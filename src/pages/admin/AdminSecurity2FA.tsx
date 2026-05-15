import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdmin2FA, setStoredToken, getStoredToken } from '@/hooks/useAdmin2FA';
import { ShieldCheck, ShieldAlert, Copy, KeyRound, Loader2, AlertTriangle, RefreshCw, MailCheck, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';

const AdminSecurity2FA = () => {
  const { status, setup, enable, disable, sendEmailOtp, reset, regenerateBackupCodes } = useAdmin2FA();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isForced = params.get('force') === '1';

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  // Setup flow
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [enabling, setEnabling] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // Disable flow
  const [disableCode, setDisableCode] = useState('');
  const [disabling, setDisabling] = useState(false);

  // Reset flow (lost authenticator)
  const [resetMode, setResetMode] = useState(false);
  const [resetEmailCode, setResetEmailCode] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetSentInfo, setResetSentInfo] = useState('');
  const [resetting, setResetting] = useState(false);

  // Regenerate backup codes flow
  const [regenMode, setRegenMode] = useState(false);
  const [regenCode, setRegenCode] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await status();
      setEnabled(!!r?.enabled);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const handleStartSetup = async () => {
    try {
      const r = await setup();
      setSetupData({ secret: r.secret, otpauthUrl: r.otpauthUrl });
      setBackupCodes(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleEnable = async () => {
    if (!setupCode.trim()) return;
    setEnabling(true);
    try {
      const r = await enable(setupCode.trim());
      setBackupCodes(r.backupCodes ?? []);
      if (r?.token) setStoredToken(r.token);
      setEnabled(true);
      setSetupData(null);
      setSetupCode('');
      toast.success('2FA সফলভাবে চালু হয়েছে।');
    } catch (e) {
      toast.error((e as Error).message);
    }
    setEnabling(false);
  };

  const handleDisable = async () => {
    if (!disableCode.trim()) return;
    if (!confirm('আপনি কি নিশ্চিত যে 2FA বন্ধ করতে চান?')) return;
    setDisabling(true);
    try {
      await disable(disableCode.trim());
      setEnabled(false);
      setDisableCode('');
      setStoredToken(null);
      toast.success('2FA বন্ধ করা হয়েছে।');
    } catch (e) {
      toast.error((e as Error).message);
    }
    setDisabling(false);
  };

  const handleSendResetEmail = async () => {
    setResetSending(true);
    setResetSentInfo('');
    try {
      const r = await sendEmailOtp();
      const n = r?.sentTo ?? 0;
      setResetSentInfo(`✉ Reset code sent to ${n} admin email${n === 1 ? '' : 's'}. Expires in 10 minutes.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setResetSending(false);
  };

  const handleConfirmReset = async () => {
    if (!confirm('This will erase the current Authenticator setup and let you scan a new QR. Continue?')) return;
    setResetting(true);
    try {
      const sessionToken = getStoredToken() || undefined;
      const codeInput = resetEmailCode.trim() || undefined;
      await reset({ token: sessionToken, code: codeInput });
      toast.success('Authenticator reset. Scan the new QR below.');
      setEnabled(false);
      setResetMode(false);
      setResetEmailCode('');
      setResetSentInfo('');
      const r = await setup();
      setSetupData({ secret: r.secret, otpauthUrl: r.otpauthUrl });
      setBackupCodes(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setResetting(false);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied'));
  };

  const handleRegenerate = async () => {
    if (!confirm('This will invalidate your old backup codes and generate 8 new ones. Continue?')) return;
    setRegenerating(true);
    try {
      const sessionToken = getStoredToken() || undefined;
      const codeInput = regenCode.trim() || undefined;
      const r = await regenerateBackupCodes({ token: sessionToken, code: codeInput });
      setBackupCodes(r.backupCodes ?? []);
      setRegenMode(false);
      setRegenCode('');
      toast.success('New backup codes generated.');
    } catch (e) {
      toast.error((e as Error).message);
    }
    setRegenerating(false);
  };

  const printBackupCodes = (codes: string[]) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Admin 2FA Backup Codes</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:40px;max-width:600px;margin:auto;color:#111}
  h1{font-size:20px;margin-bottom:4px}
  .meta{color:#555;font-size:13px;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;border:1px solid #ddd;border-radius:12px;padding:20px;background:#fafafa}
  .code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:16px;letter-spacing:1px;padding:8px 12px;background:#fff;border:1px dashed #bbb;border-radius:8px;text-align:center}
  .warn{margin-top:24px;padding:12px;background:#fff7e6;border:1px solid #f0c674;border-radius:8px;font-size:13px;color:#8a5a00}
  .footer{margin-top:24px;font-size:11px;color:#888;text-align:center}
</style></head><body>
<h1>Shahed Store — Admin 2FA Backup Codes</h1>
<div class="meta">Generated: ${new Date().toLocaleString()}</div>
<div class="grid">${codes.map(c => `<div class="code">${c}</div>`).join('')}</div>
<div class="warn">⚠ Each code can be used only once. Keep this page in a safe place. Anyone with these codes can bypass your authenticator.</div>
<div class="footer">Shahed Store Admin Panel</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`;
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) { toast.error('Popup blocked. Allow popups to print.'); return; }
    w.document.write(html);
    w.document.close();
  };

  const downloadBackupCodes = (codes: string[]) => {
    const text = `Shahed Store — Admin 2FA Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${codes.join('\n')}\n\nEach code is single-use. Keep safe.\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-2fa-backup-codes-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const qrUrl = setupData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(setupData.otpauthUrl)}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="admin-glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          {enabled ? (
            <ShieldCheck className="text-emerald-500" />
          ) : (
            <ShieldAlert className="text-amber-500" />
          )}
          <h1 className="text-xl font-bold">Two-Factor Authentication</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Protect the admin panel with Google Authenticator. After your password, you'll need a 6-digit code from your phone.
        </p>
        {isForced && !enabled && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex gap-2 text-sm">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
            <span>2FA setup is required to access the admin dashboard. Please complete enrollment below.</span>
          </div>
        )}
      </div>

      {/* Enabled status */}
      {enabled && !backupCodes && (
        <div className="admin-glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
            <ShieldCheck size={18} /> 2FA is currently <span className="underline">enabled</span>
          </div>
          <div className="border-t border-border/50 pt-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2"><AlertTriangle size={14} className="text-destructive" /> Disable 2FA</p>
            <p className="text-xs text-muted-foreground">Enter your current 6-digit code (or a backup code) to disable.</p>
            <div className="flex gap-2">
              <input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="123456"
                className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm font-mono"
              />
              <button
                onClick={handleDisable}
                disabled={disabling}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {disabling ? 'Disabling…' : 'Disable'}
              </button>
            </div>
          </div>

          {/* Reset / Lost Authenticator */}
          <div className="border-t border-border/50 pt-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <RefreshCw size={14} className="text-primary" /> Lost your Authenticator?
            </p>
            <p className="text-xs text-muted-foreground">
              Reset the current setup and scan a new QR code. Authorized either by your active admin
              session, or by a fresh email verification code sent to all admins.
            </p>

            {!resetMode ? (
              <button
                onClick={() => setResetMode(true)}
                className="px-4 py-2 border border-primary/40 text-primary rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/10"
              >
                <RefreshCw size={14} /> Reset Authenticator
              </button>
            ) : (
              <div className="space-y-3 bg-muted/30 border border-border rounded-xl p-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSendResetEmail}
                    disabled={resetSending}
                    className="px-3 py-2 border border-border rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <MailCheck size={13} /> {resetSending ? 'Sending…' : 'Email me a reset code'}
                  </button>
                </div>
                {resetSentInfo && (
                  <div className="text-xs text-primary bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">{resetSentInfo}</div>
                )}
                <input
                  value={resetEmailCode}
                  onChange={(e) => setResetEmailCode(e.target.value)}
                  placeholder="Email code (optional if logged-in session is valid)"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmReset}
                    disabled={resetting}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    {resetting ? 'Resetting…' : 'Confirm Reset & Show New QR'}
                  </button>
                  <button
                    onClick={() => { setResetMode(false); setResetEmailCode(''); setResetSentInfo(''); }}
                    className="px-4 py-2 border border-border rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backup codes (one-time display) */}
      {backupCodes && (
        <div className="admin-glass-card p-6 rounded-2xl space-y-3">
          <h2 className="font-bold text-lg flex items-center gap-2"><KeyRound size={18} /> Backup Codes</h2>
          <p className="text-xs text-muted-foreground">
            ⚠ Save these codes somewhere safe. Each code works only once if you lose access to your authenticator.
            They will <strong>not</strong> be shown again.
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-muted/40 p-4 rounded-xl">
            {backupCodes.map((c) => <div key={c}>{c}</div>)}
          </div>
          <div className="flex gap-2">
            <button onClick={() => copy(backupCodes.join('\n'))} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-1.5">
              <Copy size={14} /> Copy All
            </button>
            <button onClick={() => { setBackupCodes(null); navigate('/ceo'); }} className="px-3 py-2 border border-border rounded-lg text-sm">
              I've Saved Them
            </button>
          </div>
        </div>
      )}

      {/* Setup flow */}
      {!enabled && !setupData && (
        <div className="admin-glass-card p-6 rounded-2xl space-y-3">
          <p className="text-sm">Click below to generate your secret and QR code.</p>
          <button onClick={handleStartSetup} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
            Start Setup
          </button>
        </div>
      )}

      {!enabled && setupData && (
        <div className="admin-glass-card p-6 rounded-2xl space-y-4">
          <h2 className="font-bold">Step 1 — Scan QR with Google Authenticator</h2>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {qrUrl && (
              <img src={qrUrl} alt="2FA QR Code" className="w-56 h-56 rounded-xl border border-border bg-white p-2" />
            )}
            <div className="flex-1 space-y-2 w-full">
              <p className="text-xs text-muted-foreground">Or enter this secret manually:</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted/40 px-3 py-2 rounded-lg text-xs font-mono break-all">{setupData.secret}</code>
                <button onClick={() => copy(setupData.secret)} className="p-2 border border-border rounded-lg"><Copy size={14} /></button>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4 space-y-2">
            <h2 className="font-bold">Step 2 — Enter the 6-digit code</h2>
            <div className="flex gap-2">
              <input
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value)}
                placeholder="123456"
                className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-base font-mono tracking-widest text-center"
                autoFocus
              />
              <button
                onClick={handleEnable}
                disabled={enabling || setupCode.length < 6}
                className="px-5 py-2 btn-glow rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {enabling ? 'Enabling…' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecurity2FA;
