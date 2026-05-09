import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle, Shield, ExternalLink, ArrowUpRight, Zap, Package, Info, FileText, Send, Download, Heart, Star, Gift, Tag, Globe, ShoppingBag, Sparkles, BookOpen, HelpCircle, type LucideIcon } from 'lucide-react';
import BrandLogo from './BrandLogo';
import dbidLogo from '@/assets/dbid-logo.png';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import { useFooterMenu } from '@/hooks/useFooterMenu';

// Icon registry — admins can pick by name
const ICON_MAP: Record<string, LucideIcon> = {
  Package, Info, FileText, Shield, Globe, ShoppingBag, BookOpen, HelpCircle,
  Sparkles, Gift, Tag, Star, Heart, Download, Mail, Phone, MessageCircle,
};

// Daraz-style two-color highlight on tagline keywords:
//   green  → trust / value phrases
//   orange → product / authenticity phrases
const HIGHLIGHT_GREEN = [
  'বিশ্বস্ত', 'সাশ্রয়ী মূল্যে', 'সেরা দামে', 'ইনস্ট্যান্ট ডেলিভারি',
  'প্রিমিয়াম ডিজিটাল সেবা', 'ডিজিটাল সফটওয়্যার স্টোর', 'গ্রাহকদের',
];
const HIGHLIGHT_ORANGE = [
  'অরিজিনাল সফটওয়্যার', 'অরিজিনাল সাবস্ক্রিপশন', 'অরিজিনাল', 'সাবস্ক্রিপশন',
];
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
const highlightTagline = (text: string) => {
  // Build placeholder-based replacement so we don't nest <mark> tags
  type Hit = { start: number; end: number; word: string; cls: string };
  const hits: Hit[] = [];
  const scan = (list: string[], cls: string) => {
    for (const kw of list) {
      let from = 0;
      while (from <= text.length - kw.length) {
        const idx = text.indexOf(kw, from);
        if (idx === -1) break;
        hits.push({ start: idx, end: idx + kw.length, word: kw, cls });
        from = idx + kw.length;
      }
    }
  };
  scan(HIGHLIGHT_GREEN, 'fth-g');
  scan(HIGHLIGHT_ORANGE, 'fth-o');
  // longest first; drop overlaps
  hits.sort((a, b) => (b.end - b.start) - (a.end - a.start));
  const taken: Hit[] = [];
  for (const h of hits) {
    if (taken.some(t => !(h.end <= t.start || h.start >= t.end))) continue;
    taken.push(h);
  }
  taken.sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = 0;
  for (const h of taken) {
    out += escapeHtml(text.slice(cursor, h.start));
    out += `<mark class="${h.cls}">${escapeHtml(h.word)}</mark>`;
    cursor = h.end;
  }
  out += escapeHtml(text.slice(cursor));
  return out;
};


const Footer = () => {
  const { settings } = useFooterSettings();
  const { sections } = useFooterMenu();
  const paymentMethods = settings.payment_methods.split(',').map(s => s.trim()).filter(Boolean);

  return (
  <footer className="relative overflow-hidden" style={{ background: 'hsl(var(--background))' }}>

    {/* Decorative background */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[500px]"
        style={{ background: 'radial-gradient(ellipse at 80% 0%, hsla(var(--brand-h),var(--brand-s),var(--brand-l),0.07), transparent 65%)' }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px]"
        style={{ background: 'radial-gradient(ellipse at 0% 100%, hsla(var(--brand2-h),var(--brand2-s),var(--brand2-l),0.06), transparent 65%)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px]"
        style={{ background: 'radial-gradient(ellipse, hsla(var(--brand4-h),var(--brand4-s),var(--brand4-l),0.03), transparent 70%)' }} />
      <div className="absolute inset-0 dot-grid opacity-40" />
    </div>

    {/* CTA Strip */}
    <div className="relative z-10 border-b" style={{ borderColor: 'hsla(258,78%,75%,0.15)' }}>
      <div className="container-fluid py-7"
        style={{
          background: 'hsla(0,0%,100%,0.50)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-sora font-black text-xl" style={{ color: 'hsl(226,35%,12%)' }}>Need help choosing a product?</h3>
              <p className="text-sm mt-0.5" style={{ color: 'hsl(226,35%,45%)' }}>Our experts are available 24/7 to assist you</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a href={`https://wa.me/${settings.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all hover:scale-105"
              style={{
                color: 'hsl(226,35%,28%)',
                background: 'hsla(0,0%,100%,0.75)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid hsla(258,78%,75%,0.25)',
                boxShadow: '0 2px 12px hsla(226,35%,12%,0.06)',
              }}>
              <MessageCircle size={15} /> WhatsApp
            </a>
            <a href="/shop"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}>
              Shop Now <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* ── Main footer ── */}
    <div className="relative z-10 container-fluid pt-12 pb-10">

      {/* Brand section — always centered */}
      <div className="flex flex-col items-center text-center mb-10 space-y-5"
        style={{
          background: 'linear-gradient(135deg, hsla(0,0%,100%,0.72) 0%, hsla(0,0%,100%,0.50) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid hsla(258,78%,75%,0.20)',
          borderRadius: '20px',
          boxShadow: '0 4px 24px hsla(258,78%,55%,0.07), 0 1px 0 rgba(255,255,255,0.9) inset',
          padding: '24px 20px',
        }}>
        <a href="/" className="flex items-center justify-center">
          <BrandLogo size="lg" />
        </a>
        <p className="text-[13px] leading-relaxed md:whitespace-nowrap footer-tagline-highlight" style={{ color: 'hsl(226,35%,42%)' }}
          dangerouslySetInnerHTML={{ __html: highlightTagline(settings.tagline) }}
        />


        {/* Contact pills — centered */}
        <div className="flex flex-col items-center gap-2 w-full">
          {[
            { icon: <Phone size={13} />, href: `tel:${settings.phone.replace(/\D/g, '')}`, label: settings.phone, color: 'hsl(258,78%,55%)' },
            { icon: <Mail size={13} />,  href: `mailto:${settings.email}`, label: settings.email, color: 'hsl(200,90%,45%)' },
            { icon: <MapPin size={13} />, href: '#', label: settings.address, color: 'hsl(162,72%,38%)' },
          ].map((c, i) => (
            <a key={i} href={c.href}
              className="flex items-center gap-3 text-sm transition-all group hover:translate-x-1"
              style={{ color: 'hsl(226,35%,42%)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = c.color; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(226,35%,42%)'; }}>
              <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${c.color.replace('hsl(','hsla(').replace(')',',0.10)')}`,
                  border: `1.5px solid ${c.color.replace('hsl(','hsla(').replace(')',',0.22)')}`,
                  color: c.color,
                }}>
                {c.icon}
              </span>
              <span className="font-fira text-[12px]">{c.label}</span>
            </a>
          ))}
        </div>

        {/* Social icons — centered */}
        <div className="flex gap-3 justify-center">
          {[
            { icon: <Facebook size={17} />,      href: settings.facebook_url,  label: 'Facebook',  color: 'hsl(258,78%,55%)' },
            { icon: <MessageCircle size={17} />, href: settings.whatsapp_url,  label: 'WhatsApp',  color: 'hsl(162,72%,38%)' },
            { icon: <Instagram size={17} />,     href: settings.instagram_url, label: 'Instagram', color: 'hsl(330,85%,55%)' },
            { icon: <Send size={17} />,          href: settings.telegram_url,  label: 'Telegram',  color: 'hsl(200,80%,50%)' },
          ].map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-0.5"
              style={{
                background: 'hsla(0,0%,100%,0.65)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid hsla(258,78%,75%,0.22)',
                color: 'hsl(226,35%,42%)',
                boxShadow: '0 2px 8px hsla(226,35%,12%,0.06)',
              }}
              title={s.label}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = s.color;
                el.style.borderColor = s.color.replace('hsl(','hsla(').replace(')',',0.45)');
                el.style.boxShadow = `0 4px 16px ${s.color.replace('hsl(','hsla(').replace(')',',0.20)')}`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = 'hsl(226,35%,42%)';
                el.style.borderColor = 'hsla(258,78%,75%,0.22)';
                el.style.boxShadow = '0 2px 8px hsla(226,35%,12%,0.06)';
              }}>
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      {/* Nav columns — fully dynamic from admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sections.map((col) => {
          const IconComp = ICON_MAP[col.icon] ?? Info;
          const accent = col.accent || 'hsl(258,78%,55%)';
          return (
            <div key={col.id} className="rounded-2xl p-5 space-y-4"
              style={{
                background: 'linear-gradient(135deg, hsla(0,0%,100%,0.72) 0%, hsla(0,0%,100%,0.50) 100%)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: `1px solid ${accent.replace('hsl(','hsla(').replace(')',',0.18)')}`,
                boxShadow: `0 4px 20px ${accent.replace('hsl(','hsla(').replace(')',',0.07)')}, 0 1px 0 rgba(255,255,255,0.9) inset`,
              }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: accent.replace('hsl(','hsla(').replace(')',',0.12)'),
                    border: `1.5px solid ${accent.replace('hsl(','hsla(').replace(')',',0.25)')}`,
                    color: accent,
                  }}>
                  <IconComp size={14} />
                </div>
                <h4 className="font-sora font-bold text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: 'hsl(226,35%,20%)' }}>
                  {col.title}
                </h4>
              </div>
              <div className="h-px rounded-full"
                style={{ background: `linear-gradient(90deg, ${accent.replace('hsl(','hsla(').replace(')',',0.40)')}, transparent)` }} />
              <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-2 gap-y-0.5">
                {col.links.map((link) => (
                  <li key={link.id}>
                    <a href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="group flex items-center gap-2 px-2.5 py-2 rounded-xl text-[12.5px] transition-all"
                      style={{
                        color: 'hsl(226,35%,45%)',
                        background: 'transparent',
                        border: '1px solid transparent',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = accent;
                        el.style.background = accent.replace('hsl(','hsla(').replace(')',',0.08)');
                        el.style.borderColor = accent.replace('hsl(','hsla(').replace(')',',0.22)');
                        el.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = 'hsl(226,35%,45%)';
                        el.style.background = 'transparent';
                        el.style.borderColor = 'transparent';
                        el.style.transform = 'translateX(0)';
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all group-hover:scale-125"
                        style={{ background: accent.replace('hsl(','hsla(').replace(')',',0.45)') }} />
                      <span className="truncate">{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>

    {/* ── Copyright ── */}
    <div className="relative z-10 border-t" style={{ borderColor: 'hsla(258,78%,75%,0.12)' }}>
      <div className="container-fluid py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div
          className="inline-flex items-center px-4 py-1.5 rounded-full backdrop-blur-md transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, hsla(0,0%,100%,0.85), hsla(258,78%,98%,0.75))',
            border: '1px solid hsla(258,78%,75%,0.25)',
            boxShadow: '0 4px 16px -4px hsla(258,78%,50%,0.12), inset 0 1px 0 hsla(0,0%,100%,0.6)',
          }}
        >
          <p className="text-[11px] font-fira tracking-wide">
            <span style={{
              background: 'linear-gradient(90deg, hsl(258,78%,45%), hsl(290,70%,50%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 600,
            }}>© {new Date().getFullYear()}</span>
            {' '}
            <strong style={{
              background: 'linear-gradient(90deg, hsl(226,75%,30%), hsl(258,78%,40%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{settings.store_name}</strong>
            <span style={{ color: 'hsl(226,30%,45%)' }}>. </span>
            <span style={{
              background: 'linear-gradient(90deg, hsl(190,75%,40%), hsl(258,70%,50%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 500,
            }}>All Rights Reserved.</span>
          </p>
        </div>
        <a href={settings.website_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full backdrop-blur-md transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, hsla(0,0%,100%,0.85), hsla(258,78%,98%,0.75))',
            border: '1px solid hsla(258,78%,75%,0.25)',
            boxShadow: '0 4px 16px -4px hsla(258,78%,50%,0.12), inset 0 1px 0 hsla(0,0%,100%,0.6)',
          }}>
          <span className="text-[11px] font-fira tracking-wide" style={{
            background: 'linear-gradient(90deg, hsl(258,78%,45%), hsl(290,70%,50%), hsl(190,75%,45%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 600,
          }}>
            {settings.website_url.replace('https://','').replace('http://','')}
          </span>
          <ExternalLink size={10} style={{ color: 'hsl(258,78%,50%)' }} />
        </a>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
