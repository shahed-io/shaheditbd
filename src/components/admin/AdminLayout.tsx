import { useState, useEffect, useCallback, useMemo } from 'react';
import BrandLogo from '@/components/store/BrandLogo';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminPrefetch, prefetchAdminRoute } from '@/hooks/useAdminPrefetch';

import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  LogOut, Menu, X, Bell, Search, ChevronDown, ChevronRight,
  Grid3X3, Percent, FileText, CreditCard, Headphones, TrendingUp,
  Megaphone, Shield, Database, Gift, BookOpen, HelpCircle, Globe, Layout, FolderDown,
  Bot, KeyRound, Star, BarChart2,
  ImageIcon, ArrowLeftRight, Wallet, Sliders, Flame, Mail, Facebook, Layers, ShieldCheck, MessageCircle, Brain, AlertTriangle, Palette, Sparkles,
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
      { icon: ShoppingCart, label: 'Quick Sale', path: '/ceo/quick-sale' },
      { icon: FileText, label: 'Invoice Generator', path: '/ceo/invoices' },
      { icon: CreditCard, label: 'Payments', path: '/ceo/payments' },
      { icon: KeyRound, label: 'License Manager', path: '/ceo/licenses' },
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
      { icon: ShieldCheck, label: 'CID Reseller Portal', path: '/ceo/reseller' },
      { icon: Users, label: 'Reseller Accounts', path: '/ceo/reseller-accounts' },
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
  const location = useLocation();

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
              style={{ background: 'radial-gradient(ellipse at 40% 35%, hsl(20,100%,50%), hsl(340,100%,40%) 60%, hsl(222,30%,14%))' }}>
              <span className="text-white text-xs font-black" style={{ fontFamily: 'Sora, sans-serif' }}>S</span>
            </div>
          )}
        </div>

        {/* Quick search inside sidebar */}
        {showLabel && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
                placeholder="Quick find menu..."
                className="w-full bg-muted/30 border border-border/60 rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
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
                                <span className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-md ring-1 ring-primary/20">
                                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse" /> LIVE
                                </span>
                              )}
                              {item.badge === 'new' && (
                                <span className="text-[9px] font-bold text-primary bg-gradient-to-r from-primary/20 to-accent/20 px-1.5 py-0.5 rounded-md ring-1 ring-primary/20">NEW</span>
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
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-background text-sm font-bold flex-shrink-0">
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
    <div className="min-h-screen admin-gradient-bg flex">
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
      <div className={`flex-1 flex flex-col transition-all duration-300 w-full ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
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
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-[1.2px]">
                <span>{pageMeta.section}</span>
                <ChevronRight size={10} />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{pageMeta.title}</span>
              </div>
            )}
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight" style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.01em' }}>
              {pageMeta.title}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 flex-shrink-0 relative">
            <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="admin-icon-btn relative" aria-label="Notifications">
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-primary to-accent rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-md ring-2 ring-background">
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
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
