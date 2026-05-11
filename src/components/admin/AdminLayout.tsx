import { useState, useEffect, useCallback, useMemo } from 'react';
import BrandLogo from '@/components/store/BrandLogo';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminPrefetch, prefetchAdminRoute } from '@/hooks/useAdminPrefetch';
import AdminCommandPalette from '@/components/admin/AdminCommandPalette';
import { useAdminCopyAnywhere } from '@/hooks/useAdminCopyAnywhere';

import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  LogOut, Menu, X, Bell, Search, ChevronDown, ChevronRight,
  Grid3X3, Percent, FileText, CreditCard, Headphones, TrendingUp,
  Megaphone, Shield, Database, Gift, BookOpen, HelpCircle, Globe, Layout, FolderDown,
  Bot, KeyRound, Star, BarChart2,
  ImageIcon, ArrowLeftRight, Wallet, Sliders, Flame, Mail, Facebook, Layers, ShieldCheck, MessageCircle, Brain, AlertTriangle, Palette, Sparkles, Activity,
  ShoppingCart as ShopIcon, CreditCard as CreditIcon,
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
type MenuSection = { title: string; items: MenuItem[] };

// ─── Grouped sidebar — clear sections instead of one long flat list ───
const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/ceo' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { icon: ShoppingCart, label: 'Orders', path: '/ceo/orders', badge: 'live' },
      { icon: ShopIcon, label: 'Abandoned Checkouts', path: '/ceo/abandoned-checkouts', badge: 'new' },
      { icon: ShoppingCart, label: 'Quick Sale', path: '/ceo/quick-sale' },
      { icon: FileText, label: 'Invoice Generator', path: '/ceo/invoices' },
      { icon: Palette, label: 'Invoice Design', path: '/ceo/invoice-design', badge: 'new' },
      { icon: CreditCard, label: 'Payments', path: '/ceo/payments' },
      { icon: KeyRound, label: 'License Manager', path: '/ceo/licenses' },
      { icon: KeyRound, label: 'Customer Licenses', path: '/ceo/customer-licenses', badge: 'new' },
    ],
  },
  {
    title: 'Catalog',
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
    items: [
      { icon: Sliders, label: 'Hero Banner', path: '/ceo/hero-banner' },
      { icon: Flame, label: 'Flash Sale', path: '/ceo/flash-sale' },
      { icon: Star, label: 'Testimonials', path: '/ceo/testimonials' },
      { icon: Megaphone, label: 'Announcement Bar', path: '/ceo/announcement-bar' },
      { icon: Layers, label: 'Popup Banner', path: '/ceo/popup-banner' },
      { icon: Layout, label: 'Pages', path: '/ceo/pages' },
      { icon: Layout, label: 'Footer Settings', path: '/ceo/footer-settings' },
      { icon: FileText, label: 'Text Manager', path: '/ceo/text-manager' },
      { icon: Palette, label: 'Themes', path: '/ceo/themes' },
    ],
  },
  {
    title: 'Marketing',
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
    items: [
      { icon: BookOpen, label: 'Blog', path: '/ceo/blog' },
      { icon: HelpCircle, label: 'Help Center', path: '/ceo/help' },
      { icon: ImageIcon, label: 'Media Library', path: '/ceo/media-library' },
      { icon: Globe, label: 'SEO Manager', path: '/ceo/seo' },
      { icon: Activity, label: 'SEO Monitor', path: '/ceo/seo-monitor', badge: 'new' },
      { icon: ShieldCheck, label: 'Site Verification', path: '/ceo/site-verification' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { icon: TrendingUp, label: 'Analytics & Reports', path: '/ceo/reports' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { icon: Bot, label: 'Telegram Shop Bot', path: '/ceo/telegram-bot' },
      { icon: KeyRound, label: 'GetCID API Tools', path: '/ceo/getcid-tools', badge: 'new' },
      { icon: CreditIcon, label: 'CID Credits', path: '/ceo/cid-credits', badge: 'new' },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { icon: Brain, label: 'AI Assistant', path: '/ceo/ai-assistant', badge: 'new' },
      { icon: Sparkles, label: 'AI API Config', path: '/ceo/ai-config' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: Users, label: 'Staff Management', path: '/ceo/staff' },
      { icon: Shield, label: 'Admin Roles', path: '/ceo/roles' },
      { icon: Database, label: 'Backup', path: '/ceo/backup' },
      { icon: Settings, label: 'General Settings', path: '/ceo/settings' },
    ],
  },
];

// Build a flat lookup for the current page title
const ALL_ITEMS_FLAT = MENU_SECTIONS.flatMap(s => s.items);

const getPageTitle = (pathname: string): { title: string; section: string } => {
  // longest-prefix match
  const sorted = [...ALL_ITEMS_FLAT].sort((a, b) => b.path.length - a.path.length);
  for (const item of sorted) {
    if (pathname === item.path || pathname.startsWith(item.path + '/')) {
      const section = MENU_SECTIONS.find(s => s.items.some(i => i.path === item.path))?.title || '';
      return { title: item.label, section };
    }
  }
  return { title: 'Admin Panel', section: '' };
};

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [adminNotifs, setAdminNotifs] = useState<AdminNotif[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [navSearch, setNavSearch] = useState('');
  const [cmdOpen, setCmdOpen] = useState(false);
  const location = useLocation();

  // Global ⌘K / Ctrl+K shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ⚡ Eagerly prefetch ALL admin sub-pages during browser idle time
  // → menu clicks resolve instantly (no chunk download wait)
  useAdminPrefetch();

  const pageMeta = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  // Filter sections by search
  const visibleSections = useMemo(() => {
    if (!navSearch.trim()) return MENU_SECTIONS;
    const q = navSearch.toLowerCase();
    return MENU_SECTIONS
      .map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(s => s.items.length > 0);
  }, [navSearch]);

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

  // Enable Alt+Click and double-click to copy any text in admin panel
  useAdminCopyAnywhere();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  if (loading) return (
    <div className="min-h-screen admin-gradient-bg flex items-center justify-center">
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

  const sidebarContent = (isMobile: boolean) => {
    const showLabel = isMobile || sidebarOpen;
    return (
      <>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50 min-h-[68px] overflow-hidden">
          {showLabel ? (
            <div className="flex items-center justify-between w-full">
              <BrandLogo size="sm" />
              {isMobile && (
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))', boxShadow: '0 4px 14px hsla(258,78%,55%,0.30)' }}>
              <span className="text-white text-xs font-black" style={{ fontFamily: 'Sora, sans-serif' }}>S</span>
            </div>
          )}
        </div>

        {/* Premium global search trigger inside sidebar */}
        {showLabel && (
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={() => { setCmdOpen(true); if (isMobile) setMobileSidebarOpen(false); }}
              className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-violet-200/60 bg-white/60 hover:bg-white/90 hover:border-violet-300/80 dark:border-violet-800/40 dark:bg-violet-950/20 dark:hover:bg-violet-950/40 transition-all backdrop-blur-md"
            >
              <Search size={14} className="text-violet-500 group-hover:text-violet-600 transition-colors flex-shrink-0" strokeWidth={2.5} />
              <span className="flex-1 text-left text-xs text-muted-foreground/90 group-hover:text-foreground transition-colors truncate">
                Search anything…
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-violet-200/70 bg-white/80 dark:bg-violet-950/40 dark:border-violet-800/40 font-mono text-[9px] font-bold text-violet-600 dark:text-violet-400 flex-shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {visibleSections.map((section) => {
            const isCollapsed = collapsedSections.includes(section.title);
            return (
              <div key={section.title}>
                {/* Section header */}
                {showLabel && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 mb-1.5 group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-muted-foreground/70 group-hover:text-foreground transition-colors">
                      {section.title}
                    </span>
                    <ChevronDown
                      size={11}
                      className={`text-muted-foreground/50 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                    />
                  </button>
                )}
                {!showLabel && (
                  <div className="h-px bg-border/40 mx-2 my-2" />
                )}

                {/* Section items */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path ||
                        (item.path !== '/ceo' && location.pathname.startsWith(item.path + '/'));
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === '/ceo'}
                          title={!showLabel ? item.label : undefined}
                          onMouseEnter={() => prefetchAdminRoute(item.path)}
                          onTouchStart={() => prefetchAdminRoute(item.path)}
                          onFocus={() => prefetchAdminRoute(item.path)}
                          className={`admin-nav-item ${isActive ? 'active' : ''} ${!showLabel ? 'justify-center px-2' : ''}`}
                        >
                          <item.icon size={17} className="flex-shrink-0" />
                          {showLabel && (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {item.badge === 'live' && (
                                <span className="flex items-center gap-2 text-[9px] font-bold text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300 px-1.5 py-0.5 rounded-md ring-1 ring-violet-300/40">
                                  <span className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" /> LIVE
                                </span>
                              )}
                              {item.badge === 'new' && (
                                <span className="text-[9px] font-bold text-white bg-gradient-to-r from-violet-500 to-violet-600 px-1.5 py-0.5 rounded-md shadow-sm">NEW</span>
                              )}
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
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              কোনো ম্যাচ পাওয়া যায়নি
            </div>
          )}
        </nav>

        {/* User info */}
        <div className="border-t border-border/50 p-3">
          {showLabel ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))', boxShadow: '0 4px 14px hsla(258,78%,55%,0.30)' }}>
                A
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

  return (
    <div className="min-h-screen admin-gradient-bg">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar (overlay drawer) */}
      <aside className={`fixed left-0 top-0 h-full z-50 w-[280px] flex flex-col admin-glass-sidebar transition-transform duration-300 md:hidden ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-full z-40 transition-all duration-300 flex-col ${sidebarOpen ? 'w-64' : 'w-16'} admin-glass-sidebar`}>
        {sidebarContent(false)}
      </aside>

      {/* Main content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        {/* Top bar */}
        <header className="admin-glass-header px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-4 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="admin-icon-btn md:hidden flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="admin-icon-btn hidden md:inline-flex flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Page title + breadcrumb */}
          <div className="min-w-0 flex-1">
            {pageMeta.section && (
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-violet-500/80 uppercase tracking-[1.2px]">
                <span>{pageMeta.section}</span>
                <ChevronRight size={10} />
                <span style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{pageMeta.title}</span>
              </div>
            )}
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight" style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' }}>
              {pageMeta.title}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 flex-shrink-0 relative">
            {/* Premium Search Trigger (header) */}
            <button
              onClick={() => setCmdOpen(true)}
              className="group hidden sm:inline-flex items-center gap-2.5 h-9 px-3 rounded-xl border border-violet-200/60 bg-white/60 hover:bg-white/90 hover:border-violet-300/80 dark:border-violet-800/40 dark:bg-violet-950/20 dark:hover:bg-violet-950/40 backdrop-blur-md transition-all"
              aria-label="Search admin"
            >
              <Search size={14} className="text-violet-500 group-hover:text-violet-600 transition-colors" strokeWidth={2.5} />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Search…
              </span>
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md border border-violet-200/70 bg-white/80 dark:bg-violet-950/40 dark:border-violet-800/40 font-mono text-[9px] font-bold text-violet-600 dark:text-violet-400">
                ⌘K
              </kbd>
            </button>
            {/* Mobile-only icon trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="admin-icon-btn sm:hidden"
              aria-label="Search admin"
            >
              <Search size={18} />
            </button>

            <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="admin-icon-btn relative" aria-label="Notifications">
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-md ring-2 ring-white"
                  style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))' }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifPanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
                <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 admin-glass-card rounded-2xl shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Bell size={14} className="text-primary" />
                      Notification Center
                    </h3>
                    <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">{notifCount} items</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
                    {adminNotifs.length === 0 ? (
                      <div className="py-10 text-center text-muted-foreground text-sm">No notifications</div>
                    ) : adminNotifs.map(n => {
                      const icons: Record<string, { icon: any; cls: string }> = {
                        order: { icon: ShopIcon, cls: 'text-primary bg-primary/10' },
                        payment: { icon: CreditIcon, cls: 'text-amber-500 bg-amber-500/10' },
                        ticket: { icon: Headphones, cls: 'text-blue-500 bg-blue-500/10' },
                        stock: { icon: AlertTriangle, cls: 'text-destructive bg-destructive/10' },
                      };
                      const { icon: NIcon, cls } = icons[n.type] || icons.order;
                      return (
                        <a key={n.id} href={n.link || '#'} onClick={() => setShowNotifPanel(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-primary/5 transition-colors">
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

            <a href="/" target="_blank" className="text-xs font-medium text-primary hover:text-primary/80 admin-icon-btn px-3 hidden sm:inline-flex items-center gap-1.5">
              <Globe size={13} /> View Store
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-6 overflow-x-auto">
          {(() => {
            const currentItem = ALL_ITEMS_FLAT.find(i =>
              location.pathname === i.path || (i.path !== '/ceo' && location.pathname.startsWith(i.path + '/'))
            );
            const HeaderIcon = currentItem?.icon || LayoutDashboard;
            const decorBySection: Record<string, any[]> = {
              Sales: [ShoppingCart, CreditCard, TrendingUp],
              Catalog: [Package, Grid3X3, Star],
              Customers: [Users, Headphones, MessageCircle],
              Storefront: [Layout, Sliders, Megaphone],
              Marketing: [Megaphone, Percent, Gift],
              'Content & SEO': [BookOpen, Globe, FileText],
              Reports: [TrendingUp, BarChart2, Activity],
              Integrations: [Bot, KeyRound, Layers],
              'AI Tools': [Brain, Sparkles, Bot],
              System: [Shield, Database, Settings],
              Overview: [LayoutDashboard, Activity, TrendingUp],
            };
            const decorIcons = decorBySection[pageMeta.section] || [HeaderIcon, TrendingUp, Activity];
            return (
              <AdminHeroHeader
                title={pageMeta.title}
                section={pageMeta.section}
                Icon={HeaderIcon}
                decorIcons={decorIcons}
              />
            );
          })()}
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <AdminCommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
};

export default AdminLayout;
