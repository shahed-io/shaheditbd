import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import BrandLoader from '@/components/store/BrandLoader';
import { useParams, useNavigate } from 'react-router-dom';

const ReactMarkdown = lazy(() => import('react-markdown'));
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { useCurrency } from '@/hooks/useCurrency';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import {
  ShoppingCart, MessageCircle, CreditCard, Star, Zap, Shield, Clock,
  CheckCircle2, ChevronLeft, ChevronRight, Heart, Package, Tag,
  Truck, ArrowLeft, Share2, Copy, Check, ChevronDown, AlertCircle,
  ThumbsUp, Send, User, Download, ExternalLink
} from 'lucide-react';
import QuickOrderModal from '@/components/store/QuickOrderModal';
import NotFoundScreen from '@/components/store/NotFoundScreen';

import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { productSchema, breadcrumbSchema, faqSchema, softwareApplicationSchema, speakableSchema, reviewSchema } from '@/components/seo/schemas';
import { SITE_URL } from '@/components/seo/SEOHead';
import VerifiedBadge from '@/components/store/VerifiedBadge';
import RecentlyViewed, { trackRecentlyViewed } from '@/components/RecentlyViewed';
import { normalizeBrandNameFaqs, normalizeBrandNameText } from '@/lib/brandName';
import dbidLogo from '@/assets/dbid-logo.png';
import brandIconAsset from '@/assets/dbid-d-logo.png.asset.json';
const brandIcon = brandIconAsset.url;
import certifiedBadge from '@/assets/certified-badge.png.asset.json';

import { useAuth } from '@/hooks/useAuth';

const WA = '8801840099853';
const PLACEHOLDER = 'https://placehold.co/600x600/0d1117/a855f7?text=Product';

// Fix: replace Bengali danda (।) after English/numbers with English period (.)
const fixPunctuation = (text: string): string =>
  text.replace(/([A-Za-z0-9])\s*।/g, '$1.');

interface DurationPlan {
  duration: string;
  price: string;
  original_price?: string;
}

interface ProductFull {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  images: string[] | null;
  what_you_get: string[] | null;
  delivery_time: string | null;
  download_link: string | null;
  is_featured: boolean | null;
  total_sales: number | null;
  variants: any;
  faq: any;
  attributes: any;
  category_id: string | null;
  categories: { name: string; slug: string } | null;
  created_at: string;
}

// ── Custom hook: trigger reveal when element enters viewport ──
const useReveal = (thresholdOrOpts: number | { threshold?: number } = 0.1) => {
  const threshold = typeof thresholdOrOpts === 'number' ? thresholdOrOpts : (thresholdOrOpts.threshold ?? 0.1);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fallback: reveal after 800ms even if IO doesn't fire
    const fallback = setTimeout(() => setVisible(true), 800);
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { clearTimeout(fallback); setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: '0px 0px -20px 0px' }
    );
    obs.observe(el);
    return () => { obs.disconnect(); clearTimeout(fallback); };
  }, [threshold]);
  return { ref, visible };
};

// ── Custom Option types ──────────────────────────────────────
interface CustomOptionValue {
  id: string;
  label: string;
  price_adjustment: number;
  is_default: boolean;
  sort_order: number;
}

interface CustomOptionGroup {
  id: string;
  name: string;
  display_type: 'button' | 'radio' | 'dropdown';
  is_required: boolean;
  allow_multiple: boolean;
  sort_order: number;
  values: CustomOptionValue[];
}

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isWishlisted, isInCart } = useCart();
  const { user } = useAuth();
  const { format: fmtPrice, active: activeCurrency } = useCurrency();

  const [product,       setProduct]      = useState<ProductFull | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [notFound,      setNotFound]     = useState(false);
  const [activeImg,     setActiveImg]    = useState(0);
  const [showModal,     setShowModal]    = useState(false);
  const [copied,        setCopied]       = useState(false);
  const [imgLoaded,     setImgLoaded]    = useState(false);
  const [selectedOpts,  setSelectedOpts] = useState<Record<string, string | string[]>>({});
  const [customGroups,  setCustomGroups] = useState<CustomOptionGroup[]>([]);
  const [entered,       setEntered]      = useState(false);
  const [quantity,      setQuantity]     = useState(1);
  // Keep selectedVar for legacy variants
  const [selectedVar,   setSelectedVar]  = useState<Record<string, string>>({});
  // Duration plans from __duration_plans attribute
  const [durationPlans, setDurationPlans] = useState<DurationPlan[]>([]);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);
  // Review stats for schema
  const [reviewStats, setReviewStats] = useState<{ avg: number; count: number } | null>(null);
  const [topReviews, setTopReviews] = useState<{ author: string; rating: number; body: string; date?: string }[]>([]);

  // Section reveals
  const descReveal   = useReveal({ threshold: 0.05 });
  const faqReveal    = useReveal({ threshold: 0.05 }); // kept for hook order stability

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setEntered(false);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id,name,slug,description,short_description,price,original_price,discount_percent,sku,stock_quantity,status,category_id,image_url,image_alt,images,tags,is_featured,is_digital,download_link,sort_order,total_sales,total_views,created_at,updated_at,delivery_time,what_you_get,faq,seo_title,seo_description,variants,brand,video_url,product_type,badge,demo_url,warranty_note,refund_note,delivery_type,attributes,subcategory_id,custom_fields, category:category_id(name, slug)')
          .eq('slug', slug)
          .eq('status', 'active')
          .limit(1);
        if (cancelled) return;
        if (error) { setNotFound(true); setLoading(false); return; }
        const row = data?.[0];
        if (!row) { setNotFound(true); setLoading(false); return; }
        setProduct(row as any);

        // Signal product visit for welcome discount trigger
        sessionStorage.setItem('ss_product_visited', '1');
        window.dispatchEvent(new CustomEvent('ss:product-visited'));

        // Parse __duration_plans from attributes
        const attrRaw = Array.isArray((row as any).attributes) ? (row as any).attributes : [];
        const durationPlansAttr = attrRaw.find((a: any) => a.key === '__duration_plans');
        const parsedPlans: DurationPlan[] = (() => {
          try { return durationPlansAttr ? JSON.parse(durationPlansAttr.value) : []; } catch { return []; }
        })();
        const validPlans = parsedPlans.filter(p => p.duration?.trim() && p.price?.trim());
        if (!cancelled && validPlans.length > 0) {
          setDurationPlans(validPlans);
          setSelectedPlanIdx(0);
        }

        // Fetch custom option groups from new system
        const { data: groupData } = await supabase
          .from('product_option_groups' as any)
          .select('*, product_option_values(*)')
          .eq('product_id', row.id)
          .order('sort_order');

        if (!cancelled && groupData && (groupData as any[]).length > 0) {
          const groups: CustomOptionGroup[] = (groupData as any[]).map((g: any) => ({
            id: g.id,
            name: g.name,
            display_type: g.display_type,
            is_required: g.is_required,
            allow_multiple: !!g.allow_multiple,
            sort_order: g.sort_order,
            values: (g.product_option_values || [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((v: any) => ({
                id: v.id,
                label: v.label,
                price_adjustment: Number(v.price_adjustment),
                is_default: v.is_default,
                sort_order: v.sort_order,
              })),
          }));
          setCustomGroups(groups);
          // Initialize default selections
          const defaults: Record<string, string | string[]> = {};
          for (const g of groups) {
            if (g.allow_multiple) {
              defaults[g.id] = g.values.filter(v => v.is_default).map(v => v.id);
            } else {
              const def = g.values.find(v => v.is_default) || g.values[0];
              if (def) defaults[g.id] = def.id;
            }
          }
          setSelectedOpts(defaults);
        }

        setLoading(false);
        setTimeout(() => setEntered(true), 80);
        // Defer view tracking + review stats for schema — don't block UI
        setTimeout(() => {
          supabase.from('products').update({ total_views: (row.total_views || 0) + 1 }).eq('id', row.id).then(() => {});
          // Fire ViewContent event on TikTok / Snap / Pin / LinkedIn / X
          import('@/components/store/MarketingPixels').then(({ mTrackViewContent, loadMarketingPixels }) => {
            loadMarketingPixels().then(() => {
              mTrackViewContent({
                content_id: String(row.id),
                content_name: row.name,
                value: Number(row.price) || 0,
              });
            }).catch(() => { /* silent */ });
          }).catch(() => { /* silent */ });
          // Fetch review stats for Google rich snippet schema
          (supabase as any).from('product_reviews_public')
            .select('rating, body, author_name, created_at')
            .eq('product_slug', row.slug)
            .order('created_at', { ascending: false })
            .then(({ data: rData }: { data: any[] | null }) => {
              if (rData && rData.length > 0) {
                const avg = rData.reduce((s: number, r: any) => s + r.rating, 0) / rData.length;
                if (!cancelled) {
                  setReviewStats({ avg: parseFloat(avg.toFixed(1)), count: rData.length });
                  setTopReviews(
                    rData.slice(0, 10).map((r: any) => ({
                      author: r.author_name || 'Verified Buyer',
                      rating: Number(r.rating) || 5,
                      body: r.body || '',
                      date: r.created_at ? String(r.created_at).split('T')[0] : undefined,
                    })).filter((r: any) => r.body),
                  );
                }
              }
            });
        }, 3000);
      } catch {
        if (!cancelled) { setNotFound(true); setLoading(false); }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug]);

  // Track recently viewed
  useEffect(() => {
    if (!product) return;
    trackRecentlyViewed({
      product_id: product.id,
      product_name: product.name,
      product_price: Number((product as any).price) || 0,
      product_image: (product as any).image_url || null,
      product_slug: product.slug || null,
    }, user?.id);
  }, [product?.id, user?.id]);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <BrandLoader size="lg" />
      </div>
    </div>
  );

  if (notFound || !product) return (
    <NotFoundScreen
      code="404"
      title="Product Not Found"
      message="This product doesn't exist or has been unplugged from our digital cave."
      ctaLabel="Back to Store"
      ctaHref="/"
    />
  );


  const images = [
    product.image_url || PLACEHOLDER,
    ...(product.images || []).filter(img => img !== product.image_url),
  ].filter(Boolean);
  if (images.length === 0) images.push(PLACEHOLDER);

  // Support both new grouped format { name, options: [{label, price}] } and old flat format { name, options: string[] }
  const rawVariants = Array.isArray(product.variants) ? product.variants : [];
  // Normalize to grouped format with prices
  interface VariantOption { label: string; price?: number; }
  interface VariantGroup { name: string; options: VariantOption[]; }
  const legacyVariants: VariantGroup[] = rawVariants.map((v: any) => ({
    name: v.name || v.label || 'Options',
    options: Array.isArray(v.options)
      ? v.options.map((o: any) => typeof o === 'string' ? { label: o } : { label: o.label, price: o.price ? parseFloat(o.price) : undefined })
      : [],
  })).filter((v: VariantGroup) => v.options.length > 0);
  const productDisplayName = normalizeBrandNameText(product.name);
  const shortDescription = product.short_description ? normalizeBrandNameText(product.short_description) : '';
  const description = product.description ? normalizeBrandNameText(product.description) : '';
  const faqs: { q: string; a: string }[] = Array.isArray(product.faq) ? normalizeBrandNameFaqs(product.faq) : [];

  const wishlisted = isWishlisted(product.id);
  const inCart     = isInCart(product.id);

  // Compute displayed price:
  // 1. Duration plans (__duration_plans attribute) — highest priority
  // 2. Custom option groups (DB-driven)
  // 3. Legacy variants (JSONB-driven)
  // 4. Base price
  const selectedPlan = durationPlans[selectedPlanIdx] || null;
  const getSelectedPrice = (): number => {
    // Duration plans system
    if (selectedPlan) {
      const p = parseFloat(selectedPlan.price);
      if (!isNaN(p) && p > 0) return p;
    }
    // New system: custom option groups
    if (customGroups.length > 0) {
      // Single-select groups: first non-zero price_adjustment REPLACES base price
      let basePrice = product.price;
      let replaced = false;
      for (const group of customGroups) {
        if (group.allow_multiple) continue;
        const selValueId = selectedOpts[group.id] as string | undefined;
        const val = selValueId
          ? group.values.find(v => v.id === selValueId)
          : group.values.find(v => v.is_default) || group.values[0];
        if (!replaced && val && val.price_adjustment > 0) {
          basePrice = val.price_adjustment;
          replaced = true;
        }
      }
      // Multi-select groups: ADD every selected value's price_adjustment
      let extras = 0;
      for (const group of customGroups) {
        if (!group.allow_multiple) continue;
        const selIds = Array.isArray(selectedOpts[group.id])
          ? (selectedOpts[group.id] as string[])
          : [];
        for (const id of selIds) {
          const val = group.values.find(v => v.id === id);
          if (val) extras += val.price_adjustment;
        }
      }
      return basePrice + extras;
    }
    // Legacy variant system
    for (const group of legacyVariants) {
      const selectedLabel = selectedVar[group.name] || group.options[0]?.label;
      const opt = group.options.find(o => o.label === selectedLabel);
      if (opt?.price !== undefined && opt.price > 0) return opt.price;
    }
    return product.price;
  };
  const displayPrice = getSelectedPrice();


  // Original price: use selected plan's original_price if available, else product's
  const displayOriginalPrice = selectedPlan?.original_price
    ? parseFloat(selectedPlan.original_price) || product.original_price
    : product.original_price;

  const savings  = displayOriginalPrice && displayOriginalPrice > displayPrice ? displayOriginalPrice - displayPrice : 0;
  const discount = product.discount_percent || (displayOriginalPrice && displayOriginalPrice > displayPrice ? Math.round(savings / displayOriginalPrice * 100) : 0);

  // Build selected options string for WhatsApp/order
  const selectedOptsStr = [
    ...(selectedPlan ? [`মেয়াদ: ${selectedPlan.duration}`] : []),
    ...(customGroups.length > 0
      ? customGroups.map(g => {
          if (g.allow_multiple) {
            const selIds = Array.isArray(selectedOpts[g.id]) ? (selectedOpts[g.id] as string[]) : [];
            const labels = selIds
              .map(id => g.values.find(v => v.id === id)?.label)
              .filter(Boolean);
            return labels.length ? `${g.name}: ${labels.join(' + ')}` : null;
          }
          const selId = selectedOpts[g.id] as string | undefined;
          const val = selId ? g.values.find(v => v.id === selId) : g.values.find(v => v.is_default) || g.values[0];
          return val ? `${g.name}: ${val.label}` : null;
        }).filter(Boolean)
      : Object.entries(selectedVar).map(([k, v]) => `${k}: ${v}`)),
  ].join(', ');

  const cartItem = {
    id: product.id,
    name: productDisplayName,
    category: product.categories?.name || '',
    price: displayPrice,
    originalPrice: displayOriginalPrice || undefined,
    image: product.image_url || PLACEHOLDER,
    variant: selectedPlan ? selectedPlan.duration : undefined,
  };

  const outOfStock = (product as any).status === 'out_of_stock'
    || (typeof (product as any).stock_quantity === 'number' && (product as any).stock_quantity <= 0);

  const waOrder = () => {
    const msg = encodeURIComponent(`অর্ডার করতে চাই:\n📦 ${productDisplayName}${selectedOptsStr ? `\n⚙️ ${selectedOptsStr}` : ''}\n💰 ৳${displayPrice.toLocaleString()}\n🔗 ${window.location.href}`);
    window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
  };

  const waPreOrder = () => {
    const msg = encodeURIComponent(`প্রি-অর্ডার করতে চাই (Stock Out):\n📦 ${productDisplayName}${selectedOptsStr ? `\n⚙️ ${selectedOptsStr}` : ''}\n💰 ৳${displayPrice.toLocaleString()}\n🔗 ${window.location.href}\n\nকখন আবার stock আসবে জানাবেন please।`);
    window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prevImg = () => { setImgLoaded(false); setActiveImg(i => (i - 1 + images.length) % images.length); };
  const nextImg = () => { setImgLoaded(false); setActiveImg(i => (i + 1) % images.length); };

  // ── SEO: DB values take priority, then smart auto-generation ───────────────
  // DB seo_title/seo_description are set via Admin Product SEO panel or AI generation
  const dbSeoTitle = normalizeBrandNameText((product as any).seo_title || '');
  const dbSeoDesc = normalizeBrandNameText((product as any).seo_description || '');

  // Title format: "{Product Name} – ৳{Price} in BD | Shahed Store"
  const seoTitle = dbSeoTitle
    ? dbSeoTitle
    : `${productDisplayName} – ৳${displayPrice.toLocaleString()} in BD | Shahed Store`;

  const seoDescription = (() => {
    if (dbSeoDesc) return dbSeoDesc.substring(0, 160);
    // Auto-generate 150-160 char description mentioning product name, BDT price, instant delivery.
    const priceStr = `৳${displayPrice.toLocaleString()} BDT`;
    const catStr = product.categories?.name ? ` ${product.categories.name.toLowerCase()}` : '';
    const base = `Buy ${productDisplayName} at ${priceStr} in Bangladesh. 100% genuine${catStr} license with instant delivery via email. bKash/Nagad accepted — Shahed Store.`;
    // Pad short strings to hit 150+ chars; truncate long ones to 160.
    if (base.length >= 150) return base.substring(0, 160);
    return `${base} Trusted digital software shop in BD.`.substring(0, 160);
  })();


  // Keywords for meta tag — Bangladesh-targeted long-tail
  const seoKeywords = [
    `${productDisplayName} বাংলাদেশ`,
    `${productDisplayName} কিনুন`,
    `${productDisplayName} price in bangladesh`,
    `${productDisplayName} bd`,
    `${productDisplayName} সেরা দাম`,
    `buy ${productDisplayName} bangladesh`,
    `${productDisplayName} cheap price bangladesh`,
    product.categories?.name ? `${product.categories.name} বাংলাদেশ` : '',
    'Shahed Store',
    'digital software bangladesh',
  ].filter(Boolean).join(', ');

  // Build SEO schemas — enhanced for Bangladesh ranking
  const seoSchemas = [
    productSchema({
      name: productDisplayName,
      description: seoDescription,
      image: product.image_url,
      images: (product.images || []).filter(Boolean),
      price: displayPrice,
      slug: product.slug,
      category: product.categories?.name,
      sku: (product as any).sku || product.slug,
      originalPrice: displayOriginalPrice,
      inStock: true,
      ...(reviewStats ? { rating: reviewStats.avg, reviewCount: reviewStats.count } : {}),
    }),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Shop', url: '/shop' },
      ...(product.categories ? [{ name: product.categories.name, url: `/shop?category=${product.categories.slug}` }] : []),
      { name: productDisplayName, url: `/product/${product.slug}` },
    ]),
    softwareApplicationSchema({
      name: productDisplayName,
      description: seoDescription,
      image: product.image_url,
      slug: product.slug,
      price: displayPrice,
      category: product.categories?.name,
      ...(reviewStats ? { rating: reviewStats.avg, reviewCount: reviewStats.count } : {}),
    }),
    speakableSchema(['h1', '.product-title', '.product-description', '.lead']),
    ...(faqs.length > 0 ? [faqSchema(faqs)] : []),
    ...(topReviews.length > 0 ? reviewSchema(productDisplayName, product.slug, topReviews) : []),
  ];

  const breadcrumbItems = [
    { label: 'Shop', href: '/shop' },
    ...(product.categories ? [{ label: product.categories.name, href: `/shop?category=${product.categories.slug}` }] : []),
    { label: productDisplayName },
  ];

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        ogImage={product.image_url || undefined}
        ogImages={(product.images || []).filter(Boolean)}
        ogType="product"
        canonical={`https://shahedstore.com.bd/product/${product.slug}`}
        schema={seoSchemas}
        keywords={seoKeywords}
      />

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* ── Breadcrumb ── */}
        <div
          className="container-fluid pt-6"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'none' : 'translateY(-10px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* ── Main Content ── */}
        <div className="container-fluid py-8">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-10 xl:gap-16">

            {/* ═══ LEFT: Image Gallery ═══ */}
            <div className="space-y-4">
              {/* Main Image with cinematic entrance */}
            <div
                className={`relative rounded-3xl overflow-hidden border aspect-square group${entered ? ' rainbow-glow-border' : ''}`}
                style={{
                  background: 'linear-gradient(155deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.60) 100%)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  borderColor: 'transparent',
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateX(-40px) scale(0.95)',
                  transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                {/* Gradient top border */}
                <div className="h-[2px] w-full absolute top-0 left-0 z-10"
                  style={{ background: 'linear-gradient(90deg, hsl(258,78%,55%), hsl(200,90%,45%))' }} />

                {/* Shimmer sweep on load */}
                {entered && <div className="neon-sweep-line" />}

                {!imgLoaded && <div className="absolute inset-0 shimmer" />}
                <img
                  key={images[activeImg]}
                  src={images[activeImg]}
                  alt={(product as any).image_alt || `${productDisplayName} price in Bangladesh - Shahed Store`}
                  title={`${productDisplayName} - ৳${displayPrice.toLocaleString()} | Shahed Store Bangladesh`}
                  width={800}
                  height={800}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onLoad={() => setImgLoaded(true)}
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  style={{ opacity: imgLoaded ? 1 : 0 }}
                />


                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {discount > 0 && (
                    <span className="badge-pop badge-sale" style={{ animationDelay: '0.5s' }}>
                      -{discount}% OFF
                    </span>
                  )}
                  {product.is_featured && (
                    <span className="badge-pop badge-hot-item flex items-center gap-1" style={{ animationDelay: '0.65s' }}>
                      <Zap size={10} fill="white" /> HOT
                    </span>
                  )}
                </div>

                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={prevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid hsla(258,78%,60%,0.25)', color: 'hsl(258,78%,50%)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px hsla(258,78%,55%,0.15)' }}>
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                      style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid hsla(258,78%,60%,0.25)', color: 'hsl(258,78%,50%)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px hsla(258,78%,55%,0.15)' }}>
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(cartItem)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 z-10"
                  style={{
                    background: wishlisted ? 'hsla(320,90%,62%,0.15)' : 'rgba(255,255,255,0.80)',
                    border: `1px solid ${wishlisted ? 'hsla(320,90%,62%,0.45)' : 'hsla(258,78%,60%,0.20)'}`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 12px hsla(258,78%,55%,0.10)',
                  }}>
                  <Heart size={16} fill={wishlisted ? 'hsl(320,90%,62%)' : 'none'} color={wishlisted ? 'hsl(320,90%,62%)' : 'hsl(var(--muted-foreground))'} />
                </button>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div
                  className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
                  style={{
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(20px)',
                    transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.25s',
                  }}
                >
                  {images.map((img, i) => (
                    <button key={i} onClick={() => { setActiveImg(i); setImgLoaded(false); }}
                      className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${activeImg === i ? 'border-primary shadow-[0_0_16px_hsla(271,91%,65%,0.5)]' : 'border-border hover:border-primary/50'}`}>
                      <img src={img} alt={(product as any).image_alt || `${productDisplayName} price in Bangladesh - Shahed Store`} title={`${productDisplayName} gallery image ${i + 1}`} width={160} height={160} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* ═══ DBID Premium Trust Banner ═══ */}
              <div
                className="relative w-full"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'translateY(0)' : 'translateY(16px)',
                  transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1) 0.9s, transform 0.6s cubic-bezier(0.22,1,0.36,1) 0.9s',
                  paddingRight: '14px', // room for floating logo card overhang
                }}
              >
                <a
                  href="https://dbid.gov.bd/verify/586772174"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Verify DBID 586772174 — Government of Bangladesh"
                  className="group relative flex items-stretch rounded-[18px] overflow-visible"
                  style={{
                    background: '#ffffff',
                    // double gradient border using padding trick
                    boxShadow:
                      '0 1px 0 #ffffff inset, 0 0 0 1px rgba(255,255,255,0.9) inset, 0 8px 28px rgba(124,58,237,0.12), 0 2px 6px rgba(168,85,247,0.08)',
                    border: '2px solid transparent',
                    backgroundImage:
                      'linear-gradient(#ffffff,#ffffff), linear-gradient(135deg, hsl(280,85%,65%) 0%, hsl(258,90%,55%) 50%, hsl(300,75%,60%) 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                  }}
                >
                  {/* ── LEFT: Ribbon medal + Certified text ── */}
                  <div className="flex items-center gap-2 lg:gap-3 pl-2.5 lg:pl-4 pr-2 lg:pr-4 py-2.5 lg:py-3.5 flex-1 min-w-0">
                    {/* Gold Certified ribbon badge */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={certifiedBadge.url}
                        alt="DBID Certified Badge"
                         className="w-10 h-12 lg:w-[52px] lg:h-[60px] object-contain"
                        style={{ filter: 'drop-shadow(0 3px 6px rgba(220,38,38,0.28)) drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }}
                      />
                    </div>


                    {/* Certified text */}
                     <div className="flex flex-col leading-tight min-w-0">
                       <div className="flex items-baseline gap-1 lg:gap-1.5 flex-nowrap min-w-0">
                        <span
                          className="text-[12px] lg:text-[16px] font-extrabold tracking-normal whitespace-nowrap"
                          style={{ color: '#ea580c', fontFamily: 'Sora, sans-serif' }}
                        >
                          Certified
                        </span>
                        <span
                          className="text-[11px] lg:text-[15px] font-bold italic whitespace-nowrap"
                          style={{ color: '#1f2937', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                        >
                          by DBID
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5 whitespace-nowrap">
                        <span
                          className="text-[9px] lg:text-[11px] font-semibold"
                          style={{ color: '#374151', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                        >
                          ID:
                        </span>
                        <span
                          className="text-[10px] lg:text-[12px] font-extrabold tabular-nums tracking-normal"
                          style={{ color: '#f97316', fontFamily: 'Sora, sans-serif' }}
                        >
                          586772174
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Vertical separator ── */}
                  <div
                    className="w-px my-2.5 lg:my-3.5 flex-shrink-0"
                    style={{ background: 'linear-gradient(180deg, transparent, #fdba74 30%, #fdba74 70%, transparent)' }}
                  />


                  {/* ── MIDDLE: Digital Business + Verify CTA ── */}
                  <div className="flex flex-col justify-center px-2 lg:px-4 py-2.5 lg:py-3.5 flex-[1.1] min-w-0">
                    <div className="flex items-baseline gap-1 flex-nowrap min-w-0">
                      <span
                        className="text-[10px] lg:text-[13px] font-extrabold leading-tight whitespace-nowrap"
                        style={{
                          background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontFamily: 'Sora, sans-serif',
                        }}
                      >
                        Digital Business
                      </span>
                    </div>
                    <div
                      className="text-[9px] lg:text-[11px] font-bold leading-tight mt-0.5 whitespace-nowrap"
                      style={{ color: '#1f2937', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                    >
                      Identification Number
                    </div>
                    <div className="flex items-center gap-1 mt-1 lg:mt-1.5">
                      <span
                        className="text-[8px] lg:text-[10px] font-semibold underline-offset-2 group-hover:underline decoration-orange-400 whitespace-nowrap"
                        style={{ color: '#4b5563', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                      >
                        Click here to verify
                      </span>
                      {/* Cursor + spark icon */}
                      <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M5 3 L5 17 L9 13 L12 20 L14 19 L11 12 L17 12 Z" fill="#f97316" stroke="#ea580c" strokeWidth="0.6" strokeLinejoin="round" />
                        <g stroke="#fb923c" strokeWidth="1.2" strokeLinecap="round">
                          <line x1="19" y1="5" x2="22" y2="3" />
                          <line x1="20" y1="9" x2="23" y2="9" />
                          <line x1="17" y1="6" x2="18" y2="3" />
                        </g>
                      </svg>
                    </div>
                  </div>

                </a>

                {/* ── RIGHT: Floating Shahed Store logo card (overhangs right) ── */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-[16%] lg:translate-x-[20%]"
                  style={{ filter: 'drop-shadow(0 4px 10px rgba(124,58,237,0.18))' }}
                >
                  <div
                    className="relative w-[56px] h-[56px] lg:w-[80px] lg:h-[80px] rounded-2xl flex items-center justify-center overflow-hidden"

                    style={{
                      background: '#ffffff',
                      border: '2px solid transparent',
                      backgroundImage:
                        'linear-gradient(#ffffff,#ffffff), linear-gradient(135deg, hsl(280,85%,65%) 0%, hsl(258,90%,55%) 50%, hsl(300,75%,60%) 100%)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(124,58,237,0.10)',
                    }}
                  >
                    <img
                      src={brandIcon}
                      alt="Shahed Store — DBID Verified Merchant"
                      className="w-[82%] h-[82%] object-contain relative z-10"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(124,58,237,0.20))',
                        animation: 'gentle-float 3.5s ease-in-out infinite',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>


            {/* ═══ RIGHT: Product Info ═══ */}
            <div className="flex flex-col gap-5">

              {/* ── Glass Info Card: Title + Short Desc + Rating + Price ── */}
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{
                  background: 'linear-gradient(155deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.68) 100%)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  border: '1px solid hsla(258,78%,60%,0.22)',
                  boxShadow: '0 8px 40px hsla(258,78%,55%,0.12), 0 1px 0 rgba(255,255,255,0.95) inset',
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(28px)',
                  transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s',
                }}
              >
                {/* Top shimmer line */}
                <div className="h-[2px] w-full absolute top-0 left-0 z-10"
                  style={{ background: 'linear-gradient(90deg, hsl(258,78%,55%), hsl(185,90%,52%), hsl(258,78%,55%))' }} />

                <div className="px-5 pt-5 pb-4">
                  {/* Category + Share row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-fira font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{ color: 'hsl(185,90%,42%)', background: 'hsla(185,90%,52%,0.12)', border: '1px solid hsla(185,90%,52%,0.25)' }}>
                      {product.categories?.name || 'Digital Product'}
                    </span>
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                      style={{ color: copied ? 'hsl(158,80%,45%)' : 'hsl(226,25%,45%)', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid hsla(258,78%,60%,0.18)', boxShadow: '0 2px 8px hsla(258,78%,55%,0.08)' }}>
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Share</>}
                    </button>
                  </div>

                  {/* Title */}
                  <h1 className="font-sora font-black text-2xl sm:text-3xl leading-tight mb-2"
                    style={{ color: 'hsl(226,35%,14%)' }}>
                    {productDisplayName}
                  </h1>

                  {/* Short Description — bullet list */}
                  {shortDescription && (() => {
                    const lines = shortDescription
                      .split('\n')
                      .map(l => l.replace(/^[-•*]\s*/, '').trim())
                      .filter(Boolean);
                    return lines.length > 1 ? (
                      <ul className="mb-3 space-y-1.5">
                        {lines.map((line, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                            <span className="mt-[3px] flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: 'hsla(258,78%,55%,0.12)', border: '1px solid hsla(258,78%,55%,0.28)' }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(258,78%,55%)' }} />
                            </span>
                            <span style={{ color: 'hsl(226,25%,38%)' }}>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm leading-relaxed mb-3" style={{ color: 'hsl(226,25%,42%)' }}>
                        {shortDescription}
                      </p>
                    );
                  })()}

                  {/* Thin divider */}
                  <div className="h-px mb-3" style={{ background: 'linear-gradient(90deg, hsla(258,78%,60%,0.15), hsla(185,90%,52%,0.15), transparent)' }} />

                  {/* Rating + Sales + Stock */}
                  <div className="flex items-center flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} fill="hsl(38,100%,55%)" color="hsl(38,100%,55%)" />
                      ))}
                      <span className="text-sm font-semibold ml-1" style={{ color: 'hsl(226,35%,18%)' }}>4.9</span>
                    </div>
                    <span className="w-1 h-1 rounded-full" style={{ background: 'hsl(226,25%,75%)' }} />
                    <span className="text-sm" style={{ color: 'hsl(226,25%,48%)' }}>{(product.total_sales || 0) + 50}+ sold</span>
                    <span className="w-1 h-1 rounded-full" style={{ background: 'hsl(226,25%,75%)' }} />
                    {outOfStock ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ color: 'hsl(0,80%,42%)', background: 'hsla(0,80%,55%,0.12)', border: '1px solid hsla(0,80%,55%,0.28)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(0,80%,55%)' }} /> Stock Out
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ color: 'hsl(158,80%,38%)', background: 'hsla(158,80%,48%,0.12)', border: '1px solid hsla(158,80%,48%,0.28)' }}>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> In Stock
                      </span>
                    )}
                  </div>

                  {/* Price row — always single line on every device */}
                  <div className="flex items-end flex-nowrap gap-2 sm:gap-3 py-3 px-3 sm:px-4 rounded-2xl overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, hsla(258,78%,55%,0.07) 0%, hsla(185,90%,52%,0.05) 100%)', border: '1px solid hsla(258,78%,60%,0.14)' }}>
                    <span className="font-sora font-black whitespace-nowrap text-[26px] sm:text-3xl md:text-4xl flex-shrink-0" style={{ color: 'hsl(258,78%,42%)' }}>
                      {fmtPrice(displayPrice)}
                    </span>
                    {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                      <div className="flex flex-col min-w-0 flex-shrink">
                        <div className="text-sm sm:text-base md:text-lg line-through whitespace-nowrap" style={{ color: 'hsl(226,25%,62%)' }}>{fmtPrice(displayOriginalPrice)}</div>
                        {savings > 0 && (
                          <div className="text-[10px] sm:text-xs font-bold whitespace-nowrap" style={{ color: 'hsl(40,100%,48%)' }}>
                            Save {fmtPrice(savings)}
                          </div>
                        )}
                      </div>
                    )}
                    {discount > 0 && (
                      <span className="ml-auto text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                        style={{ color: 'hsl(0,85%,55%)', background: 'hsla(0,85%,55%,0.10)', border: '1px solid hsla(0,85%,55%,0.25)' }}>
                        -{discount}% OFF
                      </span>
                    )}
                  </div>
                  {activeCurrency && activeCurrency.code !== 'BDT' && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
                      ≈ ৳{displayPrice.toLocaleString()} · Payment settled in BDT
                    </p>
                  )}

                </div>
              </div>

              {/* ── Duration Plans Selector ── */}
              {durationPlans.length > 0 && (
                <div
                  style={{
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(16px)',
                    transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.38s',
                  }}
                >
                  <p className="text-sm font-semibold mb-3" style={{ color: 'hsl(226,35%,28%)' }}>
                    মেয়াদ ও মূল্য পরিকল্পনা
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {durationPlans.map((plan, idx) => {
                      const planPrice = parseFloat(plan.price) || 0;
                      const planOriginal = plan.original_price ? parseFloat(plan.original_price) : null;
                      const planSavings = planOriginal && planOriginal > planPrice ? planOriginal - planPrice : 0;
                      const planDiscount = planOriginal && planOriginal > planPrice ? Math.round(planSavings / planOriginal * 100) : 0;
                      const isSel = selectedPlanIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPlanIdx(idx)}
                          className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-3 rounded-2xl border-2 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                          style={isSel ? {
                            borderColor: 'hsl(258,78%,55%)',
                            background: 'linear-gradient(135deg, hsla(258,78%,55%,0.10) 0%, hsla(185,90%,52%,0.07) 100%)',
                            boxShadow: '0 0 0 3px hsla(258,78%,55%,0.12)',
                          } : {
                            borderColor: 'hsla(220,20%,82%,0.9)',
                            background: 'rgba(255,255,255,0.65)',
                            backdropFilter: 'blur(12px)',
                          }}
                        >
                          {/* Left: duration + check */}
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                              style={{ borderColor: isSel ? 'hsl(258,78%,55%)' : 'hsl(220,20%,75%)' }}>
                              {isSel && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(258,78%,55%)' }} />}
                            </div>
                            <span className="font-bold text-[13px] sm:text-sm truncate" style={{ color: isSel ? 'hsl(258,78%,42%)' : 'hsl(226,35%,22%)' }}>
                              {plan.duration}
                            </span>
                          </div>
                          {/* Right: price — always one line */}
                          <div className="flex items-center gap-1.5 text-right flex-shrink-0 whitespace-nowrap">
                            {planOriginal && planOriginal > planPrice && (
                              <span className="text-[11px] sm:text-xs line-through" style={{ color: 'hsl(226,25%,65%)' }}>{fmtPrice(planOriginal)}</span>
                            )}
                            <span className="font-black text-sm sm:text-base font-sora" style={{ color: 'hsl(258,78%,42%)' }}>
                              {fmtPrice(planPrice)}
                            </span>
                            {planDiscount > 0 && (
                              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ color: 'hsl(0,85%,52%)', background: 'hsla(0,85%,55%,0.10)', border: '1px solid hsla(0,85%,55%,0.20)' }}>
                                -{planDiscount}%
                              </span>
                            )}
                          </div>
                        </button>

                      );
                    })}
                  </div>
                </div>
              )}
              {customGroups.map((group, gi) => {
                const rawSel = selectedOpts[group.id];
                const isMulti = group.allow_multiple;
                const selIds: string[] = isMulti
                  ? (Array.isArray(rawSel) ? rawSel : [])
                  : (typeof rawSel === 'string' && rawSel
                      ? [rawSel]
                      : [(group.values.find(x => x.is_default) || group.values[0])?.id].filter(Boolean) as string[]);
                const isValueSelected = (vid: string) => selIds.includes(vid);

                const toggleMulti = (vid: string) => {
                  setSelectedOpts(p => {
                    const cur = Array.isArray(p[group.id]) ? (p[group.id] as string[]) : [];
                    const next = cur.includes(vid) ? cur.filter(x => x !== vid) : [...cur, vid];
                    return { ...p, [group.id]: next };
                  });
                };
                const pickSingle = (vid: string) => setSelectedOpts(p => ({ ...p, [group.id]: vid }));

                return (
                  <div
                    key={group.id}
                    style={{
                      opacity: entered ? 1 : 0,
                      transform: entered ? 'none' : 'translateY(16px)',
                      transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${0.44 + gi * 0.08}s`,
                    }}
                  >
                    {/* Group label */}
                    <p className="text-sm font-medium text-muted-foreground mb-2.5 flex items-center gap-2">
                      <span>{group.name}</span>
                      {isMulti && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'hsla(258,78%,55%,0.10)', color: 'hsl(258,78%,55%)', border: '1px solid hsla(258,78%,55%,0.25)' }}>
                          একাধিক নির্বাচন করা যাবে
                        </span>
                      )}
                    </p>

                    {/* Dropdown display — single-select only */}
                    {group.display_type === 'dropdown' && !isMulti && (
                      <select
                        value={(typeof rawSel === 'string' ? rawSel : '') || ''}
                        onChange={e => pickSingle(e.target.value)}
                        className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      >
                        {group.values.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.label}{v.price_adjustment > 0 ? ` — ${fmtPrice(v.price_adjustment)}` : ''}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Radio / checkbox list display */}
                    {(group.display_type === 'radio' || (group.display_type === 'dropdown' && isMulti)) && (
                      <div className="space-y-2">
                        {group.values.map(v => {
                          const isSel = isValueSelected(v.id);
                          return (
                            <label
                              key={v.id}
                              className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
                              style={{
                                borderColor: isSel ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
                                background: isSel ? 'hsla(var(--foreground) / 0.06)' : 'transparent',
                              }}
                              onClick={(e) => { e.preventDefault(); isMulti ? toggleMulti(v.id) : pickSingle(v.id); }}
                            >
                              <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isMulti ? 'rounded-[4px]' : 'rounded-full'} ${isSel ? 'border-foreground' : 'border-border'}`}>
                                {isSel && (isMulti
                                  ? <Check size={11} strokeWidth={3} className="text-foreground" />
                                  : <div className="w-2 h-2 rounded-full bg-foreground" />)}
                              </div>
                              <span className="text-sm font-semibold text-foreground flex-1">{v.label}</span>
                              {v.price_adjustment > 0 && (
                                <span className="text-xs font-semibold text-muted-foreground">+৳{v.price_adjustment.toLocaleString()}</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Button/chip display (default) */}
                    {group.display_type === 'button' && (
                      <div className="flex flex-wrap gap-2">
                        {group.values.map(v => {
                          const isSel = isValueSelected(v.id);
                          return (
                            <button
                              key={v.id}
                              onClick={() => isMulti ? toggleMulti(v.id) : pickSingle(v.id)}
                              className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-1.5"
                              style={isSel
                                ? { borderColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))', background: 'hsl(var(--foreground))' }
                                : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }
                              }
                            >
                              {isMulti && isSel && <Check size={13} strokeWidth={3} />}
                              <span>{v.label}</span>
                              {v.price_adjustment > 0 && (
                                <span className="text-[11px] font-bold opacity-80">+৳{v.price_adjustment.toLocaleString()}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Legacy Variants (JSONB fallback) — hidden when new system active ── */}
              {customGroups.length === 0 && legacyVariants.map((group, vi) => {
                const selectedLabel = selectedVar[group.name] || group.options[0]?.label;
                return (
                  <div
                    key={group.name + vi}
                    style={{
                      opacity: entered ? 1 : 0,
                      transform: entered ? 'none' : 'translateY(16px)',
                      transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${0.44 + vi * 0.08}s`,
                    }}
                  >
                    <p className="text-sm font-medium text-muted-foreground mb-2.5">{group.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const isSelected = selectedLabel === opt.label;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => setSelectedVar(p => ({ ...p, [group.name]: opt.label }))}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:scale-[1.03] active:scale-95"
                            style={isSelected
                              ? { borderColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))', background: 'hsl(var(--foreground))' }
                              : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', background: 'transparent' }
                            }
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Quantity selector */}
              <div
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(12px)',
                  transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1) 0.52s',
                }}
              >
                <p className="text-sm font-medium text-muted-foreground mb-2.5">Quantity</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-11 h-11 flex items-center justify-center text-lg font-bold text-foreground hover:bg-muted/50 transition-colors"
                    >−</button>
                    <span className="w-12 text-center font-bold text-base text-foreground">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-11 h-11 flex items-center justify-center text-lg font-bold text-foreground hover:bg-muted/50 transition-colors"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* CTA Buttons — Animated Gradient Border Glassmorphism Card */}
              <div
                className="cta-card-shell"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'none' : 'translateY(28px)',
                  transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.5s',
                }}
              >
                <div className="cta-card-inner space-y-2.5">
                  {/* Shimmer line */}
                  <div className="h-px w-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, hsla(258,78%,65%,0.70) 30%, hsla(200,90%,65%,0.70) 70%, transparent 100%)' }} />

                  {outOfStock && (
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-black tracking-wide text-white"
                      style={{
                        background: 'linear-gradient(135deg, hsl(0,80%,55%), hsl(15,90%,55%))',
                        boxShadow: '0 4px 16px hsla(0,80%,55%,0.35)',
                        letterSpacing: '0.06em',
                      }}>
                      ⚠️ STOCK OUT — এখন কিনতে পারবেন না
                    </div>
                  )}

                  {/* Buy Now — full-width primary (or Pre-order when out of stock) */}
                  {outOfStock ? (
                    <button
                      onClick={waPreOrder}
                      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, hsl(0,80%,55%), hsl(15,90%,55%))',
                        boxShadow: '0 4px 24px hsla(0,80%,55%,0.35), 0 1px 0 rgba(255,255,255,0.4) inset',
                        letterSpacing: '0.02em',
                      }}
                    >
                      <MessageCircle size={18} strokeWidth={2.5} /> Pre-order via WhatsApp
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (outOfStock) return;
                        // Add to cart + go straight to the dedicated /checkout route.
                        // Guest checkout is supported end-to-end there, and all form
                        // state is preserved in localStorage across auth round-trips.
                        addToCart(cartItem, quantity);
                        navigate('/checkout');
                      }}
                      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(245,243,255,0.82) 50%, rgba(235,245,255,0.88) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1.5px solid rgba(255,255,255,0.95)',
                        boxShadow: '0 4px 24px hsla(258,78%,55%,0.18), 0 1px 0 rgba(255,255,255,1) inset, 0 -1px 0 hsla(258,78%,55%,0.08) inset',
                        color: 'hsl(258,78%,48%)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      <CreditCard size={18} strokeWidth={2.5} /> Buy Now
                    </button>

                  )}

                  {/* WhatsApp + Cart — row */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* WhatsApp — always active so customers can talk about the product */}
                    <button onClick={outOfStock ? waPreOrder : waOrder}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(243,242,255,0.76) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1.5px solid rgba(255,255,255,0.90)',
                        boxShadow: '0 2px 16px hsla(258,78%,55%,0.12), 0 1px 0 rgba(255,255,255,1) inset',
                        color: 'hsl(258,78%,48%)',
                      }}>
                      <MessageCircle size={15} strokeWidth={2.5} /> WhatsApp
                    </button>

                    {/* Cart — disabled when out of stock */}
                    <button
                      disabled={outOfStock}
                      onClick={() => { if (outOfStock) return; addToCart(cartItem, quantity); }}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        background: inCart
                          ? 'linear-gradient(135deg, rgba(240,255,248,0.88) 0%, rgba(230,250,255,0.82) 100%)'
                          : 'linear-gradient(135deg, rgba(235,248,255,0.88) 0%, rgba(230,242,255,0.82) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1.5px solid rgba(255,255,255,0.90)',
                        boxShadow: inCart
                          ? '0 2px 16px hsla(162,72%,46%,0.18), 0 1px 0 rgba(255,255,255,1) inset'
                          : '0 2px 16px hsla(200,90%,45%,0.15), 0 1px 0 rgba(255,255,255,1) inset',
                        color: inCart ? 'hsl(162,72%,38%)' : 'hsl(200,90%,38%)',
                      }}
                    >
                      <ShoppingCart size={15} strokeWidth={2.5} />
                      {outOfStock ? 'Out of Stock' : (inCart ? '✓ Added' : 'Cart')}
                    </button>
                  </div>
                </div>
              </div>


              {/* What You Get */}
              {product.what_you_get && product.what_you_get.length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid hsla(258,78%,75%,0.22)',
                    boxShadow: '0 4px 24px hsla(258,78%,55%,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(20px)',
                    transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.64s',
                  }}
                >
                  <h3 className="font-sora font-bold text-base flex items-center gap-2 mb-4" style={{ color: 'hsl(226,35%,18%)' }}>
                    <Package size={16} style={{ color: 'hsl(258,78%,55%)' }} /> What You'll Get
                  </h3>
                  <ul className="space-y-2.5">
                    {product.what_you_get.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm"
                        style={{
                          color: 'hsl(226,25%,35%)',
                          opacity: entered ? 1 : 0,
                          transform: entered ? 'none' : 'translateX(-12px)',
                          transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${0.7 + i * 0.07}s`,
                        }}>
                        <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'hsl(158,80%,45%)' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Free Download — visible to everyone when admin has set a download link */}
              {product.download_link && (
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.60) 100%)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid hsla(158,80%,45%,0.30)',
                    boxShadow: '0 4px 24px hsla(158,80%,45%,0.12), 0 1px 0 rgba(255,255,255,0.9) inset',
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'none' : 'translateY(20px)',
                    transition: 'all 0.65s cubic-bezier(0.22,1,0.36,1) 0.72s',
                  }}
                >
                  <h3 className="font-sora font-bold text-base flex items-center gap-2 mb-1.5" style={{ color: 'hsl(226,35%,18%)' }}>
                    <Download size={16} style={{ color: 'hsl(158,80%,42%)' }} /> Software Download
                  </h3>
                  <p className="text-xs mb-4" style={{ color: 'hsl(226,20%,42%)' }}>
                    Official setup file — free download। Purchase করার পর license key দিয়ে activate করুন।
                  </p>
                  <a
                    href={product.download_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-95 hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, hsl(158,80%,42%), hsl(178,75%,40%))',
                      boxShadow: '0 6px 20px hsla(158,80%,42%,0.30)',
                    }}
                  >
                    <Download size={15} /> Download Now
                    <ExternalLink size={12} className="opacity-80" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom: Description + FAQ (stacked) ── */}
          <div className="mt-14 space-y-8">

            {/* Description — full width */}
            <div
              ref={descReveal.ref}
              style={{
                opacity: 1,
                transform: 'none',
                transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2 mb-5">
                <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />
                {description ? 'Product Description' : 'Why Choose This Product?'}
              </h2>
              <div
                className="rounded-2xl p-6 text-sm leading-relaxed"
                style={{
                  background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid hsla(258,78%,75%,0.22)',
                  boxShadow: '0 4px 24px hsla(258,78%,55%,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
                  color: 'hsl(226,25%,40%)',
                }}
              >
                {description ? (
                  <div className="prose prose-sm max-w-none
                    prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                    prose-h2:text-base prose-h3:text-sm
                    prose-p:text-[hsl(226,25%,40%)] prose-p:mb-2 prose-p:leading-relaxed
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-ul:pl-4 prose-ul:space-y-1
                    prose-li:text-[hsl(226,25%,40%)] prose-li:leading-relaxed
                    prose-a:text-primary">
                  <Suspense fallback={<div className="h-20 shimmer rounded-xl" />}>
                      <ReactMarkdown>{fixPunctuation(description)}</ReactMarkdown>
                    </Suspense>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {[
                      { icon: '✅', text: '100% Genuine & Original License — directly from official source' },
                      { icon: '⚡', text: 'Instant Digital Delivery — received within 5–30 minutes after payment' },
                      { icon: '🔒', text: 'Lifetime Activation — one-time purchase, no subscription needed' },
                      { icon: '🛡️', text: 'After-sales Support — our team is available 24/7 to help you activate' },
                      { icon: '💳', text: 'Easy Payment — BKash, Nagad, Rocket, Card & more options available' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3"
                        style={{
                          opacity: descReveal.visible ? 1 : 0,
                          transform: descReveal.visible ? 'none' : 'translateX(-12px)',
                          transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.08}s`,
                        }}>
                        <span className="text-base">{item.icon}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* FAQ — full width, below description */}
            {faqs.length > 0 && (
              <div className="animate-fade-in">
                <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2 mb-5">
                  <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />
                  FAQ
                </h2>
                <div className="space-y-3">
                  {faqs.map((f, i) => (
                    <FAQItem key={i} q={f.q} a={f.a} delay={i * 0.07} revealed={true} />
                  ))}
                </div>
              </div>
            )}

          {/* ── Specifications table from attributes ── */}
          <ProductSpecsTable productId={product.id} />
          </div>
        </div>

        {/* ── SEO long-form description (300+ words, mixed BN/EN, H2/H3) ── */}
        <ProductSeoDescription
          productName={productDisplayName}
          categoryName={product.categories?.name || 'Digital Software'}
          price={displayPrice}
        />

        {/* ── Customer Reviews ── */}
        <ProductReviews productId={product.id} productSlug={product.slug} />

        {/* ── Related Products ── */}
        <RelatedProducts categoryId={product.category_id} currentProductId={product.id} />

        {/* ── Recently Viewed ── */}
        <RecentlyViewed currentProductId={product.id} />

        <Footer />
      </div>

      {showModal && (
        <QuickOrderModal
          product={{ id: product.id, name: productDisplayName, price: displayPrice, originalPrice: displayOriginalPrice || undefined, image: product.image_url || PLACEHOLDER, category: product.categories?.name || '', customFields: Array.isArray((product as any).custom_fields) ? (product as any).custom_fields : [] }}
          onClose={() => setShowModal(false)}
          quantity={quantity}
        />
      )}
    </>
  );
};

// ── SEO Long Description (300+ words, mixed BN/EN) ──────────
const ProductSeoDescription = ({
  productName, categoryName, price,
}: { productName: string; categoryName: string; price: number }) => {
  const priceStr = `৳${price.toLocaleString()}`;
  return (
    <section
      className="container-fluid pt-6 pb-4"
      aria-label={`About ${productName}`}
      itemScope
      itemType="https://schema.org/Article"
    >
      <div className="border-t border-border mb-8" />
      <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-sora prose-headings:font-bold prose-p:text-[15px] prose-p:leading-[1.85] prose-li:leading-[1.85]">
        <h2 className="text-2xl mb-4">Why buy {productName} from Shahed Store</h2>
        <p>
          <strong>{productName}</strong> কিনতে চাইলে বাংলাদেশে সবচেয়ে বিশ্বস্ত এবং সাশ্রয়ী ঠিকানা হলো <strong>Shahed Store</strong>। আমরা ২০২০ সাল থেকে বাংলাদেশের হাজার হাজার গ্রাহককে ১০০% জেনুইন <em>{categoryName}</em> লাইসেন্স সরবরাহ করে আসছি। প্রতিটি লাইসেন্স key সরাসরি অথরাইজড ডিস্ট্রিবিউটর এবং official partner থেকে সংগ্রহ করা হয় — তাই activation ও lifetime validity নিয়ে কোনো দুশ্চিন্তা নেই। আমাদের কাছে {productName} এর দাম মাত্র <strong>{priceStr} BDT</strong>, যা বাংলাদেশের বাজারে অন্যতম কম দাম।
        </p>
        <p>
          Unlike random Facebook sellers, Shahed Store একটি registered digital software shop যেখানে আপনি পাবেন proper invoice, activation guide এবং <strong>lifetime after-sales support</strong> সম্পূর্ণ বাংলায়। কোনো activation issue হলে আমাদের support team ২৪/৭ WhatsApp, live chat এবং Telegram এ পাশে আছে। এছাড়াও আমরা <strong>7 days replacement guarantee</strong> দিই — যদি কোনো কারণে license কাজ না করে, তাহলে সাথে সাথে replacement অথবা full refund পাবেন।
        </p>

        <h3 className="text-xl mt-8 mb-3">How delivery works</h3>
        <p>
          Payment confirm হওয়ার সাথে সাথে আমাদের automated system আপনার <strong>{productName}</strong> license key এবং activation instructions তৈরি করে ফেলে। সাধারণত <strong>১-১৫ মিনিটের</strong> মধ্যে আপনি email এ complete delivery পেয়ে যাবেন। যদি office hour (সকাল ৯টা - রাত ১২টা) এর মধ্যে অর্ডার করেন তাহলে instant delivery নিশ্চিত। এছাড়া আপনার Shahed Store dashboard এর <strong>My Licenses</strong> section এ যেকোনো সময় license key দেখতে পারবেন এবং backup হিসেবে সংরক্ষণ করতে পারবেন।
        </p>
        <ul>
          <li>💳 <strong>Payment methods:</strong> bKash, Nagad, Rocket, DBBL bank transfer, PayPal, SSLCommerz</li>
          <li>⚡ <strong>Delivery time:</strong> Instant থেকে ২৪ ঘণ্টার মধ্যে (average ১৫ মিনিট)</li>
          <li>📩 <strong>Delivery method:</strong> Email + Dashboard + WhatsApp notification</li>
          <li>🔒 <strong>Genuine guarantee:</strong> ১০০% original license, officially activated</li>
        </ul>

        <h3 className="text-xl mt-8 mb-3">System requirements & compatibility</h3>
        <p>
          {productName} ব্যবহার করার আগে নিশ্চিত করুন আপনার device এর হার্ডওয়্যার ও operating system requirement পূরণ করছে। সাধারণ <em>{categoryName}</em> product গুলোর জন্য আপনার প্রয়োজন হবে stable internet connection, minimum 4GB RAM এবং কমপক্ষে 2GB ফ্রি storage space। কিছু software শুধু Windows 10/11 বা macOS এর নির্দিষ্ট version এ চলে — কেনার আগে <strong>Product Specifications</strong> tab এ compatibility check করে নিন। কোনো confusion থাকলে আমাদের support কে জিজ্ঞেস করুন, আমরা আপনার device অনুযায়ী best plan suggest করব।
        </p>

        <h3 className="text-xl mt-8 mb-3">Payment, warranty & after-sales support</h3>
        <p>
          Bangladesh এর সকল popular payment gateway আমরা সাপোর্ট করি। বিকাশ, নগদ, রকেট এর মাধ্যমে instant payment করতে পারবেন, অথবা DBBL bank transfer এর মাধ্যমেও পেমেন্ট করা যাবে। আন্তর্জাতিক গ্রাহকদের জন্য PayPal এবং card payment রয়েছে। প্রতিটি transaction SSL-encrypted এবং আমরা আপনার payment information কখনও store করি না।
        </p>
        <p>
          আপনি যদি {productName} সম্পর্কে আরও জানতে চান, দাম নিয়ে আলোচনা করতে চান বা bulk quantity তে কিনতে চান — সরাসরি আমাদের WhatsApp <strong>+880 1840-099853</strong> নম্বরে message করুন। Reseller price এবং corporate deal এর জন্যও আমরা special discount দিয়ে থাকি। Shahed Store — বাংলাদেশের <strong>#1 digital software shop</strong>, genuine software কিনুন নিশ্চিন্তে।
        </p>
      </article>
    </section>
  );
};


interface RelatedProduct {
  id: string; name: string; slug: string; price: number;
  original_price: number | null; discount_percent: number | null;
  image_url: string | null; is_featured: boolean | null;
  tags: string[] | null;
  categories: { name: string } | null;
}

const ITEMS_PER_PAGE = 4;

const RelatedProducts = ({ categoryId, currentProductId }: { categoryId: string | null; currentProductId: string }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage] = useState(0);
  const sectionReveal = useReveal({ threshold: 0.05 });

  useEffect(() => {
    const query = supabase
      .from('products')
      .select('id, name, slug, price, original_price, discount_percent, image_url, is_featured, tags, category:category_id(name)')
      .eq('status', 'active')
      .neq('id', currentProductId)
      .limit(8);

    if (categoryId) {
      query.eq('category_id', categoryId);
    }

    query.then(({ data }) => {
      setProducts((data as any[]) || []);
      setLoading(false);
    });
  }, [categoryId, currentProductId]);

  if (!loading && products.length === 0) return null;

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const visible = products.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  return (
    <div
      ref={sectionReveal.ref}
      className="container-fluid pt-2 pb-8"
      style={{
        opacity: sectionReveal.visible ? 1 : 0,
        transform: sectionReveal.visible ? 'none' : 'translateY(30px)',
        transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Divider */}
      <div className="border-t border-border mb-8" />

      {/* Section Header */}
      <h2 className="font-sora font-bold text-xl text-foreground mb-6">Related products</h2>

      {/* Grid — 4 columns matching reference */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-muted animate-pulse aspect-[3/4]" />
            ))
          : visible.map((p, i) => {
              const discount = p.discount_percent || (p.original_price && p.original_price > p.price ? Math.round((p.original_price - p.price) / p.original_price * 100) : 0);
              // build category tags from categories + some tags
              const categoryLabel = (p.categories as any)?.name || '';
              const extraTags = (p.tags || []).filter(t => !['flash-sale','requires-email'].includes(t)).slice(0, 2);
              const allTags = [categoryLabel, ...extraTags].filter(Boolean);

              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.slug}`)}
                  className="group cursor-pointer flex flex-col"
                  style={{
                    opacity: sectionReveal.visible ? 1 : 0,
                    transform: sectionReveal.visible ? 'translateY(0)' : 'translateY(16px)',
                    transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
                  }}
                >
                  {/* Image Box */}
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30 group-hover:border-primary/40 transition-colors">
                    <img
                      src={p.image_url || PLACEHOLDER}
                      alt={`${p.name} price in Bangladesh - Shahed Store`}
                      width={300}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    />
                    {/* Discount badge — orange circle like reference */}
                    {discount > 0 && (
                      <span
                        className="absolute top-2.5 left-2.5 w-11 h-11 rounded-full flex items-center justify-center text-[11px] font-bold text-white leading-none"
                        style={{ background: 'hsl(30,100%,50%)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
                      >
                        -{discount}%
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="pt-3 flex flex-col gap-1.5">
                    <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      {p.name}
                    </p>

                    {/* Category / Tag pills */}
                    {allTags.length > 0 && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {allTags.join(', ')}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {p.original_price && p.original_price > p.price ? (
                        <>
                          <span className="text-xs line-through text-muted-foreground">
                            {p.original_price.toLocaleString()}৳
                          </span>
                          <span className="text-sm font-bold" style={{ color: 'hsl(35,100%,45%)' }}>
                            – {p.price.toLocaleString()}৳
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold" style={{ color: 'hsl(35,100%,45%)' }}>
                          {p.price.toLocaleString()}৳
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Dot Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="rounded-full transition-all"
              style={{
                width: i === page ? '24px' : '10px',
                height: '10px',
                background: i === page ? 'hsl(258,78%,55%)' : 'hsl(220,13%,82%)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── FAQ accordion item ──
const FAQItem = ({ q, a, delay = 0, revealed = true }: { q: string; a: string; delay?: number; revealed?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${open ? 'hsla(258,78%,60%,0.35)' : 'hsla(258,78%,75%,0.22)'}`,
        boxShadow: open ? '0 4px 24px hsla(258,78%,55%,0.12)' : '0 2px 12px hsla(258,78%,55%,0.06)',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'none' : 'translateY(16px)',
        transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s, border-color 0.3s, box-shadow 0.3s`,
      }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-left gap-3" style={{ color: 'hsl(226,35%,18%)' }}>
        <span>{q}</span>
        <ChevronDown size={16} className="flex-shrink-0 transition-transform duration-300" style={{ color: 'hsl(258,78%,55%)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      <div className="overflow-hidden transition-all duration-400" style={{ maxHeight: open ? '300px' : '0', opacity: open ? 1 : 0 }}>
        <div className="px-5 pb-4 text-sm leading-relaxed border-t" style={{ borderColor: 'hsla(258,78%,75%,0.18)', paddingTop: '12px', color: 'hsl(226,25%,42%)' }}>{a}</div>
      </div>
    </div>
  );
};

// ── Product Specifications Table ──────────────────────────────
const ProductSpecsTable = ({ productId }: { productId: string }) => {
  const [specs, setSpecs] = useState<{ name: string; values: string[] }[]>([]);
  useEffect(() => {
    supabase
      .from('product_attribute_assignments' as any)
      .select('*, global_attributes(name)')
      .eq('product_id', productId)
      .eq('is_visible', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) {
          setSpecs((data as any[])
            .filter((a: any) => (a.selected_values || []).length > 0)
            .map((a: any) => ({
              name: a.attribute_type === 'custom' ? a.custom_name : (a.global_attributes?.name || ''),
              values: a.selected_values || [],
            }))
          );
        }
      });
  }, [productId]);
  if (specs.length === 0) return null;
  return (
    <div className="mt-10">
      <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2 mb-5">
        <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />
        Specifications
      </h2>
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid hsla(258,78%,75%,0.22)',
          boxShadow: '0 4px 24px hsla(258,78%,55%,0.08)',
        }}>
        <table className="w-full text-sm">
          <tbody>
            {specs.map((s, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.40)' : 'transparent' }}>
                <td className="px-5 py-3 font-semibold w-1/3 border-r" style={{ color: 'hsl(226,35%,22%)', borderColor: 'hsla(258,78%,75%,0.18)' }}>{s.name}</td>
                <td className="px-5 py-3" style={{ color: 'hsl(226,25%,42%)' }}>
                  <div className="flex flex-wrap gap-1.5">
                    {s.values.map(v => (
                      <span key={v} className="px-2.5 py-0.5 rounded-full text-xs" style={{ background: 'hsla(258,78%,55%,0.08)', border: '1px solid hsla(258,78%,75%,0.25)', color: 'hsl(258,78%,45%)' }}>{v}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Customer Reviews Section ──────────────────────────────────
interface Review {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
}

const StarRating = ({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
          tabIndex={onChange ? 0 : -1}
        >
          <Star
            size={size}
            fill={(hover || value) >= s ? 'hsl(38,100%,55%)' : 'none'}
            color={(hover || value) >= s ? 'hsl(38,100%,55%)' : 'hsl(220,13%,75%)'}
          />
        </button>
      ))}
    </div>
  );
};

const ProductReviews = ({ productId, productSlug }: { productId: string; productSlug: string }) => {
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sectionReveal             = useReveal({ threshold: 0.05 });

  // Form state
  const [rating, setRating]       = useState(5);
  const [name, setName]           = useState('');
  const [title, setTitle]         = useState('');
  const [body, setBody]           = useState('');

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('product_reviews_public' as any)
      .select('id, author_name, rating, title, body, is_verified, helpful_count, created_at')
      .eq('product_slug', productSlug)
      .order('created_at', { ascending: false })
      .limit(20);
    setReviews(((data as unknown as Review[]) || []).map((review) => ({
      ...review,
      title: review.title ? normalizeBrandNameText(review.title) : review.title,
      body: normalizeBrandNameText(review.body),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [productSlug]);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: reviews.filter(r => r.rating === n).length,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim() || rating < 1) return;
    setSubmitting(true);
    await (supabase as any).from('product_reviews').insert({
      product_id: productId,
      product_slug: productSlug,
      author_name: name.trim(),
      title: title.trim() || null,
      body: body.trim(),
      rating,
      status: 'pending',
    });
    setSubmitting(false);
    setSubmitted(true);
    setShowForm(false);
    setName(''); setTitle(''); setBody(''); setRating(5);
  };

  const handleHelpful = async (id: string, current: number) => {
    await (supabase as any).from('product_reviews').update({ helpful_count: current + 1 }).eq('id', id);
    setReviews(p => p.map(r => r.id === id ? { ...r, helpful_count: r.helpful_count + 1 } : r));
  };

  const glassStyle: React.CSSProperties = {
    background: 'linear-gradient(155deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.68) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid hsla(258,78%,75%,0.22)',
    boxShadow: '0 4px 24px hsla(258,78%,55%,0.08)',
  };

  return (
    <div
      ref={sectionReveal.ref}
      className="container-fluid py-8"
      style={{
        opacity: loading ? 0 : (sectionReveal.visible ? 1 : 0),
        transform: sectionReveal.visible ? 'none' : 'translateY(30px)',
        transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      <div className="border-t border-border mb-4" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-sora font-bold text-xl text-foreground flex items-center gap-2">
          <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, hsl(271,91%,65%), hsl(185,90%,52%))' }} />
          গ্রাহক রিভিউ
          <span className="text-sm font-normal text-muted-foreground">({reviews.length})</span>
        </h2>
        {!submitted ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(271,91%,65%))', color: 'white', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}
          >
            <Star size={14} fill="white" color="white" />
            রিভিউ লিখুন
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl" style={{ color: 'hsl(158,80%,38%)', background: 'hsla(158,80%,48%,0.12)', border: '1px solid hsla(158,80%,48%,0.28)' }}>
            <CheckCircle2 size={14} /> রিভিউ পাঠানো হয়েছে!
          </span>
        )}
      </div>

      {/* Summary + Rating Bar */}
      {reviews.length > 0 && (
        <div className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-6" style={glassStyle}>
          {/* Avg score */}
          <div className="flex flex-col items-center justify-center min-w-[100px]">
            <div className="text-5xl font-sora font-black" style={{ color: 'hsl(258,78%,42%)' }}>
              {avgRating.toFixed(1)}
            </div>
            <StarRating value={Math.round(avgRating)} size={16} />
            <div className="text-xs text-muted-foreground mt-1">{reviews.length} রিভিউ</div>
          </div>
          {/* Bars */}
          <div className="flex-1 space-y-1.5">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs w-4 text-right font-semibold" style={{ color: 'hsl(226,35%,25%)' }}>{star}</span>
                <Star size={11} fill="hsl(38,100%,55%)" color="hsl(38,100%,55%)" />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsla(258,78%,55%,0.10)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%',
                      background: 'linear-gradient(90deg, hsl(258,78%,55%), hsl(271,91%,65%))',
                    }}
                  />
                </div>
                <span className="text-xs w-5 text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 mb-6 space-y-4" style={glassStyle}>
          <h3 className="font-semibold text-foreground">আপনার রিভিউ লিখুন</h3>

          {/* Rating picker */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">রেটিং *</label>
            <StarRating value={rating} onChange={setRating} size={28} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">আপনার নাম *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="আপনার নাম লিখুন"
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">শিরোনাম (ঐচ্ছিক)</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="সংক্ষিপ্ত শিরোনাম"
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">রিভিউ *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              rows={4}
              placeholder="প্রোডাক্টটি সম্পর্কে আপনার অভিজ্ঞতা শেয়ার করুন..."
              className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !body.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, hsl(258,78%,55%), hsl(271,91%,65%))', boxShadow: '0 4px 16px hsla(258,78%,55%,0.30)' }}
            >
              <Send size={14} />
              {submitting ? 'পাঠানো হচ্ছে...' : 'রিভিউ পাঠান'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">* রিভিউ অনুমোদনের পর প্রকাশিত হবে।</p>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={glassStyle}>
          <Star size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'hsl(38,100%,55%)' }} />
          <p className="text-muted-foreground text-sm">এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <div
              key={r.id}
              className="rounded-2xl p-5"
              style={{
                ...glassStyle,
                opacity: sectionReveal.visible ? 1 : 0,
                transform: sectionReveal.visible ? 'none' : 'translateY(12px)',
                transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s`,
              }}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: `hsl(${(r.author_name.charCodeAt(0) * 47) % 360},65%,88%)`, color: `hsl(${(r.author_name.charCodeAt(0) * 47) % 360},65%,35%)` }}>
                  {r.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground inline-flex items-center gap-1">
                      {r.author_name}
                      <VerifiedBadge size={13} />
                    </span>
                    <StarRating value={r.rating} size={12} />
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(r.created_at).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                  {r.title && <p className="text-sm font-semibold text-foreground mb-1">{r.title}</p>}
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(226,25%,42%)' }}>{r.body}</p>
                  {/* Helpful */}
                  <button
                    onClick={() => handleHelpful(r.id, r.helpful_count)}
                    className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ThumbsUp size={12} />
                    সহায়ক ({r.helpful_count})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
