import { SITE_URL, SITE_NAME } from './SEOHead';

const PHONE = '+8801840099853';
const EMAIL = 'info@shahedstore.com.bd';
/** Official Shahed Store profiles — keep in sync with footer settings & contact page */
const SAME_AS = [
  'https://www.facebook.com/Shahed.Store365',
  'https://www.instagram.com/shahedstore.com.bd/',
  'https://t.me/Shahed_Store',
];
const BD_AREA_CODE = 'BD';
const SUPABASE_STORAGE_ORIGIN = 'https://dpvdavjwqyviredzoorj.supabase.co';
const SUPABASE_STORAGE_PUBLIC_PATH = '/storage/v1/object/public/';

const seoImageUrl = (url?: string | null, fallback = `${SITE_URL}/favicon.png`) => {
  const clean = (url || '').trim();
  if (!clean) return fallback;
  if (clean.startsWith(`${SUPABASE_STORAGE_ORIGIN}${SUPABASE_STORAGE_PUBLIC_PATH}`)) {
    return clean.replace(SUPABASE_STORAGE_ORIGIN, SITE_URL);
  }
  if (clean.startsWith(SUPABASE_STORAGE_PUBLIC_PATH)) return `${SITE_URL}${clean}`;
  if (clean.startsWith('/')) return `${SITE_URL}${clean}`;
  return clean;
};

/** Product (offers) schema — enhanced for Bangladesh Google ranking */
export const productSchema = (p: {
  name: string;
  description?: string | null;
  image?: string | null;
  images?: string[];
  price: number;
  slug: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  sku?: string;
  originalPrice?: number | null;
  inStock?: boolean;
}) => {
  // Build full image array for Google Image indexing
  const allImages: string[] = [];
  if (p.image) allImages.push(seoImageUrl(p.image));
  if (p.images) {
    for (const img of p.images) {
      const normalized = seoImageUrl(img, '');
      if (normalized && !allImages.includes(normalized)) allImages.push(normalized);
    }
  }
  // NOTE: never fall back to the logo/placeholder — Google flags a logo used as
  // a product image. If a product genuinely has no image, we omit the field.

  // Use ImageObject entries with captions — significantly boosts Google Images ranking
  const imageObjects = allImages.map((url) => ({
    '@type': 'ImageObject',
    url,
    contentUrl: url,
    caption: `${p.name} - ${SITE_NAME}`,
    representativeOfPage: true,
  }));

  // Only emit aggregateRating when REAL review data exists (Google forbids invented ratings)
  const hasRealRating = typeof p.rating === 'number' && typeof p.reviewCount === 'number' && p.reviewCount > 0;

  return ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  '@id': `${SITE_URL}/product/${p.slug}#product`,
  name: p.name,
  description: p.description || `${p.name} - Buy at the best price in Bangladesh from ${SITE_NAME}. 100% genuine. Instant delivery.`,
  ...(imageObjects.length ? { image: imageObjects } : {}),
  url: `${SITE_URL}/product/${p.slug}`,
  sku: p.sku || p.slug,
  mpn: p.sku || p.slug,
  brand: { '@type': 'Brand', name: SITE_NAME },
  category: p.category || 'Digital Software',
  offers: {
    '@type': 'Offer',
    '@id': `${SITE_URL}/product/${p.slug}#offer`,
    url: `${SITE_URL}/product/${p.slug}`,
    priceCurrency: 'BDT',
    price: p.price,
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    availability: p.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability',
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      areaServed: { '@type': 'Country', name: 'Bangladesh', '@id': 'https://www.wikidata.org/wiki/Q902' },
    },
    // Required for Google Merchant rich results
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'BDT' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'BD' },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'HUR' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 24, unitCode: 'HUR' },
      },
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'BD',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 7,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
    ...(p.originalPrice && p.originalPrice > p.price ? {
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: p.originalPrice,
        priceCurrency: 'BDT',
        priceType: 'https://schema.org/ListPrice',
      },
    } : {}),
  },
  ...(hasRealRating ? {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: p.rating,
      reviewCount: p.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  } : {}),
});
};


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
  image: seoImageUrl(post.image),
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

/** Organization / LocalBusiness schema — enhanced for Bangladesh Google ranking */
export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': ['Organization', 'OnlineStore'],
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  legalName: SITE_NAME,
  alternateName: ['ShahedStore', 'Shahed Store BD', 'Shahed Store Bangladesh', 'শাহেদ স্টোর'],
  brand: { '@type': 'Brand', name: SITE_NAME },
  url: `${SITE_URL}/`,
  logo: {
    '@type': 'ImageObject',
    '@id': `${SITE_URL}/#logo`,
    url: `${SITE_URL}/logo.png`,
    contentUrl: `${SITE_URL}/logo.png`,
    caption: SITE_NAME,
  },
  image: `${SITE_URL}/og-image.jpg`,
  description:
    'Shahed Store is a digital software store in Bangladesh offering Windows, Microsoft Office, Adobe, VPN and other digital subscriptions with fast delivery and customer support.',
  email: EMAIL,
  telephone: PHONE,
  currenciesAccepted: 'BDT',
  paymentAccepted: 'bKash, Nagad, Rocket, Bank Transfer',
  areaServed: {
    '@type': 'Country',
    name: 'Bangladesh',
    '@id': 'https://www.wikidata.org/wiki/Q902',
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: BD_AREA_CODE,
    addressLocality: 'Ishwardi',
    addressRegion: 'Pabna',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: PHONE,
      email: EMAIL,
      contactType: 'customer service',
      availableLanguage: ['Bengali', 'English'],
      areaServed: BD_AREA_CODE,
    },
  ],
  // Only profiles that genuinely belong to Shahed Store (mirrors footer/contact page)
  sameAs: SAME_AS,
});

export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: ['ShahedStore', 'Shahed Store BD', 'শাহেদ স্টোর'],
  url: `${SITE_URL}/`,
  publisher: { '@id': `${SITE_URL}/#organization` },
  inLanguage: ['bn-BD', 'en'],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

/** WebPage schema — describes the current page and ties it to the brand entity */
export const webPageSchema = (page: { name: string; description?: string; url: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${page.url}#webpage`,
  name: page.name,
  ...(page.description ? { description: page.description } : {}),
  url: page.url,
  isPartOf: { '@id': `${SITE_URL}/#website` },
  about: { '@id': `${SITE_URL}/#organization` },
  inLanguage: 'bn-BD',
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', '.lead'],
  },
});

/** ItemList schema for shop/category pages — helps Google show product grid in search */
export const itemListSchema = (items: { name: string; slug: string; image?: string | null; price: number }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: `Digital Software Products — ${SITE_NAME}`,
  description: 'Buy digital software licenses at the best price in Bangladesh',
  numberOfItems: items.length,
  itemListElement: items.slice(0, 20).map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE_URL}/product/${item.slug}`,
    name: item.name,
    image: {
      '@type': 'ImageObject',
      url: seoImageUrl(item.image),
      caption: `${item.name} - ${SITE_NAME}`,
    },
  })),
});

/** Review schema — embed individual reviews for Google rich snippets */
export const reviewSchema = (
  productName: string,
  productSlug: string,
  reviews: { author: string; rating: number; body: string; date?: string }[]
) => reviews.slice(0, 10).map(r => ({
  '@context': 'https://schema.org',
  '@type': 'Review',
  itemReviewed: {
    '@type': 'Product',
    name: productName,
    url: `${SITE_URL}/product/${productSlug}`,
  },
  author: { '@type': 'Person', name: r.author },
  reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
  reviewBody: r.body,
  datePublished: r.date || new Date().toISOString().split('T')[0],
}));

/** Speakable — boosts ranking in Google Assistant / voice search results */
export const speakableSchema = (selectors: string[] = ['h1', '.product-title', '.lead', '.product-description']) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: selectors,
  },
});

/** LocalBusiness — strong local-SEO boost for "near me" queries in BD */
export const localBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  '@id': `${SITE_URL}/#localbusiness`,
  name: SITE_NAME,
  image: `${SITE_URL}/og-image.jpg`,
  url: `${SITE_URL}/`,
  telephone: PHONE,
  priceRange: '৳৳',
  currenciesAccepted: 'BDT',
  paymentAccepted: 'bKash, Nagad, Rocket, Bank Transfer, DBBL',
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    opens: '00:00', closes: '23:59',
  }],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Ishwardi',
    addressRegion: 'Pabna',
    addressCountry: 'BD',
  },
  email: EMAIL,
  areaServed: { '@type': 'Country', name: 'Bangladesh' },
  sameAs: SAME_AS,
});

/** SiteNavigationElement — helps Google build sitelinks */
export const siteNavigationSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@graph': items.map((it, i) => ({
    '@type': 'SiteNavigationElement',
    position: i + 1,
    name: it.name,
    url: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
  })),
});

/** SoftwareApplication — boosts software-product rankings */
export const softwareApplicationSchema = (p: {
  name: string;
  description?: string | null;
  image?: string | null;
  slug: string;
  price: number;
  category?: string;
  rating?: number;
  reviewCount?: number;
  operatingSystem?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: p.name,
  description: p.description || `${p.name} — Buy at the best price in Bangladesh`,
  image: seoImageUrl(p.image),
  url: `${SITE_URL}/product/${p.slug}`,
  applicationCategory: p.category || 'BusinessApplication',
  operatingSystem: p.operatingSystem || 'Windows, macOS, Android, iOS',
  offers: {
    '@type': 'Offer',
    price: p.price,
    priceCurrency: 'BDT',
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/product/${p.slug}`,
  },
  ...(typeof p.rating === 'number' && typeof p.reviewCount === 'number' && p.reviewCount > 0 ? {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: p.rating,
      reviewCount: p.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  } : {}),
});

/** HowTo — for tutorial pages (huge ranking boost in how-to queries) */
export const howToSchema = (h: {
  name: string;
  description: string;
  image?: string;
  totalTime?: string;
  steps: { name: string; text: string; image?: string }[];
}) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: h.name,
  description: h.description,
  image: seoImageUrl(h.image),
  totalTime: h.totalTime || 'PT5M',
  step: h.steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.name,
    text: s.text,
    ...(s.image ? { image: s.image } : {}),
  })),
});

/** VideoObject — for any video embed */
export const videoObjectSchema = (v: {
  name: string; description: string; thumbnailUrl: string;
  uploadDate?: string; contentUrl?: string; embedUrl?: string; duration?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: v.name,
  description: v.description,
  thumbnailUrl: seoImageUrl(v.thumbnailUrl, v.thumbnailUrl),
  uploadDate: v.uploadDate || new Date().toISOString(),
  ...(v.contentUrl ? { contentUrl: v.contentUrl } : {}),
  ...(v.embedUrl ? { embedUrl: v.embedUrl } : {}),
  duration: v.duration || 'PT2M',
  publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png` } },
});

/** SaleEvent — for flash sales / promotions */
export const eventSchema = (e: {
  name: string; description: string; startDate: string; endDate: string; url?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'SaleEvent',
  name: e.name,
  description: e.description,
  startDate: e.startDate,
  endDate: e.endDate,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
  location: { '@type': 'VirtualLocation', url: e.url || SITE_URL },
  organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
});
