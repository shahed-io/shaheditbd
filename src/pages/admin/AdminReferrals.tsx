import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Users, TrendingUp, CheckCircle2, Clock, RefreshCw, Search, ChevronDown } from 'lucide-react';

const TIERS = [
  { name: 'bronze',   min: 0,  max: 4,  reward: 50,  label: 'ব্রোঞ্জ',    emoji: '🥉', color: 'hsl(30,60%,55%)' },
  { name: 'silver',   min: 5,  max: 14, reward: 75,  label: 'সিলভার',     emoji: '🥈', color: 'hsl(220,15%,70%)' },
  { name: 'gold',     min: 15, max: 29, reward: 100, label: 'গোল্ড',      emoji: '🥇', color: 'hsl(45,90%,52%)' },
  { name: 'platinum', min: 30, max: 49, reward: 150, label: 'প্লাটিনাম', emoji: '💎', color: 'hsl(185,90%,52%)' },
  { name: 'diamond',  min: 50, max: Infinity, reward: 200, label: 'ডায়মন্ড', emoji: '💠', color: 'hsl(271,91%,65%)' },
];

const getTier = (count: number) => TIERS.find(t => count >= t.min && count <= t.max) || TIERS[0];

const STATUS_OPTIONS = ['pending', 'completed', 'cancelled'];
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'পেন্ডিং',  color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  completed: { label: 'সফল',      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  cancelled: { label: 'বাতিল',    color: 'text-red-400 bg-red-400/10 border-red-400/30' },
};

interface Referral {
  id: string;
  referral_code: string;
  referrer_id: string;
  referred_id: string | null;
  reward_amount: number;
  status: string;
  reward_paid: boolean;
  created_at: string;
  referrer_name?: string;
  referrer_email?: string;
  referred_email?: string;
  referrer_total?: number;
}

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalPaid: 0 });

  const fetchReferrals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { toast.error('ডেটা লোড ব্যর্থ'); setLoading(false); return; }

    const refs = data || [];

    // Fetch referrer profiles in batch
    const referrerIds = [...new Set(refs.map(r => r.referrer_id).filter(Boolean))];
    const referredIds = [...new Set(refs.map(r => r.referred_id).filter(Boolean))];

    const [{ data: referrers }, { data: referred }] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, email').in('user_id', referrerIds),
      supabase.from('profiles').select('user_id, display_name, email').in('user_id', referredIds),
    ]);

    // Count referrals per referrer
    const referrerCounts: Record<string, number> = {};
    refs.forEach(r => {
      if (r.status === 'completed') {
        referrerCounts[r.referrer_id] = (referrerCounts[r.referrer_id] || 0) + 1;
      }
    });

    const enriched: Referral[] = refs.map(r => {
      const rr = referrers?.find(p => p.user_id === r.referrer_id);
      const rf = referred?.find(p => p.user_id === r.referred_id);
      return {
        ...r,
        referrer_name: rr?.display_name || '—',
        referrer_email: rr?.email || '—',
        referred_email: rf?.email || '—',
        referrer_total: referrerCounts[r.referrer_id] || 0,
      };
    });

    setReferrals(enriched);
    setStats({
      total: refs.length,
      completed: refs.filter(r => r.status === 'completed').length,
      pending: refs.filter(r => r.status === 'pending').length,
      totalPaid: refs.filter(r => r.status === 'completed').reduce((s, r) => s + Number(r.reward_amount), 0),
    });
    setLoading(false);
  };

  useEffect(() => { fetchReferrals(); }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const referral = referrals.find(r => r.id === id);
    const oldStatus = referral?.status;

    const { error } = await supabase
      .from('referrals')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('আপডেট ব্যর্থ হয়েছে');
      setUpdatingId(null);
      return;
    }

    // Auto credit: pending → completed = add credit to referrer's profile
    if (oldStatus !== 'completed' && newStatus === 'completed' && referral) {
      const rewardAmount = referral.reward_amount;
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_credit, referral_earnings')
        .eq('user_id', referral.referrer_id)
        .maybeSingle();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            referral_credit: Number(profile.referral_credit) + rewardAmount,
            referral_earnings: Number(profile.referral_earnings) + rewardAmount,
          })
          .eq('user_id', referral.referrer_id);
        toast.success(`✅ স্ট্যাটাস "সফল" — ৳${rewardAmount} ক্রেডিট স্বয়ংক্রিয়ভাবে যোগ হয়েছে`);
      }
    } else if (oldStatus === 'completed' && newStatus !== 'completed' && referral) {
      // Reverse credit if moving away from completed
      const rewardAmount = referral.reward_amount;
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_credit, referral_earnings')
        .eq('user_id', referral.referrer_id)
        .maybeSingle();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            referral_credit: Math.max(0, Number(profile.referral_credit) - rewardAmount),
            referral_earnings: Math.max(0, Number(profile.referral_earnings) - rewardAmount),
          })
          .eq('user_id', referral.referrer_id);
        toast.success(`স্ট্যাটাস "${STATUS_LABELS[newStatus]?.label}" — ৳${rewardAmount} ক্রেডিট কাটা হয়েছে`);
      }
    } else {
      toast.success(`স্ট্যাটাস "${STATUS_LABELS[newStatus]?.label}" তে পরিবর্তন হয়েছে`);
    }

    setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    // Refresh stats
    setStats(prev => ({
      ...prev,
      completed: newStatus === 'completed'
        ? prev.completed + (oldStatus !== 'completed' ? 1 : 0)
        : prev.completed - (oldStatus === 'completed' ? 1 : 0),
      pending: newStatus === 'pending'
        ? prev.pending + (oldStatus !== 'pending' ? 1 : 0)
        : prev.pending - (oldStatus === 'pending' ? 1 : 0),
    }));
    setUpdatingId(null);
  };

  const handleTogglePaid = async (id: string, current: boolean) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('referrals')
      .update({ reward_paid: !current })
      .eq('id', id);
    if (!error) {
      toast.success(!current ? 'পেমেন্ট দেওয়া হয়েছে চিহ্নিত করা হয়েছে' : 'পেমেন্ট অপেক্ষমাণ');
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, reward_paid: !current } : r));
    }
    setUpdatingId(null);
  };

  const filtered = referrals.filter(r => {
    const matchSearch = !search ||
      r.referral_code.toLowerCase().includes(search.toLowerCase()) ||
      (r.referrer_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.referrer_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Referral <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">সব রেফারেল ম্যানেজ ও স্ট্যাটাস পরিবর্তন করুন</p>
        </div>
        <button onClick={fetchReferrals} disabled={loading}
          className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'মোট রেফারেল', value: stats.total, icon: Gift, color: 'text-primary' },
          { label: 'সফল রেফারেল', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'পেন্ডিং', value: stats.pending, icon: Clock, color: 'text-amber-400' },
          { label: 'মোট ক্রেডিট বিতরণ', value: `৳${stats.totalPaid}`, icon: TrendingUp, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} className={s.color} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="নাম, ইমেইল বা কোড দিয়ে খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-muted/30 border border-border rounded-xl pl-12 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                statusFilter === s
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'glass-card text-muted-foreground border-border/50 hover:text-foreground'
              }`}>
              {s === 'all' ? 'সব' : STATUS_LABELS[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">রেফারেল তালিকা ({filtered.length})</h3>
          <span className="text-xs text-muted-foreground">টিয়ার স্বয়ংক্রিয়ভাবে গণনা হয়</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-muted/20 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Gift size={36} className="mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground text-sm">কোনো রেফারেল পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {['#', 'রেফারকারী', 'টিয়ার', 'কোড', 'রেফার প্রাপক', 'রিওয়ার্ড', 'স্ট্যাটাস', 'পেমেন্ট', 'তারিখ'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filtered.map((r, i) => {
                  const tier = getTier(r.referrer_total || 0);
                  const st = STATUS_LABELS[r.status] || STATUS_LABELS['pending'];
                  return (
                    <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>

                      {/* Referrer */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground text-xs">{r.referrer_name}</div>
                        <div className="text-[10px] text-muted-foreground">{r.referrer_email}</div>
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap"
                          style={{ color: tier.color }}>
                          {tier.emoji} {tier.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{r.referrer_total} রেফার</span>
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs px-2 py-1 rounded-lg bg-muted/30 text-foreground">
                          {r.referral_code}
                        </span>
                      </td>

                      {/* Referred user */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.referred_email}</td>

                      {/* Reward */}
                      <td className="px-4 py-3">
                        <span className="font-black text-sm" style={{ color: tier.color }}>৳{r.reward_amount}</span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={r.status}
                            disabled={updatingId === r.id}
                            onChange={e => handleStatusChange(r.id, e.target.value)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer outline-none transition-all appearance-none pr-7 ${st.color}`}
                            style={{ background: 'transparent' }}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt} value={opt} className="bg-background text-foreground">
                                {STATUS_LABELS[opt]?.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                        </div>
                      </td>

                      {/* Reward Paid toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTogglePaid(r.id, r.reward_paid)}
                          disabled={updatingId === r.id}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                            r.reward_paid
                              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                              : 'text-muted-foreground bg-muted/20 border-border/50 hover:border-primary/40'
                          }`}
                        >
                          {r.reward_paid ? '✓ দেওয়া হয়েছে' : 'বাকি আছে'}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('bn-BD')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReferrals;
