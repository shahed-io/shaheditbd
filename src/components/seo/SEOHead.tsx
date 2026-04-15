import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogImages?: string[];
  ogType?: 'website' | 'article' | 'product';
  canonical?: string;
  noIndex?: boolean;
  schema?: object | object[];
  keywords?: string;
}

const SITE_NAME = 'Shahed Store';
const SITE_URL = 'https://shahedstore.com.bd';
const DEFAULT_DESC = 'Shahed Store – Bangladesh\'s most trusted digital software shop. Buy Windows 11, Microsoft Office 365, Adobe Creative Cloud, Antivirus, VPN & subscriptions at the lowest price. 100% genuine. Instant delivery.';
const DEFAULT_OG = '/favicon.png';
const DEFAULT_KEYWORDS = 'windows 11 key bangladesh, microsoft office 365 bangladesh, adobe creative cloud bangladesh, antivirus cheap, buy digital software bangladesh, digital license key, shahed store';

// Cache for GA/GSC settings so we only fetch once per session
let _seoCache: { ga?: string; gsc?: string; loaded?: boolean } = {};

const SEOHead = ({
  title,
  description = DEFAULT_DESC,
  ogImage = DEFAULT_OG,
  ogImages,
  ogType = 'website',
  canonical,
  noIndex = false,
  schema,
  keywords,
}: SEOHeadProps) => {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Buy Digital Software at Best Price in Bangladesh`;
  const canonicalUrl = canonical || `${SITE_URL}${pathname}`;
  const ogImageFull = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;
  const gaInjected = useRef(false);

  // Fetch GA & GSC settings once
  useEffect(() => {
    if (_seoCache.loaded) {
      injectGA(_seoCache.ga);
      injectGSC(_seoCache.gsc);
      return;
    }
    supabase.from('site_settings').select('key,value')
      .in('key', ['google_analytics', 'google_site_verification'])
      .then(({ data }) => {
        _seoCache.loaded = true;
        data?.forEach(r => {
          if (r.key === 'google_analytics') _seoCache.ga = r.value || '';
          if (r.key === 'google_site_verification') _seoCache.gsc = r.value || '';
        });
        injectGA(_seoCache.ga);
        injectGSC(_seoCache.gsc);
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

    // Lang
    document.documentElement.lang = 'en';

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
    setMeta('meta[name="robots"]', noIndex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1');
    setMeta('meta[name="keywords"]', keywords || DEFAULT_KEYWORDS);

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

    // Twitter Card
    setMeta('meta[name="twitter:card"]', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', ogImageFull);

    // Canonical
    setLink('canonical', canonicalUrl);

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
      // cleanup schema on unmount
      document.querySelectorAll('script[data-seo-schema]').forEach(s => s.remove());
    };
  }, [fullTitle, description, ogType, canonicalUrl, ogImageFull, noIndex, schema, keywords]);

  return null;
};

export default SEOHead;
export { SITE_URL, SITE_NAME };
