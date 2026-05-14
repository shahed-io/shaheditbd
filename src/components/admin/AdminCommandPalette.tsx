import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, X, ArrowRight, Clock, Sparkles, Hash,
  LayoutDashboard, Package, ShoppingCart, Users, Settings, Grid3X3, Percent, FileText,
  CreditCard, Headphones, TrendingUp, Megaphone, BookOpen, HelpCircle, Globe, Layout,
  FolderDown, Bot, KeyRound, Star, BarChart2, Wallet, Sliders, Flame, Mail, Facebook,
  Layers, MessageCircle, AlertTriangle, Palette, Gift, Database, Shield, Brain,
  ImageIcon, ArrowLeftRight, ShieldCheck, CornerDownLeft, Command,
} from 'lucide-react';

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: any;
  path: string;
  group: string;
  keywords?: string;
  badge?: string;
};

type DynamicResult = {
  id: string;
  label: string;
  description: string;
  icon: any;
  path: string;
  group: string;
};

const STATIC_COMMANDS: CommandItem[] = [
  // Overview
  { id: 'dash', label: 'Dashboard', description: 'View your store overview & analytics', icon: LayoutDashboard, path: '/ceo', group: 'Overview', keywords: 'home overview stats analytics' },

  // Sales
  { id: 'orders', label: 'Orders', description: 'Manage customer orders', icon: ShoppingCart, path: '/ceo/orders', group: 'Sales', badge: 'LIVE', keywords: 'order purchase sales transaction' },
  { id: 'quick-sale', label: 'Quick Sale', description: 'Create a fast manual order', icon: ShoppingCart, path: '/ceo/quick-sale', group: 'Sales', keywords: 'pos manual order create' },
  { id: 'invoices', label: 'Invoice Generator', description: 'Generate professional invoices', icon: FileText, path: '/ceo/invoices', group: 'Sales', keywords: 'bill receipt invoice pdf' },
  { id: 'payments', label: 'Payments', description: 'Verify & manage payment proofs', icon: CreditCard, path: '/ceo/payments', group: 'Sales', keywords: 'payment money bkash bank' },
  { id: 'licenses', label: 'License Manager', description: 'Manage product license keys', icon: KeyRound, path: '/ceo/licenses', group: 'Sales', keywords: 'license key serial activation' },
  { id: 'p-licenses', label: 'Personal Licenses', description: 'Personal license inventory', icon: KeyRound, path: '/ceo/personal-licenses', group: 'Sales', keywords: 'personal license customer' },

  // Catalog
  { id: 'products', label: 'Products', description: 'Manage your product catalog', icon: Package, path: '/ceo/products', group: 'Catalog', keywords: 'product item inventory sku' },
  { id: 'categories', label: 'Categories', description: 'Organize products into categories', icon: Grid3X3, path: '/ceo/categories', group: 'Catalog', keywords: 'category group taxonomy' },
  { id: 'attributes', label: 'Attributes', description: 'Product attributes & variants', icon: Sliders, path: '/ceo/attributes', group: 'Catalog', keywords: 'attribute variant option' },
  { id: 'inv-alert', label: 'Inventory Alerts', description: 'Low stock notifications', icon: AlertTriangle, path: '/ceo/inventory-alerts', group: 'Catalog', keywords: 'stock low warning alert' },
  { id: 'imp-exp', label: 'Import / Export', description: 'Bulk product CSV operations', icon: ArrowLeftRight, path: '/ceo/import-export', group: 'Catalog', keywords: 'csv excel bulk upload' },
  { id: 'reviews', label: 'Product Reviews', description: 'Moderate customer reviews', icon: Star, path: '/ceo/product-reviews', group: 'Catalog', keywords: 'review rating star feedback' },
  { id: 'sw-down', label: 'Software Downloads', description: 'Manage downloadable software', icon: FolderDown, path: '/ceo/software-downloads', group: 'Catalog', keywords: 'software download file' },

  // Customers
  { id: 'customers', label: 'All Customers', description: 'View & manage customers', icon: Users, path: '/ceo/customers', group: 'Customers', keywords: 'user buyer client member' },
  { id: 'wallet', label: 'Wallet', description: 'Customer wallet balances', icon: Wallet, path: '/ceo/wallet', group: 'Customers', keywords: 'wallet balance credit money' },
  { id: 'tickets', label: 'Support Tickets', description: 'Handle customer support', icon: Headphones, path: '/ceo/tickets', group: 'Customers', keywords: 'support help ticket' },
  { id: 'live-chat', label: 'Live Chat', description: 'Real-time chat conversations', icon: MessageCircle, path: '/ceo/live-chat', group: 'Customers', keywords: 'chat message conversation' },
  { id: 'newsletter', label: 'Newsletter', description: 'Email subscribers', icon: Mail, path: '/ceo/newsletter', group: 'Customers', keywords: 'email subscriber newsletter' },

  // Storefront
  { id: 'hero', label: 'Hero Banner', description: 'Edit homepage hero', icon: Sliders, path: '/ceo/hero-banner', group: 'Storefront', keywords: 'hero banner home slider' },
  { id: 'flash', label: 'Flash Sale', description: 'Manage flash sale offers', icon: Flame, path: '/ceo/flash-sale', group: 'Storefront', keywords: 'flash sale deal countdown' },
  { id: 'testimonials', label: 'Testimonials', description: 'Customer testimonials', icon: Star, path: '/ceo/testimonials', group: 'Storefront', keywords: 'testimonial quote review' },
  { id: 'announce', label: 'Announcement Bar', description: 'Top notification bar', icon: Megaphone, path: '/ceo/announcement-bar', group: 'Storefront', keywords: 'announcement bar notice' },
  { id: 'popup', label: 'Popup Banner', description: 'Promotional popup banners', icon: Layers, path: '/ceo/popup-banner', group: 'Storefront', keywords: 'popup banner modal' },
  { id: 'pages', label: 'Pages', description: 'Edit static pages', icon: Layout, path: '/ceo/pages', group: 'Storefront', keywords: 'page about contact terms' },
  { id: 'footer', label: 'Footer Settings', description: 'Footer links & info', icon: Layout, path: '/ceo/footer-settings', group: 'Storefront', keywords: 'footer links bottom' },
  { id: 'themes', label: 'Themes', description: 'Switch site themes', icon: Palette, path: '/ceo/themes', group: 'Storefront', keywords: 'theme color design dark light' },

  // Marketing
  { id: 'coupons', label: 'Coupons', description: 'Discount codes', icon: Percent, path: '/ceo/coupons', group: 'Marketing', keywords: 'coupon code discount promo' },
  { id: 'welcome-disc', label: 'Welcome Discount', description: 'New user discount setup', icon: Gift, path: '/ceo/welcome-discount', group: 'Marketing', keywords: 'welcome new user discount' },
  { id: 'referrals', label: 'Referrals', description: 'Referral program', icon: Gift, path: '/ceo/referrals', group: 'Marketing', keywords: 'referral invite friend reward' },
  { id: 'affiliates', label: 'Affiliates', description: 'Affiliate partner program', icon: TrendingUp, path: '/ceo/affiliates', group: 'Marketing', keywords: 'affiliate partner commission' },
  { id: 'mkt-hub', label: 'Marketing Hub', description: 'Marketing tools overview', icon: Megaphone, path: '/ceo/marketing', group: 'Marketing', keywords: 'marketing campaign promotion' },
  { id: 'fb-pixel', label: 'Facebook Pixel', description: 'FB tracking setup', icon: Facebook, path: '/ceo/facebook-pixel', group: 'Marketing', keywords: 'facebook pixel meta tracking' },
  { id: 'fb-aud', label: 'FB Custom Audiences', description: 'Facebook audience builder', icon: Users, path: '/ceo/custom-audiences', group: 'Marketing', keywords: 'facebook audience custom' },
  { id: 'google-ads', label: 'Google Ads', description: 'Google Ads tracking', icon: BarChart2, path: '/ceo/google-ads', group: 'Marketing', keywords: 'google ads adwords' },
  { id: 'mkt-pixels', label: 'Other Pixels', description: 'TikTok & other pixels', icon: Megaphone, path: '/ceo/marketing-pixels', group: 'Marketing', keywords: 'tiktok pixel tracking' },

  // Content & SEO
  { id: 'blog', label: 'Blog', description: 'Manage blog posts', icon: BookOpen, path: '/ceo/blog', group: 'Content & SEO', keywords: 'blog post article content' },
  { id: 'help', label: 'Help Center', description: 'Help articles', icon: HelpCircle, path: '/ceo/help', group: 'Content & SEO', keywords: 'help faq article documentation' },
  { id: 'media', label: 'Media Library', description: 'All uploaded images', icon: ImageIcon, path: '/ceo/media-library', group: 'Content & SEO', keywords: 'media image photo upload' },
  { id: 'seo', label: 'SEO Settings', description: 'Search engine optimization', icon: Globe, path: '/ceo/seo', group: 'Content & SEO', keywords: 'seo google search ranking meta' },
  { id: 'outreach', label: 'Backlink Outreach', description: 'Track guest posts & link partnerships', icon: Globe, path: '/ceo/seo/outreach', group: 'Content & SEO', keywords: 'outreach backlink guest post pitch link building' },

  // System
  { id: 'settings', label: 'Settings', description: 'Site-wide configuration', icon: Settings, path: '/ceo/settings', group: 'System', keywords: 'settings config preferences' },
  { id: 'staff', label: 'Staff Management', description: 'Manage admin users', icon: ShieldCheck, path: '/ceo/staff', group: 'System', keywords: 'staff admin user role permission' },
  { id: 'roles', label: 'Roles', description: 'User roles & permissions', icon: Shield, path: '/ceo/roles', group: 'System', keywords: 'role permission access' },
  { id: 'backup', label: 'Backup & Restore', description: 'Database backup', icon: Database, path: '/ceo/backup', group: 'System', keywords: 'backup restore database export' },
  { id: 'ai', label: 'AI Assistant', description: 'AI-powered admin assistant', icon: Bot, path: '/ceo/ai-assistant', group: 'System', keywords: 'ai assistant chat gemini' },
  { id: 'ai-conf', label: 'AI Config', description: 'AI configuration', icon: Brain, path: '/ceo/ai-config', group: 'System', keywords: 'ai config setup api' },
];

const RECENT_KEY = 'admin-cmd-recent';
const MAX_RECENT = 5;

interface Props {
  open: boolean;
  onClose: () => void;
}

const AdminCommandPalette = ({ open, onClose }: Props) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const [dynamic, setDynamic] = useState<DynamicResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load recents
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      if (Array.isArray(saved)) setRecents(saved);
    } catch {}
  }, []);

  // Focus + reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setDynamic([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced dynamic search (products / orders / customers)
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setDynamic([]);
      return;
    }
    const q = query.trim();
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const [prodRes, orderRes, custRes] = await Promise.all([
          supabase.from('products').select('id, name, slug, price').ilike('name', `%${q}%`).limit(5),
          supabase.from('orders').select('id, order_number, customer_name, total').or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`).limit(5),
          supabase.from('profiles').select('user_id, display_name, email, phone').or(`display_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`).limit(5),
        ]);
        const results: DynamicResult[] = [];
        prodRes.data?.forEach(p => results.push({
          id: `prod-${p.id}`, label: p.name, description: `৳${p.price} • Product`,
          icon: Package, path: `/ceo/products?edit=${p.id}`, group: 'Products',
        }));
        orderRes.data?.forEach(o => results.push({
          id: `ord-${o.id}`, label: `#${o.order_number}`, description: `${o.customer_name} • ৳${o.total}`,
          icon: ShoppingCart, path: `/ceo/orders?id=${o.id}`, group: 'Orders',
        }));
        custRes.data?.forEach(c => results.push({
          id: `cust-${c.user_id}`, label: c.display_name || c.email || 'Customer',
          description: `${c.email || ''}${c.phone ? ' • ' + c.phone : ''}`,
          icon: Users, path: `/ceo/customers?id=${c.user_id}`, group: 'Customers',
        }));
        setDynamic(results);
      } catch {
        setDynamic([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open]);

  // Filter static
  const filteredStatic = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIC_COMMANDS;
    return STATIC_COMMANDS.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.keywords?.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q)
    );
  }, [query]);

  // Build flat list with section info
  const flatList = useMemo(() => {
    const items: Array<{ kind: 'header'; label: string } | { kind: 'item'; data: CommandItem | DynamicResult; isDynamic: boolean }> = [];

    // Recents (only when no query)
    if (!query.trim() && recents.length > 0) {
      const rec = recents.map(id => STATIC_COMMANDS.find(c => c.id === id)).filter(Boolean) as CommandItem[];
      if (rec.length) {
        items.push({ kind: 'header', label: 'Recent' });
        rec.forEach(c => items.push({ kind: 'item', data: c, isDynamic: false }));
      }
    }

    // Dynamic results first
    if (dynamic.length > 0) {
      const groups = ['Products', 'Orders', 'Customers'];
      groups.forEach(g => {
        const grp = dynamic.filter(d => d.group === g);
        if (grp.length) {
          items.push({ kind: 'header', label: g });
          grp.forEach(d => items.push({ kind: 'item', data: d, isDynamic: true }));
        }
      });
    }

    // Static grouped
    const grouped = filteredStatic.reduce((acc, c) => {
      (acc[c.group] = acc[c.group] || []).push(c);
      return acc;
    }, {} as Record<string, CommandItem[]>);
    Object.entries(grouped).forEach(([group, list]) => {
      items.push({ kind: 'header', label: group });
      list.forEach(c => items.push({ kind: 'item', data: c, isDynamic: false }));
    });

    return items;
  }, [filteredStatic, dynamic, recents, query]);

  // Selectable items only
  const selectable = useMemo(() => flatList.filter(i => i.kind === 'item') as Extract<typeof flatList[number], { kind: 'item' }>[], [flatList]);

  useEffect(() => { setActiveIdx(0); }, [query, dynamic.length]);

  const handleSelect = useCallback((idx: number) => {
    const target = selectable[idx];
    if (!target) return;
    const path = target.data.path;
    // Save to recents (only static items)
    if (!target.isDynamic) {
      const id = (target.data as CommandItem).id;
      const next = [id, ...recents.filter(r => r !== id)].slice(0, MAX_RECENT);
      setRecents(next);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
    }
    onClose();
    navigate(path);
  }, [selectable, recents, navigate, onClose]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, selectable.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); handleSelect(activeIdx); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selectable.length, activeIdx, handleSelect, onClose]);

  // Scroll active into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  let itemIdx = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-3 sm:px-4 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden border border-violet-200/60 dark:border-violet-800/40 bg-white/95 dark:bg-violet-950/90 backdrop-blur-xl animate-in zoom-in-95 slide-in-from-top-4 duration-200" style={{ boxShadow: '0 24px 48px hsla(258,78%,55%,0.20), 0 8px 16px hsla(258,40%,30%,0.08)' }}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-violet-200/50 dark:border-violet-800/30 bg-gradient-to-r from-violet-50/60 via-white/40 to-violet-50/60 dark:from-violet-950/40 dark:via-violet-950/20 dark:to-violet-950/40">
          <Search size={18} className="text-violet-500 flex-shrink-0" strokeWidth={2.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, orders, products, customers…"
            className="flex-1 bg-transparent border-0 outline-none text-base text-foreground placeholder:text-muted-foreground/70 font-medium"
          />
          {loading && (
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300 px-2 py-1 rounded-md">
              <div className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
              Searching
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-violet-100/60 dark:hover:bg-violet-900/40 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2 admin-cmd-scroll">
          {flatList.length === 0 || (selectable.length === 0 && !loading) ? (
            <div className="px-4 py-12 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Search size={22} className="text-muted-foreground/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for orders, products, or customers
              </p>
            </div>
          ) : (
            flatList.map((row, i) => {
              if (row.kind === 'header') {
                return (
                  <div key={`h-${i}`} className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
                    {row.label === 'Recent' ? (
                      <Clock size={10} className="text-muted-foreground/60" />
                    ) : (
                      <Hash size={10} className="text-muted-foreground/60" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-muted-foreground/70">
                      {row.label}
                    </span>
                  </div>
                );
              }
              itemIdx++;
              const isActive = itemIdx === activeIdx;
              const data = row.data;
              const Icon = data.icon;
              const currentIdx = itemIdx;
              return (
                <button
                  key={data.id}
                  data-idx={currentIdx}
                  onMouseEnter={() => setActiveIdx(currentIdx)}
                  onClick={() => handleSelect(currentIdx)}
                  className={`w-full flex items-center gap-3 px-3 mx-2 py-2.5 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'text-white'
                      : 'hover:bg-violet-50/70 dark:hover:bg-violet-950/40 text-foreground'
                  }`}
                  style={isActive ? { background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))', boxShadow: '0 8px 24px hsla(258,78%,55%,0.30)' } : undefined}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-violet-100/70 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 group-hover:bg-violet-200/70'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{data.label}</span>
                      {'badge' in data && data.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-white/25 text-white' : 'bg-red-500/15 text-red-600 dark:text-red-400'
                        }`}>
                          {data.badge}
                        </span>
                      )}
                    </div>
                    {data.description && (
                      <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-white/85' : 'text-muted-foreground'}`}>
                        {data.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={14} className={`flex-shrink-0 transition-all ${
                    isActive ? 'text-white opacity-100 translate-x-0' : 'text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                  }`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-between bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[10px] font-semibold">↑↓</kbd>
              navigate
            </span>
            <span className="hidden sm:flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[10px] font-semibold flex items-center gap-0.5">
                <CornerDownLeft size={9} />
              </kbd>
              select
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[10px] font-semibold">esc</kbd>
              close
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
            <Sparkles size={11} />
            <span className="font-semibold">AI Smart Search</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommandPalette;
