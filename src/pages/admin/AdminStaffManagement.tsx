import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Plus, Trash2, Crown, User, Search, Mail, Key, Eye, EyeOff, Users, UserPlus, Lock, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { handleDbError } from '@/lib/errorHandler';

type AppRole = 'admin' | 'manager' | 'user';

const roleConfig: Record<AppRole, { label: string; color: string; bg: string; icon: typeof Shield; desc: string; permissions: string[] }> = {
  admin: {
    label: 'Admin',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/30',
    icon: Crown,
    desc: 'সম্পূর্ণ এক্সেস — সবকিছু ম্যানেজ করতে পারবে',
    permissions: ['অর্ডার ম্যানেজমেন্ট', 'প্রোডাক্ট ম্যানেজমেন্ট', 'কাস্টমার ম্যানেজমেন্ট', 'সেটিংস', 'রিপোর্ট', 'স্টাফ ম্যানেজমেন্ট', 'পেমেন্ট', 'ব্যাকআপ'],
  },
  manager: {
    label: 'Manager',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/30',
    icon: Shield,
    desc: 'অর্ডার ও প্রোডাক্ট ম্যানেজ করতে পারবে',
    permissions: ['অর্ডার ম্যানেজমেন্ট', 'প্রোডাক্ট ম্যানেজমেন্ট', 'কাস্টমার ভিউ', 'রিপোর্ট ভিউ'],
  },
  user: {
    label: 'User',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/30',
    icon: User,
    desc: 'সাধারণ ব্যবহারকারী — শুধু নিজের ডেটা দেখতে পারবে',
    permissions: ['নিজের অর্ডার দেখা', 'নিজের প্রোফাইল এডিট'],
  },
};

const AdminStaffManagement = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'existing' | 'new'>('existing');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);

  // Existing user form
  const [emailForm, setEmailForm] = useState({ email: '', role: 'manager' as AppRole });

  // New user form
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', display_name: '', phone: '', role: 'manager' as AppRole });
  const [showPassword, setShowPassword] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [rolesRes, profilesRes] = await Promise.all([
      supabase.from('user_roles').select('*'),
      supabase.from('profiles').select('*'),
    ]);
    setRoles(rolesRes.data || []);
    setProfiles(profilesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  const handleAddExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const profile = profiles.find(p => p.email?.toLowerCase() === emailForm.email.toLowerCase());
    if (!profile) {
      toast.error('এই ইমেইলে কোনো ইউজার পাওয়া যায়নি');
      setSaving(false);
      return;
    }
    const existing = roles.find(r => r.user_id === profile.user_id && r.role === emailForm.role);
    if (existing) {
      toast.error('এই রোল ইতোমধ্যে আছে');
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('user_roles').insert({ user_id: profile.user_id, role: emailForm.role });
    if (error) toast.error(handleDbError(error));
    else { toast.success('স্টাফ যোগ করা হয়েছে!'); setShowAddModal(false); fetchData(); }
    setSaving(false);
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: {
          action: 'create_user',
          email: newUserForm.email,
          password: newUserForm.password,
          display_name: newUserForm.display_name,
          phone: newUserForm.phone,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || 'অ্যাকাউন্ট তৈরি ব্যর্থ');
        setSaving(false);
        return;
      }
      // Add role
      if (data?.user_id && newUserForm.role !== 'user') {
        await supabase.from('user_roles').insert({ user_id: data.user_id, role: newUserForm.role });
      }
      toast.success('নতুন স্টাফ অ্যাকাউন্ট তৈরি হয়েছে!');
      setShowAddModal(false);
      setNewUserForm({ email: '', password: '', display_name: '', phone: '', role: 'manager' });
      fetchData();
    } catch {
      toast.error('অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, userId: string) => {
    if (!confirm('এই স্টাফের রোল সরিয়ে দেবেন?')) return;
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) toast.error(handleDbError(error));
    else { toast.success('রোল সরানো হয়েছে'); fetchData(); }
  };

  const handleUpdateRole = async (id: string, newRole: AppRole) => {
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('id', id);
    if (error) toast.error(handleDbError(error));
    else { toast.success('রোল আপডেট হয়েছে'); fetchData(); }
  };

  // Filter staff (admin + manager only)
  const staffRoles = roles.filter(r => r.role === 'admin' || r.role === 'manager');
  const filteredStaff = staffRoles.filter(r => {
    const profile = getProfile(r.user_id);
    const email = profile?.email || '';
    const name = profile?.display_name || '';
    return email.includes(search) || name.includes(search);
  });

  const counts = { admin: 0, manager: 0 };
  staffRoles.forEach(r => { if (counts[r.role as keyof typeof counts] !== undefined) counts[r.role as keyof typeof counts]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Staff <span className="gradient-text">Management</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">স্টাফ অ্যাকাউন্ট ও পারমিশন ম্যানেজ করুন</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setAddMode('existing'); }}
          className="btn-glow px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <UserPlus size={16} /> স্টাফ যোগ করুন
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card-hover rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users size={16} className="text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{staffRoles.length}</div>
          <div className="text-xs text-muted-foreground mt-1">মোট স্টাফ</div>
        </div>
        <div className="glass-card-hover rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-red-400/10 flex items-center justify-center">
              <Crown size={16} className="text-red-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{counts.admin}</div>
          <div className="text-xs text-muted-foreground mt-1">Admin</div>
        </div>
        <div className="glass-card-hover rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center">
              <Shield size={16} className="text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{counts.manager}</div>
          <div className="text-xs text-muted-foreground mt-1">Manager</div>
        </div>
      </div>

      {/* Permission Matrix */}
      {selectedRole && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Lock size={15} className="text-primary" />
              {roleConfig[selectedRole].label} পারমিশন
            </h3>
            <button onClick={() => setSelectedRole(null)} className="text-xs text-muted-foreground hover:text-foreground">বন্ধ করুন</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {roleConfig[selectedRole].permissions.map(p => (
              <div key={p} className="flex items-center gap-2 text-xs text-foreground bg-muted/20 rounded-lg px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Permission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['admin', 'manager', 'user'] as AppRole[]).map(role => {
          const cfg = roleConfig[role];
          return (
            <button key={role} onClick={() => setSelectedRole(selectedRole === role ? null : role)}
              className={`glass-card rounded-2xl p-4 text-left transition-all hover:scale-[1.02] border ${selectedRole === role ? cfg.bg : 'border-transparent'}`}>
              <div className="flex items-center gap-2 mb-2">
                <cfg.icon size={16} className={cfg.color} />
                <span className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{cfg.desc}</p>
              <p className="text-xs text-muted-foreground/60 mt-2">{cfg.permissions.length} পারমিশন — ক্লিক করে দেখুন</p>
            </button>
          );
        })}
      </div>

      {/* Staff List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <h3 className="font-semibold text-foreground flex-1">স্টাফ তালিকা</h3>
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="সার্চ..."
              className="bg-muted/30 border border-border rounded-xl pl-14 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors w-48" />
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-muted/20 rounded-xl" />)}
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            কোনো স্টাফ নেই
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredStaff.map(item => {
              const profile = getProfile(item.user_id);
              const cfg = roleConfig[item.role as AppRole] || roleConfig.user;
              return (
                <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <cfg.icon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{profile?.display_name || profile?.email || item.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{profile?.email || ''}</div>
                  </div>
                  <select value={item.role} onChange={e => handleUpdateRole(item.id, e.target.value as AppRole)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${cfg.bg} ${cfg.color} focus:outline-none cursor-pointer`}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                  <button onClick={() => handleDelete(item.id, item.user_id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">স্টাফ যোগ করুন</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-5">
              <button onClick={() => setAddMode('existing')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${addMode === 'existing' ? 'btn-glow' : 'glass-card text-muted-foreground'}`}>
                বিদ্যমান ইউজার
              </button>
              <button onClick={() => setAddMode('new')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${addMode === 'new' ? 'btn-glow' : 'glass-card text-muted-foreground'}`}>
                নতুন অ্যাকাউন্ট
              </button>
            </div>

            {addMode === 'existing' ? (
              <form onSubmit={handleAddExisting} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">ইমেইল *</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" value={emailForm.email} onChange={e => setEmailForm({ ...emailForm, email: e.target.value })} required
                      placeholder="user@example.com"
                      className="w-full bg-muted/30 border border-border rounded-xl pl-14 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">রোল *</label>
                  <select value={emailForm.role} onChange={e => setEmailForm({ ...emailForm, role: e.target.value as AppRole })}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                    <option value="admin">Admin — সম্পূর্ণ এক্সেস</option>
                    <option value="manager">Manager — অর্ডার ও প্রোডাক্ট</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground">বাতিল</button>
                  <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                    {saving ? 'যোগ হচ্ছে...' : 'স্টাফ যোগ করুন'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddNew} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">নাম</label>
                  <input type="text" value={newUserForm.display_name} onChange={e => setNewUserForm({ ...newUserForm, display_name: e.target.value })}
                    placeholder="স্টাফের নাম"
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">ইমেইল *</label>
                  <input type="email" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} required
                    placeholder="staff@example.com"
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">পাসওয়ার্ড *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={newUserForm.password}
                      onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} required minLength={6}
                      placeholder="ন্যূনতম ৬ অক্ষর"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground focus:outline-none focus:border-primary" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">ফোন</label>
                  <input type="text" value={newUserForm.phone} onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">রোল *</label>
                  <select value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as AppRole })}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                    <option value="admin">Admin — সম্পূর্ণ এক্সেস</option>
                    <option value="manager">Manager — অর্ডার ও প্রোডাক্ট</option>
                  </select>
                </div>
                <div className="bg-green-400/10 border border-green-400/30 rounded-xl p-3 flex items-center gap-2">
                  <Shield size={14} className="text-green-400" />
                  <span className="text-xs text-green-400">ইমেইল ভেরিফিকেশন ছাড়াই অ্যাকাউন্ট সরাসরি অ্যাক্টিভ হবে</span>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 glass-card py-2.5 rounded-xl text-sm text-muted-foreground">বাতিল</button>
                  <button type="submit" disabled={saving} className="flex-1 btn-glow py-2.5 rounded-xl text-sm font-semibold">
                    {saving ? 'তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffManagement;
