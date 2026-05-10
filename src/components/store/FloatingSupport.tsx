import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Minimize2, MessageCircle, Facebook, Send as TelegramIcon, Link as LinkIcon, Phone, Mail, Instagram, Twitter, Youtube, Video, Headphones, LifeBuoy, HelpCircle, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const FS_ICON_MAP: Record<string, any> = {
  MessageCircle, Facebook, TelegramIcon, LinkIcon, Phone, Mail, Instagram, Twitter, Youtube, Video, Headphones, LifeBuoy, HelpCircle, Globe,
};
const getFsIcon = (name?: string) => FS_ICON_MAP[name || 'MessageCircle'] || MessageCircle;

type Message = { role: 'user' | 'assistant'; content: string };

interface LiveSet {
  id: string;
  type: 'whatsapp' | 'messenger' | 'telegram' | 'custom_link';
  value: string;
  label: string;
  subtitle: string;
  icon_color: string;
  icon?: string;
  is_active: boolean;
  sort_order?: number;
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
        // Handle specific status codes with friendly Bengali messages — no throw
        let friendlyMsg = errData.error || 'দুঃখিত, সমস্যা হয়েছে।';
        if (resp.status === 402) {
          friendlyMsg = '🔧 AI সহায়তা সাময়িকভাবে অনুপলব্ধ। সরাসরি WhatsApp-এ যোগাযোগ করুন: 01840099853';
        } else if (resp.status === 429) {
          friendlyMsg = '⏳ অনেক বেশি রিকোয়েস্ট। ১ মিনিট পরে আবার চেষ্টা করুন।';
        } else if (resp.status >= 500) {
          friendlyMsg = '⚠️ সার্ভার সমস্যা। WhatsApp-এ যোগাযোগ করুন: 01840099853';
        }
        setMessages(prev => [...prev, { role: 'assistant', content: friendlyMsg }]);
        setLoading(false);
        return;
      }

      if (!resp.body) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'দুঃখিত, রেসপন্স পাওয়া যায়নি। WhatsApp: 01840099853' }]);
        setLoading(false);
        return;
      }

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
      console.warn('Chat error (handled):', err?.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ সংযোগে সমস্যা হয়েছে। WhatsApp-এ যোগাযোগ করুন: 01840099853',
      }]);
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
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none whitespace-pre-wrap'
                    : 'bg-background border border-border/60 rounded-bl-none text-foreground shadow-sm'
                }`}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : msg.content ? (
                    <div className="chat-markdown space-y-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="my-1.5 ml-1 space-y-1 list-none">{children}</ul>,
                          ol: ({ children }) => <ol className="my-1.5 ml-4 space-y-1 list-decimal">{children}</ol>,
                          li: ({ children }) => (
                            <li className="flex gap-2 leading-relaxed before:content-['•'] before:text-primary before:font-bold before:flex-shrink-0">
                              <span className="flex-1">{children}</span>
                            </li>
                          ),
                          strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => <code className="px-1 py-0.5 rounded bg-muted text-[0.85em] font-mono">{children}</code>,
                          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 break-all">{children}</a>,
                          h1: ({ children }) => <h1 className="text-base font-bold mt-2 mb-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                          hr: () => <hr className="my-2 border-border/50" />,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-2 my-1.5 italic text-muted-foreground">{children}</blockquote>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : loading && i === messages.length - 1 ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : ''}
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

          {/* Other ways to contact — inside AI chat panel */}
          {(config.whatsapp_enabled || activeSets.length > 0) && (
            <div className="px-3 pb-2 pt-1 border-t border-border/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">
                অন্যান্য যোগাযোগের উপায়
              </p>
              <div className="flex flex-wrap gap-2">
                {config.whatsapp_enabled && (
                  <button
                    onClick={openWhatsApp}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-card border border-border/60 hover:border-green-500/50 hover:shadow-sm transition-all group"
                    title={config.whatsapp_label}
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                    >
                      <MessageCircle size={12} className="text-white" />
                    </span>
                    <span className="text-xs font-medium text-foreground">{config.whatsapp_label}</span>
                  </button>
                )}
                {activeSets.map(set => {
                  const ChannelIcon = getFsIcon(set.icon);
                  return (
                    <button
                      key={set.id}
                      onClick={() => openLiveSet(set)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-card border border-border/60 hover:shadow-sm transition-all group"
                      style={{ borderColor: `${set.icon_color}40` }}
                      title={set.subtitle || set.label}
                    >
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${set.icon_color}, ${set.icon_color}dd)` }}
                      >
                        <ChannelIcon size={12} className="text-white" />
                      </span>
                      <span className="text-xs font-medium text-foreground">{set.label}</span>
                    </button>
                  );
                })}
              </div>
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

      {/* ── Option Menu (stacked floating pill buttons) ── */}
      {menuOpen && !chatOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40"
            style={{ background: 'transparent' }}
            aria-hidden
          />
          <div
            className="fixed right-4 sm:right-6 z-50 flex flex-col items-end gap-3 bottom-[calc(env(safe-area-inset-bottom,0px)+170px)] md:bottom-[calc(env(safe-area-inset-bottom,0px)+90px)] w-[min(calc(100vw-2rem),300px)]"
          >
            {(() => {
              // Build list in display order (top → bottom): AI, WhatsApp, custom sets, then label
              const items: React.ReactNode[] = [];

              const renderPill = (
                key: string,
                onClick: () => void,
                gradient: string,
                glowHsl: string,
                Icon: any,
                label: string,
                subtitle?: string,
              ) => (
                <button
                  key={key}
                  onClick={onClick}
                  className="fs-pill group w-full flex items-center gap-3 pl-2 pr-4 py-2.5 rounded-full text-left"
                  style={{ ['--pill-glow' as any]: glowHsl }}
                >
                  {/* Inner aurora blob — adds depth behind the glass */}
                  <span
                    className="fs-pill-aurora"
                    style={{ background: `radial-gradient(circle at 20% 50%, ${glowHsl}, transparent 60%)` }}
                    aria-hidden
                  />
                  <span className="fs-icon-wrap relative flex-shrink-0">
                    <span
                      className="fs-icon-ring"
                      style={{
                        background: `conic-gradient(from 180deg, ${glowHsl}, transparent 40%, ${glowHsl} 80%, transparent)`,
                      }}
                    />
                    <span
                      className="fs-icon-orb relative w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[8deg]"
                      style={{
                        background: gradient,
                        boxShadow: `0 8px 22px ${glowHsl}, 0 2px 6px rgba(0,0,0,0.15), inset 0 1.5px 0 rgba(255,255,255,0.5), inset 0 -3px 8px rgba(0,0,0,0.22)`,
                      }}
                    >
                      <span className="fs-icon-gloss" aria-hidden />
                      <Icon size={19} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] relative z-10" />
                    </span>
                  </span>
                  <div className="flex-1 min-w-0 relative z-10">
                    <p className="fs-pill-title text-[14px] font-bold leading-tight tracking-tight">{label}</p>
                    {subtitle && <p className="fs-pill-subtitle text-[11px] truncate mt-0.5">{subtitle}</p>}
                  </div>
                  <span className="fs-pill-arrow relative z-10">→</span>
                </button>
              );

              if (config.chat_enabled) {
                items.push(renderPill(
                  'ai', openChat,
                  'linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,52%))',
                  'hsla(271,91%,60%,0.55)',
                  Bot, config.ai_label, config.ai_subtitle,
                ));
              }

              if (config.whatsapp_enabled) {
                items.push(renderPill(
                  'wa', openWhatsApp,
                  'linear-gradient(135deg, #25D366, #128C7E)',
                  'hsla(142,70%,45%,0.55)',
                  MessageCircle, config.whatsapp_label, config.whatsapp_subtitle,
                ));
              }

              activeSets.forEach(set => {
                const ChannelIcon = getFsIcon(set.icon);
                items.push(renderPill(
                  set.id, () => openLiveSet(set),
                  `linear-gradient(135deg, ${set.icon_color}, ${set.icon_color}dd)`,
                  `${set.icon_color}99`,
                  ChannelIcon, set.label, set.subtitle,
                ));
              });

              if (items.length === 0) {
                return (
                  <div className="fs-pill w-full px-4 py-3 rounded-full text-center text-xs" style={{ color: 'hsl(226,15%,45%)' }}>
                    কোনো সাপোর্ট চ্যানেল কনফিগার করা নেই
                  </div>
                );
              }

              // Stagger animation: bottom-most appears first (closest to FAB)
              const total = items.length;
              return items.map((node, i) => {
                const delay = (total - 1 - i) * 0.06;
                return (
                  <div
                    key={`wrap-${i}`}
                    className="fs-pill-wrap w-full flex justify-end"
                    style={{ animationDelay: `${delay}s` }}
                  >
                    {node}
                  </div>
                );
              });
            })()}

            {/* Label / heading (appears last, just above FAB area) */}
            <div
              className="fs-pill-wrap w-full flex justify-end"
              style={{ animationDelay: '0s' }}
            >
              <div className="fs-menu-heading inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full">
                <span className="fs-menu-heading-dot" aria-hidden />
                <p className="fs-menu-heading-text text-[12px] font-bold tracking-tight">
                  {config.fab_label}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Main FAB + side label ── */}
      <div
        className="fixed right-4 sm:right-6 z-50 flex items-center gap-3 bottom-[calc(env(safe-area-inset-bottom,0px)+96px)] md:bottom-[calc(env(safe-area-inset-bottom,0px)+16px)]"
      >
        {/* "সাহায্য চাই?" pill — always visible (except when chat panel is open) */}
        {!chatOpen && (
          <button
            onClick={() => setMenuOpen(o => !o)}
            className={`fs-help-pill group flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full cursor-pointer ${menuOpen ? 'fs-help-pill--active' : ''}`}
            aria-label="সাহায্য চাই"
          >
            <span className="fs-help-dot relative flex w-2.5 h-2.5 flex-shrink-0">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-300 opacity-80 animate-ping" />
              <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-[0_0_8px_hsla(150,80%,50%,0.7)]" />
            </span>
            <div className="leading-tight text-left">
              <p className="fs-help-title text-[13px] font-extrabold tracking-tight">সাহায্য চাই?</p>
              <p className="fs-help-sub text-[10px] font-medium">২৪/৭ লাইভ সাপোর্ট</p>
            </div>
            <span className="fs-help-shine" aria-hidden />
          </button>
        )}

        <div className="relative flex items-center justify-center fab-float">
          {!chatOpen && !menuOpen && (
            <>
              <span className="fab-halo" />
              <span className="fab-ring fab-ring-1" />
              <span className="fab-ring fab-ring-2" />
              <span className="fab-ring fab-ring-3" />
              <span className="fab-comet" />
              <span className="fab-comet fab-comet-2" />
            </>
          )}

          <button
            onClick={() => {
              if (chatOpen) setChatOpen(false);
              else setMenuOpen(o => !o);
            }}
            className="fab-btn relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              background: (chatOpen || menuOpen)
                ? 'linear-gradient(135deg, hsla(258,80%,97%,0.94), hsla(271,75%,94%,0.9))'
                : 'linear-gradient(140deg, hsl(271,91%,68%) 0%, hsl(290,85%,62%) 35%, hsl(210,90%,58%) 70%, hsl(185,90%,55%) 100%)',
              boxShadow: (chatOpen || menuOpen)
                ? '0 18px 44px -10px hsla(258,70%,40%,0.32), 0 0 26px -6px hsla(271,91%,60%,0.4), inset 0 1px 0 hsla(0,0%,100%,0.9)'
                : '0 0 0 1px hsla(0,0%,100%,0.25) inset, 0 1px 0 hsla(0,0%,100%,0.45) inset, 0 -3px 8px hsla(258,90%,30%,0.3) inset, 0 8px 24px hsla(271,91%,55%,0.45), 0 0 32px hsla(185,90%,55%,0.35), 0 16px 40px -8px hsla(258,80%,30%,0.45)',
              border: (chatOpen || menuOpen) ? '1.5px solid hsla(258,70%,72%,0.6)' : 'none',
              backdropFilter: (chatOpen || menuOpen) ? 'blur(40px) saturate(200%)' : 'none',
            }}
            title="সাপোর্ট"
          >
            {/* Conic-gradient rotating ring around FAB */}
            {!chatOpen && !menuOpen && <span className="fab-conic-ring" />}
            {/* Glossy top highlight */}
            {!chatOpen && !menuOpen && <span className="fab-gloss" />}
            {!chatOpen && !menuOpen && (
              <span className="absolute inset-0 rounded-full fab-pulse-inner" />
            )}
            {(chatOpen || menuOpen)
              ? <X size={22} className="fs-x-rotate" style={{ color: 'hsl(258,78%,45%)' }} />
              : <MessageCircle size={24} className="text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]" />
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInBg {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Stacked violet-tinted glass pill buttons — pops against white backgrounds */
        .fs-pill {
          position: relative;
          background:
            linear-gradient(135deg, hsla(258,80%,97%,0.92) 0%, hsla(271,75%,94%,0.88) 50%, hsla(220,80%,96%,0.92) 100%);
          border: 1.5px solid hsla(258,70%,72%,0.55);
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          box-shadow:
            0 18px 44px -10px hsla(258,70%,40%,0.28),
            0 6px 14px -4px hsla(258,60%,40%,0.15),
            0 0 0 1px hsla(258,60%,75%,0.18),
            inset 0 1px 0 hsla(0,0%,100%,0.85);
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.3s ease;
          overflow: hidden;
        }
        /* Animated gradient border ring */
        .fs-pill::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 9999px;
          padding: 1px;
          background: linear-gradient(120deg,
            var(--pill-glow, hsla(271,91%,65%,0.55)),
            hsla(0,0%,100%,0.4),
            var(--pill-glow, hsla(185,90%,52%,0.45)),
            hsla(0,0%,100%,0.3),
            var(--pill-glow, hsla(271,91%,65%,0.55)));
          background-size: 280% 280%;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          opacity: 0.55;
          animation: fsBorderShift 5s linear infinite;
          pointer-events: none;
        }
        /* Shine sweep on hover */
        .fs-pill::after {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 50%; height: 100%;
          background: linear-gradient(110deg, transparent 0%, hsla(0,0%,100%,0.55) 50%, transparent 100%);
          transform: skewX(-20deg);
          transition: left 0.7s ease;
          pointer-events: none;
        }
        .fs-pill:hover::after { left: 130%; }
        @keyframes fsBorderShift {
          0%   { background-position: 0% 50%; }
          100% { background-position: 280% 50%; }
        }
        .fs-pill:hover {
          transform: translateX(-4px) translateY(-2px);
          border-color: hsla(258,60%,65%,0.5);
          box-shadow:
            0 24px 56px -12px hsla(258,40%,30%,0.28),
            0 0 28px -4px var(--pill-glow, hsla(258,60%,60%,0.2)),
            inset 0 1px 0 hsla(0,0%,100%,1);
        }
        .fs-pill:hover::before { opacity: 1; }
        .fs-pill:active { transform: translateX(-2px) scale(0.98); }

        /* Text colors for white glass */
        .fs-pill .fs-pill-title { color: hsl(226,40%,18%); }
        .fs-pill .fs-pill-subtitle { color: hsl(226,15%,45%); }

        .fs-pill-arrow {
          font-size: 16px;
          color: hsl(226,15%,55%);
          transform: translateX(-2px);
          transition: transform 0.3s ease, color 0.3s ease;
        }
        .fs-pill:hover .fs-pill-arrow { transform: translateX(2px); color: hsl(258,78%,55%); }

        /* Icon container with conic-gradient halo ring */
        .fs-icon-wrap { display: inline-flex; padding: 2px; }
        .fs-icon-ring {
          position: absolute;
          inset: -2px;
          border-radius: 9999px;
          opacity: 0.5;
          filter: blur(2px);
          animation: fsIconSpin 6s linear infinite;
          pointer-events: none;
        }
        .fs-pill:hover .fs-icon-ring { opacity: 0.95; filter: blur(3px); }
        @keyframes fsIconSpin {
          to { transform: rotate(360deg); }
        }

        /* Side help-pill next to FAB — premium violet-tinted glass with shine */
        .fs-help-pill {
          position: relative;
          background: linear-gradient(135deg, hsla(258,80%,98%,0.95), hsla(271,75%,94%,0.92) 50%, hsla(220,80%,96%,0.95));
          border: 1.5px solid hsla(258,70%,72%,0.55);
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          box-shadow:
            0 18px 44px -10px hsla(258,70%,40%,0.3),
            0 0 26px -6px hsla(271,91%,60%,0.4),
            0 0 0 1px hsla(258,60%,75%,0.2),
            inset 0 1px 0 hsla(0,0%,100%,0.9);
          animation: fsHelpIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both, fsHelpBob 4s ease-in-out 0.6s infinite;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.3s ease;
        }
        /* Animated gradient border ring on help pill */
        .fs-help-pill::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 9999px;
          padding: 1.5px;
          background: linear-gradient(120deg,
            hsla(271,91%,65%,0.65),
            hsla(0,0%,100%,0.5),
            hsla(185,90%,55%,0.55),
            hsla(320,90%,65%,0.5),
            hsla(271,91%,65%,0.65));
          background-size: 280% 280%;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          opacity: 0.7;
          animation: fsBorderShift 5s linear infinite;
          pointer-events: none;
        }
        .fs-help-pill .fs-help-shine {
          position: absolute;
          top: 0; left: -60%;
          width: 50%; height: 100%;
          background: linear-gradient(110deg, transparent 0%, hsla(0,0%,100%,0.6) 50%, transparent 100%);
          transform: skewX(-20deg);
          pointer-events: none;
          animation: fsHelpShine 4.5s ease-in-out 1.2s infinite;
        }
        @keyframes fsHelpShine {
          0%   { left: -60%; }
          35%  { left: 130%; }
          100% { left: 130%; }
        }
        .fs-help-pill:hover {
          transform: translateX(-3px) translateY(-2px) scale(1.03);
          box-shadow:
            0 24px 56px -12px hsla(258,40%,30%,0.32),
            0 0 32px -4px hsla(271,91%,60%,0.5),
            inset 0 1px 0 hsla(0,0%,100%,1);
        }
        .fs-help-pill:active { transform: translateX(-1px) scale(0.97); }
        .fs-help-pill--active {
          border-color: hsla(258,70%,60%,0.7);
          box-shadow:
            0 24px 56px -12px hsla(258,60%,40%,0.4),
            0 0 32px -4px hsla(271,91%,60%,0.55),
            inset 0 1px 0 hsla(0,0%,100%,1);
        }
        .fs-help-pill .fs-help-title {
          color: hsl(258,78%,28%);
          background: linear-gradient(120deg, hsl(258,78%,32%), hsl(271,85%,42%), hsl(210,85%,40%));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .fs-help-pill .fs-help-sub { color: hsl(226,18%,42%); }
        @keyframes fsHelpIn {
          from { opacity: 0; transform: translateX(20px) scale(0.85); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes fsHelpBob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-2px); }
        }

        /* Stagger entrance for stacked items */
        .fs-pill-wrap {
          opacity: 0;
          transform: translateY(20px) scale(0.85);
          animation: fsPillIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes fsPillIn {
          0%   { opacity: 0; transform: translateY(20px) scale(0.85); }
          60%  { opacity: 1; transform: translateY(-2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* X icon spin-in on toggle */
        .fs-x-rotate { animation: fsXRotate 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes fsXRotate {
          from { transform: rotate(-90deg) scale(0.6); opacity: 0; }
          to   { transform: rotate(0) scale(1); opacity: 1; }
        }

        /* Subtle float animation on idle */
        .fab-float { animation: fabFloat 4.5s ease-in-out infinite; }
        @keyframes fabFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-3px); }
        }

        /* Soft aurora halo behind FAB */
        .fab-halo {
          position: absolute;
          width: 110px; height: 110px;
          border-radius: 9999px;
          background: radial-gradient(circle,
            hsla(271,91%,65%,0.35) 0%,
            hsla(185,90%,55%,0.22) 40%,
            transparent 70%);
          filter: blur(8px);
          animation: fabHaloPulse 3.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes fabHaloPulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }

        /* Rotating conic-gradient outer ring */
        .fab-conic-ring {
          position: absolute;
          inset: -3px;
          border-radius: 9999px;
          padding: 2px;
          background: conic-gradient(from 0deg,
            hsla(271,91%,75%,0.9),
            hsla(320,90%,70%,0.6),
            hsla(185,90%,65%,0.9),
            hsla(210,90%,70%,0.5),
            hsla(271,91%,75%,0.9));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          animation: fabConicSpin 4s linear infinite;
          pointer-events: none;
          opacity: 0.85;
        }
        @keyframes fabConicSpin { to { transform: rotate(360deg); } }

        /* Glossy top highlight */
        .fab-gloss {
          position: absolute;
          top: 3px; left: 50%;
          transform: translateX(-50%);
          width: 70%; height: 40%;
          border-radius: 50%;
          background: linear-gradient(180deg, hsla(0,0%,100%,0.45) 0%, hsla(0,0%,100%,0.05) 60%, transparent 100%);
          filter: blur(2px);
          pointer-events: none;
        }

        .fab-btn:hover .fab-conic-ring { animation-duration: 2s; opacity: 1; }

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
          100% { transform: scale(2.8); opacity: 0; }
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
        .fab-comet-2 {
          background: hsl(320,90%,68%);
          box-shadow: 0 0 10px hsl(320,90%,68%), 0 0 20px hsl(271,91%,65%);
          animation-duration: 4.5s;
          animation-direction: reverse;
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
