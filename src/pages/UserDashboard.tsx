import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User, Mail, Phone, Edit3, Save, X, LogOut, Package,
  ChevronRight, ShieldCheck, Home, Camera, Lock, Eye, EyeOff,
  Ticket, Star, Clock, TrendingUp, CheckCircle2, AlertCircle,
  RefreshCw, Upload
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
  payment_status: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'পেন্ডিং',     color: 'text-amber-600 bg-amber-50 border-amber-200',    icon: <Clock size={11} /> },
  processing: { label: 'প্রসেসিং',    color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: <RefreshCw size={11} /> },
  completed:  { label: 'সম্পন্ন',     color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={11} /> },
  cancelled:  { label: 'বাতিল',       color: 'text-red-600 bg-red-50 border-red-200',          icon: <X size={11} /> },
  refunded:   { label: 'রিফান্ড',     color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <AlertCircle size={11} /> },
};

const UserDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'security'>('profile');
  const [profile, setProfile] = useState<Profile>({ display_name: '', email: '', phone: '', avatar_url: null });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders' && user) fetchOrders();
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
      setProfile({ display_name: user.user_metadata?.display_name || '', email: user.email || '', phone: '', avatar_url: null });
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, payment_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setOrders(data || []);
    setOrdersLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setEditing(false);
    toast.success('প্রোফাইল আপডেট হয়েছে!');
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, display_name: profile.display_name, phone: profile.phone, email: user.email, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) toast.error('সেভ করা সম্ভব হয়নি');
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('ছবির সাইজ ২MB এর বেশি হবে না'); return; }
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      await supabase.from('profiles').upsert({ user_id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      setProfile(p => ({ ...p, avatar_url: publicUrl }));
      toast.success('প্রোফাইল ছবি আপডেট হয়েছে!');
    } catch {
      toast.error('আপলোড ব্যর্থ হয়েছে');
    }
    setAvatarUploading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'); return; }
    if (newPassword !== confirmPassword) { toast.error('পাসওয়ার্ড দুটি মিলছে না'); return; }
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error('পাসওয়ার্ড পরিবর্তন করা সম্ভব হয়নি');
    else { toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!'); setNewPassword(''); setConfirmPassword(''); }
    setPassLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalSpent = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);

  const TABS = [
    { id: 'profile',  label: 'প্রোফাইল',    icon: User },
    { id: 'orders',   label: 'আমার অর্ডার',  icon: Package },
    { id: 'security', label: 'নিরাপত্তা',    icon: Lock },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'hsl(var(--primary))' }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, hsl(230,25%,97%) 0%, hsl(243,20%,96%) 50%, hsl(263,15%,96%) 100%)' }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <img src={logoIcon} alt="Logo" className="w-8 h-8 rounded-xl" />
            <span className="font-black text-sm tracking-widest hidden sm:block" style={{ fontFamily: 'Orbitron, sans-serif', color: 'hsl(var(--primary))' }}>
              SHAHED STORE
            </span>
          </a>

          {/* User pill in header */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors hover:bg-muted/60" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Home size={14} /> হোম
            </a>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}>
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : initials}
              </div>
              <span className="text-sm font-semibold max-w-[120px] truncate hidden sm:block" style={{ color: 'hsl(var(--foreground))' }}>{displayName}</span>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-all hover:bg-red-50"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
              <LogOut size={14} />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero Profile Card */}
        <div className="rounded-3xl overflow-hidden mb-8 shadow-lg" style={{ boxShadow: '0 8px 40px hsla(243,75%,59%,0.12)' }}>
          {/* Banner gradient */}
          <div className="h-32 sm:h-40 relative" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%) 0%, hsl(263,70%,58%) 50%, hsl(283,65%,52%) 100%)' }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          {/* Profile info */}
          <div className="bg-white px-6 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : initials}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg border-2 border-white transition-transform hover:scale-110"
                    style={{ background: 'hsl(var(--primary))' }}>
                    {avatarUploading ? <RefreshCw size={13} className="text-white animate-spin" /> : <Camera size={13} className="text-white" />}
                  </button>
                </div>

                <div className="pb-1">
                  <h1 className="text-xl sm:text-2xl font-black" style={{ color: 'hsl(var(--foreground))' }}>{displayName}</h1>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
                      style={{ color: 'hsl(158,64%,38%)', background: 'hsl(158,64%,96%)', borderColor: 'hsl(158,64%,85%)' }}>
                      <ShieldCheck size={11} /> Verified Customer
                    </span>
                    {completedOrders > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
                        style={{ color: 'hsl(var(--primary))', background: 'hsl(243,75%,97%)', borderColor: 'hsl(243,75%,88%)' }}>
                        <Star size={10} fill="currentColor" /> {completedOrders} অর্ডার সম্পন্ন
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 sm:gap-6 pb-1">
                <div className="text-center">
                  <div className="text-xl font-black" style={{ color: 'hsl(var(--foreground))' }}>{orders.length}</div>
                  <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>মোট অর্ডার</div>
                </div>
                <div className="w-px" style={{ background: 'hsl(var(--border))' }} />
                <div className="text-center">
                  <div className="text-xl font-black" style={{ color: 'hsl(var(--primary))' }}>৳{totalSpent.toLocaleString()}</div>
                  <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>মোট খরচ</div>
                </div>
                <div className="w-px" style={{ background: 'hsl(var(--border))' }} />
                <div className="text-center">
                  <div className="text-xl font-black" style={{ color: 'hsl(158,64%,42%)' }}>{completedOrders}</div>
                  <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>সম্পন্ন</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-[240px_1fr] gap-6">

          {/* Sidebar */}
          <div className="bg-white rounded-2xl border p-3 h-fit shadow-sm" style={{ borderColor: 'hsl(var(--border))' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>মেনু</p>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-0.5 ${
                  activeTab === id ? 'shadow-sm' : 'hover:bg-muted/40'
                }`}
                style={activeTab === id
                  ? { background: 'hsl(243,75%,97%)', color: 'hsl(var(--primary))', border: '1px solid hsl(243,75%,88%)' }
                  : { color: 'hsl(var(--muted-foreground))', border: '1px solid transparent' }
                }
              >
                <Icon size={16} />
                <span>{label}</span>
                {activeTab === id && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
            <div className="h-px my-2" style={{ background: 'hsl(var(--border))' }} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-red-50"
              style={{ color: 'hsl(var(--destructive))', border: '1px solid transparent' }}
            >
              <LogOut size={16} /> লগআউট
            </button>
          </div>

          {/* Content Panel */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>

            {/* Tab Header */}
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
              <div>
                <h2 className="text-lg font-black" style={{ color: 'hsl(var(--foreground))' }}>
                  {activeTab === 'profile' ? 'প্রোফাইল তথ্য' : activeTab === 'orders' ? 'আমার অর্ডার' : 'নিরাপত্তা সেটিংস'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {activeTab === 'profile' ? 'আপনার ব্যক্তিগত তথ্য পরিচালনা করুন' : activeTab === 'orders' ? `মোট ${orders.length}টি অর্ডার` : 'আপনার অ্যাকাউন্ট সুরক্ষিত রাখুন'}
                </p>
              </div>
              {activeTab === 'profile' && !editing && (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                  <Edit3 size={14} /> সম্পাদনা
                </button>
              )}
              {activeTab === 'profile' && editing && (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-muted/30"
                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                    <X size={13} /> বাতিল
                  </button>
                  <button onClick={handleSaveProfile} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    <Save size={13} /> {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">

              {/* ── Profile Tab ── */}
              {activeTab === 'profile' && (
                <div className="space-y-5 max-w-lg">
                  {/* Avatar row in profile */}
                  {editing && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(230,20%,98%)' }}>
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="av" className="w-full h-full object-cover" /> : initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>প্রোফাইল ছবি</p>
                        <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>JPG, PNG — সর্বোচ্চ ২MB</p>
                        <button onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'hsl(243,75%,97%)', color: 'hsl(var(--primary))' }}>
                          <Upload size={12} /> ছবি পরিবর্তন করুন
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>পূর্ণ নাম</label>
                    {editing ? (
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <input type="text" value={profile.display_name || ''}
                          onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all border"
                          style={{ background: 'hsl(230,20%,98%)', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                          onFocus={e => e.currentTarget.style.borderColor = 'hsl(var(--primary))'}
                          onBlur={e => e.currentTarget.style.borderColor = 'hsl(var(--border))'}
                          placeholder="আপনার পুরো নাম" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: 'hsl(230,20%,98%)', borderColor: 'hsl(var(--border))' }}>
                        <User size={15} style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{profile.display_name || '—'}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>ইমেইল</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: 'hsl(230,20%,98%)', borderColor: 'hsl(var(--border))' }}>
                      <Mail size={15} style={{ color: 'hsl(var(--muted-foreground))' }} />
                      <span className="text-sm font-medium flex-1" style={{ color: 'hsl(var(--foreground))' }}>{user?.email}</span>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ color: 'hsl(158,64%,38%)', background: 'hsl(158,64%,94%)' }}>✓ Verified</span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>ফোন নম্বর</label>
                    {editing ? (
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <input type="tel" value={profile.phone || ''}
                          onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all border"
                          style={{ background: 'hsl(230,20%,98%)', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                          onFocus={e => e.currentTarget.style.borderColor = 'hsl(var(--primary))'}
                          onBlur={e => e.currentTarget.style.borderColor = 'hsl(var(--border))'}
                          placeholder="01XXXXXXXXX" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: 'hsl(230,20%,98%)', borderColor: 'hsl(var(--border))' }}>
                        <Phone size={15} style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <span className="text-sm font-medium" style={{ color: profile.phone ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                          {profile.phone || 'যোগ করা হয়নি'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Orders Tab ── */}
              {activeTab === 'orders' && (
                <div>
                  {ordersLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'hsl(var(--primary))' }} />
                      <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>লোড হচ্ছে...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(243,75%,97%)' }}>
                        <Package size={28} style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                      <p className="font-bold text-base mb-1" style={{ color: 'hsl(var(--foreground))' }}>কোনো অর্ডার নেই</p>
                      <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>এখনো কোনো অর্ডার করা হয়নি</p>
                      <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                        কেনাকাটা শুরু করুন
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map(order => {
                        const s = STATUS_MAP[order.status] || { label: order.status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: null };
                        return (
                          <div key={order.id}
                            className="flex items-center justify-between px-5 py-4 rounded-2xl border transition-all hover:shadow-md"
                            style={{ borderColor: 'hsl(var(--border))', background: 'hsl(230,20%,99%)' }}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'hsl(243,75%,97%)' }}>
                                <Package size={18} style={{ color: 'hsl(var(--primary))' }} />
                              </div>
                              <div>
                                <div className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>#{order.order_number}</div>
                                <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                  {new Date(order.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right hidden sm:block">
                                <div className="text-sm font-black" style={{ color: 'hsl(var(--primary))' }}>৳{order.total.toLocaleString()}</div>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${s.color}`}>
                                {s.icon} {s.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Security Tab ── */}
              {activeTab === 'security' && (
                <div className="max-w-lg space-y-6">
                  <div className="p-4 rounded-2xl border flex items-start gap-3" style={{ borderColor: 'hsl(243,75%,88%)', background: 'hsl(243,75%,97%)' }}>
                    <ShieldCheck size={18} style={{ color: 'hsl(var(--primary))' }} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>পাসওয়ার্ড পরিবর্তন করুন</p>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(243,50%,50%)' }}>আপনার অ্যাকাউন্ট সুরক্ষিত রাখতে নিয়মিত পাসওয়ার্ড পরিবর্তন করুন।</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>নতুন পাসওয়ার্ড</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      <input type={showNewPass ? 'text' : 'password'} value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full rounded-xl pl-10 pr-11 py-3 text-sm outline-none transition-all border"
                        style={{ background: 'hsl(230,20%,98%)', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'hsl(var(--primary))'}
                        onBlur={e => e.currentTarget.style.borderColor = 'hsl(var(--border))'}
                        placeholder="নতুন পাসওয়ার্ড লিখুন" />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>পাসওয়ার্ড নিশ্চিত করুন</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      <input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl pl-10 pr-11 py-3 text-sm outline-none transition-all border"
                        style={{ background: 'hsl(230,20%,98%)', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'hsl(var(--primary))'}
                        onBlur={e => e.currentTarget.style.borderColor = 'hsl(var(--border))'}
                        placeholder="পাসওয়ার্ড আবার লিখুন" />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'hsl(var(--destructive))' }}>
                        <AlertCircle size={11} /> পাসওয়ার্ড দুটি মিলছে না
                      </p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                      <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'hsl(158,64%,42%)' }}>
                        <CheckCircle2 size={11} /> পাসওয়ার্ড মিলেছে
                      </p>
                    )}
                  </div>

                  <button onClick={handleChangePassword}
                    disabled={passLoading || !newPassword || !confirmPassword}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    {passLoading ? <><RefreshCw size={15} className="animate-spin" /> পরিবর্তন হচ্ছে...</> : <><ShieldCheck size={15} /> পাসওয়ার্ড পরিবর্তন করুন</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
