import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';
import {
  User, Mail, Phone, Edit3, Save, X, LogOut, Package,
  ChevronRight, ShieldCheck, Home, Camera, Lock, Eye, EyeOff,
  Ticket, Star, Clock, TrendingUp, CheckCircle2, AlertCircle,
  RefreshCw, Upload, Heart, MapPin, Bell, Gift, Copy, Plus,
  Trash2, Download, History, BellRing, BellOff, ExternalLink
} from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

interface Profile {
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referral_earnings: number;
  referral_credit: number;
  referral_discount: number;
}

// Tier config
const TIERS = [
  { name: 'bronze',   min: 0,  max: 4,  reward: 50,  label: 'ব্রোঞ্জ',    emoji: '🥉', color: 'hsl(30,60%,55%)',  glow: 'hsla(30,60%,55%,0.3)'  },
  { name: 'silver',   min: 5,  max: 14, reward: 75,  label: 'সিলভার',     emoji: '🥈', color: 'hsl(220,15%,65%)', glow: 'hsla(220,15%,65%,0.3)' },
  { name: 'gold',     min: 15, max: 29, reward: 100, label: 'গোল্ড',      emoji: '🥇', color: 'hsl(45,90%,52%)',  glow: 'hsla(45,90%,52%,0.35)' },
  { name: 'platinum', min: 30, max: 49, reward: 150, label: 'প্লাটিনাম', emoji: '💎', color: 'hsl(185,90%,52%)', glow: 'hsla(185,90%,52%,0.35)' },
  { name: 'diamond',  min: 50, max: Infinity, reward: 200, label: 'ডায়মন্ড', emoji: '💠', color: 'hsl(271,91%,65%)', glow: 'hsla(271,91%,65%,0.4)' },
];

const getCurrentTier = (count: number) => TIERS.find(t => count >= t.min && count <= t.max) || TIERS[0];

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  payment_status: string | null;
}

interface Address {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  district: string | null;
  postal_code: string | null;
  is_default: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

interface Referral {
  id: string;
  referral_code: string;
  status: string;
  reward_amount: number;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'পেন্ডিং',     color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',    icon: <Clock size={11} /> },
  processing: { label: 'প্রসেসিং',    color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',       icon: <RefreshCw size={11} /> },
  completed:  { label: 'সম্পন্ন',     color: 'text-emerald bg-emerald/10 border-emerald/30',          icon: <CheckCircle2 size={11} /> },
  cancelled:  { label: 'বাতিল',       color: 'text-destructive bg-destructive/10 border-destructive/30', icon: <X size={11} /> },
  refunded:   { label: 'রিফান্ড',     color: 'text-primary bg-primary/10 border-primary/30',          icon: <AlertCircle size={11} /> },
};

type TabId = 'profile' | 'orders' | 'wishlist' | 'addresses' | 'notifications' | 'referral' | 'security';

const TABS: { id: TabId; label: string; icon: any; badge?: number }[] = [
  { id: 'profile',       label: 'প্রোফাইল',      icon: User },
  { id: 'orders',        label: 'আমার অর্ডার',   icon: Package },
  { id: 'wishlist',      label: 'উইশলিস্ট',      icon: Heart },
  { id: 'addresses',     label: 'ঠিকানাসমূহ',    icon: MapPin },
  { id: 'notifications', label: 'নোটিফিকেশন',   icon: Bell },
  { id: 'referral',      label: 'রেফারেল',        icon: Gift },
  { id: 'security',      label: 'নিরাপত্তা',     icon: Lock },
];

const UserDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { wishlistItems } = useWishlist();

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [profile, setProfile] = useState<Profile>({ display_name: '', email: '', phone: '', avatar_url: null, referral_code: null, referral_earnings: 0, referral_credit: 0, referral_discount: 0 });
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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({ label: 'বাড়ি', recipient_name: '', phone: '', address_line: '', city: '', district: '', postal_code: '', is_default: false });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notiLoading, setNotiLoading] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralLoading, setReferralLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'addresses') fetchAddresses();
    if (activeTab === 'notifications') fetchNotifications();
    if (activeTab === 'referral') { fetchReferrals(); }
  }, [activeTab, user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('display_name, email, phone, avatar_url, referral_code, referral_earnings')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setProfile({
        display_name: data.display_name,
        email: data.email,
        phone: data.phone,
        avatar_url: data.avatar_url,
        referral_code: (data as any).referral_code || null,
        referral_earnings: (data as any).referral_earnings || 0,
      });
    } else {
      setProfile({ display_name: user.user_metadata?.display_name || '', email: user.email || '', phone: '', avatar_url: null, referral_code: null, referral_earnings: 0 });
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

  const fetchAddresses = async () => {
    if (!user) return;
    setAddressLoading(true);
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
    setAddresses((data || []) as Address[]);
    setAddressLoading(false);
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setNotiLoading(true);
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
    setNotifications((data || []) as Notification[]);
    setNotiLoading(false);
  };

  const fetchReferrals = async () => {
    if (!user) return;
    setReferralLoading(true);
    const { data } = await supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false });
    setReferrals((data || []) as Referral[]);
    setReferralLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setEditing(false);
    toast.success('প্রোফাইল আপডেট হয়েছে!');
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert(
      { user_id: user.id, display_name: profile.display_name, phone: profile.phone, email: user.email, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
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

  const handleSaveAddress = async () => {
    if (!user) return;
    if (!addressForm.recipient_name || !addressForm.phone || !addressForm.address_line || !addressForm.city) {
      toast.error('সব প্রয়োজনীয় তথ্য পূরণ করুন'); return;
    }
    const payload = { ...addressForm, user_id: user.id };
    if (editingAddress) {
      await supabase.from('addresses').update(payload).eq('id', editingAddress.id);
      toast.success('ঠিকানা আপডেট হয়েছে!');
    } else {
      await supabase.from('addresses').insert(payload);
      toast.success('ঠিকানা যোগ করা হয়েছে!');
    }
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm({ label: 'বাড়ি', recipient_name: '', phone: '', address_line: '', city: '', district: '', postal_code: '', is_default: false });
    fetchAddresses();
  };

  const handleDeleteAddress = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    toast.success('ঠিকানা মুছে ফেলা হয়েছে');
    fetchAddresses();
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const copyReferralCode = () => {
    const code = profile.referral_code;
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success('রেফারেল কোড কপি হয়েছে!');
  };

  const shareReferralLink = () => {
    const code = profile.referral_code;
    if (!code) return;
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('রেফারেল লিংক কপি হয়েছে!');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalSpent = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Update tab badges
  const tabsWithBadges = TABS.map(t => ({
    ...t,
    badge: t.id === 'wishlist' ? wishlistItems.length : t.id === 'notifications' ? unreadCount : undefined,
  }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'hsl(var(--primary))' }} />
    </div>
  );

  // ─────────────── Input style helpers ───────────────
  const inputCls = "w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all border bg-muted/30 text-foreground border-border focus:border-primary";
  const labelCls = "block text-xs font-semibold uppercase tracking-wide mb-2 text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-xl border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <img src={logoIcon} alt="Logo" className="w-8 h-8 rounded-xl" />
            <span className="font-black text-sm tracking-widest hidden sm:block" style={{ fontFamily: 'Orbitron, sans-serif', color: 'hsl(var(--primary))' }}>
              SHAHED STORE
            </span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors hover:bg-muted/60 text-muted-foreground">
              <Home size={14} /> হোম
            </a>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-secondary">
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
              </div>
              <span className="text-sm font-semibold max-w-[120px] truncate hidden sm:block text-foreground">{displayName}</span>
              {unreadCount > 0 && <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: 'hsl(var(--destructive))' }}>{unreadCount}</span>}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-all hover:bg-destructive/10 text-muted-foreground">
              <LogOut size={14} /><span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero Profile Card */}
        <div className="rounded-3xl overflow-hidden mb-8 shadow-lg">
          <div className="h-32 sm:h-40 relative" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%) 0%, hsl(263,70%,58%) 50%, hsl(283,65%,52%) 100%)' }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>
          <div className="bg-card px-6 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14">
              <div className="flex items-end gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-card shadow-xl flex items-center justify-center text-3xl font-black text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg border-2 border-card transition-transform hover:scale-110"
                    style={{ background: 'hsl(var(--primary))' }}>
                    {avatarUploading ? <RefreshCw size={13} className="text-white animate-spin" /> : <Camera size={13} className="text-white" />}
                  </button>
                </div>
                <div className="pb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">{displayName}</h1>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald/30 bg-emerald/10 text-emerald">
                      <ShieldCheck size={11} /> Verified
                    </span>
                    {completedOrders > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary">
                        <Star size={10} fill="currentColor" /> {completedOrders} অর্ডার
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 sm:gap-6 pb-1">
                <div className="text-center"><div className="text-xl font-black text-foreground">{orders.length}</div><div className="text-xs text-muted-foreground">অর্ডার</div></div>
                <div className="w-px bg-border" />
                <div className="text-center"><div className="text-xl font-black" style={{ color: 'hsl(var(--primary))' }}>৳{totalSpent.toLocaleString()}</div><div className="text-xs text-muted-foreground">খরচ</div></div>
                <div className="w-px bg-border" />
                <div className="text-center"><div className="text-xl font-black" style={{ color: 'hsl(158,64%,42%)' }}>{wishlistItems.length}</div><div className="text-xs text-muted-foreground">উইশলিস্ট</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-[240px_1fr] gap-6">

          {/* Sidebar */}
          <div className="bg-card rounded-2xl border border-border p-3 h-fit shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 mb-1 text-muted-foreground">মেনু</p>
            {tabsWithBadges.map(({ id, label, icon: Icon, badge }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-0.5 ${
                  activeTab === id
                    ? 'bg-primary/10 text-primary border border-primary/25 shadow-sm'
                    : 'hover:bg-muted/40 text-muted-foreground border border-transparent'
                }`}>
                <Icon size={16} />
                <span className="flex-1 text-left">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: id === 'notifications' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>{badge}</span>
                )}
                {activeTab === id && <ChevronRight size={14} />}
              </button>
            ))}
            <div className="h-px my-2 bg-border" />
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-destructive/10 text-destructive">
              <LogOut size={16} /> লগআউট
            </button>
          </div>

          {/* Content Panel */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">

            {/* Tab Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-foreground">
                  {activeTab === 'profile' ? 'প্রোফাইল তথ্য' : activeTab === 'orders' ? 'আমার অর্ডার' : activeTab === 'wishlist' ? 'উইশলিস্ট' : activeTab === 'addresses' ? 'সংরক্ষিত ঠিকানা' : activeTab === 'notifications' ? 'নোটিফিকেশন' : activeTab === 'referral' ? 'রেফারেল ড্যাশবোর্ড' : 'নিরাপত্তা'}
                </h2>
                <p className="text-xs mt-0.5 text-muted-foreground">
                  {activeTab === 'orders' ? `মোট ${orders.length}টি অর্ডার` : activeTab === 'wishlist' ? `${wishlistItems.length}টি পণ্য` : activeTab === 'notifications' ? `${unreadCount}টি অপঠিত` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                {activeTab === 'profile' && !editing && (
                  <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    <Edit3 size={14} /> সম্পাদনা
                  </button>
                )}
                {activeTab === 'profile' && editing && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted/30"><X size={13} /> বাতিল</button>
                    <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                      <Save size={13} /> {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
                    </button>
                  </div>
                )}
                {activeTab === 'addresses' && (
                  <button onClick={() => { setShowAddressForm(true); setEditingAddress(null); setAddressForm({ label: 'বাড়ি', recipient_name: '', phone: '', address_line: '', city: '', district: '', postal_code: '', is_default: false }); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    <Plus size={14} /> নতুন ঠিকানা
                  </button>
                )}
                {activeTab === 'notifications' && unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted/30">
                    <BellOff size={13} /> সব পড়া হিসেবে চিহ্নিত
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">

              {/* ── Profile Tab ── */}
              {activeTab === 'profile' && (
                <div className="space-y-5 max-w-lg">
                  {editing && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/20">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-lg font-black text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="av" className="w-full h-full object-cover" /> : initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">প্রোফাইল ছবি</p>
                        <p className="text-xs mb-2 text-muted-foreground">JPG, PNG — সর্বোচ্চ ২MB</p>
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          <Upload size={12} /> ছবি পরিবর্তন করুন
                        </button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>পূর্ণ নাম</label>
                    {editing ? (
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={profile.display_name || ''} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} className={inputCls} placeholder="আপনার পুরো নাম" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/20">
                        <User size={15} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{profile.display_name || '—'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>ইমেইল</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/20">
                      <Mail size={15} className="text-muted-foreground" />
                      <span className="text-sm font-medium flex-1 text-foreground">{user?.email}</span>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald/10 text-emerald border border-emerald/20">✓ Verified</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>ফোন নম্বর</label>
                    {editing ? (
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="tel" value={profile.phone || ''} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="01XXXXXXXXX" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/20">
                        <Phone size={15} className="text-muted-foreground" />
                        <span className="text-sm font-medium" style={{ color: profile.phone ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>{profile.phone || 'যোগ করা হয়নি'}</span>
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
                      <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(243,75%,97%)' }}>
                        <Package size={28} style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                      <p className="font-bold text-base mb-1 text-foreground">কোনো অর্ডার নেই</p>
                      <p className="text-sm mb-4 text-muted-foreground">এখনো কোনো অর্ডার করা হয়নি</p>
                      <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                        কেনাকাটা শুরু করুন
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map(order => {
                        const s = STATUS_MAP[order.status] || { label: order.status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: null };
                        return (
                          <div key={order.id} className="flex items-center justify-between px-5 py-4 rounded-2xl border border-border transition-all hover:shadow-md bg-muted/10">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(243,75%,97%)' }}>
                                <Package size={18} style={{ color: 'hsl(var(--primary))' }} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-foreground">#{order.order_number}</div>
                                <div className="text-xs mt-0.5 text-muted-foreground">{new Date(order.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right hidden sm:block">
                                <div className="text-sm font-black" style={{ color: 'hsl(var(--primary))' }}>৳{order.total.toLocaleString()}</div>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${s.color}`}>{s.icon} {s.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Wishlist Tab ── */}
              {activeTab === 'wishlist' && (
                <div>
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(15,100%,97%)' }}>
                        <Heart size={28} style={{ color: 'hsl(15,100%,60%)' }} />
                      </div>
                      <p className="font-bold text-base mb-1 text-foreground">উইশলিস্ট খালি</p>
                      <p className="text-sm mb-4 text-muted-foreground">পছন্দের পণ্যে ❤️ চিহ্ন দিন</p>
                      <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                        পণ্য দেখুন
                      </a>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {wishlistItems.map(item => (
                        <div key={item.product_id} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-muted/10 hover:shadow-sm transition-all">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                            {item.product_image ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Heart size={16} className="text-muted-foreground" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">{item.product_name}</p>
                            <p className="text-sm font-black mt-0.5" style={{ color: 'hsl(var(--primary))' }}>৳{item.product_price.toLocaleString()}</p>
                          </div>
                          <a href="/" className="p-2 rounded-xl hover:bg-muted/40 transition-colors text-muted-foreground">
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Addresses Tab ── */}
              {activeTab === 'addresses' && (
                <div>
                  {showAddressForm ? (
                    <div className="max-w-lg space-y-4">
                      <h3 className="font-bold text-foreground">{editingAddress ? 'ঠিকানা সম্পাদনা' : 'নতুন ঠিকানা যোগ করুন'}</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {['বাড়ি', 'অফিস', 'অন্যান্য'].map(l => (
                          <button key={l} onClick={() => setAddressForm(f => ({ ...f, label: l }))}
                            className={`py-2 rounded-xl text-sm font-semibold transition-all border ${addressForm.label === l ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:bg-muted/30'}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                      {[
                        { field: 'recipient_name', label: 'প্রাপকের নাম *', placeholder: 'পূর্ণ নাম' },
                        { field: 'phone', label: 'ফোন নম্বর *', placeholder: '01XXXXXXXXX' },
                        { field: 'address_line', label: 'ঠিকানা *', placeholder: 'বাড়ি নং, রাস্তা, এলাকা' },
                        { field: 'city', label: 'শহর *', placeholder: 'ঢাকা' },
                        { field: 'district', label: 'জেলা', placeholder: 'জেলা' },
                        { field: 'postal_code', label: 'পোস্টাল কোড', placeholder: '1000' },
                      ].map(({ field, label, placeholder }) => (
                        <div key={field}>
                          <label className={labelCls}>{label}</label>
                          <input
                            type="text"
                            value={(addressForm as any)[field]}
                            onChange={e => setAddressForm(f => ({ ...f, [field]: e.target.value }))}
                            placeholder={placeholder}
                            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all border border-border bg-muted/30 text-foreground focus:border-primary"
                          />
                        </div>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm(f => ({ ...f, is_default: e.target.checked }))} className="rounded" />
                        <span className="text-sm text-foreground">ডিফল্ট ঠিকানা হিসেবে সেট করুন</span>
                      </label>
                      <div className="flex gap-3">
                        <button onClick={() => setShowAddressForm(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted/30">বাতিল</button>
                        <button onClick={handleSaveAddress} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>সংরক্ষণ করুন</button>
                      </div>
                    </div>
                  ) : addressLoading ? (
                    <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'hsl(var(--primary))' }} /></div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(243,75%,97%)' }}><MapPin size={28} style={{ color: 'hsl(var(--primary))' }} /></div>
                      <p className="font-bold text-base mb-1 text-foreground">কোনো ঠিকানা নেই</p>
                      <p className="text-sm mb-4 text-muted-foreground">ডেলিভারির জন্য ঠিকানা যোগ করুন</p>
                      <button onClick={() => setShowAddressForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                        <Plus size={16} /> ঠিকানা যোগ করুন
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <div key={addr.id} className="p-4 rounded-2xl border border-border bg-muted/10 hover:shadow-sm transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full border" style={addr.is_default ? { background: 'hsl(243,75%,97%)', color: 'hsl(var(--primary))', borderColor: 'hsl(243,75%,88%)' } : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }}>
                                {addr.label} {addr.is_default && '✓ ডিফল্ট'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingAddress(addr); setAddressForm({ label: addr.label, recipient_name: addr.recipient_name, phone: addr.phone, address_line: addr.address_line, city: addr.city, district: addr.district || '', postal_code: addr.postal_code || '', is_default: addr.is_default }); setShowAddressForm(true); }}
                                className="p-2 rounded-xl hover:bg-muted/40 text-muted-foreground">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{addr.recipient_name}</p>
                          <p className="text-sm text-muted-foreground">{addr.phone}</p>
                          <p className="text-sm text-muted-foreground">{addr.address_line}, {addr.city}{addr.district ? `, ${addr.district}` : ''}{addr.postal_code ? ` - ${addr.postal_code}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Notifications Tab ── */}
              {activeTab === 'notifications' && (
                <div>
                  {notiLoading ? (
                    <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'hsl(var(--primary))' }} /></div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(243,75%,97%)' }}><Bell size={28} style={{ color: 'hsl(var(--primary))' }} /></div>
                      <p className="font-bold text-base mb-1 text-foreground">কোনো নোটিফিকেশন নেই</p>
                      <p className="text-sm text-muted-foreground">নতুন আপডেট পেলে এখানে দেখা যাবে</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map(n => (
                        <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${!n.is_read ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/10'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.is_read ? '' : 'opacity-50'}`} style={{ background: n.type === 'order' ? 'hsl(243,75%,97%)' : n.type === 'promo' ? 'hsl(38,100%,95%)' : 'hsl(var(--muted))' }}>
                              {n.type === 'order' ? <Package size={14} style={{ color: 'hsl(var(--primary))' }} /> : n.type === 'promo' ? <Gift size={14} style={{ color: 'hsl(38,80%,50%)' }} /> : <BellRing size={14} className="text-muted-foreground" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-semibold ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('bn-BD')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Referral Tab ── */}
              {activeTab === 'referral' && (
                <div className="max-w-lg space-y-6">
                  {/* Referral Code Card */}
                  <div className="p-5 rounded-2xl border" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%)/10%, hsl(263,70%,58%)/10%)', borderColor: 'hsl(243,75%,88%)' }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">আপনার রেফারেল কোড</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black tracking-widest" style={{ fontFamily: 'Orbitron, monospace', color: 'hsl(var(--primary))' }}>
                        {profile.referral_code || '—'}
                      </span>
                      <button onClick={copyReferralCode} className="p-2.5 rounded-xl transition-all hover:scale-110" style={{ background: 'hsl(var(--primary))', color: 'white' }}>
                        <Copy size={14} />
                      </button>
                    </div>
                    <button onClick={shareReferralLink} className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
                      <ExternalLink size={12} /> রেফারেল লিংক কপি করুন
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl border border-border bg-muted/10 text-center">
                      <div className="text-xl font-black text-foreground">{referrals.length}</div>
                      <div className="text-xs text-muted-foreground">মোট রেফারেল</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-border bg-muted/10 text-center">
                      <div className="text-xl font-black" style={{ color: 'hsl(158,64%,42%)' }}>{referrals.filter(r => r.status === 'completed').length}</div>
                      <div className="text-xs text-muted-foreground">সফল</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-border bg-muted/10 text-center">
                      <div className="text-xl font-black" style={{ color: 'hsl(var(--primary))' }}>৳{profile.referral_earnings}</div>
                      <div className="text-xs text-muted-foreground">মোট আয়</div>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="p-4 rounded-2xl border border-border bg-muted/10">
                    <p className="text-sm font-bold mb-3 text-foreground">কিভাবে কাজ করে?</p>
                    {[
                      { n: '১', t: 'আপনার রেফারেল কোড বন্ধুদের শেয়ার করুন' },
                      { n: '২', t: 'বন্ধু আপনার কোড দিয়ে সাইনআপ ও অর্ডার করুক' },
                      { n: '৩', t: 'সফল রেফারেলে আপনি রিওয়ার্ড পাবেন' },
                    ].map(({ n, t }) => (
                      <div key={n} className="flex items-start gap-3 mb-2 last:mb-0">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: 'hsl(var(--primary))' }}>{n}</span>
                        <span className="text-sm text-muted-foreground">{t}</span>
                      </div>
                    ))}
                  </div>

                  {/* Referral list */}
                  {referralLoading ? (
                    <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'hsl(var(--primary))' }} /></div>
                  ) : referrals.length > 0 && (
                    <div>
                      <p className="text-sm font-bold mb-3 text-foreground">রেফারেল ইতিহাস</p>
                      <div className="space-y-2">
                        {referrals.map(r => (
                          <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10">
                            <div>
                              <p className="text-xs font-semibold text-foreground">{r.referral_code}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString('bn-BD')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black" style={{ color: 'hsl(var(--primary))' }}>৳{r.reward_amount}</span>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.status === 'completed' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>{r.status === 'completed' ? 'সফল' : 'পেন্ডিং'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
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
                    <label className={labelCls}>নতুন পাসওয়ার্ড</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        className="w-full rounded-xl pl-10 pr-11 py-3 text-sm outline-none transition-all border border-border bg-muted/30 text-foreground focus:border-primary"
                        placeholder="নতুন পাসওয়ার্ড লিখুন" />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>পাসওয়ার্ড নিশ্চিত করুন</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl pl-10 pr-11 py-3 text-sm outline-none transition-all border border-border bg-muted/30 text-foreground focus:border-primary"
                        placeholder="পাসওয়ার্ড আবার লিখুন" />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && <p className="text-xs mt-1.5 flex items-center gap-1 text-destructive"><AlertCircle size={11} /> পাসওয়ার্ড দুটি মিলছে না</p>}
                    {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'hsl(158,64%,42%)' }}><CheckCircle2 size={11} /> পাসওয়ার্ড মিলেছে</p>}
                  </div>
                  <button onClick={handleChangePassword} disabled={passLoading || !newPassword || !confirmPassword}
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
