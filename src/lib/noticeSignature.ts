// Notice signature settings — single global default signature applied to every notice.
// Stored in `site_settings` key `notice_signature`. Image is kept as a base64 data URL
// so we don't need a public storage bucket.
import { supabase } from '@/integrations/supabase/client';

export interface NoticeSignature {
  imageDataUrl: string;        // base64 png/jpg — '' when not configured
  signedBy: string;
  signedRole: string;
}

export const DEFAULT_NOTICE_SIGNATURE: NoticeSignature = {
  imageDataUrl: '',
  signedBy: 'Shahed Store Authority',
  signedRole: 'Management',
};

let cache: NoticeSignature | null = null;

function parse(raw: any): Partial<NoticeSignature> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
}

export async function loadNoticeSignature(force = false): Promise<NoticeSignature> {
  if (!force && cache) return cache;
  try {
    const { data } = await supabase
      .from('site_settings').select('value')
      .eq('key', 'notice_signature').maybeSingle();
    cache = { ...DEFAULT_NOTICE_SIGNATURE, ...parse(data?.value) };
  } catch {
    cache = DEFAULT_NOTICE_SIGNATURE;
  }
  return cache!;
}

export async function saveNoticeSignature(sig: NoticeSignature): Promise<void> {
  const clean = JSON.parse(JSON.stringify(sig)) as NoticeSignature;
  const { error } = await supabase.from('site_settings').upsert(
    { key: 'notice_signature', value: clean as any, category: 'notice' },
    { onConflict: 'key' }
  );
  if (error) throw error;
  cache = clean;
}

export function clearNoticeSignatureCache() { cache = null; }

/** Resize/compress an uploaded image to a manageable PNG data URL */
export async function fileToSignatureDataUrl(file: File, maxWidth = 600): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Could not read file'));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Invalid image'));
    i.src = dataUrl;
  });
  const ratio = Math.min(1, maxWidth / img.width);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/png');
}
