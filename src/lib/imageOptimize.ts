/**
 * Serves smaller/optimized versions of Supabase Storage images by routing
 * them through the built-in image transformation endpoint. Non-Supabase
 * URLs are returned unchanged.
 */
export const optimizeImage = (
  url: string | undefined | null,
  width = 400,
  quality = 70
): string => {
  if (!url) return url || '';
  if (url.includes('/storage/v1/object/public/')) {
    const transformed = url.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );
    const sep = transformed.includes('?') ? '&' : '?';
    return `${transformed}${sep}width=${width}&quality=${quality}`;
  }
  return url;
};

/** Build a `srcset` string for 1x/2x retina from a Supabase Storage URL. */
export const optimizeImageSrcSet = (
  url: string | undefined | null,
  width = 400,
  quality = 70
): string | undefined => {
  if (!url || !url.includes('/storage/v1/object/public/')) return undefined;
  return `${optimizeImage(url, width, quality)} 1x, ${optimizeImage(url, width * 2, quality)} 2x`;
};
