import { useState } from 'react';
import { useTheme, ThemeId, ThemeInfo } from '@/hooks/useTheme';
import { Palette, Check, Monitor } from 'lucide-react';
import { toast } from 'sonner';

const ThemeCard = ({ theme, isActive, onSelect, isPreviewing }: {
  theme: ThemeInfo;
  isActive: boolean;
  onSelect: () => void;
  isPreviewing: boolean;
}) => (
  <button
    onClick={onSelect}
    className={`relative group text-left rounded-2xl border-2 p-5 transition-all duration-300 ${
      isActive
        ? 'border-primary ring-2 ring-primary/30 shadow-lg'
        : 'border-border hover:border-primary/40 hover:shadow-md'
    } bg-card`}
  >
    {isActive && (
      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
        <Check className="w-4 h-4 text-primary-foreground" />
      </div>
    )}
    {isPreviewing && !isActive && (
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
        প্রিভিউ
      </div>
    )}

    {/* Color Preview */}
    <div className="flex gap-2 mb-4">
      <div className="w-12 h-12 rounded-xl shadow-sm border border-black/5" style={{ background: theme.preview.bg }} />
      <div className="w-12 h-12 rounded-xl shadow-sm" style={{ background: theme.preview.primary }} />
      <div className="w-12 h-12 rounded-xl shadow-sm" style={{ background: theme.preview.accent }} />
      <div className="w-12 h-12 rounded-xl shadow-sm" style={{ background: theme.preview.text }} />
    </div>

    {/* Mini Preview */}
    <div className="rounded-xl overflow-hidden border border-black/10 mb-4" style={{ background: theme.preview.bg }}>
      <div className="h-2.5" style={{ background: theme.preview.primary }} />
      <div className="p-3 space-y-2">
        <div className="h-2 w-3/4 rounded" style={{ background: theme.preview.text, opacity: 0.7 }} />
        <div className="h-2 w-1/2 rounded" style={{ background: theme.preview.text, opacity: 0.4 }} />
        <div className="flex gap-2 mt-2">
          <div className="h-6 w-16 rounded-md" style={{ background: theme.preview.primary }} />
          <div className="h-6 w-16 rounded-md" style={{ background: theme.preview.accent }} />
        </div>
      </div>
    </div>

    <h3 className="text-lg font-bold text-foreground">{theme.nameBn}</h3>
    <p className="text-xs text-muted-foreground font-medium">{theme.name}</p>
    <p className="text-sm text-muted-foreground mt-1">{theme.description}</p>
  </button>
);

const AdminThemes = () => {
  const { activeTheme, saveTheme, applyTheme, themes } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<ThemeId | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePreview = (themeId: ThemeId) => {
    setPreviewTheme(themeId);
    applyTheme(themeId);
  };

  const handleSave = async (themeId: ThemeId) => {
    setSaving(true);
    await saveTheme(themeId);
    setPreviewTheme(null);
    toast.success(`"${themes.find(t => t.id === themeId)?.nameBn}" থিম সেট করা হয়েছে!`);
    setSaving(false);
  };

  const handleCancel = () => {
    if (previewTheme) {
      applyTheme(activeTheme);
      setPreviewTheme(null);
    }
  };

  const currentDisplay = previewTheme || activeTheme;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">থিম ম্যানেজার</h1>
            <p className="text-sm text-muted-foreground">
              ওয়েবসাইটের থিম পরিবর্তন করুন — ক্লিক করে প্রিভিউ দেখুন
            </p>
          </div>
        </div>
        {previewTheme && previewTheme !== activeTheme && (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition"
            >
              বাতিল
            </button>
            <button
              onClick={() => handleSave(previewTheme)}
              disabled={saving}
              className="px-5 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'সেভ হচ্ছে...' : 'এই থিম সেট করুন'}
            </button>
          </div>
        )}
      </div>

      {/* Active Theme Banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
        <Monitor className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-foreground">
          বর্তমান থিম: <strong>{themes.find(t => t.id === activeTheme)?.nameBn}</strong>
        </span>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {themes.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={activeTheme === theme.id}
            isPreviewing={previewTheme === theme.id}
            onSelect={() => {
              if (theme.id === activeTheme && !previewTheme) return;
              if (theme.id === activeTheme && previewTheme) {
                handleCancel();
              } else {
                handlePreview(theme.id);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminThemes;
