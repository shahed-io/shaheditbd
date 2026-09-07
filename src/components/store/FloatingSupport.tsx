import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Minimize2, MessageCircle, MessageCircleMore, Facebook, Send as TelegramIcon, Link as LinkIcon, Phone, Mail, Instagram, Twitter, Youtube, Video, Headphones, LifeBuoy, HelpCircle, Globe } from 'lucide-react';
import aiLogo from '@/assets/ai-support-agent.png';

/** Professional AI support agent avatar — used across header, message avatars, and pill button */
const AiLogo = ({ size = 20, className = '', glow = false }: { size?: number; className?: string; glow?: boolean }) => (
  <img
    src={aiLogo}
    alt="AI Support Agent"
    width={size}
    height={size}
    loading="lazy"
    className={className}
    style={{
      width: size,
      height: size,
      objectFit: 'cover',
      borderRadius: '9999px',
      background: '#fff',
      filter: glow ? 'drop-shadow(0 2px 8px rgba(24,115,239,0.45))' : undefined,
    }}
  />
);

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
  phone_enabled: boolean;
  phone_number: string;
  phone_label: string;
  phone_subtitle: string;
  ai_label: string;
  ai_subtitle: string;
  ai_welcome_message: string;
  ai_placeholder: string;
  quick_suggestions: string[];
  fab_label: string;
  fab_color_from?: string;
  fab_color_mid?: string;
  fab_color_to?: string;
  fab_icon_color?: string;
  live_sets: LiveSet[];
}

const DEFAULTS: LiveChatConfig = {
  chat_enabled: true,
  whatsapp_enabled: true,
  whatsapp_number: '8801820060046',
  whatsapp_label: 'WhatsApp',
  whatsapp_subtitle: 'সরাসরি কথা বলুন',
  phone_enabled: true,
  phone_number: '01820-060046',
  phone_label: 'ফোন করুন',
  phone_subtitle: 'সরাসরি কল করুন',
  ai_label: 'AI Support',
  ai_subtitle: 'তাৎক্ষণিক উত্তর পান',
  ai_welcome_message: 'হ্যালো! 👋 আমি Shahed IT AI সহকারী। ওয়েব ডেভেলপমেন্ট, ডিজাইন, ডিজিটাল মার্কেটিং সহ যেকোনো সার্ভিস সম্পর্কে প্রশ্ন করুন!',
  ai_placeholder: 'আপনার প্রশ্ন লিখুন...',
  quick_suggestions: [
    '🔥 আজকের সেরা অফার দেখাও',
    '⚡ ফ্ল্যাশ সেলে কী আছে?',
    '🎁 চলমান ডিসকাউন্ট কী কী?',
    '🎟️ একটি কুপন কোড দিন',
    '🏆 লয়ালটি পয়েন্ট কীভাবে পাব?',
    '💎 আমার পয়েন্ট দিয়ে কী কিনতে পারি?',
    '👥 রেফার করলে কত টাকা পাব?',
    '💰 ওয়ালেটে টাকা যোগ করব কীভাবে?',
    '🆕 নতুন ইউজারদের জন্য অফার আছে?',
    '🎊 বান্ডেল প্যাকেজে ছাড় আছে?',
    '🌐 ওয়েবসাইট বানাতে কত খরচ?',
    '🛠️ ওয়েবসাইট মেইনটেনেন্স প্যাকেজ',
    '🎨 লোগো ও গ্রাফিক্স ডিজাইন',
    '📣 ফেসবুক পেজ বুস্টিং সার্ভিস',
    '📈 ডিজিটাল মার্কেটিং ও SEO',
    '💳 পেমেন্ট কিভাবে করব?',
    '🚚 কতক্ষণে ডেলিভারি পাব?',
    '✅ লাইসেন্স কি অরিজিনাল?',
    '🆘 আমার অর্ডার কোথায়?',
    '🔄 রিফান্ড পলিসি কী?',
  ],
  fab_label: 'কোনটি পছন্দ করবেন?',
  fab_color_from: '#7d3df0',
  fab_color_mid: '#3540e3',
  fab_color_to: '#1873ef',
  fab_icon_color: '#ffffff',
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
  const [language, setLanguage] = useState<'bn' | 'en'>(() => {
    if (typeof window === 'undefined') return 'bn';
    const v = localStorage.getItem('fs_chat_lang');
    return v === 'en' ? 'en' : 'bn';
  });
  const [helpDismissed, setHelpDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('fs_help_dismissed') === '1';
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const configLoaded = useRef(false);
  const sessionIdRef = useRef(crypto.randomUUID());

  const WELCOME_EN = "Hi! 👋 I'm the Shahed IT AI assistant. Ask me anything about web development, design, digital marketing or any of our IT services!";
  const PLACEHOLDER_EN = 'Type your question...';

  const switchLanguage = (lang: 'bn' | 'en') => {
    if (lang === language) return;
    setLanguage(lang);
    try { localStorage.setItem('fs_chat_lang', lang); } catch {}
    // Only refresh welcome if user hasn't started chatting yet
    setMessages(prev => {
      if (prev.length <= 1) {
        const welcome = lang === 'en' ? WELCOME_EN : config.ai_welcome_message;
        return [{ role: 'assistant', content: welcome }];
      }
      return prev;
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const dismissHelp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHelpDismissed(true);
    try { localStorage.setItem('fs_help_dismissed', '1'); } catch {}
  };


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
        let merged: LiveChatConfig = DEFAULTS;
        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            merged = { ...DEFAULTS, ...parsed };
            setConfig(merged);
          } catch {}
        }
        const welcome = language === 'en' ? WELCOME_EN : merged.ai_welcome_message;
        setMessages([{ role: 'assistant', content: welcome }]);
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

  const openPhoneCall = () => {
    setMenuOpen(false);
    window.location.href = `tel:${config.phone_number.replace(/[^0-9+]/g, '')}`;
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
    // Instantly show user message + empty assistant placeholder so the
    // typing indicator appears immediately (before network round-trip).
    setMessages([...newMessages, { role: 'assistant', content: '' }]);
    setLoading(true);

    let assistantContent = '';

    try {
      // Detect current page context so AI answers based on the product the user is viewing
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const productMatch = path.match(/^\/product\/([^/?#]+)/);
      const pageContext = {
        path,
        productSlug: productMatch ? decodeURIComponent(productMatch[1]) : null,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      };

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages, pageContext, language: language || 'bn' }),
      });


      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        // Handle specific status codes with friendly Bengali messages — no throw
        let friendlyMsg = errData.error || 'দুঃখিত, সমস্যা হয়েছে।';
        if (resp.status === 402) {
          friendlyMsg = '🔧 AI সহায়তা সাময়িকভাবে অনুপলব্ধ। সরাসরি WhatsApp-এ যোগাযোগ করুন: 01820060046';
        } else if (resp.status === 429) {
          friendlyMsg = '⏳ অনেক বেশি রিকোয়েস্ট। ১ মিনিট পরে আবার চেষ্টা করুন।';
        } else if (resp.status >= 500) {
          friendlyMsg = '⚠️ সার্ভার সমস্যা। WhatsApp-এ যোগাযোগ করুন: 01820060046';
        }
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: friendlyMsg };
          return updated;
        });
        setLoading(false);
        return;
      }

      if (!resp.body) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: 'দুঃখিত, রেসপন্স পাওয়া যায়নি। WhatsApp: 01820060046' };
          return updated;
        });
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';



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
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        const errMsg = { role: 'assistant' as const, content: '⚠️ সংযোগে সমস্যা হয়েছে। WhatsApp-এ যোগাযোগ করুন: 01820060046' };
        if (last && last.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = errMsg;
        } else {
          updated.push(errMsg);
        }
        return updated;
      });

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
              <div className="w-10 h-10 rounded-2xl bg-white/95 flex items-center justify-center shadow-lg ring-1 ring-white/60 backdrop-blur">
                <AiLogo size={26} />
              </div>
              <div>
                <p className="text-white text-sm font-bold">{config.ai_label}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-white/80 text-xs">{config.ai_subtitle}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-lg bg-white/10 p-0.5 gap-0.5">
                <button
                  onClick={() => switchLanguage('bn')}
                  title="বাংলায় কথা বলুন"
                  className={`h-7 px-2 rounded-md text-[11px] font-semibold transition-colors ${language === 'bn' ? 'bg-white text-primary' : 'text-white/80 hover:text-white'}`}
                >
                  বাং
                </button>
                <button
                  onClick={() => switchLanguage('en')}
                  title="Chat in English"
                  className={`h-7 px-2 rounded-md text-[11px] font-semibold transition-colors ${language === 'en' ? 'bg-white text-primary' : 'text-white/80 hover:text-white'}`}
                >
                  EN
                </button>
              </div>
              <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          <>



          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-80 min-h-52 bg-muted/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 mb-1 shadow-md ring-1 ring-primary/15">
                    <AiLogo size={18} />
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
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span className="text-xs text-muted-foreground animate-pulse">{language === 'en' ? 'AI is typing…' : 'AI উত্তর লিখছে…'}</span>
                    </span>
                  ) : ''}

                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions — auto-scrolling live marquee (pauses on hover) */}
          {messages.length <= 1 && config.quick_suggestions.length > 0 && (
            <div
              className="px-3 pb-2 group relative overflow-hidden"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)',
                maskImage:
                  'linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)',
              }}
            >
              <div
                className="flex gap-1.5 w-max animate-[support-marquee_28s_linear_infinite] group-hover:[animation-play-state:paused]"
              >
                {[...config.quick_suggestions, ...config.quick_suggestions].map((q, i) => (
                  <button
                    key={`${q}-${i}`}
                    onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="shrink-0 text-xs px-2.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <style>{`
                @keyframes support-marquee {
                  from { transform: translateX(0); }
                  to   { transform: translateX(-50%); }
                }
              `}</style>
            </div>
          )}

          {/* Other ways to contact — inside AI chat panel */}
          {(config.whatsapp_enabled || config.phone_enabled || activeSets.length > 0) && (
            <div className="px-3 pb-2 pt-1 border-t border-border/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">
                {language === 'en' ? 'Other ways to reach us' : 'অন্যান্য যোগাযোগের উপায়'}
              </p>
              <div className="flex flex-wrap gap-2">
                {config.phone_enabled && (
                  <button
                    onClick={openPhoneCall}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-card border border-border/60 hover:border-blue-500/50 hover:shadow-sm transition-all group"
                    title={config.phone_label}
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
                    >
                      <Phone size={12} className="text-white" />
                    </span>
                    <span className="text-xs font-medium text-foreground">{config.phone_label}</span>
                  </button>
                )}
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
              placeholder={language === 'en' ? PLACEHOLDER_EN : config.ai_placeholder}
              className="flex-1 text-sm bg-muted/40 border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
              disabled={loading}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
          </>

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
                  AiLogo, config.ai_label, config.ai_subtitle,
                ));
              }

              if (config.phone_enabled) {
                items.push(renderPill(
                  'phone', openPhoneCall,
                  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  'hsla(217,91%,60%,0.55)',
                  Phone, config.phone_label, config.phone_subtitle,
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

      {/* ── Main FAB + help pill stacked above ── */}
      <div
        className="fixed right-4 sm:right-6 z-50 flex flex-col items-end gap-2.5 bottom-[calc(env(safe-area-inset-bottom,0px)+96px)] md:bottom-[calc(env(safe-area-inset-bottom,0px)+16px)]"
      >

        <div className="relative flex items-center justify-center">
          {!chatOpen && !menuOpen && (
            <>
              <span className="fab-soft-ring fab-soft-ring-1" />
              <span className="fab-soft-ring fab-soft-ring-2" />
              <span className="fab-soft-ring fab-soft-ring-3" />
              <span className="fab-halo" />
              <span className="fab-ring fab-ring-1" />
              <span className="fab-ring fab-ring-2" />
            </>
          )}

          <button
            onClick={() => {
              if (chatOpen) setChatOpen(false);
              else setMenuOpen(o => !o);
            }}
            className="fab-luminous group relative flex items-center justify-center w-16 h-16 transition-all duration-300 hover:scale-110 active:scale-95"
            title="সাপোর্ট"
            aria-label="সাপোর্ট"
          >
            {/* Outer halo / glow */}
            <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-[#0891b2] to-[#f97316] opacity-40 blur-xl group-hover:opacity-60 transition-opacity" />

            {/* Main glass body */}
            <span className="relative w-full h-full flex items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(124,58,237,0.3)] overflow-hidden">
              {/* Internal gradient mesh */}
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: (chatOpen || menuOpen)
                    ? 'linear-gradient(45deg, hsla(258,80%,97%,0.85), hsla(271,75%,94%,0.75))'
                    : 'linear-gradient(45deg, rgba(124,58,237,0.60), rgba(6,182,212,0.40), rgba(236,72,153,0.60))'
                }}
              />
              {/* Icon */}
              {(chatOpen || menuOpen)
                ? <X size={26} strokeWidth={2.4} className="fs-x-rotate relative z-10" style={{ color: 'hsl(258,78%,45%)' }} />
                : <MessageCircleMore size={28} strokeWidth={2} className="relative z-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.28)]" />
              }
              {/* Premium highlight rim */}
              <span className="absolute inset-0 rounded-full border-t border-l border-white/50 pointer-events-none" />
            </span>

            {/* Gold notification accent */}
            {!chatOpen && !menuOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-lg bg-[#f59e0b] fab-lum-badge z-20" />
            )}
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

        /* Luminous glass orb — breathing badge + gentle idle float */
        @keyframes fabLumBadgePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245,158,11,0.55); }
          50%      { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(245,158,11,0); }
        }
        .fab-lum-badge { animation: fabLumBadgePulse 2.2s ease-in-out infinite; }
        @keyframes fabLumFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        .fab-luminous { animation: fabLumFloat 4s ease-in-out infinite; }
        .fab-luminous:hover, .fab-luminous:active { animation: none; }

        /* Stacked violet-tinted glass pill buttons — premium glassmorphism */
        .fs-pill {
          position: relative;
          background:
            linear-gradient(135deg, hsla(258,85%,98%,0.78) 0%, hsla(271,80%,95%,0.72) 45%, hsla(220,85%,97%,0.78) 100%);
          border: 1.5px solid hsla(258,70%,75%,0.55);
          backdrop-filter: blur(44px) saturate(220%);
          -webkit-backdrop-filter: blur(44px) saturate(220%);
          box-shadow:
            0 22px 48px -12px hsla(258,70%,35%,0.32),
            0 8px 18px -6px hsla(258,60%,40%,0.18),
            0 0 0 1px hsla(258,60%,80%,0.22),
            inset 0 1.5px 0 hsla(0,0%,100%,0.9),
            inset 0 -1px 0 hsla(258,40%,85%,0.4);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, border-color 0.3s ease;
          overflow: hidden;
          isolation: isolate;
        }
        /* Aurora blob behind icon — adds depth */
        .fs-pill-aurora {
          position: absolute;
          inset: 0;
          opacity: 0.35;
          filter: blur(14px);
          z-index: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
        }
        .fs-pill:hover .fs-pill-aurora { opacity: 0.6; }
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

        /* Glossy highlight on icon orb */
        .fs-icon-orb { position: relative; overflow: hidden; }
        .fs-icon-gloss {
          position: absolute;
          top: 2px; left: 8%;
          width: 84%; height: 45%;
          border-radius: 50%;
          background: linear-gradient(180deg, hsla(0,0%,100%,0.55), hsla(0,0%,100%,0));
          filter: blur(1px);
          pointer-events: none;
        }

        /* Premium menu heading pill — sits above stacked options */
        .fs-menu-heading {
          position: relative;
          background: linear-gradient(135deg, hsla(258,85%,98%,0.85), hsla(271,80%,95%,0.78) 50%, hsla(220,85%,97%,0.85));
          border: 1.5px solid hsla(258,70%,75%,0.6);
          backdrop-filter: blur(44px) saturate(220%);
          -webkit-backdrop-filter: blur(44px) saturate(220%);
          box-shadow:
            0 12px 28px -8px hsla(258,70%,35%,0.28),
            0 0 22px -6px hsla(271,91%,60%,0.35),
            inset 0 1.5px 0 hsla(0,0%,100%,0.95),
            inset 0 -1px 0 hsla(258,40%,85%,0.4);
          overflow: hidden;
        }
        .fs-menu-heading::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 9999px;
          padding: 1.5px;
          background: linear-gradient(120deg,
            hsla(271,91%,65%,0.7),
            hsla(0,0%,100%,0.5),
            hsla(185,90%,55%,0.6),
            hsla(320,90%,65%,0.55),
            hsla(271,91%,65%,0.7));
          background-size: 280% 280%;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          opacity: 0.7;
          animation: fsBorderShift 5s linear infinite;
          pointer-events: none;
        }
        .fs-menu-heading-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(271,91%,65%), hsl(185,90%,55%));
          box-shadow: 0 0 10px hsla(271,91%,60%,0.7);
          animation: fsHeadingDotPulse 2s ease-in-out infinite;
        }
        @keyframes fsHeadingDotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.35); opacity: 0.75; }
        }
        .fs-menu-heading-text {
          background: linear-gradient(120deg, hsl(258,78%,32%), hsl(271,85%,42%), hsl(210,85%,38%));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
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

        /* Soft pastel halo behind FAB */
        .fab-halo {
          position: absolute;
          width: 96px; height: 96px;
          border-radius: 9999px;
          background: radial-gradient(circle,
            hsla(258,90%,85%,0.5) 0%,
            hsla(220,90%,90%,0.3) 45%,
            transparent 72%);
          filter: blur(6px);
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
        .fab-ring-1 { width: 56px; height: 56px; animation-delay: 0s; border-color: hsla(258,80%,72%,0.45); }
        .fab-ring-2 { width: 56px; height: 56px; animation-delay: 1.2s; border-color: hsla(220,85%,75%,0.4); }
        @keyframes fab-ring-out {
          0%   { transform: scale(1);   opacity: 0.9; }
          100% { transform: scale(2.4); opacity: 0; }
        }

        /* Static soft pastel concentric rings (screenshot-1 style) */
        .fab-soft-ring {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
        }
        .fab-soft-ring-1 {
          width: 78px; height: 78px;
          background: radial-gradient(circle, hsla(258,90%,90%,0.55) 0%, hsla(258,90%,92%,0) 75%);
        }
        .fab-soft-ring-2 {
          width: 100px; height: 100px;
          background: radial-gradient(circle, hsla(220,95%,92%,0.45) 0%, hsla(220,95%,94%,0) 72%);
        }
        .fab-soft-ring-3 {
          width: 124px; height: 124px;
          background: radial-gradient(circle, hsla(195,95%,93%,0.38) 0%, hsla(195,95%,95%,0) 70%);
        }
        .fab-pulse-inner {
          background: radial-gradient(circle, hsla(271,91%,65%,0.35) 0%, transparent 70%);
          animation: fab-inner-pulse 2s ease-in-out infinite;
        }
        @keyframes fab-inner-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }

        /* Close (X) button on the help pill */
        .fs-help-close {
          background: hsla(258,40%,92%,0.65);
          color: hsl(258,40%,38%);
          border: 1px solid hsla(258,50%,75%,0.5);
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .fs-help-close:hover {
          background: hsla(258,80%,55%,0.92);
          color: #fff;
          transform: scale(1.08);
          border-color: hsla(258,80%,55%,0.92);
        }
        .fs-help-close:active { transform: scale(0.92); }
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
