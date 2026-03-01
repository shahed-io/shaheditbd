import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, MessageCircle, Shield, Zap, Star, ChevronDown, ChevronUp, CheckCircle2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import { WhatsAppButton } from '@/components/store/Extras';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  image_url: string | null;
  images: string[] | null;
  description: string | null;
  short_description: string | null;
  is_featured: boolean | null;
  tags: string[] | null;
  slug: string;
  categories?: { name: string } | null;
}

const FAQS = [
  { q: 'পণ্য কীভাবে ডেলিভারি পাবো?', a: 'পেমেন্ট ভেরিফিকেশনের পর ইমেইল ও SMS-এর মাধ্যমে লাইসেন্স কি বা একাউন্ট ডিটেইল পাঠানো হবে। সাধারণত ১-৬ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।' },
  { q: 'পেমেন্ট কীভাবে করবো?', a: 'বিকাশ, নগদ বা রকেটের মাধ্যমে পেমেন্ট করুন। পেমেন্টের পর ট্রানজেকশন আইডি ও স্ক্রিনশট দিয়ে অর্ডার সম্পন্ন করুন।' },
  { q: 'রিফান্ড পলিসি কী?', a: 'যদি পণ্যে কোনো সমস্যা হয় তাহলে ৭২ ঘণ্টার মধ্যে সাপোর্টে যোগাযোগ করুন। সমস্যা প্রমাণিত হলে রিফান্ড বা রিপ্লেসমেন্ট দেওয়া হবে।' },
  { q: 'কতদিনের জন্য সাপোর্ট পাবো?', a: 'সব পণ্যে ২৪/৭ সাপোর্ট পাওয়া যায়। WhatsApp বা সাপোর্ট টিকেটের মাধ্যমে যোগাযোগ করুন।' },
];

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [rating] = useState(4.8);
  const [reviews] = useState(Math.floor(Math.random() * 300) + 100);
  const { addToCart, toggleWishlist, isWishlisted, isInCart } = useCart();

  useEffect(() => {
    if (!slug) return;
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('slug', slug)
      .single();
    if (data) {
      setProduct(data as Product);
      fetchRelated(data.categories?.name || '', data.id);
    }
    setLoading(false);
  };

  const fetchRelated = async (catName: string, excludeId: string) => {
    const { data: catData } = await supabase.from('categories').select('id').eq('name', catName).single();
    if (!catData) return;
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('category_id', catData.id)
      .neq('id', excludeId)
      .eq('status', 'active')
      .limit(4);
    if (data) setRelated(data as Product[]);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
      পণ্য পাওয়া যায়নি
    </div>
  );

  const images = [product.image_url, ...(product.images || [])].filter(Boolean) as string[];
  const waMessage = encodeURIComponent(`আমি ${product.name} কিনতে চাই। দাম: ৳${product.price}। অর্ডার করতে সাহায্য করুন।`);
  const inCart = isInCart(product.id);
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-36 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary transition-colors">হোম</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-primary transition-colors">শপ</Link>
            <span>/</span>
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 mb-16">
            {/* Gallery */}
            <div className="space-y-3">
              <div className="aspect-square rounded-2xl overflow-hidden glass-card border border-border">
                <img
                  src={images[selectedImage] || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-primary' : 'border-border'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-5">
              <div>
                <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">{product.categories?.name}</span>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mt-3 mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {product.name}
                </h1>
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'} />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{rating} ({reviews} রিভিউ)</span>
                </div>
              </div>

              {/* Price */}
              <div className="glass-card rounded-2xl p-4 border border-primary/20">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">৳{product.price.toLocaleString()}</span>
                  {product.original_price && (
                    <span className="text-muted-foreground text-xl line-through">৳{product.original_price.toLocaleString()}</span>
                  )}
                  {product.discount_percent && (
                    <span className="badge-discount text-sm">-{product.discount_percent}%</span>
                  )}
                </div>
                {product.original_price && (
                  <p className="text-sm text-green-400 mt-1">
                    আপনি সাশ্রয় করছেন ৳{(product.original_price - product.price).toLocaleString()}
                  </p>
                )}
              </div>

              {/* What you get */}
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm uppercase tracking-wider">📦 কী পাবেন</h3>
                <ul className="space-y-1.5">
                  {[
                    'অরিজিনাল লাইসেন্স কি / একাউন্ট',
                    'ইনস্টলেশন গাইড',
                    '২৪/৭ লাইভ সাপোর্ট',
                    'মানি-ব্যাক গ্যারান্টি (শর্ত প্রযোজ্য)',
                    '১-৬ ঘণ্টায় ডেলিভারি',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: <Shield size={13} />, text: '১০০% অরিজিনাল' },
                  { icon: <Zap size={13} />, text: 'দ্রুত ডেলিভারি' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs glass-card px-3 py-1.5 rounded-full text-muted-foreground">
                    <span className="text-primary">{b.icon}</span>
                    {b.text}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => addToCart({ id: product.id, name: product.name, category: product.categories?.name || '', price: product.price, originalPrice: product.original_price || undefined, image: product.image_url || '' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all ${inCart ? 'bg-primary/20 text-primary border border-primary/40' : 'btn-glow'}`}
                >
                  <ShoppingCart size={18} />
                  {inCart ? 'কার্টে আছে' : 'কার্টে যোগ করুন'}
                </button>
                <button
                  onClick={() => toggleWishlist({ id: product.id, name: product.name, category: product.categories?.name || '', price: product.price, image: product.image_url || '' })}
                  className={`p-3.5 rounded-xl glass-card border transition-all ${wishlisted ? 'text-red-400 border-red-400/40' : 'text-muted-foreground border-border hover:text-red-400'}`}
                >
                  <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* WhatsApp order */}
              <a
                href={`https://wa.me/8801840099853?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
              >
                <MessageCircle size={18} />
                WhatsApp-এ অর্ডার করুন
              </a>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="glass-card rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>পণ্যের বিবরণ</h2>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* FAQ */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>সচরাচর জিজ্ঞাসা (FAQ)</h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/20 transition-colors"
                  >
                    {faq.q}
                    {openFaq === i ? <ChevronUp size={16} className="text-primary flex-shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-3 text-sm text-muted-foreground border-t border-border bg-muted/10">
                      <p className="pt-3">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-5" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                সম্পর্কিত পণ্য
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {related.map((p) => (
                  <Link key={p.id} to={`/product/${p.slug}`} className="product-card rounded-2xl overflow-hidden group">
                    <div className="relative overflow-hidden aspect-square bg-muted">
                      <img src={p.image_url || '/placeholder.svg'} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      {p.discount_percent && (
                        <span className="absolute top-2 right-2 badge-discount">-{p.discount_percent}%</span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">{p.name}</h3>
                      <span className="text-primary font-bold">৳{p.price.toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ProductDetail;
