import { useState, useEffect, useCallback } from 'react';
import BrandLogo from '@/components/store/BrandLogo';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  LogOut, Menu, X, BarChart3, Bell, Search, ChevronDown,
  Grid3X3, Percent, FileText, CreditCard, Headphones, TrendingUp,
  Megaphone, Shield, Database, Tag, Gift, BookOpen, HelpCircle, Globe, Layout, FolderDown,
  Map, Bot, Code2, KeyRound, FileSearch, PackageSearch, Star, BarChart2,
  Zap, ImageIcon, Link2, ArrowLeftRight, Link2Off, Wallet, Sliders, Flame, Mail, Facebook, Layers, ShieldCheck, MessageCircle, Brain, AlertTriangle, Palette,
  ShoppingCart as ShopIcon, CreditCard as CreditIcon, Clock, Eye
} from 'lucide-react';

interface AdminNotif {
  id: string;
  type: 'order' | 'payment' | 'ticket' | 'stock';
  title: string;
  message: string;
  time: string;
  link?: string;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/ceo' },
  { icon: ShoppingCart, label: 'Orders', path: '/ceo/orders' },
  {
    icon: Package, label: 'Products', path: '/ceo/products',
    children: [
      { label: 'All Products', path: '/ceo/products' },
      { label: 'Add New', path: '/ceo/products/new' },
      { label: 'Attributes', path: '/ceo/attributes' },
    ]
  },
  {
    icon: Grid3X3, label: 'Categories', path: '/ceo/categories',
    children: [
      { label: 'All Categories', path: '/ceo/categories' },
      { label: 'Add New', path: '/ceo/categories/new' },
    ]
  },
  { icon: Users, label: 'Customers', path: '/ceo/customers' },
  { icon: Wallet, label: 'Wallet', path: '/ceo/wallet' },
  { icon: Sliders, label: 'Hero Banner', path: '/ceo/hero-banner' },
  { icon: Flame, label: 'Flash Sale', path: '/ceo/flash-sale' },
  { icon: Star, label: 'Testimonials', path: '/ceo/testimonials' },
  { icon: Megaphone, label: 'Announcement Bar', path: '/ceo/announcement-bar' },
  { icon: Layers, label: 'Popup Banner', path: '/ceo/popup-banner' },
  { icon: CreditCard, label: 'Payments', path: '/ceo/payments' },
  { icon: Percent, label: 'Coupons', path: '/ceo/coupons' },
  { icon: Gift, label: 'Welcome Discount', path: '/ceo/welcome-discount' },
  { icon: Gift, label: 'Referrals', path: '/ceo/referrals' },
  { icon: TrendingUp, label: 'Affiliates', path: '/ceo/affiliates' },
  { icon: Headphones, label: 'Tickets', path: '/ceo/tickets' },
  { icon: BookOpen, label: 'Blog', path: '/ceo/blog' },
  { icon: Layout, label: 'Pages', path: '/ceo/pages' },
  { icon: HelpCircle, label: 'Help Center', path: '/ceo/help' },
  { icon: KeyRound, label: 'License Manager', path: '/ceo/licenses' },
  { icon: ShoppingCart, label: 'Quick Sale', path: '/ceo/quick-sale' },
  
  { icon: FolderDown, label: 'Software Downloads', path: '/ceo/software-downloads' },
  { icon: ImageIcon, label: 'Media Library', path: '/ceo/media-library' },
  { icon: Mail, label: 'Newsletter', path: '/ceo/newsletter' },
  { icon: FileText, label: 'Product Reviews', path: '/ceo/product-reviews' },
  { icon: ArrowLeftRight, label: 'Import / Export', path: '/ceo/import-export' },
  { icon: FileText, label: 'Invoice Generator', path: '/ceo/invoices' },
  {
    icon: Globe, label: 'SEO Settings', path: '/ceo/seo',
    children: [
      { label: 'SEO Manager', path: '/ceo/seo', icon: Globe },
      { label: 'Blog Manager', path: '/ceo/blog', icon: BookOpen },
      { label: 'Meta Tag Manager', path: '/ceo/seo/meta-tags', icon: Tag },
      { label: 'Sitemap Generator', path: '/ceo/seo/sitemap', icon: Map },
      { label: 'Robots.txt Editor', path: '/ceo/seo/robots', icon: Bot },
      { label: 'Schema Generator', path: '/ceo/seo/schema', icon: Code2 },
      { label: 'Keyword Manager', path: '/ceo/seo/keywords', icon: KeyRound },
      { label: 'Page SEO Control', path: '/ceo/seo/pages', icon: FileSearch },
      { label: 'Product SEO', path: '/ceo/seo/products', icon: PackageSearch },
      { label: 'FAQ Manager', path: '/ceo/seo/faq', icon: HelpCircle },
      { label: 'Review System', path: '/ceo/seo/reviews', icon: Star },
      { label: 'Google Analytics', path: '/ceo/seo/analytics', icon: BarChart2 },
      { label: 'Search Console', path: '/ceo/seo/search-console', icon: Search },
      { label: 'Speed Optimization', path: '/ceo/seo/speed', icon: Zap },
      { label: 'Image SEO', path: '/ceo/seo/images', icon: ImageIcon },
      { label: 'URL Slug Editor', path: '/ceo/seo/slugs', icon: Link2 },
      { label: 'Redirect Manager', path: '/ceo/seo/redirects', icon: ArrowLeftRight },
      { label: 'Broken Link Checker', path: '/ceo/seo/broken-links', icon: Link2Off },
    ]
  },
  { icon: TrendingUp, label: 'Reports', path: '/ceo/reports' },
  { icon: Megaphone, label: 'Marketing', path: '/ceo/marketing' },
  { icon: Facebook, label: 'Facebook Pixel', path: '/ceo/facebook-pixel' },
  { icon: MessageCircle, label: 'Live Chat', path: '/ceo/live-chat' },
  { icon: Bot, label: 'Telegram Shop Bot', path: '/ceo/telegram-bot' },
  { icon: Layout, label: 'Footer Settings', path: '/ceo/footer-settings' },
  { icon: Brain, label: 'AI API Config', path: '/ceo/ai-config' },
  { icon: Users, label: 'Staff Management', path: '/ceo/staff' },
  { icon: AlertTriangle, label: 'Inventory Alerts', path: '/ceo/inventory-alerts' },
  { icon: Palette, label: 'Themes', path: '/ceo/themes' },
  { icon: Settings, label: 'Settings', path: '/ceo/settings' },
  { icon: Shield, label: 'Admin Roles', path: '/ceo/roles' },
  { icon: Database, label: 'Backup', path: '/ceo/backup' },
  { icon: ShieldCheck, label: 'CID For Reseller', path: '/ceo/reseller' },
  { icon: Users, label: 'Reseller Accounts', path: '/ceo/reseller-accounts' },
  { icon: Brain, label: '🤖 AI Assistant', path: '/ceo/ai-assistant' },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Products', 'Orders']);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [adminNotifs, setAdminNotifs] = useState<AdminNotif[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const location = useLocation();

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

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50 min-h-[68px] overflow-hidden">
        {(isMobile || sidebarOpen) ? (
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus.includes(item.label);
          const showLabel = isMobile || sidebarOpen;

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  onClick={() => showLabel && toggleMenu(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {showLabel && (
                    <>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === '/ceo'}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {showLabel && <span className="font-medium">{item.label}</span>}
                </NavLink>
              )}

              {/* Sub-menu */}
              {hasChildren && showLabel && isExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children!.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end
                      className={({ isActive }) => `block px-3 py-1.5 rounded-lg text-xs transition-all ${
                        isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      → {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-border/50 p-3">
        {(isMobile || sidebarOpen) ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-background text-sm font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">Admin</div>
              <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
            </div>
            <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={signOut} className="w-full flex justify-center text-muted-foreground hover:text-destructive transition-colors p-2">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </>
  );

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
        <header className="admin-glass-header px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl glass-card hover:border-primary/40 transition-all text-muted-foreground hover:text-primary md:hidden"
          >
            <Menu size={18} />
          </button>
          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl glass-card hover:border-primary/40 transition-all text-muted-foreground hover:text-primary hidden md:block"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex-1 max-w-md min-w-0">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full bg-muted/30 border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 flex-shrink-0 relative">
            <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="relative p-2 rounded-xl glass-card hover:border-primary/40 transition-all text-muted-foreground hover:text-primary">
              <Bell size={18} />
              {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-[9px] font-bold text-primary-foreground flex items-center justify-center">{notifCount > 9 ? '9+' : notifCount}</span>}
            </button>

            {/* Notification Dropdown */}
            {showNotifPanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
                <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-sm">নোটিফিকেশন সেন্টার</h3>
                    <span className="text-[10px] text-muted-foreground">{notifCount}টি আইটেম</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
                    {adminNotifs.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground text-sm">কোনো নোটিফিকেশন নেই</div>
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
                          className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
                            <NIcon size={14} />
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

            <a href="/" target="_blank" className="text-xs text-primary hover:underline glass-card px-2 sm:px-3 py-2 rounded-xl border-primary/30 hidden sm:block">
              View Store →
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
