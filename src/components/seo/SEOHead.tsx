import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogImages?: string[];
  ogImageAlt?: string;
  ogType?: 'website' | 'article' | 'product';
  canonical?: string;
  noIndex?: boolean;
  schema?: object | object[];
  keywords?: string;
  /** Pagination (helps Google understand series of pages) */
  prevUrl?: string;
  nextUrl?: string;
  /** Article-specific (blog posts) */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

const SITE_NAME = 'Shahed Store';
const SITE_URL = 'https://shahedstore.com.bd';
const SUPABASE_STORAGE_ORIGIN = 'https://dpvdavjwqyviredzoorj.supabase.co';
const SUPABASE_STORAGE_PUBLIC_PATH = '/storage/v1/object/public/';
const DEFAULT_DESC = 'Shahed Store is a digital software store in Bangladesh offering Windows, Microsoft Office, Adobe, VPN and other digital subscriptions with fast delivery and customer support.';
const DEFAULT_OG = '/og-image.jpg';
const DEFAULT_KEYWORDS = 'windows 11 key bangladesh, microsoft office 365 bangladesh, adobe creative cloud bangladesh, antivirus cheap, buy digital software bangladesh, digital license key, Shahed Store';

// Cache for GA/GSC/Clarity settings so we only fetch once per session
let _seoCache: { ga?: string; gsc?: string; clarity?: string; verification?: Record<string, string>; loaded?: boolean } = {};

const VERIFICATION_META: Record<string, string> = {
  google: 'google-site-verification',
  bing: 'msvalidate.01',
  yandex: 'yandex-verification',
  pinterest: 'p:domain_verify',
  facebook: 'facebook-domain-verification',
  baidu: 'baidu-site-verification',
  norton: 'norton-safeweb-site-verification',
  ahrefs: 'ahrefs-site-verification',
  semrush: 'semrush-verification',
};

const injectVerificationTags = (verif: Record<string, string>) => {
  Object.entries(verif).forEach(([key, value]) => {
    const metaName = VERIFICATION_META[key];
    if (!metaName || !value) return;
    if (document.querySelector(`meta[name="${metaName}"]`)) return;
    const m = document.createElement('meta');
    m.name = metaName;
    m.content = value;
    document.head.appendChild(m);
  });
};

const normalizeSeoAssetUrl = (url: string) => {
  if (url.startsWith(`${SUPABASE_STORAGE_ORIGIN}${SUPABASE_STORAGE_PUBLIC_PATH}`)) {
    return url.replace(SUPABASE_STORAGE_ORIGIN, SITE_URL);
  }
  if (url.startsWith(SUPABASE_STORAGE_PUBLIC_PATH)) return `${SITE_URL}${url}`;
  if (url.startsWith('http')) return url;
  return `${SITE_URL}${url}`;
};

const SEOHead = ({
  title,
  description = DEFAULT_DESC,
  ogImage = DEFAULT_OG,
  ogImages,
  ogImageAlt,
  ogType = 'website',
  canonical,
  noIndex = false,
  schema,
  keywords,
  prevUrl,
  nextUrl,
  article,
}: SEOHeadProps) => {
  const { pathname, search } = useLocation();

  // Canonical normalization:
  // 1. Always strip query strings (prevents duplicate content from utm_, fbclid, gclid, ref, etc.)
  // 2. Lowercase the path
  // 3. Strip trailing slash (except root)
  const normalizePath = (p: string) => {
    let np = p.toLowerCase();
    if (np.length > 1 && np.endsWith('/')) np = np.slice(0, -1);
    return np;
  };
  const cleanPath = normalizePath(pathname);

  // Detect tracking / duplicate-content params → force noindex on these variants
  const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'msclkid', 'ref', 'ref_src', 'mc_cid', 'mc_eid', 'yclid', '_ga'];
  const params = new URLSearchParams(search);
  const hasTrackingParams = TRACKING_PARAMS.some(k => params.has(k));
  const shouldNoIndex = noIndex || hasTrackingParams;

  const truncate = (value: string, max: number) => value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
  const pageTitle = title || `${SITE_NAME} | Digital Software Shop in Bangladesh`;
  const fullTitle = truncate(pageTitle.includes(SITE_NAME) ? pageTitle : `${pageTitle} | ${SITE_NAME}`, 60);
  const metaDescription = truncate(description, 160);
  const canonicalUrl = canonical || `${SITE_URL}${cleanPath}`;
  const ogImageFull = normalizeSeoAssetUrl(ogImage);
  const extraOgImages = (ogImages || []).filter(img => img && img !== ogImage).map(normalizeSeoAssetUrl);
  const gaInjected = useRef(false);
  const robotsContent = shouldNoIndex
    ? 'noindex,follow'
    : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1';
  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  // Fetch GA & GSC settings once (side-effect scripts — kept out of Helmet)
  useEffect(() => {
    if (_seoCache.loaded) {
      injectGA(_seoCache.ga);
      injectGSC(_seoCache.gsc);
      injectClarity(_seoCache.clarity);
      if (_seoCache.verification) injectVerificationTags(_seoCache.verification);
      return;
    }
    supabase.from('site_settings').select('key,value')
      .in('key', ['google_analytics', 'google_site_verification', 'seo_verification', 'microsoft_clarity_id'])
      .then(({ data }) => {
        _seoCache.loaded = true;
        data?.forEach(r => {
          if (r.key === 'google_analytics') _seoCache.ga = r.value || '';
          if (r.key === 'google_site_verification') _seoCache.gsc = r.value || '';
          if (r.key === 'microsoft_clarity_id') _seoCache.clarity = r.value || '';
          if (r.key === 'seo_verification') {
            try { _seoCache.verification = JSON.parse(r.value || '{}'); } catch { _seoCache.verification = {}; }
          }
        });
        injectGA(_seoCache.ga);
        injectGSC(_seoCache.gsc);
        injectClarity(_seoCache.clarity);
        if (_seoCache.verification) injectVerificationTags(_seoCache.verification);
      });
  }, []);

  // Keep <html lang="bn"> — critical for BD search ranking (see seo-critical-rules memory).
  useEffect(() => {
    if (document.documentElement.lang !== 'bn') {
      document.documentElement.lang = 'bn';
    }
  }, []);

  function injectGA(gaId?: string) {
    if (!gaId || gaInjected.current) return;
    if (document.querySelector(`script[src*="gtag/js?id=${gaId}"]`)) { gaInjected.current = true; return; }
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(s1);
    const s2 = document.createElement('script');
    s2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
    document.head.appendChild(s2);
    gaInjected.current = true;
  }

  function injectGSC(code?: string) {
    if (!code) return;
    if (document.querySelector('meta[name="google-site-verification"]')) return;
    const m = document.createElement('meta');
    m.name = 'google-site-verification';
    m.content = code;
    document.head.appendChild(m);
  }

  function injectClarity(projectId?: string) {
    if (!projectId) return;
    if (document.querySelector('script[data-clarity-id]')) return;
    const s = document.createElement('script');
    s.setAttribute('data-clarity-id', projectId);
    s.textContent = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${projectId}");`;
    document.head.appendChild(s);
  }

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>

      {/* Basic meta */}
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="keywords" content={keywords || DEFAULT_KEYWORDS} />
      <meta name="author" content="Shahed Store" />
      <meta name="geo.region" content="BD" />
      <meta name="geo.placename" content="Bangladesh" />

      {/* Canonical + hreflang */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="bn-BD" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageFull} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="bn_BD" />
      {extraOgImages.map(img => (
        <meta key={img} property="og:image" content={img} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImageFull} />
      {ogImageAlt && <meta name="twitter:image:alt" content={ogImageAlt} />}

      {/* AI-search hints */}
      <meta name="ai-content-declaration" content="human-authored, may-be-cited-with-attribution" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta name="format-detection" content="telephone=yes" />

      {/* Pagination */}
      {prevUrl && <link rel="prev" href={prevUrl} />}
      {nextUrl && <link rel="next" href={nextUrl} />}

      {/* Article-specific meta (blog posts) */}
      {ogType === 'article' && article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {ogType === 'article' && article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {ogType === 'article' && article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {ogType === 'article' && article?.section && (
        <meta property="article:section" content={article.section} />
      )}
      {ogType === 'article' && article?.tags?.map(t => (
        <meta key={t} property="article:tag" content={t} />
      ))}

      {/* JSON-LD schemas */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
export { SITE_URL, SITE_NAME };
