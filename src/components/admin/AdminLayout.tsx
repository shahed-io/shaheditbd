import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import BrandLogo from '@/components/store/BrandLogo';
import { NavLink, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  LogOut, Menu, X, Bell, Search, ChevronDown, ChevronRight,
  Grid3X3, Percent, FileText, CreditCard, Headphones, TrendingUp,
  Megaphone, Shield, Database, Gift, BookOpen, HelpCircle, Globe, Layout, FolderDown,
  Bot, KeyRound, Star, BarChart2,
  ImageIcon, ArrowLeftRight, Wallet, Sliders, Flame, Mail, Facebook, Layers, ShieldCheck, MessageCircle, Brain, AlertTriangle, Palette, Sparkles,
  ShoppingCart as ShopIcon, CreditCard as CreditIcon,
  PanelLeftClose, PanelLeftOpen,
  ShoppingBag, Boxes, Megaphone as MegaIcon, FileCode2, BarChart3, Plug, Cog, Pin, PinOff,
} from 'lucide-react';

interface AdminNotif {
  id: string;
  type: 'order' | 'payment' | 'ticket' | 'stock';
  title: string;
  message: string;
  time: string;
  link?: string;
}

type MenuItem = { icon: any; label: string; path: string; badge?: 'live' | 'new' };
type MenuSection = { title: string; sectionIcon: any; items: MenuItem[] };

// ─── Grouped sidebar — clear sections with category icons ───
const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Overview',
    sectionIcon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/ceo' },
    ],
  },
  {
    title: 'Sales',
    sectionIcon: ShoppingBag,
    items: [
      { icon: ShoppingCart, label: 'Orders', path: '/ceo/orders', badge: 'live' },
      { icon: ShoppingCart, label: 'Quick Sale', path: '/ceo/quick-sale' },
      { icon: FileText, label: 'Invoice Generator', path: '/ceo/invoices' },
      { icon: CreditCard, label: 'Payments', path: '/ceo/payments' },
      { icon: KeyRound, label: 'License Manager', path: '/ceo/licenses' },
    ],
  },
  {
    title: 'Catalog',
    sectionIcon: Boxes,
    items: [
      { icon: Package, label: 'Products', path: '/ceo/products' },
      { icon: Grid3X3, label: 'Categories', path: '/ceo/categories' },
      { icon: Sliders, label: 'Attributes', path: '/ceo/attributes' },
      { icon: AlertTriangle, label: 'Inventory Alerts', path: '/ceo/inventory-alerts' },
      { icon: ArrowLeftRight, label: 'Import / Export', path: '/ceo/import-export' },
      { icon: Star, label: 'Product Reviews', path: '/ceo/product-reviews' },
      { icon: FolderDown, label: 'Software Downloads', path: '/ceo/software-downloads' },
    ],
  },
  {
    title: 'Customers',
    sectionIcon: Users,
    items: [
      { icon: Users, label: 'All Customers', path: '/ceo/customers' },
      { icon: Wallet, label: 'Wallet', path: '/ceo/wallet' },
      { icon: Headphones, label: 'Support Tickets', path: '/ceo/tickets' },
      { icon: MessageCircle, label: 'Live Chat', path: '/ceo/live-chat' },
      { icon: Mail, label: 'Newsletter', path: '/ceo/newsletter' },
    ],
  },
  {
    title: 'Storefront',
    sectionIcon: Layout,
    items: [
      { icon: Sliders, label: 'Hero Banner', path: '/ceo/hero-banner' },
      { icon: Flame, label: 'Flash Sale', path: '/ceo/flash-sale' },
      { icon: Star, label: 'Testimonials', path: '/ceo/testimonials' },
      { icon: Megaphone, label: 'Announcement Bar', path: '/ceo/announcement-bar' },
      { icon: Layers, label: 'Popup Banner', path: '/ceo/popup-banner' },
      { icon: Layout, label: 'Pages', path: '/ceo/pages' },
      { icon: Layout, label: 'Footer Settings', path: '/ceo/footer-settings' },
      { icon: Palette, label: 'Themes', path: '/ceo/themes' },
    ],
  },
  {
    title: 'Marketing',
    sectionIcon: MegaIcon,
    items: [
      { icon: Percent, label: 'Coupons', path: '/ceo/coupons' },
      { icon: Gift, label: 'Welcome Discount', path: '/ceo/welcome-discount' },
      { icon: Gift, label: 'Referrals', path: '/ceo/referrals' },
      { icon: TrendingUp, label: 'Affiliates', path: '/ceo/affiliates' },
      { icon: Megaphone, label: 'Marketing Hub', path: '/ceo/marketing' },
      { icon: Facebook, label: 'Facebook Pixel', path: '/ceo/facebook-pixel' },
      { icon: Users, label: 'FB Custom Audiences', path: '/ceo/custom-audiences' },
      { icon: BarChart2, label: 'Google Ads', path: '/ceo/google-ads' },
      { icon: Megaphone, label: 'Other Pixels', path: '/ceo/marketing-pixels' },
    ],
  },
  {
    title: 'Content & SEO',
    sectionIcon: FileCode2,
    items: [
      { icon: BookOpen, label: 'Blog', path: '/ceo/blog' },
      { icon: HelpCircle, label: 'Help Center', path: '/ceo/help' },
      { icon: ImageIcon, label: 'Media Library', path: '/ceo/media-library' },
      { icon: Globe, label: 'SEO Manager', path: '/ceo/seo' },
      { icon: ShieldCheck, label: 'Site Verification', path: '/ceo/site-verification' },
    ],
  },
  {
    title: 'Reports',
    sectionIcon: BarChart3,
    items: [
      { icon: TrendingUp, label: 'Analytics & Reports', path: '/ceo/reports' },
    ],
  },
  {
    title: 'Integrations',
    sectionIcon: Plug,
    items: [
      { icon: Bot, label: 'Telegram Shop Bot', path: '/ceo/telegram-bot' },
      { icon: ShieldCheck, label: 'CID Reseller Portal', path: '/ceo/reseller' },
      { icon: Users, label: 'Reseller Accounts', path: '/ceo/reseller-accounts' },
    ],
  },
  {
    title: 'AI Tools',
    sectionIcon: Sparkles,
    items: [
      { icon: Brain, label: 'AI Assistant', path: '/ceo/ai-assistant', badge: 'new' },
      { icon: Sparkles, label: 'AI API Config', path: '/ceo/ai-config' },
    ],
  },
  {
    title: 'System',
    sectionIcon: Cog,
    items: [
      { icon: Users, label: 'Staff Management', path: '/ceo/staff' },
      { icon: Shield, label: 'Admin Roles', path: '/ceo/roles' },
      { icon: Database, label: 'Backup', path: '/ceo/backup' },
      { icon: Settings, label: 'General Settings', path: '/ceo/settings' },
    ],
  },
];

// Build a flat lookup for the current page title
const ALL_ITEMS_FLAT = MENU_SECTIONS.flatMap(s =>
  s.items.map(i => ({ ...i, section: s.title }))
);

const getPageTitle = (pathname: string): { title: string; section: string; icon: any } => {
  const sorted = [...ALL_ITEMS_FLAT].sort((a, b) => b.path.length - a.path.length);
  for (const item of sorted) {
    if (pathname === item.path || pathname.startsWith(item.path + '/')) {
      return { title: item.label, section: item.section, icon: item.icon };
    }
  }
  return { title: 'Admin Panel', section: '', icon: LayoutDashboard };
};

const PINNED_KEY = 'admin_pinned_items_v1';

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [adminNotifs, setAdminNotifs] = useState<AdminNotif[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [navSearch, setNavSearch] = useState('');
  const [pinnedPaths, setPinnedPaths] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(PINNED_KEY) || '[]'); } catch { return []; }
  });
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pageMeta = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  // Filter sections by search
  const visibleSections = useMemo(() => {
    if (!navSearch.trim()) return MENU_SECTIONS;
    const q = navSearch.toLowerCase();
    return MENU_SECTIONS
      .map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(s => s.items.length > 0);
  }, [navSearch]);

  // Pinned items (from flat lookup)
  const pinnedItems = useMemo(() => {
    return pinnedPaths
      .map(p => ALL_ITEMS_FLAT.find(i => i.path === p))
      .filter(Boolean) as (MenuItem & { section: string })[];
  }, [pinnedPaths]);

  // Persist pinned
  useEffect(() => {
    localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedPaths));
  }, [pinnedPaths]);

  const togglePin = useCallback((path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  }, []);

  // Keyboard shortcut ⌘K / Ctrl+K — focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Fetch admin notifications
  const fetchNotifs = useCallback(async () => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const [{ data: recentOrders }, { data: pendingPayments }, { data: openTickets }, { data: lowStock }] = await Promise.all([
      supabase.from('orders').select('id, order_number, customer_name, total, created_at').gte('created_at', dayAgo).order('created_at', { ascending: false }).limit(5),
      supabase.from('payment_proofs').select('id, order_id, submitted_at').eq('status', 'pending').order('submitted_at', { ascending: false }).limit(5),
      supabase.from('support_tickets').select('id, ticket_number, subject, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('id, name, stock_quantity').eq('status', 'active').lte('stock_quantity', 5).not('stock_quantity', 'is', null).limit(5),
    ]);
    const notifs: AdminNotif[] = [];
    (recentOrders || []).forEach(o => notifs.push({ id: `o-${o.id}`, type: 'order', title: `নতুন অর্ডার #${o.order_number}`, message: `${o.customer_name} — ৳${Number(o.total).toLocaleString()}`, time: new Date(o.created_at).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }), link: '/ceo/orders' }));
    (pendingPayments || []).forEach(p => notifs.push({ id: `p-${p.id}`, type: 'payment', title: 'পেমেন্ট ভেরিফিকেশন বাকি', message: `Order ID: ${p.order_id?.slice(0, 8)}...`, time: new Date(p.submitted_at).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }), link: '/ceo/orders?status=payment_pending' }));
    (openTickets || []).forEach(t => notifs.push({ id: `t-${t.id}`, type: 'ticket', title: `টিকেট #${t.ticket_number}`, message: t.subject, time: new Date(t.created_at).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }), link: '/ceo/tickets' }));
    (lowStock || []).forEach(s => notifs.push({ id: `s-${s.id}`, type: 'stock', title: 'লো স্টক অ্যালার্ট', message: `${s.name} — ${s.stock_quantity} বাকি`, time: 'এখনই', link: '/ceo/inventory-alerts' }));
    setAdminNotifs(notifs);
    setNotifCount(notifs.length);
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);
  useEffect(() => { const iv = setInterval(fetchNotifs, 60000); return () => clearInterval(iv); }, [fetchNotifs]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  if (loading) return (
    <div className="min-h-screen admin-mesh-bg flex items-center justify-center">
      <div className="admin-glass-card p-8 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Loading Dashboard...</p>
      </div>
    </div>
  );

  if (!user || !isAdmin) return <Navigate to="/ceo/login" replace />;

  const toggleSection = (title: string) => {
    setCollapsedSections(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  // ─── Sidebar content renderer ───
  const sidebarContent = (isMobile: boolean) => {
    const showLabel = isMobile || sidebarOpen;
    return (
      <>
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border/40 min-h-[72px] overflow-hidden">
          {showLabel ? (
            <div className="flex items-center justify-between w-full">
              <Link to="/ceo" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
                  style={{ background: 'radial-gradient(ellipse at 40% 35%, hsl(20,100%,55%), hsl(340,100%,45%) 60%, hsl(222,30%,18%))' }}>
                  <span className="text-white text-sm font-black" style={{ fontFamily: 'Sora, sans-serif' }}>S</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-bold text-foreground tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>Shahed Store</span>
                  <span className="text-[9px] uppercase tracking-[1.5px] font-semibold text-primary mt-0.5">Admin Panel</span>
                </div>
              </Link>
              {isMobile && (
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mx-auto shadow-md"
              style={{ background: 'radial-gradient(ellipse at 40% 35%, hsl(20,100%,55%), hsl(340,100%,45%) 60%, hsl(222,30%,18%))' }}>
              <span className="text-white text-sm font-black" style={{ fontFamily: 'Sora, sans-serif' }}>S</span>
            </div>
          )}
        </div>

        {/* Quick search inside sidebar */}
        {showLabel && (
          <div className="px-3 pt-3 pb-1">
            <div className="admin-search-box !min-w-0 !py-1.5">
              <Search size={13} className="text-muted-foreground flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
                placeholder="Search menu..."
              />
              <span className="admin-kbd flex-shrink-0">⌘K</span>
            </div>
          </div>
        )}

        {/* Pinned items */}
        {showLabel && pinnedItems.length > 0 && !navSearch && (
          <div className="px-2 pt-2">
            <div className="admin-section-chip">
              <Pin size={11} className="text-primary" />
              <span>Pinned</span>
            </div>
            <div className="space-y-0.5 mt-1 mb-3">
              {pinnedItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/ceo' && location.pathname.startsWith(item.path + '/'));
                return (
                  <NavLink
                    key={`pin-${item.path}`}
                    to={item.path}
                    end={item.path === '/ceo'}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    <button onClick={(e) => togglePin(item.path, e)} className="opacity-50 hover:opacity-100 transition-opacity">
                      <PinOff size={11} />
                    </button>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3 scrollbar-thin">
          {visibleSections.map((section, sIdx) => {
            const isCollapsed = collapsedSections.includes(section.title);
            const SectionIcon = section.sectionIcon;
            return (
              <div key={section.title} className="admin-nav-anim" style={{ animationDelay: `${sIdx * 25}ms` }}>
                {showLabel ? (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="admin-section-chip"
                  >
                    <span className="admin-section-icon">
                      <SectionIcon size={11} />
                    </span>
                    <span className="flex-1 text-left">{section.title}</span>
                    <span className="text-[9px] font-medium opacity-60">{section.items.length}</span>
                    <ChevronDown
                      size={11}
                      className={`opacity-60 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                    />
                  </button>
                ) : (
                  <div className="flex justify-center my-2" title={section.title}>
                    <span className="admin-section-icon" style={{ width: 24, height: 24 }}>
                      <SectionIcon size={13} />
                    </span>
                  </div>
                )}

                {!isCollapsed && (
                  <div className="space-y-0.5 mt-1">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path ||
                        (item.path !== '/ceo' && location.pathname.startsWith(item.path + '/'));
                      const isPinned = pinnedPaths.includes(item.path);
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === '/ceo'}
                          title={!showLabel ? item.label : undefined}
                          className={`admin-nav-item group ${isActive ? 'active' : ''} ${!showLabel ? 'justify-center' : ''}`}
                        >
                          <item.icon size={17} className="flex-shrink-0" />
                          {showLabel && (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {item.badge === 'live' && (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-500/12 px-1.5 py-0.5 rounded-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 admin-notif-dot" /> LIVE
                                </span>
                              )}
                              {item.badge === 'new' && (
                                <span className="text-[9px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-md">NEW</span>
                              )}
                              <button
                                onClick={(e) => togglePin(item.path, e)}
                                className={`transition-opacity ${isPinned ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-50 hover:!opacity-100'}`}
                                title={isPinned ? 'Unpin' : 'Pin to top'}
                              >
                                {isPinned ? <Pin size={11} className="text-primary fill-primary" /> : <Pin size={11} />}
                              </button>
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {visibleSections.length === 0 && showLabel && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              <Search size={20} className="mx-auto mb-2 opacity-40" />
              কোনো ম্যাচ পাওয়া যায়নি
            </div>
          )}
        </nav>

        {/* User info footer */}
        <div className="border-t border-border/40 p-3">
          {showLabel ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                {(user.email?.[0] || 'A').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">Admin</div>
                <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
              </div>
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={signOut} className="w-full flex justify-center text-muted-foreground hover:text-destructive transition-colors p-2" title="Sign Out">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </>
    );
  };

  const PageIcon = pageMeta.icon;

  return (
    <div className="min-h-screen admin-mesh-bg flex">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed left-0 top-0 h-full z-50 w-[280px] flex flex-col admin-sidebar-v2 transition-transform duration-300 md:hidden ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-full z-40 transition-all duration-300 flex-col ${sidebarOpen ? 'w-[260px]' : 'w-[68px]'} admin-sidebar-v2`}>
        {sidebarContent(false)}
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 w-full min-w-0 ${sidebarOpen ? 'md:ml-[260px]' : 'md:ml-[68px]'}`}>
        {/* Top bar */}
        <header className="admin-header-v2 px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-3 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="admin-pill-btn !p-2 md:hidden flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="admin-pill-btn !p-2 hidden md:flex flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>

          {/* Page title + breadcrumb */}
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsla(var(--brand-h),var(--brand-s),55%,0.15), hsla(var(--brand2-h),var(--brand2-s),55%,0.10))' }}>
              <PageIcon size={18} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              {pageMeta.section && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-[1.2px]">
                  <span>{pageMeta.section}</span>
                  <ChevronRight size={10} />
                  <span className="text-primary">{pageMeta.title}</span>
                </div>
              )}
              <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.3px' }}>
                {pageMeta.title}
              </h1>
            </div>
          </div>

          {/* Header actions */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 flex-shrink-0 relative">
            {/* Quick search trigger (hidden on mobile) */}
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="admin-pill-btn hidden lg:flex"
              title="Search menu (⌘K)"
            >
              <Search size={14} />
              <span className="text-xs">Search</span>
              <span className="admin-kbd ml-1">⌘K</span>
            </button>

            {/* Notifications */}
            <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="admin-pill-btn !p-2 relative" aria-label="Notifications">
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-rose-500 to-orange-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-md">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {showNotifPanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
                <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 admin-glass-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">Notifications</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{notifCount} new updates</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">Live</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-border/30">
                    {adminNotifs.length === 0 ? (
                      <div className="py-12 text-center">
                        <Bell size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই</p>
                      </div>
                    ) : adminNotifs.map(n => {
                      const icons: Record<string, { icon: any; cls: string }> = {
                        order: { icon: ShopIcon, cls: 'text-emerald-600 bg-emerald-500/10' },
                        payment: { icon: CreditIcon, cls: 'text-amber-600 bg-amber-500/10' },
                        ticket: { icon: Headphones, cls: 'text-blue-600 bg-blue-500/10' },
                        stock: { icon: AlertTriangle, cls: 'text-rose-600 bg-rose-500/10' },
                      };
                      const { icon: NIcon, cls } = icons[n.type] || icons.order;
                      return (
                        <a key={n.id} href={n.link || '#'} onClick={() => setShowNotifPanel(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
                            <NIcon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground">{n.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{n.time}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <a href="/" target="_blank" rel="noopener" className="admin-pill-btn hidden sm:flex">
              <Globe size={14} />
              <span className="text-xs">View Store</span>
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-auto relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
