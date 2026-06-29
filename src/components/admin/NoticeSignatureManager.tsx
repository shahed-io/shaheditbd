// Admin — manage the default signature applied to every notice.
// Supports: upload a signature image, or generate one with AI. Also stores
// the default Signed By / Signed Role so notices auto-fill them.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Sparkles, Upload, Trash2, PenLine, Save } from 'lucide-react';
import {
  loadNoticeSignature, saveNoticeSignature, fileToSignatureDataUrl,
  type NoticeSignature, DEFAULT_NOTICE_SIGNATURE,
} from '@/lib/noticeSignature';

interface Props {
  onChanged?: (sig: NoticeSignature) => void;
}

export default function NoticeSignatureManager({ onChanged }: Props) {
  const [sig, setSig] = useState<NoticeSignature>(DEFAULT_NOTICE_SIGNATURE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiStyle, setAiStyle] = useState('elegant cursive');

  useEffect(() => {
    loadNoticeSignature(true).then((s) => { setSig(s); setLoading(false); });
  }, []);

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('শুধু image upload করুন'); return; }
    try {
      const dataUrl = await fileToSignatureDataUrl(file, 600);
      setSig((p) => ({ ...p, imageDataUrl: dataUrl }));
      toast.success('Signature image যোগ হয়েছে — Save করুন');
    } catch (e: any) {
      toast.error(e?.message || 'Image load ব্যর্থ');
    }
  };

  const handleAI = async () => {
    setAiBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('ai-generate-signature', {
        body: { name: sig.signedBy || 'Shahed Store Authority', style: aiStyle },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.dataUrl) throw new Error('AI did not return image');
      setSig((p) => ({ ...p, imageDataUrl: data.dataUrl }));
      toast.success('AI signature তৈরি হয়েছে — Save করুন');
    } catch (e: any) {
      toast.error(e?.message || 'AI signature ব্যর্থ');
    } finally {
      setAiBusy(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveNoticeSignature(sig);
      toast.success('Signature settings save হয়েছে');
      onChanged?.(sig);
    } catch (e: any) {
      toast.error(e?.message || 'Save ব্যর্থ');
    } finally {
      setSaving(false);
    }
  };

  const clearImage = () => setSig((p) => ({ ...p, imageDataUrl: '' }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PenLine className="w-4 h-4" /> Notice Signature (default for all notices)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-4 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Signed By</Label>
                <Input value={sig.signedBy}
                       onChange={(e) => setSig((p) => ({ ...p, signedBy: e.target.value }))} />
              </div>
              <div>
                <Label>Signed Role</Label>
                <Input value={sig.signedRole}
                       onChange={(e) => setSig((p) => ({ ...p, signedRole: e.target.value }))} />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Signature Image Preview</div>
              <div className="bg-white border rounded p-4 flex items-center justify-center min-h-[110px]">
                {sig.imageDataUrl ? (
                  <img src={sig.imageDataUrl} alt="Signature"
                       style={{ maxHeight: 90, maxWidth: 320, mixBlendMode: 'multiply' }} />
                ) : (
                  <div className="text-xs text-muted-foreground italic">কোনো signature নেই — upload করুন বা AI দিয়ে তৈরি করুন</div>
                )}
              </div>
              {sig.imageDataUrl && (
                <Button size="sm" variant="ghost" onClick={clearImage} className="mt-2 text-red-600">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove image
                </Button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {/* Upload */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Upload className="w-4 h-4" /> Upload signature
                </div>
                <p className="text-xs text-muted-foreground mb-2">PNG/JPG — transparent background সবচেয়ে ভাল।</p>
                <Input type="file" accept="image/*"
                       onChange={(e) => handleUpload(e.target.files?.[0])} />
              </div>
              {/* AI */}
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Sparkles className="w-4 h-4" /> Generate with AI
                </div>
                <div className="flex gap-2">
                  <Select value={aiStyle} onValueChange={setAiStyle}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elegant cursive">Elegant cursive</SelectItem>
                      <SelectItem value="bold executive">Bold executive</SelectItem>
                      <SelectItem value="formal calligraphy">Formal calligraphy</SelectItem>
                      <SelectItem value="modern minimal">Modern minimal</SelectItem>
                      <SelectItem value="quick scribble">Quick scribble</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAI} disabled={aiBusy} className="gap-1">
                    {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  AI "{sig.signedBy || 'name'}" এর জন্য signature তৈরি করবে।
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save signature settings
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
