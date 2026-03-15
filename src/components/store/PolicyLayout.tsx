import React from 'react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { FloatingButtons } from '@/components/store/Extras';

/* ─── Reusable primitives ─── */

export const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`relative rounded-3xl overflow-hidden ${className}`}
    style={{
      background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.60) 100%)',
      backdropFilter: 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.75)',
      boxShadow: '0 8px 40px hsla(258,78%,55%,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
    }}
  >
    {/* Top shimmer line */}
    <div className="absolute top-0 left-0 right-0 h-px"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 50%, transparent)' }} />
    {children}
  </div>
);

export const SectionCard = ({
  icon, title, accentFrom, accentTo, children,
}: {
  icon: React.ReactNode; title: string;
  accentFrom: string; accentTo: string;
  children: React.ReactNode;
}) => (
  <div className="mb-5 rounded-2xl overflow-hidden"
    style={{
      background: 'linear-gradient(155deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.45) 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid hsla(258,78%,75%,0.22)`,
      boxShadow: '0 2px 16px hsla(258,78%,55%,0.06)',
    }}>
    {/* Header */}
    <div className="flex items-center gap-3 px-6 py-4"
      style={{
        background: `linear-gradient(135deg, hsla(258,78%,55%,0.07), hsla(200,90%,45%,0.05))`,
        borderBottom: '1px solid hsla(258,78%,75%,0.15)',
      }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`, boxShadow: `0 4px 12px ${accentFrom}50` }}>
        <span className="text-white">{icon}</span>
      </div>
      <h2 className="font-sora font-bold text-[15px]" style={{ color: 'hsl(226,35%,14%)' }}>{title}</h2>
    </div>
    {/* Body */}
    <div className="px-6 py-5 text-[13.5px] leading-relaxed space-y-2" style={{ color: 'hsl(226,25%,38%)' }}>
      {children}
    </div>
  </div>
);

export const Bullet = ({ children, color }: { children: React.ReactNode; color?: string }) => (
  <li className="flex items-start gap-2.5">
    <span className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: color || 'hsl(258,78%,55%)' }} />
    <span>{children}</span>
  </li>
);

export const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2.5 px-1"
    style={{ borderBottom: '1px solid hsla(258,78%,55%,0.08)' }}>
    <span className="text-[12px] font-semibold" style={{ color: 'hsl(226,35%,30%)' }}>{label}</span>
    <span className="text-[12px] font-bold px-3 py-1 rounded-full"
      style={{ background: 'hsla(258,78%,55%,0.08)', color: 'hsl(258,78%,45%)' }}>{value}</span>
  </div>
);

export const ContactCard = ({ accentFrom, accentTo }: { accentFrom: string; accentTo: string }) => (
  <div className="mt-5 rounded-2xl p-5"
    style={{
      background: `linear-gradient(135deg, ${accentFrom}0d, ${accentTo}08)`,
      border: `1px solid ${accentFrom}30`,
    }}>
    <p className="font-sora font-bold text-sm mb-3" style={{ color: 'hsl(226,35%,18%)' }}>যোগাযোগ করুন</p>
    <div className="space-y-2 text-[13px]" style={{ color: 'hsl(226,25%,42%)' }}>
      <a href="https://wa.me/8801840099853" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 hover:underline w-fit" style={{ color: accentFrom }}>
        💬 WhatsApp: 01840-099853
      </a>
      <a href="mailto:info@shahedstore.com.bd"
        className="flex items-center gap-2 hover:underline w-fit" style={{ color: accentFrom }}>
        ✉️ info@shahedstore.com.bd
      </a>
      <a href="tel:01840099853"
        className="flex items-center gap-2 hover:underline w-fit" style={{ color: accentFrom }}>
        📞 01840-099853
      </a>
    </div>
  </div>
);

/* ─── Main Layout ─── */

interface PolicyLayoutProps {
  seoTitle: string;
  seoDesc: string;
  badge: string;
  badgeIcon: React.ReactNode;
  title: string;
  subtitle: string;
  accentFrom: string;
  accentTo: string;
  children: React.ReactNode;
}

const PolicyLayout = ({
  seoTitle, seoDesc, badge, badgeIcon, title, subtitle,
  accentFrom, accentTo, children,
}: PolicyLayoutProps) => (
  <div className="min-h-screen text-foreground"
    style={{
      background: `linear-gradient(145deg, hsl(258,55%,97%) 0%, hsl(220,40%,96%) 40%, hsl(200,50%,96%) 100%)`,
    }}>
    <SEOHead title={seoTitle} description={seoDesc} />
    <Navbar />

    {/* Hero */}
    <div className="relative overflow-hidden pt-24 pb-16">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px]"
          style={{ background: `radial-gradient(circle, ${accentFrom}18, transparent 65%)` }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px]"
          style={{ background: `radial-gradient(circle, ${accentTo}12, transparent 65%)` }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: `radial-gradient(circle, ${accentFrom}0f 1px, transparent 1px)`, backgroundSize: '26px 26px' }} />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold mb-5"
          style={{
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${accentFrom}35`,
            color: accentFrom,
            boxShadow: `0 4px 16px ${accentFrom}20`,
          }}>
          {badgeIcon} {badge}
        </div>

        {/* Title glass card */}
        <div className="inline-block px-8 py-5 rounded-3xl mb-5"
          style={{
            background: 'linear-gradient(155deg, rgba(255,255,255,0.80), rgba(255,255,255,0.55))',
            backdropFilter: 'blur(32px)',
            border: '1.5px solid rgba(255,255,255,0.80)',
            boxShadow: `0 12px 50px ${accentFrom}18, 0 1px 0 rgba(255,255,255,0.9) inset`,
          }}>
          <h1 className="font-sora font-black text-4xl sm:text-5xl leading-none"
            style={{
              background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{title}</h1>
        </div>

        <p className="text-[14px] max-w-lg mx-auto leading-relaxed" style={{ color: 'hsl(226,25%,42%)' }}>
          {subtitle}
        </p>
        <p className="text-[11px] mt-3 font-fira" style={{ color: 'hsl(226,25%,58%)' }}>
          সর্বশেষ আপডেট: মার্চ ২০২৬
        </p>
      </div>
    </div>

    {/* Content */}
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pb-20">
      <GlassCard className="p-6 sm:p-8">
        {children}
      </GlassCard>
    </div>

    <Footer />
    <FloatingButtons />
  </div>
);

export default PolicyLayout;
