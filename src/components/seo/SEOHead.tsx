import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
const DEFAULT_DESC = 'Shahed Store – Bangladesh\'s most trusted digital software shop. Buy Windows 11, Microsoft Office 365, Adobe Creative Cloud, Antivirus, VPN & subscriptions at the lowest price. 100% genuine. Instant delivery.';
const DEFAULT_OG = '/favicon.png';
const DEFAULT_KEYWORDS = 'windows 11 key bangladesh, microsoft office 365 bangladesh, adobe creative cloud bangladesh, antivirus cheap, buy digital software bangladesh, digital license key, shahed store';

// Cache for GA/GSC settings so we only fetch once per session
let _seoCache: { ga?: string; gsc?: string; verification?: Record<string, string>; loaded?: boolean } = {};

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
  // Pagination / filter params keep index but still canonical points to clean URL
  const shouldNoIndex = noIndex || hasTrackingParams;

  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Buy Digital Software at Best Price in Bangladesh`;
  const canonicalUrl = canonical || `${SITE_URL}${cleanPath}`;
  const ogImageFull = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;
  const gaInjected = useRef(false);


  // Fetch GA & GSC settings once
  useEffect(() => {
    if (_seoCache.loaded) {
      injectGA(_seoCache.ga);
      injectGSC(_seoCache.gsc);
      if (_seoCache.verification) injectVerificationTags(_seoCache.verification);
      return;
    }
    supabase.from('site_settings').select('key,value')
      .in('key', ['google_analytics', 'google_site_verification', 'seo_verification'])
      .then(({ data }) => {
        _seoCache.loaded = true;
        data?.forEach(r => {
          if (r.key === 'google_analytics') _seoCache.ga = r.value || '';
          if (r.key === 'google_site_verification') _seoCache.gsc = r.value || '';
          if (r.key === 'seo_verification') {
            try { _seoCache.verification = JSON.parse(r.value || '{}'); } catch { _seoCache.verification = {}; }
          }
        });
        injectGA(_seoCache.ga);
        injectGSC(_seoCache.gsc);
        if (_seoCache.verification) injectVerificationTags(_seoCache.verification);
      });
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

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Lang — keep Bengali primary (matches site content); critical for BD search ranking.
    // Previously hardcoded to 'en' which prevented Google from ranking Bengali queries.
    if (document.documentElement.lang !== 'bn') {
      document.documentElement.lang = 'bn';
    }

    const setMeta = (sel: string, content: string) => {
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        const attr = sel.includes('[name') ? 'name' : 'property';
        const val = sel.match(/["']([^"']+)["']/)?.[1] || '';
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Basic meta
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', shouldNoIndex ? 'noindex,follow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1');
    setMeta('meta[name="googlebot"]', shouldNoIndex ? 'noindex,follow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1');
    setMeta('meta[name="keywords"]', keywords || DEFAULT_KEYWORDS);
    setMeta('meta[name="author"]', 'Shahed Store');
    setMeta('meta[name="geo.region"]', 'BD');
    setMeta('meta[name="geo.placename"]', 'Bangladesh');
    setMeta('meta[name="geo.position"]', '23.8103;90.4125');
    setMeta('meta[name="ICBM"]', '23.8103, 90.4125');

    // hreflang for Bangladesh bilingual SEO
    const setHreflang = (lang: string, href: string) => {
      let el = document.querySelector(`link[hreflang="${lang}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'alternate');
        el.setAttribute('hreflang', lang);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };
    setHreflang('bn-BD', canonicalUrl);
    setHreflang('en', canonicalUrl);
    setHreflang('x-default', canonicalUrl);

    // Open Graph
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:type"]', ogType);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[property="og:image"]', ogImageFull);
    setMeta('meta[property="og:image:width"]', '1200');
    setMeta('meta[property="og:image:height"]', '630');
    setMeta('meta[property="og:site_name"]', SITE_NAME);
    setMeta('meta[property="og:locale"]', 'bn_BD');

    // Additional og:image tags for gallery images
    document.querySelectorAll('meta[data-extra-og-image]').forEach(el => el.remove());
    if (ogImages && ogImages.length > 0) {
      ogImages.forEach(img => {
        if (img && img !== ogImage) {
          const imgUrl = img.startsWith('http') ? img : `${SITE_URL}${img}`;
          const el = document.createElement('meta');
          el.setAttribute('property', 'og:image');
          el.setAttribute('content', imgUrl);
          el.setAttribute('data-extra-og-image', 'true');
          document.head.appendChild(el);
        }
      });
    }

    // Twitter Card
    setMeta('meta[name="twitter:card"]', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', ogImageFull);
    if (ogImageAlt) setMeta('meta[name="twitter:image:alt"]', ogImageAlt);
    if (ogImageAlt) setMeta('meta[property="og:image:alt"]', ogImageAlt);

    // AI-search hints (Google AI Overviews / Perplexity / ChatGPT Search)
    setMeta('meta[name="ai-content-declaration"]', 'human-authored, may-be-cited-with-attribution');
    setMeta('meta[name="rating"]', 'general');
    setMeta('meta[name="distribution"]', 'global');
    setMeta('meta[name="referrer"]', 'no-referrer-when-downgrade');
    setMeta('meta[name="format-detection"]', 'telephone=yes');

    // Canonical
    setLink('canonical', canonicalUrl);

    // Pagination (rel=prev/next) — kept for Bing/Yandex; Google ignores but harmless
    document.querySelectorAll('link[rel="prev"], link[rel="next"]').forEach(el => el.remove());
    if (prevUrl) {
      const l = document.createElement('link');
      l.setAttribute('rel', 'prev');
      l.setAttribute('href', prevUrl);
      document.head.appendChild(l);
    }
    if (nextUrl) {
      const l = document.createElement('link');
      l.setAttribute('rel', 'next');
      l.setAttribute('href', nextUrl);
      document.head.appendChild(l);
    }

    // Article meta (Open Graph article namespace) — only for blog posts
    document.querySelectorAll('meta[data-article-meta]').forEach(el => el.remove());
    if (ogType === 'article' && article) {
      const addArt = (prop: string, content?: string) => {
        if (!content) return;
        const m = document.createElement('meta');
        m.setAttribute('property', prop);
        m.setAttribute('content', content);
        m.setAttribute('data-article-meta', 'true');
        document.head.appendChild(m);
      };
      addArt('article:published_time', article.publishedTime);
      addArt('article:modified_time', article.modifiedTime);
      addArt('article:author', article.author);
      addArt('article:section', article.section);
      article.tags?.forEach(t => addArt('article:tag', t));
    }

    // JSON-LD Schema
    const existingScripts = document.querySelectorAll('script[data-seo-schema]');
    existingScripts.forEach(s => s.remove());

    if (schema) {
      const schemas = Array.isArray(schema) ? schema : [schema];
      schemas.forEach(s => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-schema', 'true');
        script.textContent = JSON.stringify(s);
        document.head.appendChild(script);
      });
    }

    return () => {
      document.querySelectorAll('script[data-seo-schema]').forEach(s => s.remove());
      document.querySelectorAll('meta[data-extra-og-image]').forEach(el => el.remove());
      document.querySelectorAll('meta[data-article-meta]').forEach(el => el.remove());
      document.querySelectorAll('link[rel="prev"], link[rel="next"]').forEach(el => el.remove());
    };
  }, [fullTitle, description, ogType, canonicalUrl, ogImageFull, shouldNoIndex, schema, keywords, ogImages, ogImageAlt, prevUrl, nextUrl, article]);

  return null;
};

export default SEOHead;
export { SITE_URL, SITE_NAME };
