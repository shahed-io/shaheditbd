import { useEffect, useMemo, useState } from 'react';
import { Save, RotateCcw, Palette, FileText, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  loadInvoiceDesign,
  saveInvoiceDesign,
  DEFAULT_INVOICE_DESIGN,
  resolveHeaderTheme,
  resolveTotalColor,
  type InvoiceDesign,
} from '@/lib/invoiceSettings';
import logoIcon from '@/assets/logo.png';

const inputCls =
  'w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors';

const Field = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-muted-foreground/70 mt-1">{hint}</p>}
  </div>
);

const ColorField = ({
  label,
  value,
  onChange,
  allowAuto,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowAuto?: boolean;
}) => {
  const isAuto = value === 'auto';
  return (
    <Field label={label} hint={allowAuto ? 'Set "Auto" to derive automatically from brand color.' : undefined}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isAuto ? '#7c3aed' : value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-lg border border-border bg-transparent cursor-pointer"
        />
        <input
          type="text"
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#7c3aed"
        />
        {allowAuto && (
          <button
            type="button"
            onClick={() => onChange(isAuto ? '#1a1a2e' : 'auto')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              isAuto
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted/30'
            }`}
          >
            Auto
          </button>
        )}
      </div>
    </Field>
  );
};

const AdminInvoiceDesign = () => {
  const [design, setDesign] = useState<InvoiceDesign>(DEFAULT_INVOICE_DESIGN);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoiceDesign(true).then((d) => {
      setDesign(d);
      setJsonText(JSON.stringify(d, null, 2));
      setLoading(false);
    });
  }, []);

  // Keep JSON textarea in sync when fields are edited via UI
  useEffect(() => {
    if (!loading) setJsonText(JSON.stringify(design, null, 2));
  }, [design, loading]);

  const update = <K extends keyof InvoiceDesign>(k: K, v: InvoiceDesign[K]) =>
    setDesign((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const tid = toast.loading('Saving design...');
    try {
      await saveInvoiceDesign(design);
      toast.success('Invoice design saved — applied everywhere.', { id: tid });
    } catch (e: any) {
      toast.error('Failed: ' + (e?.message || 'Unknown'), { id: tid });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('Reset to default design?')) return;
    setDesign(DEFAULT_INVOICE_DESIGN);
    toast.info('Reset (not yet saved). Click Save to apply.');
  };

  const hdr = useMemo(() => resolveHeaderTheme(design), [design]);
  const totalColor = useMemo(() => resolveTotalColor(design), [design]);

  if (loading) {
    return <div className="text-sm text-muted-foreground p-6">Loading design...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Palette size={22} /> Invoice Design Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control colours, branding text and labels for every invoice (preview, PDF & email).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/30 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Design'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Settings */}
        <div className="space-y-5">
          <section className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm text-foreground">🎨 Colors</h2>
            <ColorField label="Brand color" value={design.brandColor} onChange={(v) => update('brandColor', v)} />
            <ColorField label="Brand light tint" value={design.brandLight} onChange={(v) => update('brandLight', v)} />
            <ColorField label="Table header background" value={design.headerBg} onChange={(v) => update('headerBg', v)} allowAuto />
            <ColorField label="Table header text" value={design.headerText} onChange={(v) => update('headerText', v)} />
            <ColorField label="Total amount color" value={design.totalColor} onChange={(v) => update('totalColor', v)} allowAuto />
            <ColorField label="Body dark text" value={design.accentText} onChange={(v) => update('accentText', v)} />
          </section>

          <section className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm text-foreground">🏷️ Layout</h2>
            <Field label={`Card border radius (${design.borderRadius}px)`}>
              <input
                type="range"
                min={0}
                max={24}
                value={design.borderRadius}
                onChange={(e) => update('borderRadius', Number(e.target.value))}
                className="w-full"
              />
            </Field>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={design.showLogo}
                onChange={(e) => update('showLogo', e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">Show company logo</span>
            </label>
          </section>

          <section className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm text-foreground">🏢 Company Info</h2>
            <Field label="Invoice title">
              <input className={inputCls} value={design.invoiceTitle} onChange={(e) => update('invoiceTitle', e.target.value)} />
            </Field>
            <Field label="Company name">
              <input className={inputCls} value={design.companyName} onChange={(e) => update('companyName', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Website"><input className={inputCls} value={design.companyWebsite} onChange={(e) => update('companyWebsite', e.target.value)} /></Field>
              <Field label="Email"><input className={inputCls} value={design.companyEmail} onChange={(e) => update('companyEmail', e.target.value)} /></Field>
              <Field label="Phone"><input className={inputCls} value={design.companyPhone} onChange={(e) => update('companyPhone', e.target.value)} /></Field>
              <Field label="Address"><input className={inputCls} value={design.companyAddress} onChange={(e) => update('companyAddress', e.target.value)} /></Field>
            </div>
            <Field label="Thank-you text">
              <input className={inputCls} value={design.thankYouText} onChange={(e) => update('thankYouText', e.target.value)} />
            </Field>
            <Field label="Footer note">
              <input className={inputCls} value={design.footerNote} onChange={(e) => update('footerNote', e.target.value)} />
            </Field>
          </section>

          <section className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm text-foreground">🔤 Labels</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Billing block"><input className={inputCls} value={design.labelBilling} onChange={(e) => update('labelBilling', e.target.value)} /></Field>
              <Field label="Payment block"><input className={inputCls} value={design.labelPayment} onChange={(e) => update('labelPayment', e.target.value)} /></Field>
              <Field label="Item column"><input className={inputCls} value={design.labelItem} onChange={(e) => update('labelItem', e.target.value)} /></Field>
              <Field label="Qty column"><input className={inputCls} value={design.labelQty} onChange={(e) => update('labelQty', e.target.value)} /></Field>
              <Field label="Price column"><input className={inputCls} value={design.labelPrice} onChange={(e) => update('labelPrice', e.target.value)} /></Field>
              <Field label="Total column"><input className={inputCls} value={design.labelTotal} onChange={(e) => update('labelTotal', e.target.value)} /></Field>
              <Field label="Subtotal row"><input className={inputCls} value={design.labelSubtotal} onChange={(e) => update('labelSubtotal', e.target.value)} /></Field>
              <Field label="Discount row"><input className={inputCls} value={design.labelDiscount} onChange={(e) => update('labelDiscount', e.target.value)} /></Field>
              <Field label="Grand total row"><input className={inputCls} value={design.labelGrandTotal} onChange={(e) => update('labelGrandTotal', e.target.value)} /></Field>
            </div>
          </section>

          {/* Manual JSON editor */}
          <section className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Code2 size={16} /> Manual JSON Editor
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonText);
                      setDesign({ ...DEFAULT_INVOICE_DESIGN, ...parsed });
                      setJsonError(null);
                      toast.success('Applied to preview. Click "Save Design" to persist.');
                    } catch (e: any) {
                      setJsonError(e?.message || 'Invalid JSON');
                      toast.error('Invalid JSON: ' + (e?.message || ''));
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
                >
                  Apply JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJsonText(JSON.stringify(design, null, 2));
                    setJsonError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted/30"
                >
                  Reload
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Edit any value directly. Click "Apply JSON" to push it to the live preview, then "Save Design" to persist.
            </p>
            <textarea
              value={jsonText}
              onChange={(e) => { setJsonText(e.target.value); setJsonError(null); }}
              spellCheck={false}
              rows={16}
              className="w-full font-mono text-xs bg-muted/20 border border-border rounded-xl p-3 text-foreground focus:outline-none focus:border-primary"
            />
            {jsonError && <p className="text-xs text-red-500">⚠️ {jsonError}</p>}
          </section>
        </div>

        {/* RIGHT — Live preview */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
              <FileText size={16} /> Live Preview
            </h2>
            <div className="overflow-auto rounded-xl border border-border">
              <div
                style={{
                  background: '#fff',
                  color: design.accentText,
                  padding: '32px',
                  borderRadius: `${design.borderRadius}px`,
                  fontFamily: "'Segoe UI', 'Noto Sans Bengali', Arial, sans-serif",
                  minWidth: 540,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: `3px solid ${design.brandColor}` }}>
                  <div>
                    {design.showLogo && <img src={logoIcon} alt="logo" style={{ height: 42 }} />}
                    <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>{design.companyName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: design.brandColor, letterSpacing: 2 }}>{design.invoiceTitle}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4, fontFamily: 'monospace' }}>#INV-PREVIEW-001</div>
                  </div>
                </div>

                {/* Two cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                  <div style={{ background: design.brandLight, borderRadius: design.borderRadius - 2, padding: 14, borderLeft: `4px solid ${design.brandColor}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: design.brandColor, letterSpacing: 1.4, marginBottom: 8 }}>{design.labelBilling}</div>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Sample Customer</p>
                    <p style={{ fontSize: 11, color: '#555', margin: '4px 0 0' }}>✉️ customer@example.com</p>
                  </div>
                  <div style={{ background: design.brandLight, borderRadius: design.borderRadius - 2, padding: 14, borderLeft: `4px solid ${design.brandColor}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: design.brandColor, letterSpacing: 1.4, marginBottom: 8 }}>{design.labelPayment}</div>
                    <div style={{ fontSize: 11, color: '#555' }}>Method: <strong style={{ color: design.accentText }}>BKash</strong></div>
                    <div style={{ fontSize: 11, marginTop: 6 }}>
                      <span style={{ background: design.brandColor, color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>PAID</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, borderRadius: 8, overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: hdr.bg }}>
                      <th style={{ background: hdr.bg, color: hdr.text, padding: 12, fontSize: 12, fontWeight: 700, textAlign: 'left' }}>#</th>
                      <th style={{ background: hdr.bg, color: hdr.text, padding: 12, fontSize: 12, fontWeight: 700, textAlign: 'left' }}>{design.labelItem}</th>
                      <th style={{ background: hdr.bg, color: hdr.text, padding: 12, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{design.labelQty}</th>
                      <th style={{ background: hdr.bg, color: hdr.text, padding: 12, fontSize: 12, fontWeight: 700, textAlign: 'right' }}>{design.labelPrice}</th>
                      <th style={{ background: hdr.bg, color: hdr.text, padding: 12, fontSize: 12, fontWeight: 700, textAlign: 'right' }}>{design.labelTotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { n: 'Demo Product A', q: 1, p: 1200 },
                      { n: 'Demo Product B', q: 2, p: 800 },
                    ].map((it, i) => (
                      <tr key={i} style={{ background: i % 2 ? '#faf9ff' : '#fff', borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: 10, fontSize: 12 }}>{i + 1}</td>
                        <td style={{ padding: 10, fontSize: 12, fontWeight: 500 }}>{it.n}</td>
                        <td style={{ padding: 10, fontSize: 12, textAlign: 'center' }}>×{it.q}</td>
                        <td style={{ padding: 10, fontSize: 12, textAlign: 'right' }}>৳{it.p.toLocaleString()}</td>
                        <td style={{ padding: 10, fontSize: 12, fontWeight: 700, textAlign: 'right' }}>৳{(it.q * it.p).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ minWidth: 240, background: design.brandLight, padding: 14, borderRadius: design.borderRadius - 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 6 }}>
                      <span>{design.labelSubtotal}:</span><span>৳2,800</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#059669', marginBottom: 6 }}>
                      <span>{design.labelDiscount}:</span><span>-৳200</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: totalColor, borderTop: `2px solid ${design.brandColor}`, paddingTop: 8, marginTop: 6 }}>
                      <span>{design.labelGrandTotal}:</span><span>৳2,600</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 22, textAlign: 'center', paddingTop: 14, borderTop: `2px solid ${design.brandLight}` }}>
                  <div style={{ fontSize: 12, color: '#666' }}>{design.thankYouText}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                    {design.companyWebsite && `🌐 ${design.companyWebsite}`}
                    {design.companyEmail && `  •  ✉️ ${design.companyEmail}`}
                    {design.companyPhone && `  •  📞 ${design.companyPhone}`}
                  </div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 6 }}>{design.footerNote}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceDesign;
