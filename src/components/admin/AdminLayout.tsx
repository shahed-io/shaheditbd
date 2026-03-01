import { useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  LogOut, Menu, X, Package2, BarChart3, Bell, Search, ChevronDown,
  Grid3X3, Percent, FileText, CreditCard, Headphones, TrendingUp,
  Megaphone, Shield, Database, Tag
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
  {
    icon: Package, label: 'Products', path: '/admin/products',
    children: [
      { label: 'All Products', path: '/admin/products' },
      { label: 'Add New', path: '/admin/products/new' },
    ]
  },
  {
    icon: Grid3X3, label: 'Categories', path: '/admin/categories',
    children: [
      { label: 'All Categories', path: '/admin/categories' },
      { label: 'Add New', path: '/admin/categories/new' },
    ]
  },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
  { icon: Percent, label: 'Coupons', path: '/admin/coupons' },
  { icon: Headphones, label: 'Tickets', path: '/admin/tickets' },
  { icon: TrendingUp, label: 'Reports', path: '/admin/reports' },
  { icon: Megaphone, label: 'Marketing', path: '/admin/marketing' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
  { icon: Shield, label: 'Admin Roles', path: '/admin/roles' },
  { icon: Database, label: 'Backup', path: '/admin/backup' },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Products', 'Orders']);
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-16'} glass-card border-r border-border/50`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
            <Package2 size={18} className="text-background" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-sm gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>SHAHED</div>
              <div className="text-[10px] text-muted-foreground">Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus.includes(item.label);

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    onClick={() => sidebarOpen && toggleMenu(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                ) : (
                  <NavLink
                    to={item.path}
                    end={item.path === '/admin'}
                    className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </NavLink>
                )}

                {/* Sub-menu */}
                {hasChildren && sidebarOpen && isExpanded && (
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
          {sidebarOpen ? (
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
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Top bar */}
        <header className="glass-card border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl glass-card hover:border-primary/40 transition-all text-muted-foreground hover:text-primary"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full bg-muted/30 border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 rounded-xl glass-card hover:border-primary/40 transition-all text-muted-foreground hover:text-primary">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <a href="/" target="_blank" className="text-xs text-primary hover:underline glass-card px-3 py-2 rounded-xl border-primary/30">
              View Store →
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
