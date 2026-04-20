import { SITE_URL, SITE_NAME } from './SEOHead';

const PHONE = '+8801840099853';
const BD_AREA_CODE = 'BD';

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
  if (p.image) allImages.push(p.image);
  if (p.images) {
    for (const img of p.images) {
      if (img && !allImages.includes(img)) allImages.push(img);
    }
  }
  if (allImages.length === 0) allImages.push(`${SITE_URL}/favicon.png`);

  return ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: p.name,
  description: p.description || p.name,
  image: allImages,
  url: `${SITE_URL}/product/${p.slug}`,
  sku: p.sku || p.slug,
  brand: { '@type': 'Brand', name: SITE_NAME },
  category: p.category || 'Digital Products',
  offers: {
    '@type': 'Offer',
    url: `${SITE_URL}/product/${p.slug}`,
    priceCurrency: 'BDT',
    price: p.price,
    priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    availability: p.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability',
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      areaServed: { '@type': 'Country', name: 'Bangladesh', '@id': 'https://www.wikidata.org/wiki/Q902' },
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

/** Organization / LocalBusiness schema — enhanced for Bangladesh Google ranking */
export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': ['Organization', 'OnlineStore'],
  name: SITE_NAME,
  alternateName: ['Shahed Store BD', 'শাহেদ স্টোর'],
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/favicon.png`,
    width: 512,
    height: 512,
  },
  image: `${SITE_URL}/favicon.png`,
  description: "Bangladesh's most trusted digital software shop. Buy Windows 11, Microsoft Office 365, Adobe Creative Cloud, Antivirus, VPN at the lowest price. 100% genuine. Instant delivery.",
  foundingDate: '2020',
  areaServed: {
    '@type': 'Country',
    name: 'Bangladesh',
    '@id': 'https://www.wikidata.org/wiki/Q902',
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'BD',
    addressLocality: 'Dhaka',
    addressRegion: 'Dhaka',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+8801840099853',
      contactType: 'customer service',
      contactOption: 'TollFree',
      availableLanguage: ['Bengali', 'English'],
      areaServed: 'BD',
    },
  ],
  sameAs: [
    'https://www.facebook.com/shahedstore',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Digital Software Products',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Windows 11 License Key Bangladesh' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Microsoft Office 365 Bangladesh' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Adobe Creative Cloud Bangladesh' } },
    ],
  },
});

export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: 'Shahed Store BD',
  url: SITE_URL,
  inLanguage: ['bn-BD', 'en'],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
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
    image: item.image || `${SITE_URL}/favicon.png`,
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
