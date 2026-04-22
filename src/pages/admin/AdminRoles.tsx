import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Plus, Trash2, Crown, User, Search, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';

type AppRole = 'admin' | 'manager' | 'user';

const roleConfig: Record<AppRole, { label: string; color: string; bg: string; icon: typeof Shield; desc: string }> = {
  admin: { label: 'Admin', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', icon: Crown, desc: 'সম্পূর্ণ এক্সেস' },
  manager: { label: 'Manager', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', icon: Shield, desc: 'অর্ডার ও প্রোডাক্ট ম্যানেজ' },
  user: { label: 'User', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', icon: User, desc: 'সাধারণ ব্যবহারকারী' },
};

const AdminRoles = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'manager' as AppRole });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    const { data: rolesData } = await supabase.from('user_roles').select('*');
    const { data: profilesData } = await supabase.from('profiles').select('*');
    setRoles(rolesData || []);
    setProfiles(profilesData || []);
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Find user by email from profiles
    const profile = profiles.find(p => p.email?.toLowerCase() === form.email.toLowerCase());
    if (!profile) {
      toast.error('এই ইমেইলে কোনো ইউজার পাওয়া যায়নি');
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('user_roles').insert({ user_id: profile.user_id, role: form.role });
    if (error) toast.error(handleDbError(error));
    else { toast.success('রোল যোগ করা হয়েছে!'); setShowForm(false); fetchRoles(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই রোলটি সরিয়ে দেবেন?')) return;
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) toast.error(handleDbError(error));
    else { toast.success('রোল সরানো হয়েছে'); fetchRoles(); }
  };

  const handleUpdateRole = async (id: string, newRole: AppRole) => {
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('id', id);
    if (error) toast.error(handleDbError(error));
    else { toast.success('রোল আপডেট হয়েছে'); fetchRoles(); }
  };

  const filteredRoles = roles.filter(r => {
    const profile = getProfile(r.user_id);
    const email = profile?.email || '';
    const name = profile?.display_name || '';
    return email.includes(search) || name.includes(search) || r.role.includes(search);
  });

  // Summary counts
  const counts = { admin: 0, manager: 0, user: 0 };
  roles.forEach(r => { if (counts[r.role as AppRole] !== undefined) counts[r.role as AppRole]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Admin <span className="gradient-text">Roles</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">ইউজারদের অ্যাডমিন রোল ম্যানেজ করুন</p>
        </div>
        <button onClick={() => { setForm({ email: '', role: 'manager' }); setShowForm(true); }}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Plus size={16} /> রোল দিন
        </button>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.keys(roleConfig) as AppRole[]).map(role => {
          const cfg = roleConfig[role];
          return (
            <div key={role} className={`glass-card rounded-2xl p-5 border ${cfg.bg}`}>
              <div className="flex items-center gap-3 mb-2">
                <cfg.icon size={18} className={cfg.color} />
                <span className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{counts[role]}</div>
              <div className="text-xs text-muted-foreground mt-1">{cfg.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Add Role Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">ইউজারকে রোল দিন</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ইউজার ইমেইল *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                    placeholder="user@example.com"
                    className="w-full bg-muted/30 border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">রোল *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as AppRole })}
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                  <option value="admin">Admin — সম্পূর্ণ এক্সেস</option>
                  <option value="manager">Manager — অর্ডার ও প্রোডাক্ট</option>
                  <option value="user">User — সাধারণ</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground">বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                  {saving ? 'দেওয়া হচ্ছে...' : 'রোল দিন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roles Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <h3 className="font-semibold text-foreground flex-1">সব রোল</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="সার্চ করুন..."
              className="bg-muted/30 border border-border rounded-xl pl-10 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors w-48" />
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-muted/20 rounded-xl" />)}
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            <Shield size={32} className="mx-auto mb-3 opacity-30" />
            কোনো রোল নেই
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredRoles.map((item) => {
              const profile = getProfile(item.user_id);
              const cfg = roleConfig[item.role as AppRole] || roleConfig.user;
              return (
                <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <cfg.icon size={15} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{profile?.display_name || profile?.email || item.user_id.slice(0, 8) + '...'}</div>
                    <div className="text-xs text-muted-foreground">{profile?.email || ''}</div>
                  </div>
                  <select value={item.role} onChange={e => handleUpdateRole(item.id, e.target.value as AppRole)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${cfg.bg} ${cfg.color} focus:outline-none cursor-pointer`}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoles;
