import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Loader2, Trash2, Sparkles, PanelLeftClose, PanelLeft, RefreshCw, ExternalLink, Monitor, Smartphone, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_ACTIONS = [
  { icon: "📊", label: "আজকের সেলস", prompt: "আজকের সেলস রিপোর্ট দেখাও" },
  { icon: "📦", label: "পেন্ডিং অর্ডার", prompt: "সব পেন্ডিং অর্ডার দেখাও" },
  { icon: "⚠️", label: "লো স্টক", prompt: "কোন প্রোডাক্টের স্টক কম আছে?" },
  { icon: "🎫", label: "ওপেন টিকেট", prompt: "ওপেন সাপোর্ট টিকেটগুলো দেখাও" },
  { icon: "⭐", label: "পেন্ডিং রিভিউ", prompt: "পেন্ডিং রিভিউ দেখাও" },
  { icon: "👥", label: "নতুন কাস্টমার", prompt: "সাম্প্রতিক কাস্টমারদের দেখাও" },
  { icon: "🏷️", label: "কুপন তৈরি", prompt: "SAVE20 নামে ২০% ডিসকাউন্ট কুপন তৈরি করো" },
  { icon: "📝", label: "ব্লগ লেখো", prompt: "Windows 11 কেন কিনবেন — এই বিষয়ে একটি ব্লগ পোস্ট লেখো" },
  { icon: "⚙️", label: "সেটিংস দেখাও", prompt: "সকল সাইট সেটিংস দেখাও" },
  { icon: "✍️", label: "কন্টেন্ট তৈরি", prompt: "Microsoft Office 365 এর জন্য একটি আকর্ষণীয় প্রোডাক্ট ডেসক্রিপশন লেখো" },
  { icon: "📈", label: "এই মাসের রিপোর্ট", prompt: "এই মাসের রেভিনিউ রিপোর্ট দেখাও দিন অনুযায়ী" },
  { icon: "🔥", label: "টপ প্রোডাক্ট", prompt: "সবচেয়ে বেশি বিক্রি হওয়া টপ ১০ প্রোডাক্ট দেখাও" },
];

const AdminAiAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const refreshPreview = useCallback(() => {
    setPreviewKey(k => k + 1);
  }, []);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isLoading) return;

    const userMsg: Message = { role: 'user', content: msgText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('সেশন মেয়াদোত্তীর্ণ');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) toast.error('রেট লিমিট অতিক্রম হয়েছে');
        else if (response.status === 402) toast.error('AI ক্রেডিট শেষ');
        else toast.error('AI তে সমস্যা হয়েছে');
        return;
      }

      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.result }]);

      // Auto-refresh preview if something was changed
      if (data.result?.includes('সফল') || data.result?.includes('আপডেট') || data.result?.includes('তৈরি') || data.result?.includes('পরিবর্তন') || data.result?.includes('success')) {
        setTimeout(refreshPreview, 1000);
      }
    } catch (e) {
      console.error(e);
      toast.error('কোনো সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-0 -m-6">
      {/* ═══ Left: Chat Panel ═══ */}
      <div className={`flex flex-col bg-card border-r border-border transition-all duration-300 ${showPreview ? 'w-1/2 min-w-[380px]' : 'flex-1'}`}>
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground text-sm">AI কন্ট্রোল সেন্টার</h2>
            <p className="text-[10px] text-muted-foreground truncate">চ্যাটের মাধ্যমে সম্পূর্ণ ওয়েবসাইট কন্ট্রোল করুন</p>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setMessages([])}>
                <Trash2 className="w-3 h-3 mr-1" /> ক্লিয়ার
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? 'প্রিভিউ বন্ধ করুন' : 'প্রিভিউ দেখুন'}
            >
              {showPreview ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">AI কন্ট্রোল সেন্টারে স্বাগতম!</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  প্রোডাক্ট, অর্ডার, সেটিংস, কন্টেন্ট — সব কিছু AI দিয়ে কন্ট্রোল করুন। পাশের প্রিভিউতে লাইভ দেখুন!
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-w-lg w-full">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="px-2.5 py-2 text-[11px] rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors text-left text-foreground flex items-center gap-1.5"
                  >
                    <span className="text-sm">{action.icon}</span>
                    <span className="truncate">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted/50 border border-border text-foreground rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:text-xs [&_th]:px-2 [&_td]:px-2 [&_th]:py-1 [&_td]:py-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/50 border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted-foreground">কাজ করছি...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-background">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="কমান্ড লিখুন... (যেমন: সব প্রোডাক্টের দাম ১০% কমাও)"
              className="min-h-[42px] max-h-28 resize-none text-sm rounded-xl"
              rows={1}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[42px] w-[42px] shrink-0 rounded-xl"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ Right: Live Preview Panel ═══ */}
      {showPreview && (
        <div className="flex-1 flex flex-col bg-muted/20 min-w-[300px]">
          {/* Preview Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground flex-1">লাইভ প্রিভিউ</span>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1 rounded-md transition-colors ${previewDevice === 'desktop' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Desktop"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1 rounded-md transition-colors ${previewDevice === 'mobile' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Mobile"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={refreshPreview} title="রিফ্রেশ">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <a
              href="https://shahedstore.com.bd"
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 w-7 p-0 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
              title="নতুন ট্যাবে খুলুন"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </a>
          </div>

          {/* Preview iframe */}
          <div className="flex-1 flex items-start justify-center p-2 overflow-hidden">
            <div
              className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 h-full ${
                previewDevice === 'mobile' ? 'w-[375px] border-[6px] border-gray-800 rounded-[24px]' : 'w-full'
              }`}
            >
              <iframe
                key={previewKey}
                src="https://shahedstore.com.bd"
                className="w-full h-full border-0"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAiAssistant;
