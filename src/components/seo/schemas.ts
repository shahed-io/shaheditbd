import { SITE_URL, SITE_NAME } from './SEOHead';

/** Product (offers) schema */
export const productSchema = (p: {
  name: string;
  description?: string | null;
  image?: string | null;
  price: number;
  slug: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  sku?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: p.name,
  description: p.description || p.name,
  image: p.image || `${SITE_URL}/favicon.png`,
  url: `${SITE_URL}/product/${p.slug}`,
  sku: p.sku || p.slug,
  brand: { '@type': 'Brand', name: SITE_NAME },
  category: p.category || 'Digital Products',
  offers: {
    '@type': 'Offer',
    url: `${SITE_URL}/product/${p.slug}`,
    priceCurrency: 'BDT',
    price: p.price,
    availability: 'https://schema.org/InStock',
    seller: { '@type': 'Organization', name: SITE_NAME },
  },
  ...(p.rating && p.reviewCount
    ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: p.rating,
          reviewCount: p.reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      }
    : {}),
});

/** Breadcrumb schema */
export const breadcrumbSchema = (
  items: { name: string; url: string }[]
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
  })),
});

/** Article / Blog schema */
export const articleSchema = (post: {
  title: string;
  description?: string | null;
  image?: string | null;
  slug: string;
  publishedAt?: string | null;
  updatedAt?: string;
  authorName?: string | null;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.description || post.title,
  image: post.image || `${SITE_URL}/favicon.png`,
  url: `${SITE_URL}/blog/${post.slug}`,
  datePublished: post.publishedAt || new Date().toISOString(),
  dateModified: post.updatedAt || post.publishedAt || new Date().toISOString(),
  author: {
    '@type': 'Person',
    name: post.authorName || SITE_NAME,
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png` },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
});

/** FAQ schema */
export const faqSchema = (faqs: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

/** Organization / Website schema (homepage) */
export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+8801840099853',
    contactType: 'customer service',
    availableLanguage: ['Bengali', 'English'],
  },
  sameAs: [],
});

export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});
