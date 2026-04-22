import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Download, Trash2, Search, Users, Clock, CheckCircle2, XCircle } from 'lucide-react';

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  subscribed_at: string;
  source: string | null;
};

const AdminNewsletterSubscribers = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });
    if (data) setSubscribers(data as Subscriber[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('newsletter_subscribers').update({ status }).eq('id', id);
    setSubscribers(p => p.map(s => s.id === id ? { ...s, status } : s));
    toast.success('স্ট্যাটাস আপডেট হয়েছে!');
  };

  const remove = async (id: string) => {
    if (!confirm('এই সাবস্ক্রাইবার মুছে দিতে চান?')) return;
    await supabase.from('newsletter_subscribers').delete().eq('id', id);
    setSubscribers(p => p.filter(s => s.id !== id));
    toast.success('সাবস্ক্রাইবার মুছে ফেলা হয়েছে!');
  };

  const exportCSV = () => {
    const rows = filtered.map(s => [s.email, s.name || '', s.status, s.subscribed_at, s.source || '']);
    const csv = [['Email', 'Name', 'Status', 'Subscribed At', 'Source'], ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `subscribers_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast.success('CSV এক্সপোর্ট হয়েছে!');
  };

  const filtered = subscribers.filter(s => {
    const matchSearch = s.email.toLowerCase().includes(search.toLowerCase()) || (s.name || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = { total: subscribers.length, active: subscribers.filter(s => s.status === 'active').length, unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Newsletter <span className="gradient-text">Subscribers</span>
          </h1>
          <p className="text-muted-foreground text-sm">ইমেইল সাবস্ক্রাইবার ম্যানেজমেন্ট</p>
        </div>
        <button onClick={exportCSV} disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold glass-card hover:border-primary/40 text-primary transition-all disabled:opacity-50">
          <Download size={15} /> CSV এক্সপোর্ট
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'মোট', value: stats.total, icon: Users, color: 'text-primary' },
          { label: 'সক্রিয়', value: stats.active, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'আনসাবস্ক্রাইবড', value: stats.unsubscribed, icon: XCircle, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <s.icon size={20} className={`${s.color} mx-auto mb-1.5`} />
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ইমেইল বা নাম খুঁজুন..."
            className="w-full bg-muted/30 border border-border rounded-xl pl-14 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
        {(['all', 'active', 'unsubscribed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f ? 'btn-glow' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
            {f === 'all' ? 'সব' : f === 'active' ? 'সক্রিয়' : 'আনসাবস্ক্রাইবড'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted/20 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Mail size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">কোনো সাবস্ক্রাইবার নেই</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ইমেইল</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">নাম</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">স্ট্যাটাস</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">তারিখ</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Mail size={12} className="text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{sub.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{sub.name || '—'}</td>
                    <td className="px-5 py-3.5">
                      <select value={sub.status} onChange={e => updateStatus(sub.id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer outline-none ${sub.status === 'active' ? 'bg-green-400/15 text-green-400' : 'bg-red-400/15 text-red-400'}`}>
                        <option value="active">সক্রিয়</option>
                        <option value="unsubscribed">আনসাবস্ক্রাইবড</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">
                      <div className="flex items-center gap-1"><Clock size={11} />{new Date(sub.subscribed_at).toLocaleDateString('bn-BD')}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => remove(sub.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNewsletterSubscribers;
