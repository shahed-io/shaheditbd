import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Minimize2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Message = { role: 'user' | 'assistant'; content: string };

interface LiveSet {
  id: string;
  type: 'whatsapp' | 'messenger' | 'telegram' | 'custom_link';
  value: string;
  label: string;
  subtitle: string;
  icon_color: string;
  is_active: boolean;
}

interface LiveChatConfig {
  chat_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_label: string;
  whatsapp_subtitle: string;
  ai_label: string;
  ai_subtitle: string;
  ai_welcome_message: string;
  ai_placeholder: string;
  quick_suggestions: string[];
  fab_label: string;
  live_sets: LiveSet[];
}

const DEFAULTS: LiveChatConfig = {
  chat_enabled: true,
  whatsapp_enabled: true,
  whatsapp_number: '8801840099853',
  whatsapp_label: 'WhatsApp',
  whatsapp_subtitle: 'সরাসরি কথা বলুন',
  ai_label: 'AI Support',
  ai_subtitle: 'তাৎক্ষণিক উত্তর পান',
  ai_welcome_message: 'হ্যালো! 👋 আমি Shahed Store-এর AI সহকারী। Windows, Office, Adobe, Netflix, Spotify সহ যেকোনো প্রোডাক্ট সম্পর্কে প্রশ্ন করুন!',
  ai_placeholder: 'আপনার প্রশ্ন লিখুন...',
  quick_suggestions: ['💰 দাম জানতে চাই', '📦 কোন প্রোডাক্ট ভালো?', '🚚 ডেলিভারি কতক্ষণ?'],
  fab_label: 'কোনটি পছন্দ করবেন?',
  live_sets: [],
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`;

const FloatingSupport = () => {
  const [config, setConfig] = useState<LiveChatConfig>(DEFAULTS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const configLoaded = useRef(false);
  const sessionIdRef = useRef(crypto.randomUUID());

  // Load settings once
  useEffect(() => {
    if (configLoaded.current) return;
    configLoaded.current = true;
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'live_chat_settings')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            const merged = { ...DEFAULTS, ...parsed };
            setConfig(merged);
            setMessages([{ role: 'assistant', content: merged.ai_welcome_message }]);
          } catch {
            setMessages([{ role: 'assistant', content: DEFAULTS.ai_welcome_message }]);
          }
        } else {
          setMessages([{ role: 'assistant', content: DEFAULTS.ai_welcome_message }]);
        }
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [chatOpen]);

  const openChat = () => {
    setMenuOpen(false);
    setChatOpen(true);
  };

  const openWhatsApp = () => {
    setMenuOpen(false);
    window.open(`https://wa.me/${config.whatsapp_number}`, '_blank');
  };

  const openLiveSet = (set: LiveSet) => {
    setMenuOpen(false);
    let url = '';
    switch (set.type) {
      case 'whatsapp':
        url = `https://wa.me/${set.value}`;
        break;
      case 'messenger':
        url = `https://m.me/${set.value}`;
        break;
      case 'telegram':
        url = `https://t.me/${set.value.replace('@', '')}`;
        break;
      case 'custom_link':
        url = set.value;
        break;
    }
    if (url) window.open(url, '_blank');
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed');
      }

      if (!resp.body) throw new Error('No body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch { /* partial */ }
        }
      }

      // Save chat Q&A to database
      if (assistantContent) {
        try {
          await supabase.from('chat_conversations' as any).insert({
            session_id: sessionIdRef.current,
            user_message: text,
            ai_response: assistantContent,
            user_agent: navigator.userAgent,
            page_url: window.location.pathname,
          });
        } catch { /* silent */ }
      }
    } catch (err: any) {
      const msg = err?.message?.includes('রিকোয়েস্ট') || err?.message?.includes('AI')
        ? err.message
        : 'দুঃখিত, সমস্যা হয়েছে। WhatsApp-এ যোগাযোগ করুন: 01840099853';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  // Get active live sets
  const activeSets = config.live_sets.filter(s => s.is_active);

  return (
    <>
      {/* ── AI Chat Window ── */}
      {chatOpen && config.chat_enabled && (
        <div className="fixed right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-sm flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-border/60 bg-background bottom-[calc(env(safe-area-inset-bottom,0px)+160px)] md:bottom-[calc(env(safe-area-inset-bottom,0px)+80px)]"
          style={{
            animation: 'slideUpIn 0.2s ease-out',
          }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">{config.ai_label}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-white/80 text-xs">{config.ai_subtitle}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-80 min-h-52 bg-muted/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mb-1">
                    <Bot size={12} className="text-primary" />
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-background border border-border/60 rounded-bl-none text-foreground shadow-sm'
                }`}>
                  {msg.content || (loading && i === messages.length - 1
                    ? <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></span>
                    : ''
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 1 && config.quick_suggestions.length > 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {config.quick_suggestions.map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border/60 bg-background">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={config.ai_placeholder}
              className="flex-1 text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
              disabled={loading}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}

      {/* ── Popup Menu ── */}
      {menuOpen && !chatOpen && (
        <div className="fixed right-4 sm:right-6 z-50 flex flex-col gap-3 bottom-[calc(env(safe-area-inset-bottom,0px)+160px)] md:bottom-[calc(env(safe-area-inset-bottom,0px)+80px)]" style={{ animation: 'slideUpIn 0.15s ease-out' }}>
          {/* AI Support */}
          {config.chat_enabled && (
            <button onClick={openChat}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/40 shadow-xl hover:border-primary/50 transition-all group w-56">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
                <Bot size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{config.ai_label}</p>
                <p className="text-xs text-muted-foreground">{config.ai_subtitle}</p>
              </div>
            </button>
          )}

          {/* WhatsApp */}
          {config.whatsapp_enabled && (
            <button onClick={openWhatsApp}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/40 shadow-xl hover:border-green-500/50 transition-all group w-56">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                <MessageCircle size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{config.whatsapp_label}</p>
                <p className="text-xs text-muted-foreground">{config.whatsapp_subtitle}</p>
              </div>
            </button>
          )}

          {/* Live Sets */}
          {activeSets.map(set => (
            <button key={set.id} onClick={() => openLiveSet(set)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/40 shadow-xl hover:border-primary/50 transition-all group w-56">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${set.icon_color}, ${set.icon_color}dd)` }}>
                <MessageCircle size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{set.label}</p>
                <p className="text-xs text-muted-foreground">{set.subtitle}</p>
              </div>
            </button>
          ))}

          {/* Label */}
          <p className="text-center text-xs text-muted-foreground">{config.fab_label}</p>
        </div>
      )}

      {/* ── Main FAB ── */}
      <div
        className="fixed right-4 sm:right-6 z-50 flex items-center justify-center bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] md:bottom-[calc(env(safe-area-inset-bottom,0px)+16px)]"
      >
        {!menuOpen && !chatOpen && (
          <>
            <span className="fab-ring fab-ring-1" />
            <span className="fab-ring fab-ring-2" />
            <span className="fab-ring fab-ring-3" />
          </>
        )}

        {!menuOpen && !chatOpen && (
          <span className="fab-comet" />
        )}

        <button
          onClick={() => { if (chatOpen) { setChatOpen(false); } else { setMenuOpen(o => !o); } }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
          style={{
            background: menuOpen || chatOpen
              ? 'hsl(var(--muted))'
              : 'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))',
            boxShadow: menuOpen || chatOpen
              ? 'none'
              : '0 0 24px hsla(271,91%,65%,0.6), 0 0 50px hsla(185,90%,52%,0.3), 0 8px 24px hsla(215,40%,4%,0.5)',
          }}
          title="সাপোর্ট"
        >
          {!menuOpen && !chatOpen && (
            <span className="absolute inset-0 rounded-full fab-pulse-inner" />
          )}
          {menuOpen || chatOpen
            ? <X size={22} className="text-foreground" />
            : <MessageCircle size={24} className="text-white relative z-10" />
          }
        </button>
      </div>

      <style>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fab-ring {
          position: absolute;
          border-radius: 9999px;
          border: 1.5px solid hsla(271,91%,65%,0.5);
          animation: fab-ring-out 2.4s cubic-bezier(0.2,0.8,0.4,1) infinite;
          pointer-events: none;
        }
        .fab-ring-1 { width: 56px; height: 56px; animation-delay: 0s; }
        .fab-ring-2 { width: 56px; height: 56px; animation-delay: 0.7s; border-color: hsla(185,90%,52%,0.4); }
        .fab-ring-3 { width: 56px; height: 56px; animation-delay: 1.4s; border-color: hsla(320,90%,62%,0.35); }
        @keyframes fab-ring-out {
          0%   { transform: scale(1);   opacity: 0.9; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .fab-pulse-inner {
          background: radial-gradient(circle, hsla(271,91%,65%,0.35) 0%, transparent 70%);
          animation: fab-inner-pulse 2s ease-in-out infinite;
        }
        @keyframes fab-inner-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
        .fab-comet {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: hsl(185,90%,62%);
          box-shadow: 0 0 10px hsl(185,90%,62%), 0 0 20px hsl(271,91%,65%);
          transform-origin: 38px 38px;
          animation: fab-orbit 3s linear infinite;
          pointer-events: none;
          top: calc(50% - 4px);
          left: calc(50% - 4px);
        }
        @keyframes fab-orbit {
          0%   { transform: rotate(0deg) translateX(36px); }
          100% { transform: rotate(360deg) translateX(36px); }
        }
      `}</style>
    </>
  );
};

export { FloatingSupport };
