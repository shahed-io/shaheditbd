import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User, Mail, Phone, Edit3, Save, X, LogOut, Package,
  ChevronRight, ShieldCheck, Home, Camera, Lock, Eye, EyeOff
} from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

interface Profile {
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

const UserDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'security'>('profile');
  const [profile, setProfile] = useState<Profile>({ display_name: '', email: '', phone: '', avatar_url: null });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      fetchOrders();
    }
  }, [activeTab, user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('display_name, email, phone, avatar_url')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setProfile(data);
    } else {
      setProfile({
        display_name: user.user_metadata?.display_name || '',
        email: user.email || '',
        phone: '',
        avatar_url: null,
      });
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setOrders(data || []);
    setOrdersLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        display_name: profile.display_name,
        phone: profile.phone,
        email: user.email,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (error) {
      toast.error('প্রোফাইল আপডেট করা সম্ভব হয়নি');
    } else {
      toast.success('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
      setEditing(false);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না');
      return;
    }
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error('পাসওয়ার্ড পরিবর্তন করা সম্ভব হয়নি');
    } else {
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPassLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    processing: 'text-blue-400 bg-blue-400/10',
    completed: 'text-green-400 bg-green-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
    refunded: 'text-purple-400 bg-purple-400/10',
  };

  const displayName = profile.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="glass-card border-b border-primary/20 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <img src={logoIcon} alt="Shahed Store" className="w-8 h-8 rounded-full" />
            <span className="font-black text-sm tracking-widest gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              SHAHED STORE
            </span>
          </a>
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">
              <Home size={16} /> হোম
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors text-sm ml-3"
            >
              <LogOut size={16} /> লগআউট
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="glass-card rounded-2xl p-6 mb-6 border border-primary/20">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-background text-2xl font-bold shadow-lg">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/80 transition-colors">
                <Camera size={13} className="text-background" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <ShieldCheck size={12} /> Verified Customer
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar */}
          <div className="glass-card rounded-2xl border border-primary/20 p-3 h-fit">
            {[
              { id: 'profile', label: 'প্রোফাইল', icon: User },
              { id: 'orders', label: 'আমার অর্ডার', icon: Package },
              { id: 'security', label: 'নিরাপত্তা', icon: Lock },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <Icon size={16} />
                {label}
                {activeTab === id && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
            <div className="h-px bg-border my-2" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut size={16} /> লগআউট
            </button>
          </div>

          {/* Content */}
          <div className="glass-card rounded-2xl border border-primary/20 p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground">প্রোফাইল তথ্য</h2>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 btn-glow px-4 py-2 rounded-xl text-sm"
                    >
                      <Edit3 size={14} /> সম্পাদনা করুন
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-border hover:bg-muted/30 transition-colors"
                      >
                        <X size={14} /> বাতিল
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-1.5 btn-glow px-4 py-2 rounded-xl text-sm"
                      >
                        <Save size={14} /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">পূর্ণ নাম</label>
                    {editing ? (
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={profile.display_name || ''}
                          onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                          className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors"
                          placeholder="আপনার নাম"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                        <User size={15} className="text-muted-foreground" />
                        <span className="text-sm">{profile.display_name || '—'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">ইমেইল অ্যাড্রেস</label>
                    <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                      <Mail size={15} className="text-muted-foreground" />
                      <span className="text-sm">{user?.email}</span>
                      <span className="ml-auto text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Verified</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">ফোন নম্বর</label>
                    {editing ? (
                      <div className="relative">
                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="tel"
                          value={profile.phone || ''}
                          onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                          className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors"
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                        <Phone size={15} className="text-muted-foreground" />
                        <span className="text-sm">{profile.phone || 'যোগ করা হয়নি'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-6">আমার অর্ডার সমূহ</h2>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className="text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">এখনো কোনো অর্ডার নেই</p>
                    <a href="/" className="inline-block mt-3 btn-glow px-5 py-2 rounded-xl text-sm">
                      কেনাকাটা শুরু করুন
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => (
                      <div key={order.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-4 border border-border hover:border-primary/30 transition-colors">
                        <div>
                          <div className="text-sm font-semibold text-foreground">#{order.order_number}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('bn-BD')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold gradient-text">৳{order.total.toLocaleString()}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block ${statusColors[order.status] || 'text-muted-foreground bg-muted'}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-6">নিরাপত্তা সেটিংস</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">নতুন পাসওয়ার্ড</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl pl-10 pr-10 py-3 text-sm outline-none transition-colors"
                        placeholder="নতুন পাসওয়ার্ড"
                      />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">পাসওয়ার্ড নিশ্চিত করুন</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-muted/50 border border-border focus:border-primary rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors"
                        placeholder="পাসওয়ার্ড আবার লিখুন"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={passLoading || !newPassword}
                    className="btn-glow px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    {passLoading ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
