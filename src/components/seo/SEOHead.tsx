import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  canonical?: string;
  noIndex?: boolean;
  schema?: object | object[];
}

const SITE_NAME = 'Shahed Store';
const SITE_URL = 'https://shahedstore.com.bd';
const DEFAULT_DESC = 'Shahed Store - আপনার বিশ্বস্ত ডিজিটাল প্রোডাক্ট শপ। Windows, Office, Adobe, Antivirus, Subscription সহ সকল ডিজিটাল সফটওয়্যার সেরা দামে।';
const DEFAULT_OG = '/favicon.png';

const SEOHead = ({
  title,
  description = DEFAULT_DESC,
  ogImage = DEFAULT_OG,
  ogType = 'website',
  canonical,
  noIndex = false,
  schema,
}: SEOHeadProps) => {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = canonical || `${SITE_URL}${pathname}`;
  const ogImageFull = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;

  useEffect(() => {
    // Title
    document.title = fullTitle;

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
    setMeta('meta[name="robots"]', noIndex ? 'noindex,nofollow' : 'index,follow');

    // Open Graph
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:type"]', ogType);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[property="og:image"]', ogImageFull);
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
  }, [fullTitle, description, ogType, canonicalUrl, ogImageFull, noIndex, schema]);

  return null;
};

export default SEOHead;
export { SITE_URL, SITE_NAME };
