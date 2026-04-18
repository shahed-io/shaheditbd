import { useState, useEffect, useRef } from 'react';
import BrandLoader from '@/components/store/BrandLoader';
import PaymentInstructions from '@/components/store/PaymentInstructions';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import bkashLogo from '@/assets/payment/bkash.png';
import nagadLogo from '@/assets/payment/nagad.png';
import rocketLogo from '@/assets/payment/rocket.png';
import upayLogo from '@/assets/payment/upay.png';
import bkashMerchantLogo from '@/assets/payment/bkash-merchant.png';

const ASSET_LOGOS: Record<string, string> = {
  bkash: bkashLogo,
  nagad: nagadLogo,
  rocket: rocketLogo,
  upay: upayLogo,
  bkash_merchant: bkashMerchantLogo,
};
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'sonner';
import {
  User, Mail, Phone, Edit3, Save, X, LogOut, Package,
  ChevronRight, ShieldCheck, Home, Camera, Lock, Eye, EyeOff,
  Star, Clock, TrendingUp, TrendingDown, CheckCircle2, AlertCircle,
  RefreshCw, Upload, Heart, MapPin, Bell, Gift, Copy, Plus,
  History, BellRing, BellOff, ExternalLink, Wallet, Globe,
  ChevronDown, Key, CreditCard, Receipt, Info, Award, Zap, ArrowDownCircle,
  Download, Share2, PlusSquare, Smartphone, AtSign, Check, Loader2
} from 'lucide-react';
import BrandLogo from '@/components/store/BrandLogo';
import VerifiedBadge from '@/components/store/VerifiedBadge';
import { LANGUAGES, LangCode, getStoredLang, setStoredLang, t, translateDbText, getLangLocale } from '@/lib/translations';

interface Profile {
  display_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referral_earnings: number;
  referral_credit: number;
  referral_discount: number;
}

const TIERS = [
  { name: 'bronze',   min: 0,  max: 4,  reward: 50,  label: 'Bronze',   emoji: '🥉', color: 'hsl(30,60%,55%)',  glow: 'hsla(30,60%,55%,0.3)'  },
  { name: 'silver',   min: 5,  max: 14, reward: 75,  label: 'Silver',   emoji: '🥈', color: 'hsl(220,15%,65%)', glow: 'hsla(220,15%,65%,0.3)' },
  { name: 'gold',     min: 15, max: 29, reward: 100, label: 'Gold',     emoji: '🥇', color: 'hsl(45,90%,52%)',  glow: 'hsla(45,90%,52%,0.35)' },
  { name: 'platinum', min: 30, max: 49, reward: 150, label: 'Platinum', emoji: '💎', color: 'hsl(185,90%,52%)', glow: 'hsla(185,90%,52%,0.35)' },
  { name: 'diamond',  min: 50, max: Infinity, reward: 200, label: 'Diamond', emoji: '💠', color: 'hsl(271,91%,65%)', glow: 'hsla(271,91%,65%,0.4)' },
];

const getCurrentTier = (count: number) => TIERS.find(t => count >= t.min && count <= t.max) || TIERS[0];

interface OrderItem {
  id: string; product_name: string; price: number; quantity: number; total: number; license_key: string | null;
}
interface TimelineEvent {
  id: string; status: string; note: string | null; created_at: string;
}
interface Order {
  id: string; order_number: string; status: string;
  total: number; subtotal: number; discount_amount: number | null;
  created_at: string; payment_status: string | null;
  payment_method: string | null; transaction_id: string | null;
  notes: string | null; coupon_code: string | null;
  items?: OrderItem[];
  timeline?: TimelineEvent[];
}
interface Address {
  id: string; label: string; recipient_name: string; phone: string;
  address_line: string; city: string; district: string | null;
  postal_code: string | null; is_default: boolean;
}
interface Notification {
  id: string; title: string; message: string; type: string;
  is_read: boolean; link: string | null; created_at: string;
}
interface Referral {
  id: string; referral_code: string; status: string;
  reward_amount: number; created_at: string;
  referred_id: string | null;
  referred_name?: string;
  referred_email?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',    icon: <Clock size={11} /> },
  processing: { label: 'Processing', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',       icon: <RefreshCw size={11} /> },
  completed:  { label: 'Completed',  color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 size={11} /> },
  cancelled:  { label: 'Cancelled',  color: 'text-destructive bg-destructive/10 border-destructive/30', icon: <X size={11} /> },
  refunded:   { label: 'Refunded',   color: 'text-primary bg-primary/10 border-primary/30',          icon: <AlertCircle size={11} /> },
  delivered:  { label: 'Delivered',  color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 size={11} /> },
  failed:     { label: 'Failed',     color: 'text-destructive bg-destructive/10 border-destructive/30', icon: <X size={11} /> },
};

type TabId = 'profile' | 'orders' | 'licenses' | 'wallet' | 'points' | 'wishlist' | 'addresses' | 'notifications' | 'referral' | 'security' | 'language' | 'install';

const TAB_IDS: { id: TabId; key: string; icon: any }[] = [
  { id: 'profile',       key: 'tab_profile',       icon: User },
  { id: 'orders',        key: 'tab_orders',        icon: Package },
  { id: 'licenses',      key: 'tab_licenses',      icon: Key },
  { id: 'wallet',        key: 'tab_wallet',        icon: Wallet },
  { id: 'points',        key: 'tab_points',        icon: Award },
  { id: 'wishlist',      key: 'tab_wishlist',      icon: Heart },
  { id: 'addresses',     key: 'tab_addresses',     icon: MapPin },
  { id: 'notifications', key: 'tab_notifications', icon: Bell },
  { id: 'referral',      key: 'tab_referral',      icon: Gift },
  { id: 'security',      key: 'tab_security',      icon: Lock },
  { id: 'language',      key: 'tab_language',      icon: Globe },
  { id: 'install',       key: 'tab_install',       icon: Download },
];

// Glassmorphism card style helper
const glassCard = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.55) 100%)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid hsla(258,78%,75%,0.22)',
  boxShadow: '0 4px 24px hsla(258,78%,55%,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
};

const glassCardStrong = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 100%)',
  backdropFilter: 'blur(32px) saturate(200%)',
  WebkitBackdropFilter: 'blur(32px) saturate(200%)',
  border: '1px solid hsla(258,78%,75%,0.28)',
  boxShadow: '0 8px 32px hsla(258,78%,55%,0.10), 0 1px 0 rgba(255,255,255,0.95) inset',
};
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallAppTab = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BIPEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS] = useState(() => /iPad|iPhone|iPod/.test(navigator.userAgent));

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BIPEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-foreground">App is already installed!</h3>
        <p className="text-sm text-muted-foreground">You are using the Shahed Store app</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-6 text-center" style={{
        background: 'linear-gradient(145deg, hsla(258,78%,55%,0.12), hsla(258,78%,55%,0.04))',
        border: '1px solid hsla(258,78%,55%,0.2)',
      }}>
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.55) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid hsla(258,78%,75%,0.25)',
            boxShadow: '0 4px 20px hsla(258,78%,55%,0.15)',
          }}>
          <img src="/favicon.png" alt="Shahed Store" className="w-14 h-14 object-contain" />
        </div>
        <h3 className="text-lg font-black text-foreground">Install Shahed Store App</h3>
        <p className="text-sm text-muted-foreground mt-1">Get direct access on your phone</p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icon: Zap, title: 'Fast Loading', desc: 'Faster than the website' },
          { icon: Bell, title: 'Order Notifications', desc: 'Get real-time updates' },
          { icon: Smartphone, title: 'App-like Experience', desc: 'Fullscreen, no address bar' },
          { icon: ShieldCheck, title: 'Safe & Trusted', desc: '100% official app' },
        ].map((b, i) => (
          <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl" style={{
            background: 'rgba(255,255,255,0.65)',
            border: '1px solid hsla(258,78%,75%,0.18)',
          }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsla(258,78%,55%,0.1)' }}>
              <b.icon size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Install action */}
      {deferredPrompt ? (
        <button onClick={handleInstall}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-transform active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(258,78%,42%))',
            boxShadow: '0 4px 16px hsla(258,78%,55%,0.35)',
          }}>
          <Download size={16} /> Install Now
        </button>
      ) : isIOS ? (
        <div className="rounded-xl p-4 space-y-2" style={{
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid hsla(258,78%,75%,0.2)',
        }}>
          <p className="text-sm font-bold text-foreground flex items-center gap-2"><Share2 size={14} className="text-primary" /> Install on iOS:</p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">1. Tap the <Share2 size={12} className="text-blue-500" /> Share button in Safari</p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">2. Select <PlusSquare size={12} className="text-blue-500" /> "Add to Home Screen"</p>
        </div>
      ) : (
        <div className="rounded-xl p-4 text-center" style={{
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid hsla(258,78%,75%,0.2)',
        }}>
          <p className="text-sm text-muted-foreground">Open in Chrome/Edge browser to install</p>
        </div>
      )}
    </div>
  );
};

const UserDashboard = () => {
  const { user, signOut, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { wishlistItems } = useWishlist();
  const { configs: paymentConfigs } = usePaymentSettings();

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tab = searchParams.get('tab') as TabId;
    return TAB_IDS.some(t => t.id === tab) ? tab : 'profile';
  });
  // On mobile: if a tab param is provided via URL, go directly to content view
  const [mobileShowContent, setMobileShowContent] = useState(() => !!searchParams.get('tab'));
  const [profile, setProfile] = useState<Profile>({ display_name: '', username: null, email: '', phone: '', avatar_url: null, referral_code: null, referral_earnings: 0, referral_credit: 0, referral_discount: 0 });
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string>('');
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
  const [addressForm, setAddressForm] = useState({ label: 'Home', recipient_name: '', phone: '', address_line: '', city: '', district: '', postal_code: '', is_default: false });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notiLoading, setNotiLoading] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralLoading, setReferralLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [topupRequests, setTopupRequests] = useState<any[]>([]);
  const [topupStep, setTopupStep] = useState(0);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupPaymentMethod, setTopupPaymentMethod] = useState('bkash');
  const [topupTxId, setTopupTxId] = useState('');
  const [topupProcessing, setTopupProcessing] = useState(false);
  const [selectedLang, setSelectedLang] = useState<LangCode>(getStoredLang());
  // Points state
  const [pointsBalance, setPointsBalance] = useState(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [totalPointsRedeemed, setTotalPointsRedeemed] = useState(0);
  const [pointsTx, setPointsTx] = useState<any[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemProcessing, setRedeemProcessing] = useState(false);
  // Licenses state
  const [myLicenses, setMyLicenses] = useState<any[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [licenseVisibility, setLicenseVisibility] = useState<Record<string, boolean>>({});
  // Trending categories for mobile home view
  const [trendingCats, setTrendingCats] = useState<{ id: string; name: string; slug: string; productCount: number }[]>([]);

  // Mobile-friendly tab switch: also show content panel
  const handleTabSwitch = (tab: TabId) => {
    setActiveTab(tab);
    setMobileShowContent(true);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => { if (!loading && !user) navigate('/'); }, [user, loading, navigate]);
  useEffect(() => { if (user) { fetchProfile(); fetchOrders(); fetchTrendingCats(); } }, [user]);

  const fetchTrendingCats = async () => {
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(3);
    if (!cats) return;
    const withCounts = await Promise.all(cats.map(async (c) => {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', c.id)
        .eq('status', 'active');
      return { ...c, productCount: count || 0 };
    }));
    setTrendingCats(withCounts);
  };
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'addresses') fetchAddresses();
    if (activeTab === 'notifications') fetchNotifications();
    if (activeTab === 'referral') fetchReferrals();
    if (activeTab === 'wallet') fetchWallet();
    if (activeTab === 'points') fetchPoints();
    if (activeTab === 'licenses') fetchLicenses();
  }, [activeTab, user]);

  // Realtime order updates - live preview
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('user-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as any;
            setOrders(prev => [{ ...newOrder, items: undefined } as Order, ...prev]);
            toast.success('🛒 নতুন অর্ডার তৈরি হয়েছে!', { description: `#${newOrder.order_number}` });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
            const statusLabel = STATUS_MAP[updated.status]?.label || updated.status;
            toast.info(`📦 অর্ডার #${updated.order_number} আপডেট হয়েছে`, { description: `Status: ${statusLabel}` });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'order_items' },
        (payload) => {
          const updated = payload.new as any;
          setOrders(prev => prev.map(o => {
            if (!o.items) return o;
            return { ...o, items: o.items.map(item => item.id === updated.id ? { ...item, ...updated } : item) };
          }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchLicenses = async () => {
    if (!user) return;
    setLicensesLoading(true);
    const { data } = await supabase
      .from('order_items')
      .select('id, product_name, license_key, orders!inner(user_id, order_number, status, created_at)')
      .eq('orders.user_id', user.id)
      .eq('orders.status', 'completed')
      .not('license_key', 'is', null);
    setMyLicenses(data || []);
    setLicensesLoading(false);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('display_name, username, email, phone, avatar_url, referral_code, referral_earnings, referral_credit, referral_discount, points_balance, total_points_earned, total_points_redeemed').eq('user_id', user.id).single();
    if (data) {
      setProfile({ display_name: data.display_name, username: (data as any).username || null, email: data.email, phone: data.phone, avatar_url: data.avatar_url, referral_code: (data as any).referral_code || null, referral_earnings: (data as any).referral_earnings || 0, referral_credit: (data as any).referral_credit || 0, referral_discount: (data as any).referral_discount || 0 });
      setUsernameInput((data as any).username || '');
      setPointsBalance((data as any).points_balance || 0);
      setTotalPointsEarned((data as any).total_points_earned || 0);
      setTotalPointsRedeemed((data as any).total_points_redeemed || 0);
    } else {
      setProfile({ display_name: user.user_metadata?.display_name || '', username: null, email: user.email || '', phone: '', avatar_url: null, referral_code: null, referral_earnings: 0, referral_credit: 0, referral_discount: 0 });
    }
  };

  const fetchPoints = async () => {
    if (!user) return; setPointsLoading(true);
    const [profileRes, txRes] = await Promise.all([
      supabase.from('profiles').select('points_balance, total_points_earned, total_points_redeemed').eq('user_id', user.id).single(),
      supabase.from('point_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    ]);
    setPointsBalance((profileRes.data as any)?.points_balance || 0);
    setTotalPointsEarned((profileRes.data as any)?.total_points_earned || 0);
    setTotalPointsRedeemed((profileRes.data as any)?.total_points_redeemed || 0);
    setPointsTx(txRes.data || []);
    setPointsLoading(false);
  };

  const handleRedeemPoints = async () => {
    if (!user) return;
    const pts = parseInt(redeemPoints);
    if (!pts || pts < 20) { toast.error(t(selectedLang, 'points_min_redeem')); return; }
    if (pts % 2 !== 0) { toast.error('Points must be a multiple of 2'); return; }
    if (pts > pointsBalance) { toast.error('Insufficient points'); return; }
    setRedeemProcessing(true);
    try {
      const { data } = await (supabase as any).rpc('redeem_points', { p_user_id: user.id, p_points: pts });
      if (data?.success) {
        toast.success(`✅ ${pts} pts redeemed — ৳${data.taka_credited} ${t(selectedLang, 'points_will_add')}!`);
        setRedeemPoints('');
        fetchPoints();
        fetchProfile();
      } else {
        toast.error(data?.error || 'Could not redeem');
      }
    } catch { toast.error('Something went wrong, please try again'); }
    setRedeemProcessing(false);
  };

  const fetchOrders = async () => {
    if (!user) return; setOrdersLoading(true);
    const { data } = await supabase.from('orders').select('id, order_number, status, total, subtotal, discount_amount, created_at, payment_status, payment_method, transaction_id, notes, coupon_code').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    setOrders((data || []) as Order[]); setOrdersLoading(false);
  };

  const fetchOrderItems = async (orderId: string) => {
    const [itemsRes, timelineRes] = await Promise.all([
      supabase.from('order_items').select('id, product_name, price, quantity, total, license_key').eq('order_id', orderId),
      supabase.from('order_timeline').select('id, status, note, created_at').eq('order_id', orderId).order('created_at', { ascending: true }),
    ]);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: (itemsRes.data || []) as OrderItem[], timeline: (timelineRes.data || []) as TimelineEvent[] } : o));
  };

  const fetchAddresses = async () => {
    if (!user) return; setAddressLoading(true);
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
    setAddresses((data || []) as Address[]); setAddressLoading(false);
  };

  const fetchNotifications = async () => {
    if (!user) return; setNotiLoading(true);
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
    setNotifications((data || []) as Notification[]); setNotiLoading(false);
  };

  const fetchReferrals = async () => {
    if (!user) return; setReferralLoading(true);
    const { data } = await supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false });
    const refs = (data || []) as Referral[];

    // Fetch referred user profiles to show names
    const referredIds = refs.map(r => r.referred_id).filter(Boolean) as string[];
    if (referredIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', referredIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      refs.forEach(r => {
        if (r.referred_id) {
          const p = profileMap.get(r.referred_id);
          if (p) {
            r.referred_name = p.display_name || p.email?.split('@')[0] || 'User';
            r.referred_email = p.email || '';
          }
        }
      });
    }

    setReferrals(refs); setReferralLoading(false);

    // Retry pending referral (email signup) from localStorage if any
    const pendingRef = localStorage.getItem('pending_referral');
    if (pendingRef && user) {
      const { data: refResult } = await supabase.rpc('process_referral', {
        p_referral_code: pendingRef,
        p_referred_user_id: user.id,
      });
      if ((refResult as any)?.success) {
        localStorage.removeItem('pending_referral');
        toast.success('🎁 রেফারেল কোড প্রয়োগ হয়েছে! ৫% স্থায়ী ছাড় সক্রিয়।');
        fetchProfile();
      }
    }

    // Process Google OAuth referral — referrer gets ৳20
    const pendingGoogleRef = localStorage.getItem('pending_google_referral');
    if (pendingGoogleRef && user) {
      // Check if user signed in with Google (provider = google)
      const { data: sessionData } = await supabase.auth.getSession();
      const provider = sessionData?.session?.user?.app_metadata?.provider;
      if (provider === 'google') {
        let processed = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise(res => setTimeout(res, 800 * (attempt + 1)));
          try {
            const { data: refResult } = await (supabase.rpc as any)('process_google_referral', {
              p_referral_code: pendingGoogleRef,
              p_referred_user_id: user.id,
            });
            if ((refResult as any)?.success) {
              localStorage.removeItem('pending_google_referral');
              toast.success('🎉 Google রেফারেল সফল! ৫% স্থায়ী ছাড় সক্রিয় হয়েছে।');
              processed = true;
              fetchProfile();
              break;
            } else if ((refResult as any)?.error && (refResult as any)?.error !== 'User not found') {
              localStorage.removeItem('pending_google_referral');
              break;
            }
          } catch { /* retry */ }
        }
        if (!processed) localStorage.removeItem('pending_google_referral');
      }
    }
  };

  const fetchWallet = async () => {
    if (!user) return; setWalletLoading(true);
    const [profileRes, txRes, reqRes] = await Promise.all([
      supabase.from('profiles').select('wallet_balance').eq('user_id', user.id).single(),
      supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('wallet_topup_requests' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ]);
    setWalletBalance((profileRes.data as any)?.wallet_balance || 0);
    setWalletTx(txRes.data || []);
    setTopupRequests(reqRes.data || []);
    setWalletLoading(false);
  };

  const TOPUP_PAYMENT_METHODS = paymentConfigs
    .filter(c => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(c => ({
      id: c.id,
      label: c.label,
      number: c.number,
      type: c.type,
      logo: c.logoUrl || ASSET_LOGOS[c.id] || undefined,
      color: 'from-gray-600 to-gray-700',
    }));

  const handleTopupSubmit = async () => {
    if (!user) return;
    const amt = parseFloat(topupAmount);
    if (!amt || amt < 10) { toast.error('Minimum ৳10 required'); return; }
    if (!topupTxId.trim()) { toast.error('Please enter transaction ID'); return; }
    setTopupProcessing(true);
    try {
      const { error } = await (supabase.from('wallet_topup_requests' as any) as any).insert({ user_id: user.id, amount: amt, payment_method: topupPaymentMethod, transaction_id: topupTxId.trim(), status: 'pending' });
      if (error) throw error;
      toast.success('✅ Top-up request submitted! Admin will verify and credit your wallet.');
      setTopupStep(2); setTopupTxId('');
    } catch { toast.error('Failed to submit request. Please try again.'); }
    setTopupProcessing(false);
  };

  // Live username availability check (debounced)
  useEffect(() => {
    if (!editing) return;
    const trimmed = usernameInput.trim();
    // No change → idle
    if (trimmed === (profile.username || '')) { setUsernameStatus('idle'); setUsernameError(''); return; }
    if (!trimmed) { setUsernameStatus('idle'); setUsernameError(''); return; }
    // Format check
    if (trimmed.length < 3 || trimmed.length > 20) {
      setUsernameStatus('invalid'); setUsernameError('৩-২০ অক্ষরের মধ্যে হতে হবে'); return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameStatus('invalid'); setUsernameError('শুধু a-z, 0-9 এবং _ ব্যবহার করুন'); return;
    }
    setUsernameStatus('checking'); setUsernameError('');
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc('is_username_available', { p_username: trimmed, p_user_id: user?.id || null });
      if (error) { setUsernameStatus('invalid'); setUsernameError('চেক করতে সমস্যা হয়েছে'); return; }
      setUsernameStatus(data ? 'available' : 'taken');
      setUsernameError(data ? '' : 'এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে');
    }, 400);
    return () => clearTimeout(timer);
  }, [usernameInput, editing, profile.username, user?.id]);

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmedUsername = usernameInput.trim();
    // Block save if username invalid/taken
    if (trimmedUsername && trimmedUsername !== (profile.username || '') && (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking')) {
      toast.error(usernameError || 'ইউজারনেম সঠিক নয়');
      return;
    }
    setSaving(true);
    const payload: any = {
      display_name: profile.display_name,
      phone: profile.phone,
      email: user.email,
      updated_at: new Date().toISOString(),
    };
    // Only include username if changed and valid
    if (trimmedUsername !== (profile.username || '')) {
      payload.username = trimmedUsername || null;
    }
    // Use UPDATE (profile already exists via handle_new_user trigger)
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('user_id', user.id)
      .select('user_id')
      .maybeSingle();

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('username') && msg.includes('reserved')) {
        toast.error('এই ইউজারনেমটি সংরক্ষিত — অন্য একটি বেছে নিন');
      } else if (msg.includes('username') && (msg.includes('character') || msg.includes('between'))) {
        toast.error('ইউজারনেম ৩-২০ অক্ষরের মধ্যে এবং শুধু a-z, 0-9, _ ব্যবহার করুন');
      } else if (msg.includes('duplicate') || msg.includes('unique')) {
        toast.error('এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে');
      } else {
        toast.error(error.message || t(selectedLang, 'profile_save_error'));
      }
      setSaving(false);
      return;
    }

    // Safety: if profile row didn't exist, insert one
    if (!updated) {
      const { error: insertError } = await supabase.from('profiles').insert({
        user_id: user.id,
        ...payload,
      });
      if (insertError) {
        toast.error(insertError.message || t(selectedLang, 'profile_save_error'));
        setSaving(false);
        return;
      }
    }

    setProfile(p => ({ ...p, username: trimmedUsername || null }));
    setEditing(false);
    setUsernameStatus('idle');
    toast.success(t(selectedLang, 'profile_saved'));
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(t(selectedLang, 'avatar_size_error')); return; }
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      await supabase.from('profiles').upsert({ user_id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      setProfile(p => ({ ...p, avatar_url: publicUrl })); toast.success(t(selectedLang, 'avatar_updated'));
    } catch { toast.error(t(selectedLang, 'avatar_upload_error')); }
    setAvatarUploading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error(t(selectedLang, 'password_short')); return; }
    if (newPassword !== confirmPassword) { toast.error(t(selectedLang, 'password_mismatch')); return; }
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(t(selectedLang, 'password_error'));
    else { toast.success(t(selectedLang, 'password_success')); setNewPassword(''); setConfirmPassword(''); }
    setPassLoading(false);
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    if (!addressForm.recipient_name || !addressForm.phone || !addressForm.address_line || !addressForm.city) { toast.error(t(selectedLang, 'address_required_fields')); return; }
    const payload = { ...addressForm, user_id: user.id };
    if (editingAddress) { await supabase.from('addresses').update(payload).eq('id', editingAddress.id); toast.success(t(selectedLang, 'address_saved')); }
    else { await supabase.from('addresses').insert(payload); toast.success(t(selectedLang, 'address_saved')); }
    setShowAddressForm(false); setEditingAddress(null);
    setAddressForm({ label: 'Home', recipient_name: '', phone: '', address_line: '', city: '', district: '', postal_code: '', is_default: false });
    fetchAddresses();
  };

  const handleDeleteAddress = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    toast.success(t(selectedLang, 'address_deleted')); fetchAddresses();
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
    if (!code) return; navigator.clipboard.writeText(code); toast.success(t(selectedLang, 'copied'));
  };

  const shareReferralLink = () => {
    const code = profile.referral_code;
    if (!code) return;
    navigator.clipboard.writeText(`${window.location.origin}?ref=${code}`); toast.success(t(selectedLang, 'link_copied'));
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const displayName = profile.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalSpent = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const tabsWithBadges = TAB_IDS.map(tab => ({
    ...tab, label: t(selectedLang, tab.key),
    badge: tab.id === 'wishlist' ? wishlistItems.length : tab.id === 'notifications' ? unreadCount : undefined,
  }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <BrandLoader size="md" />
    </div>
  );

  const inputCls = "w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all border bg-white/60 text-foreground border-border focus:border-primary focus:bg-white/80 placeholder:text-muted-foreground";
  const labelCls = "block text-xs font-semibold uppercase tracking-wide mb-2 text-muted-foreground";
  const gradBtn = "text-white font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98]";
  const gradBtnStyle = { background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, hsl(240,30%,96%) 0%, hsl(260,25%,94%) 50%, hsl(280,20%,95%) 100%)' }}>

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ ...glassCard, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center group"><BrandLogo size="sm" /></a>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="/" className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors hover:bg-primary/8 text-muted-foreground">
              <Home size={14} /> <span className="hidden sm:inline">Home</span>
            </a>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid hsla(258,78%,75%,0.25)' }}>
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
              </div>
              <span className="text-sm font-semibold max-w-[120px] truncate hidden sm:flex items-center gap-1 text-foreground">
                <span className="truncate">{displayName}</span>
                <VerifiedBadge size={13} />
              </span>
              {unreadCount > 0 && <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: 'hsl(var(--destructive))' }}>{unreadCount}</span>}
            </div>
            {isAdmin && (
              <button onClick={() => navigate('/ceo')} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(263,70%,58%))', color: 'white', boxShadow: '0 2px 8px hsla(243,75%,59%,0.4)' }}>
                <ShieldCheck size={14} /><span className="hidden sm:inline">Admin Panel</span>
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-all hover:bg-destructive/10 text-muted-foreground">
              <LogOut size={14} /><span className="hidden sm:inline">{t(selectedLang, 'tab_logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Hero Profile Card - always hidden on mobile */}
        <div className="hidden md:block rounded-2xl overflow-hidden mb-6 sm:mb-8 p-4 sm:p-5" style={glassCardStrong}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shadow-lg flex items-center justify-center text-lg font-black text-white"
                  style={{ borderColor: 'hsla(258,78%,65%,0.3)', background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : initials}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center shadow-md border-2 transition-transform hover:scale-110"
                  style={{ background: 'hsl(var(--primary))', borderColor: 'white' }}>
                  {avatarUploading ? <RefreshCw size={10} className="text-white animate-spin" /> : <Camera size={10} className="text-white" />}
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-black text-foreground truncate flex items-center gap-1.5">
                  <span className="truncate">{displayName}</span>
                  <VerifiedBadge size={18} />
                </h1>
                <p className="text-xs sm:text-sm font-medium text-foreground/70 break-all">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                    <ShieldCheck size={10} /> Verified
                  </span>
                  {completedOrders > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-primary/25 bg-primary/10 text-primary">
                      <Star size={9} fill="currentColor" /> {completedOrders} {t(selectedLang, 'tab_orders')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4 sm:gap-5">
              <div className="text-center">
                <div className="text-lg font-black text-foreground">{orders.length}</div>
                <div className="text-[10px] text-muted-foreground">{t(selectedLang, 'order')}</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="text-lg font-black" style={{ color: 'hsl(var(--primary))' }}>৳{totalSpent.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">{t(selectedLang, 'total')}</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="text-lg font-black" style={{ color: 'hsl(158,64%,42%)' }}>{wishlistItems.length}</div>
                <div className="text-[10px] text-muted-foreground">{t(selectedLang, 'tab_wishlist')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== MOBILE HOME VIEW (replaces sidebar on mobile when no tab selected) ====== */}
        {!mobileShowContent && (
          <div className="md:hidden space-y-4 mb-4">
            {/* Hero Welcome Card */}
            <div className="rounded-3xl overflow-hidden p-5 relative" style={{
              background: 'linear-gradient(135deg, hsl(220,90%,55%), hsl(258,78%,58%) 60%, hsl(280,75%,60%))',
              boxShadow: '0 12px 40px hsla(258,78%,55%,0.35)',
            }}>
              <div className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-widest text-white/80 flex items-center gap-1">
                Welcome Back <span>👋</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/40 shadow-lg flex items-center justify-center text-base font-black text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-black text-white truncate flex items-center gap-1.5">
                    {displayName}
                    <VerifiedBadge size={16} />
                  </h2>
                  {profile.username && (
                    <p className="text-xs text-white/80 truncate">@{profile.username}</p>
                  )}
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                    <Star size={9} fill="currentColor" /> VIP Member
                  </span>
                </div>
                <button onClick={() => handleTabSwitch('profile')} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white">
                  <ChevronRight size={16} />
                </button>
              </div>
              {/* Stats row */}
              <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-2">
                <button onClick={() => handleTabSwitch('wallet')} className="text-center active:scale-95 transition-transform">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Wallet</p>
                  <p className="text-base font-black text-white mt-0.5">৳{walletBalance.toLocaleString()}</p>
                </button>
                <button onClick={() => handleTabSwitch('points')} className="text-center active:scale-95 transition-transform border-x border-white/20">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Points</p>
                  <p className="text-base font-black text-white mt-0.5">{pointsBalance}</p>
                </button>
                <button onClick={() => handleTabSwitch('orders')} className="text-center active:scale-95 transition-transform">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Orders</p>
                  <p className="text-base font-black text-white mt-0.5">{orders.length}</p>
                </button>
              </div>
            </div>

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { id: 'orders' as TabId, icon: Package, label: 'Orders', bg: 'linear-gradient(145deg, hsl(210,90%,60%), hsl(220,90%,52%))', badge: orders.filter(o => ['pending','processing'].includes(o.status)).length },
                { id: 'wallet' as TabId, icon: Wallet, label: 'Wallet', bg: 'linear-gradient(145deg, hsl(158,64%,48%), hsl(168,70%,42%))' },
                { id: 'wishlist' as TabId, icon: Heart, label: 'Wishlist', bg: 'linear-gradient(145deg, hsl(348,85%,62%), hsl(358,80%,55%))', badge: wishlistItems.length },
                { id: 'points' as TabId, icon: Award, label: 'Points', bg: 'linear-gradient(145deg, hsl(35,95%,58%), hsl(25,90%,52%))' },
              ].map((it) => {
                const Icon = it.icon;
                return (
                  <button key={it.id} onClick={() => handleTabSwitch(it.id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl active:scale-95 transition-transform relative"
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid hsla(258,78%,75%,0.22)',
                      boxShadow: '0 4px 14px hsla(258,78%,55%,0.08)',
                    }}>
                    {it.badge !== undefined && it.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-md">
                        {it.badge}
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: it.bg }}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-foreground">{it.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Promo Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={() => navigate('/shop')} className="text-left p-4 rounded-2xl active:scale-95 transition-transform relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, hsl(15,90%,60%), hsl(0,85%,55%))',
                boxShadow: '0 8px 22px hsla(15,90%,55%,0.32)',
              }}>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25 text-white">
                  🔥 Hot Deals
                </span>
                <p className="text-base font-black text-white mt-2">Up to 70% OFF</p>
                <p className="text-[11px] text-white/85 font-medium mt-0.5">Shop trending →</p>
              </button>
              <button onClick={() => window.open('https://wa.me/8801894392421', '_blank')} className="text-left p-4 rounded-2xl active:scale-95 transition-transform relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, hsl(158,70%,45%), hsl(168,75%,40%))',
                boxShadow: '0 8px 22px hsla(158,70%,40%,0.32)',
              }}>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25 text-white">
                  💬 Live 24/7
                </span>
                <p className="text-base font-black text-white mt-2">Need Help?</p>
                <p className="text-[11px] text-white/85 font-medium mt-0.5">Chat with us →</p>
              </button>
            </div>

            {/* Trending Categories */}
            {trendingCats.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest px-1 mb-2 text-muted-foreground flex items-center gap-1">
                  ✨ Trending Categories
                </p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                  {trendingCats.map((c, i) => {
                    const emojis = ['🪟', '📂', '💿'];
                    return (
                      <button key={c.id} onClick={() => navigate(`/shop?category=${c.slug}`)}
                        className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl active:scale-95 transition-transform"
                        style={{
                          background: 'rgba(255,255,255,0.85)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid hsla(258,78%,75%,0.22)',
                          boxShadow: '0 3px 10px hsla(258,78%,55%,0.06)',
                        }}>
                        <span className="text-base">{emojis[i] || '📦'}</span>
                        <span className="text-sm font-bold text-foreground">{c.name}</span>
                        {c.productCount > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-primary/12 text-primary">
                            {c.productCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Account Links */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest px-1 mb-2 text-muted-foreground flex items-center gap-1">
                ✦ Account ✦
              </p>
              <div className="rounded-2xl overflow-hidden" style={glassCard}>
                {[
                  { id: 'licenses' as TabId, icon: Key, label: 'My Licenses', color: 'hsl(35,95%,55%)' },
                  { id: 'addresses' as TabId, icon: MapPin, label: 'Addresses', color: 'hsl(210,90%,55%)' },
                  { id: 'notifications' as TabId, icon: Bell, label: 'Notifications', color: 'hsl(25,90%,55%)', badge: unreadCount },
                  { id: 'referral' as TabId, icon: Gift, label: 'Referral', color: 'hsl(280,75%,58%)' },
                  { id: 'security' as TabId, icon: Lock, label: 'Security', color: 'hsl(220,15%,45%)' },
                  { id: 'language' as TabId, icon: Globe, label: 'Language', color: 'hsl(195,80%,50%)' },
                  { id: 'install' as TabId, icon: Download, label: 'Install App', color: 'hsl(158,64%,42%)' },
                ].map((item, idx, arr) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => handleTabSwitch(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-primary/5 transition-colors ${idx < arr.length - 1 ? 'border-b border-border/40' : ''}`}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `${item.color}` }}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <span className="flex-1 text-left text-sm font-bold text-foreground">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-white text-[10px] font-black flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </button>
                  );
                })}
                {isAdmin && (
                  <button onClick={() => navigate('/ceo')} className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-border/40" style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.08), hsla(263,70%,58%,0.05))' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                      <ShieldCheck size={16} className="text-white" />
                    </div>
                    <span className="flex-1 text-left text-sm font-black text-primary">Admin Panel</span>
                    <ChevronRight size={16} className="text-primary" />
                  </button>
                )}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-border/40 active:bg-destructive/5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-destructive/15">
                    <LogOut size={16} className="text-destructive" />
                  </div>
                  <span className="flex-1 text-left text-sm font-bold text-destructive">{t(selectedLang, 'tab_logout')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="grid md:grid-cols-[240px_1fr] gap-5 sm:gap-6">

          {/* Sidebar */}
          <div className="hidden md:block rounded-2xl p-3 h-fit" style={glassCard}>
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 mb-1 text-muted-foreground">{t(selectedLang, 'menu')}</p>
            {tabsWithBadges.map(({ id, label, icon: Icon, badge }) => (
              <button key={id} onClick={() => handleTabSwitch(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-0.5 ${
                  activeTab === id
                    ? 'text-primary shadow-sm'
                    : 'hover:bg-white/50 text-muted-foreground'
                }`}
                style={activeTab === id ? {
                  background: 'rgba(255,255,255,0.85)',
                  border: '1px solid hsla(258,78%,65%,0.25)',
                  boxShadow: '0 2px 8px hsla(258,78%,55%,0.12)',
                } : { border: '1px solid transparent' }}>
                <Icon size={16} />
                <span className="flex-1 text-left">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: id === 'notifications' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>{badge}</span>
                )}
                {activeTab === id && <ChevronRight size={14} />}
              </button>
            ))}
            <div className="h-px my-2 bg-border/50" />
            <button onClick={() => navigate('/free-tools')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-0.5 hover:bg-white/50 text-muted-foreground" style={{ border: '1px solid transparent' }}>
              <Zap size={16} /> Free Tools
            </button>
            {isAdmin && (
              <button onClick={() => navigate('/ceo')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-0.5" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(263,70%,58%))', color: 'white', boxShadow: '0 2px 10px hsla(243,75%,59%,0.35)', border: '1px solid transparent' }}>
                <ShieldCheck size={16} /> Admin Panel
              </button>
            )}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-destructive/10 text-destructive" style={{ border: '1px solid transparent' }}>
              <LogOut size={16} /> {t(selectedLang, 'tab_logout')}
            </button>
          </div>

          {/* Content Panel */}
          <div className={`rounded-2xl overflow-hidden ${!mobileShowContent ? 'hidden md:block' : ''}`} style={glassCardStrong}>

            {/* Mobile Back Button */}
            <button
              onClick={() => { navigate('/?openMenu=1'); }}
              className="md:hidden flex items-center gap-2 px-4 py-3 text-sm font-semibold text-primary w-full"
              style={{ borderBottom: '1px solid hsla(258,78%,75%,0.15)', background: 'rgba(255,255,255,0.5)' }}>
              <ChevronRight size={16} className="rotate-180" /> Back to Menu
            </button>

            {/* Tab Header */}
            <div className="px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between" style={{ borderBottom: '1px solid hsla(258,78%,75%,0.18)', background: 'rgba(255,255,255,0.4)' }}>
              <div>
                 <h2 className="text-lg font-black text-foreground">{t(selectedLang, `tab_${activeTab}`)}</h2>
                 <p className="text-xs mt-0.5 text-muted-foreground">
                    {activeTab === 'orders' ? `${orders.length} ${t(selectedLang, 'order')}` : activeTab === 'wishlist' ? `${wishlistItems.length} items` : activeTab === 'notifications' ? `${unreadCount} ${t(selectedLang, 'unread')}` : activeTab === 'points' ? `${t(selectedLang, 'points_balance_label')} ${pointsBalance} pts` : ''}
                  </p>
              </div>
              <div className="flex gap-2">
                {activeTab === 'profile' && !editing && (
                  <button onClick={() => setEditing(true)} className={`flex items-center gap-2 px-4 py-2 text-sm ${gradBtn}`} style={gradBtnStyle}>
                    <Edit3 size={14} /> {t(selectedLang, 'edit')}
                  </button>
                )}
                {activeTab === 'profile' && editing && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/60 transition-colors" style={{ border: '1px solid hsla(258,78%,75%,0.3)' }}>
                      <X size={13} /> {t(selectedLang, 'cancel')}
                    </button>
                    <button onClick={handleSaveProfile} disabled={saving} className={`flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-60 ${gradBtn}`} style={gradBtnStyle}>
                      <Save size={13} /> {saving ? t(selectedLang, 'loading') : t(selectedLang, 'save')}
                    </button>
                  </div>
                )}
                {activeTab === 'addresses' && (
                  <button onClick={() => { setShowAddressForm(true); setEditingAddress(null); setAddressForm({ label: 'Home', recipient_name: '', phone: '', address_line: '', city: '', district: '', postal_code: '', is_default: false }); }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${gradBtn}`} style={gradBtnStyle}>
                    <Plus size={14} /> {t(selectedLang, 'add_address')}
                  </button>
                )}
                {activeTab === 'notifications' && unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-white/60 transition-colors" style={{ border: '1px solid hsla(258,78%,75%,0.3)' }}>
                    <BellOff size={13} /> {t(selectedLang, 'mark_all_read')}
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6">

              {/* ── Profile Tab ── */}
              {activeTab === 'profile' && (
                <div className="space-y-4 max-w-lg">
                  {/* Avatar section - always visible on mobile, only in edit mode on desktop */}
                  <div className={`flex items-center gap-4 p-4 rounded-2xl ${!editing ? 'md:hidden' : ''}`} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid hsla(258,78%,75%,0.2)' }}>
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center text-lg font-black text-white" style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="av" className="w-full h-full object-cover" /> : initials}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center shadow-md border-2 transition-transform hover:scale-110"
                        style={{ background: 'hsl(var(--primary))', borderColor: 'white' }}>
                        {avatarUploading ? <RefreshCw size={11} className="text-white animate-spin" /> : <Camera size={11} className="text-white" />}
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t(selectedLang, 'avatar_change')}</p>
                      <p className="text-xs mb-2 text-muted-foreground">JPG, PNG — Max 2MB</p>
                      <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        {avatarUploading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />} {t(selectedLang, 'avatar_change')}
                      </button>
                    </div>
                  </div>
                  {[
                    { label: t(selectedLang, 'full_name'), icon: User, field: 'display_name', editable: true, value: profile.display_name || '', type: 'text', placeholder: t(selectedLang, 'enter_name'), extra: null },
                  ].map(item => (
                    <div key={item.field}>
                      <label className={labelCls}>{item.label}</label>
                      {editing ? (
                        <div className="relative">
                          <item.icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input type={item.type} value={item.value} onChange={e => setProfile(p => ({ ...p, [item.field]: e.target.value }))} className={inputCls} placeholder={item.placeholder} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid hsla(258,78%,75%,0.2)' }}>
                          <item.icon size={15} className="text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{item.value || '—'}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* ── Username Field (custom @handle) ── */}
                  <div>
                    <label className={labelCls}>Username</label>
                    {editing ? (
                      <>
                        <div className="relative">
                          <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            value={usernameInput}
                            onChange={e => setUsernameInput(e.target.value.replace(/\s/g, '').toLowerCase())}
                            className={inputCls}
                            placeholder="your_username"
                            maxLength={20}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                          />
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                            {usernameStatus === 'checking' && <Loader2 size={15} className="animate-spin text-muted-foreground" />}
                            {usernameStatus === 'available' && <Check size={16} className="text-emerald-500" />}
                            {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X size={16} className="text-rose-500" />}
                          </div>
                        </div>
                        <p className="mt-1.5 text-[11px]"
                          style={{ color: usernameStatus === 'available' ? 'hsl(160,70%,40%)' : (usernameStatus === 'taken' || usernameStatus === 'invalid') ? 'hsl(350,75%,55%)' : 'hsl(var(--muted-foreground))' }}>
                          {usernameStatus === 'available' && '✓ এই ইউজারনেমটি ব্যবহারের জন্য উপলব্ধ'}
                          {(usernameStatus === 'taken' || usernameStatus === 'invalid') && usernameError}
                          {(usernameStatus === 'idle' || usernameStatus === 'checking') && '৩-২০ অক্ষর • শুধু a-z, 0-9, _ • যতবার ইচ্ছা পরিবর্তন করুন'}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid hsla(258,78%,75%,0.2)' }}>
                        <AtSign size={15} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {profile.username ? `@${profile.username}` : <span className="text-muted-foreground italic">এডিট চাপুন এবং কাস্টম ইউজারনেম সেট করুন</span>}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>{t(selectedLang, 'email')}</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid hsla(258,78%,75%,0.2)' }}>
                      <Mail size={15} className="text-muted-foreground" />
                      <span className="text-sm font-medium flex-1 text-foreground">{user?.email}</span>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">✓ Verified</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{t(selectedLang, 'phone')}</label>
                    {editing ? (
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="tel" value={profile.phone || ''} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="01XXXXXXXXX" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid hsla(258,78%,75%,0.2)' }}>
                        <Phone size={15} className="text-muted-foreground" />
                        <span className="text-sm font-medium" style={{ color: profile.phone ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>{profile.phone || t(selectedLang, 'phone_not_added')}</span>
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
                      <BrandLoader size="sm" />
                      <p className="text-sm text-muted-foreground">{t(selectedLang, 'loading_text')}</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(243,75%,97%)' }}>
                        <Package size={28} style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                      <p className="font-bold text-base mb-1 text-foreground">{t(selectedLang, 'no_orders')}</p>
                      <p className="text-sm mb-4 text-muted-foreground">{t(selectedLang, 'no_orders_sub')}</p>
                      <a href="/shop" className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm ${gradBtn}`} style={gradBtnStyle}>{t(selectedLang, 'shop_now')}</a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map(order => {
                        const s = STATUS_MAP[order.status] || { label: order.status, color: 'text-muted-foreground bg-muted border-border', icon: null };
                        const isExpanded = expandedOrder === order.id;
                        const isWallet = order.payment_method === 'wallet';
                        const pmLabel: Record<string, string> = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', upay: 'উপায়', bkash_merchant: 'bKash Merchant', wallet: '💜 Wallet' };
                        return (
                          <div key={order.id} className="rounded-2xl overflow-hidden transition-all"
                            style={{ background: 'rgba(255,255,255,0.72)', border: isExpanded ? '1.5px solid hsla(258,78%,65%,0.4)' : '1px solid hsla(258,78%,75%,0.2)', backdropFilter: 'blur(12px)', boxShadow: isExpanded ? '0 4px 20px hsla(258,78%,55%,0.10)' : 'none' }}>
                            {/* Order Header Row */}
                            <button
                              className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-white/40 transition-colors text-left"
                              onClick={() => {
                                if (!isExpanded) { setExpandedOrder(order.id); if (!order.items) fetchOrderItems(order.id); }
                                else setExpandedOrder(null);
                              }}
                            >
                              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(243,75%,97%)' }}>
                                  <Package size={18} style={{ color: 'hsl(var(--primary))' }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-foreground">#{order.order_number}</span>
                                    {isWallet && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 border border-violet-400/30">
                                        <Wallet size={9} /> Wallet
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs mt-0.5 text-muted-foreground">{new Date(order.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                <div className="text-right hidden sm:block">
                                  <div className="text-sm font-black text-primary">৳{order.total.toLocaleString()}</div>
                                  {order.payment_status && (
                                    <div className={`text-[10px] font-semibold ${order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                      {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                                    </div>
                                  )}
                                </div>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border ${s.color}`}>{s.icon} {s.label}</span>
                                <ChevronDown size={14} className={`text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </button>

                            {/* Expanded Detail */}
                            {isExpanded && (
                              <div className="border-t px-4 sm:px-5 py-4 space-y-4" style={{ borderColor: 'hsla(258,78%,75%,0.2)', background: 'rgba(255,255,255,0.45)' }}>
                                {/* Payment Info */}
                                <div className="flex flex-wrap gap-3">
                                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid hsla(258,78%,75%,0.2)' }}>
                                    <CreditCard size={13} className="text-primary" />
                                    <span className="text-muted-foreground">{t(selectedLang, 'payment_status')}:</span>
                                    <span className="font-semibold text-foreground">{pmLabel[order.payment_method || ''] || order.payment_method || '—'}</span>
                                  </div>
                                  {order.transaction_id && !order.transaction_id.startsWith('WALLET-') && (
                                    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid hsla(258,78%,75%,0.2)' }}>
                                      <Receipt size={13} className="text-primary" />
                                      <span className="text-muted-foreground">TrxID:</span>
                                      <span className="font-mono font-semibold text-foreground">{order.transaction_id}</span>
                                    </div>
                                  )}
                                  {order.coupon_code && (
                                    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                                      <span className="text-emerald-600 font-semibold">🏷️ {order.coupon_code} — ৳{(order.discount_amount || 0).toLocaleString()} {t(selectedLang, 'discount_off')}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Order Items */}
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t(selectedLang, 'order_items_label')}</p>
                                  {!order.items ? (
                                    <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-primary" />
                                      {t(selectedLang, 'loading_text')}
                                    </div>
                                  ) : order.items.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">{t(selectedLang, 'no_items_found')}</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {order.items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid hsla(258,78%,75%,0.15)' }}>
                                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                                              <Package size={13} className="text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-sm font-semibold text-foreground truncate">{item.product_name}</p>
                                              <p className="text-xs text-muted-foreground">×{item.quantity} × ৳{item.price.toLocaleString()}</p>
                                            </div>
                                          </div>
                                          <div className="text-sm font-bold text-primary flex-shrink-0 ml-2">৳{item.total.toLocaleString()}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* License Keys */}
                                {order.items && order.items.some(i => i.license_key) && (
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t(selectedLang, 'license_keys_label')}</p>
                                    <div className="space-y-2">
                                      {order.items.filter(i => i.license_key).map(item => (
                                        <div key={item.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                                          <Key size={13} className="text-emerald-600 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground">{item.product_name}</p>
                                            <p className="font-mono text-sm font-bold text-emerald-700 truncate">{item.license_key}</p>
                                          </div>
                                          <button onClick={() => { navigator.clipboard.writeText(item.license_key!); toast.success(t(selectedLang, 'key_copied')); }}
                                            className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-600 flex-shrink-0 transition-colors">
                                            <Copy size={13} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Price Breakdown */}
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm pt-2 border-t" style={{ borderColor: 'hsla(258,78%,75%,0.15)' }}>
                                  <span className="text-muted-foreground">Subtotal: <span className="font-semibold text-foreground">৳{(order.subtotal || 0).toLocaleString()}</span></span>
                                  {(order.discount_amount || 0) > 0 && <span className="text-emerald-600 font-semibold">{t(selectedLang, 'discount_off')}: -৳{(order.discount_amount || 0).toLocaleString()}</span>}
                                  <span className="font-bold text-primary">{t(selectedLang, 'total')}: ৳{order.total.toLocaleString()}</span>
                                </div>

                                {/* Notes */}
                                {order.notes && (
                                  <div className="flex items-start gap-2 text-xs px-3 py-2 rounded-xl bg-muted/30 border border-border">
                                    <Info size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">{order.notes}</span>
                                  </div>
                                )}

                                {/* Order Timeline */}
                                {order.timeline && order.timeline.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">📋 অর্ডার ট্র্যাকিং</p>
                                    <div className="relative pl-5">
                                      <div className="absolute left-[7px] top-1 bottom-1 w-0.5 rounded-full" style={{ background: 'linear-gradient(to bottom, hsl(var(--primary)), hsla(258,78%,75%,0.3))' }} />
                                      {order.timeline.map((event, idx) => {
                                        const evStatus = STATUS_MAP[event.status] || { label: event.status, color: 'text-muted-foreground bg-muted border-border', icon: <Clock size={11} /> };
                                        const isLast = idx === order.timeline!.length - 1;
                                        return (
                                          <div key={event.id} className="relative flex items-start gap-3 pb-3 last:pb-0">
                                            <div className={`absolute -left-5 top-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 ${isLast ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30 bg-background text-muted-foreground'}`}>
                                              <div className={`${isLast ? 'w-1.5 h-1.5 rounded-full bg-white' : 'w-1 h-1 rounded-full bg-muted-foreground/50'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${evStatus.color}`}>
                                                  {evStatus.icon} {evStatus.label}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                  {new Date(event.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })} — {new Date(event.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                              </div>
                                              {event.note && <p className="text-xs text-muted-foreground mt-0.5">{event.note}</p>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
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
                      <p className="font-bold text-base mb-1 text-foreground">{t(selectedLang, 'no_wishlist')}</p>
                      <p className="text-sm mb-4 text-muted-foreground">{t(selectedLang, 'no_wishlist_sub')}</p>
                      <a href="/" className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm ${gradBtn}`} style={gradBtnStyle}>{t(selectedLang, 'browse_products')}</a>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {wishlistItems.map(item => (
                        <div key={item.product_id} className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:shadow-sm"
                          style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid hsla(258,78%,75%,0.2)', backdropFilter: 'blur(8px)' }}>
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'hsl(240,20%,96%)' }}>
                            {item.product_image ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Heart size={16} className="text-muted-foreground" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">{item.product_name}</p>
                            <p className="text-sm font-black mt-0.5" style={{ color: 'hsl(var(--primary))' }}>৳{item.product_price.toLocaleString()}</p>
                          </div>
                          <a href="/" className="p-2 rounded-xl hover:bg-white/60 transition-colors text-muted-foreground">
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
                      <h3 className="font-bold text-foreground">{editingAddress ? t(selectedLang, 'edit_address') : t(selectedLang, 'add_address')}</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {['Home', 'Office', 'Other'].map(l => (
                          <button key={l} onClick={() => setAddressForm(f => ({ ...f, label: l }))}
                            className={`py-2 rounded-xl text-sm font-semibold transition-all border ${addressForm.label === l ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:bg-white/60'}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                      {[
                        { field: 'recipient_name', label: `${t(selectedLang, 'recipient_name')} *`, placeholder: t(selectedLang, 'enter_name') },
                        { field: 'phone', label: `${t(selectedLang, 'phone')} *`, placeholder: '01XXXXXXXXX' },
                        { field: 'address_line', label: `${t(selectedLang, 'address_line')} *`, placeholder: t(selectedLang, 'address_placeholder') },
                        { field: 'city', label: `${t(selectedLang, 'city')} *`, placeholder: t(selectedLang, 'city_placeholder') },
                        { field: 'district', label: t(selectedLang, 'district'), placeholder: t(selectedLang, 'district') },
                        { field: 'postal_code', label: t(selectedLang, 'postal_code'), placeholder: '1000' },
                      ].map(({ field, label, placeholder }) => (
                        <div key={field}>
                          <label className={labelCls}>{label}</label>
                          <input type="text" value={(addressForm as any)[field]} onChange={e => setAddressForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
                            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all border bg-white/60 text-foreground border-border focus:border-primary focus:bg-white/80" />
                        </div>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm(f => ({ ...f, is_default: e.target.checked }))} className="rounded" />
                        <span className="text-sm text-foreground">{t(selectedLang, 'set_default')}</span>
                      </label>
                      <div className="flex gap-3">
                        <button onClick={() => setShowAddressForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-white/60 transition-colors" style={{ border: '1px solid hsla(258,78%,75%,0.3)' }}>{t(selectedLang, 'cancel')}</button>
                        <button onClick={handleSaveAddress} className={`flex-1 py-3 text-sm ${gradBtn}`} style={gradBtnStyle}>{t(selectedLang, 'save')}</button>
                      </div>
                    </div>
                  ) : addressLoading ? (
                    <div className="flex justify-center py-12"><BrandLoader size="sm" /></div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(243,75%,97%)' }}><MapPin size={28} style={{ color: 'hsl(var(--primary))' }} /></div>
                      <p className="font-bold text-base mb-1 text-foreground">{t(selectedLang, 'no_addresses')}</p>
                      <p className="text-sm mb-4 text-muted-foreground">{t(selectedLang, 'no_addresses_sub')}</p>
                      <button onClick={() => setShowAddressForm(true)} className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm ${gradBtn}`} style={gradBtnStyle}>
                        <Plus size={16} /> {t(selectedLang, 'add_address')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <div key={addr.id} className="p-4 rounded-2xl transition-all hover:shadow-sm"
                          style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid hsla(258,78%,75%,0.2)', backdropFilter: 'blur(8px)' }}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full border" style={addr.is_default ? { background: 'hsl(243,75%,97%)', color: 'hsl(var(--primary))', borderColor: 'hsl(243,75%,88%)' } : { background: 'rgba(255,255,255,0.6)', color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }}>
                                {addr.label} {addr.is_default && `✓ ${t(selectedLang, 'default_label')}`}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingAddress(addr); setAddressForm({ label: addr.label, recipient_name: addr.recipient_name, phone: addr.phone, address_line: addr.address_line, city: addr.city, district: addr.district || '', postal_code: addr.postal_code || '', is_default: addr.is_default }); setShowAddressForm(true); }}
                                className="p-2 rounded-xl hover:bg-white/60 text-muted-foreground"><Edit3 size={14} /></button>
                              <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive"><X size={14} /></button>
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
                    <div className="flex justify-center py-12"><BrandLoader size="sm" /></div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(243,75%,97%)' }}><Bell size={28} style={{ color: 'hsl(var(--primary))' }} /></div>
                      <p className="font-bold text-base mb-1 text-foreground">{t(selectedLang, 'no_notifications')}</p>
                      <p className="text-sm text-muted-foreground">{t(selectedLang, 'no_notifications_sub')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map(n => (
                        <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)}
                          className="p-4 rounded-2xl transition-all cursor-pointer"
                          style={!n.is_read
                            ? { background: 'rgba(99,82,234,0.07)', border: '1px solid hsla(258,78%,65%,0.28)', backdropFilter: 'blur(8px)' }
                            : { background: 'rgba(255,255,255,0.55)', border: '1px solid hsla(258,78%,75%,0.18)', backdropFilter: 'blur(8px)' }}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.is_read ? '' : 'opacity-50'}`} style={{ background: n.type === 'order' ? 'hsl(243,75%,97%)' : n.type === 'promo' ? 'hsl(38,100%,95%)' : 'rgba(255,255,255,0.7)' }}>
                              {n.type === 'order' ? <Package size={14} style={{ color: 'hsl(var(--primary))' }} /> : n.type === 'promo' ? <Gift size={14} style={{ color: 'hsl(38,80%,50%)' }} /> : <BellRing size={14} className="text-muted-foreground" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                              <p className={`text-sm font-semibold ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{translateDbText(n.title, selectedLang)}</p>
                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{translateDbText(n.message, selectedLang)}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString(getLangLocale(selectedLang))}</p>
                            </div>
                          </div>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Points Tab ── */}
              {activeTab === 'points' && (
                <div className="space-y-5">
                  {pointsLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <BrandLoader size="sm" />
                      <p className="text-sm text-muted-foreground">{t(selectedLang, 'loading_text')}</p>
                    </div>
                  ) : (
                    <>
                      {/* Hero Points Card */}
                      <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, hsl(43,95%,48%) 0%, hsl(36,100%,44%) 100%)', boxShadow: '0 8px 32px hsla(43,95%,48%,0.35), 0 1px 0 rgba(255,255,255,0.15) inset' }}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(20%, -20%)' }} />
                        <div className="relative flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.22)' }}>
                              <Award size={20} className="text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-white/80 font-medium">{t(selectedLang, 'points_reward_points')}</p>
                              <p className="text-xs text-white/55">{t(selectedLang, 'points_available_balance')}</p>
                            </div>
                          </div>
                          <button onClick={fetchPoints} className="text-white/60 hover:text-white transition-colors">
                            <RefreshCw size={14} className={pointsLoading ? 'animate-spin' : ''} />
                          </button>
                        </div>
                        <p className="relative text-4xl font-black tracking-tight text-white">{pointsBalance.toLocaleString()}</p>
                        <p className="relative text-sm text-white/65 mt-1">= ৳{Math.floor(pointsBalance / 2).toLocaleString()} {t(selectedLang, 'points_wallet_value')}</p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: t(selectedLang, 'points_available'), value: pointsBalance.toLocaleString(), sub: `= ৳${Math.floor(pointsBalance/2)}`, color: 'hsl(43,95%,48%)', bg: 'hsla(43,95%,55%,0.08)', border: 'hsla(43,95%,55%,0.25)', icon: <Award size={16} /> },
                          { label: t(selectedLang, 'points_total_earned'), value: totalPointsEarned.toLocaleString(), sub: t(selectedLang, 'points_from_orders'), color: 'hsl(271,91%,65%)', bg: 'hsla(271,91%,65%,0.08)', border: 'hsla(271,91%,65%,0.25)', icon: <TrendingUp size={16} /> },
                          { label: t(selectedLang, 'points_total_redeemed'), value: totalPointsRedeemed.toLocaleString(), sub: `= ৳${Math.floor(totalPointsRedeemed/2)} ${t(selectedLang, 'points_credited')}`, color: 'hsl(158,64%,42%)', bg: 'hsla(158,64%,42%,0.08)', border: 'hsla(158,64%,42%,0.25)', icon: <Wallet size={16} /> },
                          { label: t(selectedLang, 'points_value'), value: `৳${Math.floor(pointsBalance / 2)}`, sub: t(selectedLang, 'points_rate'), color: 'hsl(243,75%,59%)', bg: 'hsla(243,75%,59%,0.08)', border: 'hsla(243,75%,59%,0.25)', icon: <Zap size={16} /> },
                        ].map(stat => (
                          <div key={stat.label} className="rounded-2xl p-4" style={{ background: stat.bg, border: `1px solid ${stat.border}`, backdropFilter: 'blur(8px)' }}>
                            <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>{stat.icon}<span className="text-xs font-semibold text-muted-foreground">{stat.label}</span></div>
                            <div className="text-xl font-black text-foreground">{stat.value}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</div>
                          </div>
                        ))}
                      </div>

                      {/* Earning & Conversion Rules */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-2xl p-4 space-y-2" style={{ background: 'hsla(43,95%,55%,0.07)', border: '1px solid hsla(43,95%,55%,0.25)' }}>
                          <p className="text-xs font-bold uppercase tracking-wide text-amber-600 flex items-center gap-1.5"><Zap size={13} /> {t(selectedLang, 'points_earning_rules')}</p>
                          {[['100', '10'], ['500', '50'], ['1000', '100']].map(([spend, earn]) => (
                            <div key={spend} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">৳{spend} {t(selectedLang, 'points_spend')}</span>
                              <span className="font-bold text-amber-600">= {earn} pts</span>
                            </div>
                          ))}
                          <p className="text-[10px] text-muted-foreground pt-1 border-t border-amber-200/50">{t(selectedLang, 'points_only_completed')}</p>
                        </div>
                        <div className="rounded-2xl p-4 space-y-2" style={{ background: 'hsla(158,64%,42%,0.07)', border: '1px solid hsla(158,64%,42%,0.25)' }}>
                          <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'hsl(158,64%,42%)' }}><Wallet size={13} /> {t(selectedLang, 'points_redemption_rules')}</p>
                          {[['20', '৳10'], ['100', '৳50'], ['200', '৳100']].map(([pts, taka]) => (
                            <div key={pts} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{pts} pts {t(selectedLang, 'points_redeem_label')}</span>
                              <span className="font-bold" style={{ color: 'hsl(158,64%,42%)' }}>= {taka} Wallet</span>
                            </div>
                          ))}
                          <p className="text-[10px] text-muted-foreground pt-1 border-t" style={{ borderColor: 'hsla(158,64%,42%,0.2)' }}>{t(selectedLang, 'points_min_redeem')}</p>
                        </div>
                      </div>

                      {/* Redeem Section */}
                      {pointsBalance >= 20 ? (
                        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid hsla(258,78%,75%,0.25)' }}>
                          <div>
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                              <ArrowDownCircle size={16} style={{ color: 'hsl(158,64%,42%)' }} /> {t(selectedLang, 'points_redeem_title')}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{t(selectedLang, 'points_redeem_subtitle')}</p>
                          </div>
                          {/* Quick select */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{t(selectedLang, 'points_quick_select')}</p>
                            <div className="flex flex-wrap gap-2">
                              {[20, 50, 100, 200, 500].filter(v => v <= pointsBalance).map(v => (
                                <button key={v} onClick={() => setRedeemPoints(String(v))}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                                  style={redeemPoints === String(v)
                                    ? { background: 'hsl(var(--primary))', color: 'white', borderColor: 'hsl(var(--primary))' }
                                    : { background: 'rgba(255,255,255,0.8)', borderColor: 'hsla(258,78%,75%,0.3)', color: 'hsl(var(--foreground))' }}>
                                  {v} pts → ৳{v/2}
                                </button>
                              ))}
                              {pointsBalance >= 20 && (
                                <button onClick={() => setRedeemPoints(String(Math.floor(pointsBalance / 2) * 2))}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                                  style={{ background: 'hsla(43,95%,55%,0.12)', borderColor: 'hsla(43,95%,55%,0.3)', color: 'hsl(43,95%,38%)' }}>
                                  {t(selectedLang, 'points_max')} ({Math.floor(pointsBalance / 2) * 2} pts)
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Custom input */}
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">{t(selectedLang, 'points_custom_label')}</label>
                            <div className="flex gap-3 items-end">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  min="20"
                                  step="2"
                                  max={pointsBalance}
                                  value={redeemPoints}
                                  onChange={e => setRedeemPoints(e.target.value)}
                                  className="w-full rounded-xl px-4 py-2.5 text-sm border bg-white/60 text-foreground border-border focus:border-primary outline-none"
                                  placeholder={t(selectedLang, 'points_min_placeholder')}
                                />
                                {redeemPoints && parseInt(redeemPoints) >= 20 && parseInt(redeemPoints) % 2 === 0 && parseInt(redeemPoints) <= pointsBalance && (
                                  <p className="text-xs mt-1" style={{ color: 'hsl(158,64%,42%)' }}>✅ {parseInt(redeemPoints)} pts = ৳{Math.floor(parseInt(redeemPoints) / 2)} {t(selectedLang, 'points_will_add')}</p>
                                )}
                                {redeemPoints && parseInt(redeemPoints) > 0 && parseInt(redeemPoints) < 20 && (
                                  <p className="text-xs mt-1 text-destructive">{t(selectedLang, 'points_min_warning')}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={handleRedeemPoints}
                            disabled={redeemProcessing || !redeemPoints || parseInt(redeemPoints) < 20 || parseInt(redeemPoints) > pointsBalance || parseInt(redeemPoints) % 2 !== 0}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                            style={{ background: 'linear-gradient(135deg, hsl(158,64%,42%), hsl(170,70%,38%))' }}>
                            {redeemProcessing ? <><RefreshCw size={14} className="animate-spin" /> {t(selectedLang, 'points_processing')}</> : <><Wallet size={14} /> {t(selectedLang, 'points_redeem_btn')}</>}
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid hsla(258,78%,75%,0.2)' }}>
                          <div className="text-4xl mb-3">⭐</div>
                          <p className="font-bold text-foreground text-sm mb-1">
                            {pointsBalance > 0 ? `${t(selectedLang, 'points_need_more')} (${20 - pointsBalance} pts)` : t(selectedLang, 'points_none_yet')}
                          </p>
                          <p className="text-xs text-muted-foreground mb-3">{t(selectedLang, 'points_need_20')}</p>
                          {pointsBalance > 0 && (
                            <div className="w-full bg-border rounded-full h-2 mb-3">
                              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (pointsBalance/20)*100)}%`, background: 'linear-gradient(90deg, hsl(43,95%,55%), hsl(36,100%,52%))' }} />
                            </div>
                          )}
                          <a href="/shop" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, hsl(243,75%,59%), hsl(263,70%,58%))' }}>
                            <Zap size={13} /> {t(selectedLang, 'points_shop_btn')}
                          </a>
                        </div>
                      )}

                      {/* Transactions History */}
                      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid hsla(258,78%,75%,0.2)', backdropFilter: 'blur(16px)' }}>
                        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid hsla(258,78%,75%,0.16)', background: 'rgba(255,255,255,0.4)' }}>
                          <h3 className="font-bold text-foreground flex items-center gap-2"><History size={14} className="text-primary" /> {t(selectedLang, 'points_history')}</h3>
                          <button onClick={fetchPoints} className="text-muted-foreground hover:text-primary transition-colors"><RefreshCw size={13} /></button>
                        </div>
                        {pointsTx.length === 0 ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">{t(selectedLang, 'points_no_tx')}</div>
                        ) : (
                          <div className="divide-y max-h-[320px] overflow-y-auto" style={{ divideColor: 'hsla(258,78%,75%,0.12)' } as any}>
                            {pointsTx.map((tx: any) => {
                              const isEarn = tx.type === 'earn';
                              const isDeduct = tx.type === 'deduct';
                              const isRedeem = tx.type === 'redeem';
                              return (
                                <div key={tx.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid hsla(258,78%,75%,0.10)' }}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                      style={{ background: isEarn ? 'hsla(43,95%,55%,0.15)' : isRedeem ? 'hsla(158,64%,42%,0.12)' : 'hsla(0,80%,60%,0.10)' }}>
                                      {isEarn ? <TrendingUp size={15} className="text-amber-500" /> 
                                       : isRedeem ? <Wallet size={15} style={{ color: 'hsl(158,64%,42%)' }} />
                                       : <TrendingDown size={15} className="text-destructive" />}
                                    </div>
                                    <div>
                                       <div className="text-xs font-semibold text-foreground">{translateDbText(tx.note || '', selectedLang)}</div>
                                       <div className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString(getLangLocale(selectedLang), { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-black"
                                      style={{ color: isEarn ? 'hsl(43,95%,42%)' : isRedeem ? 'hsl(158,64%,42%)' : 'hsl(var(--destructive))' }}>
                                      {isEarn ? '+' : '-'}{tx.points} pts
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">{t(selectedLang, 'points_balance_label')} {tx.balance_after} pts</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Referral Tab ── */}
              {activeTab === 'referral' && (() => {
                const totalRefs = referrals.length;
                const completedRefs = referrals.filter(r => r.status === 'completed').length;
                return (
                  <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.65))', backdropFilter: 'blur(20px)', border: '1.5px solid hsla(258,78%,65%,0.35)', boxShadow: '0 0 30px hsla(258,78%,55%,0.12), 0 4px 16px hsla(258,78%,55%,0.08)' }}>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg, hsla(258,78%,65%,0.15), hsla(258,78%,65%,0.30))', border: '1px solid hsla(258,78%,65%,0.4)' }}>🎁</div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{t(selectedLang, 'referral_program_label')}</p>
                            <p className="text-2xl font-black" style={{ color: 'hsl(var(--primary))' }}>{t(selectedLang, 'referral_rate')}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t(selectedLang, 'referral_rate_sub')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-0.5">{t(selectedLang, 'referral_credit')}</p>
                          <p className="text-3xl font-black text-foreground">৳{profile.referral_credit}</p>
                          {profile.referral_discount > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: 'hsla(158,80%,48%,0.15)', color: 'hsl(158,80%,48%)', border: '1px solid hsla(158,80%,48%,0.3)' }}>
                              {profile.referral_discount}% {t(selectedLang, 'referral_discount')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                        <div className="rounded-xl p-3" style={{ background: 'hsla(258,78%,65%,0.08)' }}>
                          <p className="text-xl font-black text-foreground">{completedRefs}</p>
                          <p className="text-[10px] text-muted-foreground">{t(selectedLang, 'referral_count_success')} {t(selectedLang, 'tab_referral')}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: 'hsla(158,80%,48%,0.08)' }}>
                          <p className="text-xl font-black" style={{ color: 'hsl(158,80%,48%)' }}>{totalRefs - completedRefs}</p>
                          <p className="text-[10px] text-muted-foreground">{t(selectedLang, 'referral_count_pending')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Referral Code Card */}
                    <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(99,82,234,0.07), rgba(99,82,234,0.04))', border: '1px solid hsla(258,78%,65%,0.25)', backdropFilter: 'blur(12px)' }}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-3 text-muted-foreground">{t(selectedLang, 'your_code')}</p>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl font-black tracking-widest flex-1" style={{ fontFamily: 'Orbitron, monospace', color: 'hsl(var(--primary))' }}>{profile.referral_code || '—'}</span>
                        <button onClick={copyReferralCode} className="p-2.5 rounded-xl transition-all hover:scale-110" style={{ background: 'hsl(var(--primary))', color: 'white' }}><Copy size={14} /></button>
                      </div>
                      <button onClick={shareReferralLink} className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"><ExternalLink size={12} /> {t(selectedLang, 'share_link')}</button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: t(selectedLang, 'referral_count'), value: totalRefs, color: 'hsl(var(--foreground))' },
                        { label: t(selectedLang, 'referral_count_success'), value: completedRefs, color: 'hsl(158,64%,42%)' },
                        { label: t(selectedLang, 'referral_earnings'), value: `৳${profile.referral_earnings}`, color: 'hsl(var(--primary))' },
                      ].map(s => (
                        <div key={s.label} className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid hsla(258,78%,75%,0.2)', backdropFilter: 'blur(8px)' }}>
                          <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                          <div className="text-xs text-muted-foreground">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Benefit Box */}
                    <div className="p-4 rounded-2xl" style={{ background: 'hsla(158,80%,48%,0.06)', border: '1px solid hsla(158,80%,48%,0.22)', backdropFilter: 'blur(8px)' }}>
                      <p className="text-sm font-bold mb-3 text-foreground flex items-center gap-2"><Gift size={15} style={{ color: 'hsl(158,80%,48%)' }} /> {t(selectedLang, 'referral_benefit_title')}</p>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { emoji: '🏷️', title: t(selectedLang, 'referral_benefit1_title'), sub: t(selectedLang, 'referral_benefit1_sub') },
                          { emoji: '🤝', title: t(selectedLang, 'referral_benefit2_title'), sub: t(selectedLang, 'referral_benefit2_sub') },
                        ].map(b => (
                          <div key={b.title} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'hsla(258,78%,65%,0.08)' }}>
                            <span className="text-lg">{b.emoji}</span>
                            <div><p className="text-sm font-black" style={{ color: 'hsl(var(--primary))' }}>{b.title}</p><p className="text-[10px] text-muted-foreground">{b.sub}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* How it works */}
                    <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid hsla(258,78%,75%,0.2)', backdropFilter: 'blur(8px)' }}>
                      <p className="text-sm font-bold mb-3 text-foreground">{t(selectedLang, 'referral_how')}</p>
                      {[
                        { n: '1', text: t(selectedLang, 'referral_step1') },
                        { n: '2', text: t(selectedLang, 'referral_step2') },
                        { n: '3', text: t(selectedLang, 'referral_step3') },
                      ].map(({ n, text }) => (
                        <div key={n} className="flex items-start gap-3 mb-2 last:mb-0">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: 'hsl(var(--primary))' }}>{n}</span>
                          <span className="text-sm text-muted-foreground">{text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Referral History */}
                    {referralLoading ? (
                      <div className="flex justify-center py-4"><BrandLoader size="sm" /></div>
                    ) : referrals.length > 0 ? (
                      <div>
                        <p className="text-sm font-bold mb-3 text-foreground flex items-center gap-2">
                          <History size={14} style={{ color: 'hsl(var(--primary))' }} /> {t(selectedLang, 'referral_history')} ({referrals.length})
                        </p>
                        <div className="space-y-2">
                          {referrals.map((r, i) => {
                            const refTier = getCurrentTier(i + 1);
                            return (
                              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid hsla(258,78%,75%,0.18)', backdropFilter: 'blur(8px)' }}>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: `${refTier.color}18`, border: `1px solid ${refTier.color}30` }}>
                                    {refTier.emoji}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-foreground">
                                      {r.referred_name ? r.referred_name : `#${i + 1} ${t(selectedLang, 'referral_referred')}`}
                                    </p>
                                    {r.referred_email && (
                                      <p className="text-[10px] text-muted-foreground">{r.referred_email}</p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-sm font-black" style={{ color: refTier.color }}>+৳{r.reward_amount}</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={r.status === 'completed' ? { background: 'hsla(158,80%,48%,0.15)', color: 'hsl(158,80%,48%)' } : { background: 'hsla(40,100%,58%,0.15)', color: 'hsl(40,100%,58%)' }}>
                                    {r.status === 'completed' ? t(selectedLang, 'referral_success_badge') : t(selectedLang, 'referral_pending_badge')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid hsla(258,78%,75%,0.18)' }}>
                        <div className="text-3xl mb-2">👥</div>
                        <p className="text-sm font-semibold text-foreground mb-1">{t(selectedLang, 'no_referrals')}</p>
                        <p className="text-xs text-muted-foreground">{t(selectedLang, 'no_referrals_sub')}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Security Tab ── */}
              {activeTab === 'security' && (
                <div className="max-w-lg space-y-5">
                  <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(99,82,234,0.08), rgba(99,82,234,0.04))', border: '1px solid hsla(258,78%,65%,0.22)', backdropFilter: 'blur(8px)' }}>
                    <ShieldCheck size={18} style={{ color: 'hsl(var(--primary))' }} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'hsl(var(--primary))' }}>{t(selectedLang, 'security_title')}</p>
                      <p className="text-xs mt-0.5 text-muted-foreground">{t(selectedLang, 'security_subtitle')}</p>
                    </div>
                  </div>
                  {[
                    { label: t(selectedLang, 'new_password'), value: newPassword, set: setNewPassword, show: showNewPass, toggle: () => setShowNewPass(!showNewPass), placeholder: t(selectedLang, 'enter_new_password') },
                    { label: t(selectedLang, 'confirm_password'), value: confirmPassword, set: setConfirmPassword, show: showConfirmPass, toggle: () => setShowConfirmPass(!showConfirmPass), placeholder: t(selectedLang, 'enter_confirm_password') },
                  ].map((f, idx) => (
                    <div key={idx}>
                      <label className={labelCls}>{f.label}</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type={f.show ? 'text' : 'password'} value={f.value} onChange={e => f.set(e.target.value)}
                          className="w-full rounded-xl pl-10 pr-11 py-3 text-sm outline-none transition-all border bg-white/60 text-foreground border-border focus:border-primary focus:bg-white/80"
                          placeholder={f.placeholder} />
                        <button type="button" onClick={f.toggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {f.show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  {confirmPassword && newPassword !== confirmPassword && <p className="text-xs flex items-center gap-1 text-destructive"><AlertCircle size={11} /> {t(selectedLang, 'password_mismatch')}</p>}
                  {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(158,64%,42%)' }}><CheckCircle2 size={11} /> {t(selectedLang, 'password_match')}</p>}
                  <button onClick={handleChangePassword} disabled={passLoading || !newPassword || !confirmPassword}
                    className={`flex items-center justify-center gap-2 w-full py-3 text-sm disabled:opacity-50 ${gradBtn}`} style={gradBtnStyle}>
                    {passLoading ? <><RefreshCw size={15} className="animate-spin" /> {t(selectedLang, 'loading_text')}</> : <><ShieldCheck size={15} /> {t(selectedLang, 'change_password')}</>}
                  </button>
                </div>
              )}

              {/* ── Licenses Tab ── */}
              {activeTab === 'licenses' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Key size={16} className="text-primary" />
                      My Licenses & Credentials
                    </h3>
                    <button onClick={fetchLicenses} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  {licensesLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <RefreshCw size={20} className="animate-spin text-primary" />
                    </div>
                  ) : myLicenses.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground rounded-2xl border border-dashed border-border">
                      <Key size={40} className="mx-auto mb-3 opacity-20" />
                       <p className="font-medium text-sm">No License Found</p>
                      <p className="text-xs mt-1">Licenses will appear here after your order is completed</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myLicenses.map((item: any) => {
                        const isVisible = licenseVisibility[item.id];
                        const parts = (item.license_key || '').split('|');
                        const keyValue = parts[0];
                        const extraInfo = parts[1] || null;
                        const order = item.orders;
                        return (
                          <div key={item.id} className="rounded-2xl border overflow-hidden"
                            style={{ background: 'hsl(var(--card))', borderColor: 'hsla(162,72%,46%,0.25)' }}>
                            {/* Header */}
                            <div className="flex items-center gap-3 px-4 py-3"
                              style={{ background: 'hsla(162,72%,46%,0.06)', borderBottom: '1px solid hsla(162,72%,46%,0.15)' }}>
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'hsla(162,72%,46%,0.15)' }}>
                                <Key size={14} style={{ color: 'hsl(162,72%,46%)' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-foreground truncate">{item.product_name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  অর্ডার #{order?.order_number} · {order?.created_at ? new Date(order.created_at).toLocaleDateString('bn-BD') : ''}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                                style={{ background: 'hsla(162,72%,46%,0.15)', color: 'hsl(162,72%,46%)' }}>
                                ✅ Delivered
                              </span>
                            </div>

                            {/* Key Content */}
                            <div className="p-4 space-y-2.5">
                              {/* Main key */}
                              <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  {extraInfo ? 'Username / Email' : 'License Key'}
                                </p>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                                  <code className="flex-1 text-sm font-mono text-foreground break-all">
                                    {isVisible ? keyValue : keyValue.slice(0, 4) + '•'.repeat(Math.min(keyValue.length - 8, 16)) + keyValue.slice(-4)}
                                  </code>
                                  <button onClick={() => setLicenseVisibility(p => ({ ...p, [item.id]: !p[item.id] }))}
                                    className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                                    {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                  <button onClick={() => { navigator.clipboard.writeText(keyValue); toast.success('Copied!'); }}
                                    className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                                    <Copy size={13} />
                                  </button>
                                </div>
                              </div>

                              {/* Extra (Password) */}
                              {extraInfo && (
                                <div>
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Password</p>
                                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                                    <code className="flex-1 text-sm font-mono text-foreground break-all">
                                      {isVisible ? extraInfo : '•'.repeat(Math.min(extraInfo.length, 20))}
                                    </code>
                                    <button onClick={() => { navigator.clipboard.writeText(extraInfo); toast.success('Password copied!'); }}
                                      className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                                      <Copy size={13} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Wallet Tab ── */}
              {activeTab === 'wallet' && (
                <div className="space-y-5">
                  {/* Balance Card */}
                  <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, hsl(243,75%,52%) 0%, hsl(263,70%,50%) 100%)', boxShadow: '0 8px 32px hsla(258,78%,55%,0.30), 0 1px 0 rgba(255,255,255,0.15) inset' }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(20%, -20%)' }} />
                    <div className="relative flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.22)' }}>
                          <Wallet size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-white/80 font-medium">My Wallet</p>
                          <p className="text-xs text-white/55">Store Balance</p>
                        </div>
                      </div>
                      <button onClick={fetchWallet} className="text-white/60 hover:text-white transition-colors">
                        <RefreshCw size={14} className={walletLoading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    <p className="relative text-4xl font-black tracking-tight text-white">৳{walletBalance.toLocaleString()}</p>
                    <p className="relative text-sm text-white/65 mt-1">Available Balance</p>
                  </div>

                  {/* Top-up Wizard */}
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid hsla(258,78%,75%,0.22)', backdropFilter: 'blur(20px)' }}>
                    {/* Step indicators */}
                    <div className="flex" style={{ borderBottom: '1px solid hsla(258,78%,75%,0.18)' }}>
                      {['Select Amount', 'Payment', 'Confirm'].map((s, i) => (
                        <div key={i} className={`flex-1 py-3 text-center text-xs font-semibold transition-colors ${
                          topupStep === i ? 'text-primary border-b-2 border-primary' :
                          topupStep > i ? 'text-muted-foreground' : 'text-muted-foreground/50'
                        }`} style={topupStep === i ? { background: 'rgba(99,82,234,0.06)' } : {}}>{i + 1}. {s}</div>
                      ))}
                    </div>

                    <div className="p-5">
                      {/* STEP 0: Select Amount */}
                      {topupStep === 0 && (
                        <div className="space-y-4">
                          <p className="text-sm font-semibold text-foreground">How much do you want to add?</p>
                          <div className="flex flex-wrap gap-2">
                            {[100, 200, 500, 1000, 2000, 5000].map(v => (
                              <button key={v} onClick={() => setTopupAmount(String(v))}
                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                  topupAmount === String(v)
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary bg-white/60'
                                }`}>৳{v}</button>
                            ))}
                          </div>
                          <div>
                            <label className={labelCls}>Or enter custom amount</label>
                            <input type="number" min="10" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} placeholder="Min ৳10"
                              className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-border bg-white/60 text-foreground focus:border-primary focus:bg-white/80" />
                          </div>
                          <button onClick={() => { if (!topupAmount || parseFloat(topupAmount) < 10) { toast.error('Minimum ৳10'); return; } setTopupStep(1); }}
                            className={`w-full py-3 text-sm flex items-center justify-center gap-2 ${gradBtn}`} style={gradBtnStyle}>
                            Continue →
                          </button>
                        </div>
                      )}

                      {/* STEP 1: Payment */}
                      {topupStep === 1 && (() => {
                        const pm = TOPUP_PAYMENT_METHODS.find(p => p.id === topupPaymentMethod) || TOPUP_PAYMENT_METHODS[0];
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-foreground">Top-up: <span className="text-primary font-black">৳{topupAmount}</span></p>
                              <button onClick={() => setTopupStep(0)} className="text-xs text-muted-foreground hover:text-primary underline">Change</button>
                            </div>
                            <div>
                              <label className={labelCls}>Select Payment Method</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {TOPUP_PAYMENT_METHODS.map(p => (
                                  <button key={p.id} onClick={() => setTopupPaymentMethod(p.id)}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-all ${
                                      topupPaymentMethod === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 bg-white/60'
                                    }`}>
                                    <img src={p.logo} alt={p.label} className="h-7 w-auto object-contain rounded" /><span className="text-xs">{p.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <PaymentInstructions
                              paymentMethodId={topupPaymentMethod as import('@/components/store/PaymentInstructions').PMId}
                              amount={parseFloat(topupAmount) || 0}
                              amountLabel="টপ-আপ পরিমাণ"
                            />
                            <div>
                              <label className={labelCls}>Transaction ID (TrxID)</label>
                              <input value={topupTxId} onChange={e => setTopupTxId(e.target.value)} placeholder="Enter your TrxID after payment"
                                className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-border bg-white/60 text-foreground focus:border-primary focus:bg-white/80" />
                            </div>
                            <div className="flex gap-3">
                              <button onClick={() => setTopupStep(0)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-white/60 transition-colors" style={{ border: '1px solid hsla(258,78%,75%,0.3)' }}>Back</button>
                              <button onClick={handleTopupSubmit} disabled={topupProcessing || !topupTxId.trim()}
                                className={`flex-1 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${gradBtn}`} style={gradBtnStyle}>
                                {topupProcessing ? <><RefreshCw size={14} className="animate-spin" /> Submitting...</> : 'Submit Request'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* STEP 2: Success */}
                      {topupStep === 2 && (
                        <div className="text-center py-6 space-y-4">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'hsla(158,80%,48%,0.12)', border: '1px solid hsla(158,80%,48%,0.3)' }}>
                            <CheckCircle2 size={32} style={{ color: 'hsl(158,80%,48%)' }} />
                          </div>
                          <div>
                            <p className="text-base font-black text-foreground">Request Submitted!</p>
                            <p className="text-sm text-muted-foreground mt-1">Admin will verify your payment and credit <span className="font-bold text-primary">৳{topupAmount}</span> to your wallet.</p>
                          </div>
                          <button onClick={() => { setTopupStep(0); setTopupAmount(''); fetchWallet(); }}
                            className={`px-6 py-2.5 text-sm ${gradBtn}`} style={gradBtnStyle}>Done</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pending Requests */}
                  {topupRequests.filter((r: any) => r.status === 'pending').length > 0 && (
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid hsla(45,93%,58%,0.28)', backdropFilter: 'blur(8px)' }}>
                      <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Clock size={14} className="text-amber-500" /> Pending Top-up Requests
                      </p>
                      {topupRequests.filter((r: any) => r.status === 'pending').map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">৳{r.amount} via {r.payment_method}</p>
                            <p className="text-xs text-muted-foreground">TrxID: {r.transaction_id} · {new Date(r.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">Pending</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transaction History */}
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid hsla(258,78%,75%,0.2)', backdropFilter: 'blur(16px)' }}>
                    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid hsla(258,78%,75%,0.16)', background: 'rgba(255,255,255,0.4)' }}>
                      <h3 className="font-bold text-foreground flex items-center gap-2"><History size={14} className="text-primary" /> Transaction History</h3>
                      <button onClick={fetchWallet} className="text-muted-foreground hover:text-primary transition-colors"><RefreshCw size={13} /></button>
                    </div>
                    <div className="divide-y max-h-[280px] overflow-y-auto" style={{ divideColor: 'hsla(258,78%,75%,0.12)' } as any}>
                      {walletLoading ? (
                        <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
                      ) : walletTx.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-sm">No transactions yet</div>
                      ) : walletTx.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid hsla(258,78%,75%,0.10)' }}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center`} style={{ background: tx.type === 'credit' ? 'hsla(158,80%,48%,0.12)' : 'hsla(0,80%,60%,0.10)' }}>
                              {tx.type === 'credit' ? <TrendingUp size={12} style={{ color: 'hsl(158,80%,42%)' }} /> : <TrendingDown size={12} className="text-destructive" />}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground">{translateDbText(tx.note || (tx.type === 'credit' ? 'Credit' : 'Debit'), selectedLang)}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold`} style={{ color: tx.type === 'credit' ? 'hsl(158,80%,42%)' : 'hsl(var(--destructive))' }}>
                              {tx.type === 'credit' ? '+' : '-'}৳{tx.amount}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Balance: ৳{tx.balance_after}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* How to use wallet */}
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid hsla(258,78%,75%,0.2)', backdropFilter: 'blur(8px)' }}>
                    <p className="text-sm font-bold mb-3 text-foreground">How to use your wallet?</p>
                    {[
                      { n: '1', text: 'Top-up: Choose amount → Pay via bKash/Nagad → Enter TrxID' },
                      { n: '2', text: 'Admin verifies payment and credits your wallet balance' },
                      { n: '3', text: 'At checkout, select "Wallet" as payment method to pay instantly' },
                    ].map(({ n, text }) => (
                      <div key={n} className="flex items-start gap-3 mb-2 last:mb-0">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: 'hsl(var(--primary))' }}>{n}</span>
                        <span className="text-sm text-muted-foreground">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Language Tab ── */}
              {activeTab === 'language' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2"><Globe size={18} className="text-primary" /> {t(selectedLang, 'language_title')}</h2>
                    <p className="text-sm text-muted-foreground">{t(selectedLang, 'language_subtitle')}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LANGUAGES.map(lang => {
                      const isActive = selectedLang === lang.code;
                      return (
                        <button key={lang.code} onClick={() => {
                          const code = lang.code as LangCode;
                          setSelectedLang(code); setStoredLang(code);
                          toast.success(`${t(code, 'language_changed')}: ${lang.native}`);
                        }}
                          className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200"
                          style={isActive ? {
                            background: 'linear-gradient(135deg, rgba(99,82,234,0.10), rgba(99,82,234,0.06))',
                            border: '1.5px solid hsla(258,78%,65%,0.35)',
                            boxShadow: '0 4px 16px hsla(258,78%,55%,0.10)',
                            backdropFilter: 'blur(12px)',
                          } : {
                            background: 'rgba(255,255,255,0.65)',
                            border: '1px solid hsla(258,78%,75%,0.18)',
                            backdropFilter: 'blur(8px)',
                          }}>
                          <span className="text-3xl leading-none">{lang.flag}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>{lang.native}</p>
                            <p className="text-xs text-muted-foreground">{lang.name} · {lang.region}</p>
                          </div>
                          {isActive && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--primary))' }}>
                              <CheckCircle2 size={12} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid hsla(258,78%,75%,0.18)', backdropFilter: 'blur(8px)' }}>
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <Globe size={13} className="text-primary mt-0.5 flex-shrink-0" />
                      {t(selectedLang, 'language_note')}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Install App Tab ── */}
              {activeTab === 'install' && (
                <InstallAppTab />
              )}

            </div>
          </div>{/* end Content Panel */}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
