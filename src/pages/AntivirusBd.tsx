import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, BadgeCheck, ArrowRight, Headphones } from 'lucide-react';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import SEOHead from '@/components/seo/SEOHead';
import { FloatingButtons } from '@/components/store/Extras';
import { breadcrumbSchema, itemListSchema } from '@/components/seo/schemas';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';

const A = 'hsl(258,78%,55%)';
const B = 'hsl(200,90%,45%)';

interface AvProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  short_description: string | null;
  image_url: string | null;
}

const HIGHLIGHTS = [
  { icon: <BadgeCheck size={16} />, title: '১০০% জেনুইন লাইসেন্স', text: 'প্রতিটি অ্যান্টিভাইরাস কী অফিসিয়াল সোর্স থেকে সংগ্রহ করা।' },
  { icon: <Zap size={16} />, title: 'দ্রুত ডেলিভারি', text: 'পেমেন্ট যাচাইয়ের পর ১–২৪ ঘণ্টার মধ্যে ইমেইলে কী পৌঁছে যায়।' },
  { icon: <Headphones size={16} />, title: 'ইনস্টলেশন সাপোর্ট', text: 'অ্যাক্টিভেশনে সমস্যা হলে WhatsApp-এ সরাসরি সহায়তা।' },
];

const GUIDE = [
  {
    q: 'বাংলাদেশে অ্যান্টিভাইরাসের দাম কেমন?',
    a: 'ব্র্যান্ড, ডিভাইস সংখ্যা ও মেয়াদভেদে দাম আলাদা হয়। সাধারণত ১ ডিভাইস ১ বছরের লাইসেন্স সবচেয়ে সাশ্রয়ী, আর মাল্টি-ডিভাইস (৩–৫ ডিভাইস) প্যাকে প্রতি ডিভাইসের খরচ কমে আসে। উপরের তালিকায় আমাদের বর্তমান দাম দেখানো আছে।',
  },
  {
    q: 'কোন অ্যান্টিভাইরাসটি আমার জন্য ঠিক?',
    a: 'হালকা ও দ্রুত পারফরম্যান্স চাইলে ESET, ভালো র‍্যানসমওয়্যার সুরক্ষা ও মাল্টি-প্ল্যাটফর্ম চাইলে Bitdefender, বিল্ট-ইন VPN সহ প্যাকেজ চাইলে Kaspersky Plus বা Norton 360 Deluxe বেছে নিতে পারেন।',
  },
  {
    q: 'লাইসেন্স কী কীভাবে পাবো?',
    a: 'অর্ডার সম্পন্ন হওয়ার পর অ্যাক্টিভেশন কী ও ডাউনলোড লিংক আপনার ইমেইলে পাঠানো হয় এবং ড্যাশবোর্ডের My Orders অংশেও দেখা যায়।',
  },
  {
    q: 'মেয়াদ শেষ হলে কী হবে?',
    a: 'মেয়াদ শেষে নতুন কী দিয়ে রিনিউ করতে হবে। রিনিউ করার সময় আগের অর্ডার আইডি জানালে আমরা দ্রুত প্রসেস করে দিই।',
  },
];

const AntivirusBd = () => {
  const [products, setProducts] = useState<AvProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { format: fmtPrice } = useCurrency();

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('id,name,slug,price,original_price,short_description,image_url')
        .contains('tags', ['antivirus'])
        .in('status', ['active', 'out_of_stock'])
        .order('price', { ascending: true });
      if (!alive) return;
      setProducts((data as AvProduct[]) || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const schema = [
    breadcrumbSchema([
      { name: 'Home', url: 'https://shahedit.com/' },
      { name: 'Antivirus Price in BD', url: 'https://shahedit.com/antivirus-price-in-bd' },
    ]),
    ...(products.length
      ? [itemListSchema(products.map(p => ({ name: p.name, slug: p.slug, image: p.image_url, price: p.price })))]
      : []),
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Antivirus Price in Bangladesh — ESET, Kaspersky, Bitdefender | Shahed IT"
        description="Antivirus price in BD: ESET Internet Security, Kaspersky Plus, Bitdefender Total Security, Avast ও Norton 360-এর জেনুইন লাইসেন্স কী, দ্রুত ডেলিভারি।"
        canonical="https://shahedit.com/antivirus-price-in-bd"
        keywords="antivirus price in bd, eset internet security price in bd, kaspersky price in bangladesh, bitdefender total security price in bd, norton 360 price in bangladesh, avast premium security bd"
        schema={schema}
      />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-[104px] pb-16">
        <nav aria-label="Breadcrumb" className="text-[12px] mb-4" style={{ color: 'hsl(226,25%,50%)' }}>
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span>Antivirus Price in BD</span>
        </nav>

        <header className="rounded-3xl p-6 sm:p-8 mb-8"
          style={{
            background: 'linear-gradient(155deg, rgba(255,255,255,0.72), rgba(255,255,255,0.45))',
            backdropFilter: 'blur(24px)',
            border: '1px solid hsla(258,78%,75%,0.24)',
          }}>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${A}14`, color: A }}>
            <ShieldCheck size={13} /> Genuine Antivirus License
          </span>
          <h1 className="font-sora font-black text-[26px] sm:text-[34px] leading-tight mt-3"
            style={{ color: 'hsl(226,35%,14%)' }}>
            Antivirus Price in Bangladesh
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed max-w-3xl" style={{ color: 'hsl(226,25%,40%)' }}>
            ESET Internet Security, Kaspersky Plus, Bitdefender Total Security, Avast Premium Security ও Norton 360 Deluxe —
            সব জনপ্রিয় অ্যান্টিভাইরাসের জেনুইন লাইসেন্স কী বাংলাদেশে সাশ্রয়ী দামে পাওয়া যাচ্ছে Shahed IT-এ।
            নিচে বর্তমান দাম দেখুন, পছন্দের প্যাকেজে ক্লিক করে সরাসরি অর্ডার করুন।
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            {HIGHLIGHTS.map(h => (
              <div key={h.title} className="rounded-2xl p-3.5"
                style={{ background: 'hsla(258,78%,55%,0.06)', border: '1px solid hsla(258,78%,55%,0.14)' }}>
                <p className="flex items-center gap-1.5 font-bold text-[12.5px]" style={{ color: A }}>{h.icon}{h.title}</p>
                <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'hsl(226,25%,45%)' }}>{h.text}</p>
              </div>
            ))}
          </div>
        </header>

        <section aria-labelledby="price-list" className="mb-10">
          <h2 id="price-list" className="font-sora font-black text-[19px] mb-3" style={{ color: 'hsl(226,35%,14%)' }}>
            অ্যান্টিভাইরাস দামের তালিকা (আপডেটেড)
          </h2>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl h-[104px] animate-pulse" style={{ background: 'hsla(258,78%,55%,0.07)' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'hsl(226,25%,45%)' }}>
              এই মুহূর্তে অ্যান্টিভাইরাস প্যাকেজ তালিকায় নেই। সর্বশেষ দাম জানতে আমাদের সাথে যোগাযোগ করুন।
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {products.map(p => (
                <Link key={p.id} to={`/product/${p.slug}`}
                  className="rounded-2xl p-4 flex items-center gap-3 transition-transform hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.70), rgba(255,255,255,0.45))',
                    backdropFilter: 'blur(18px)',
                    border: '1px solid hsla(258,78%,75%,0.22)',
                  }}>
                  {p.image_url && (
                    <img src={p.image_url} alt={`${p.name} — Shahed IT`} loading="lazy"
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] truncate" style={{ color: 'hsl(226,35%,16%)' }}>{p.name}</p>
                    {p.short_description && (
                      <p className="text-[11.5px] mt-0.5 line-clamp-2" style={{ color: 'hsl(226,25%,48%)' }}>{p.short_description}</p>
                    )}
                    <p className="mt-1 font-sora font-black text-[15px]" style={{ color: A }}>
                      {fmtPrice(p.price)}
                      {p.original_price && p.original_price > p.price && (
                        <span className="ml-2 text-[12px] font-semibold line-through" style={{ color: 'hsl(226,15%,60%)' }}>
                          {fmtPrice(p.original_price)}
                        </span>
                      )}
                    </p>
                  </div>
                  <ArrowRight size={16} style={{ color: B, flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="guide" className="mb-10">
          <h2 id="guide" className="font-sora font-black text-[19px] mb-3" style={{ color: 'hsl(226,35%,14%)' }}>
            কেনার আগে যা জানা দরকার
          </h2>
          <div className="space-y-3">
            {GUIDE.map(item => (
              <div key={item.q} className="rounded-2xl p-4"
                style={{ background: 'hsla(258,78%,55%,0.05)', border: '1px solid hsla(258,78%,55%,0.12)' }}>
                <h3 className="font-bold text-[13px] mb-1" style={{ color: 'hsl(226,35%,16%)' }}>{item.q}</h3>
                <p className="text-[12.5px] leading-relaxed" style={{ color: 'hsl(226,25%,42%)' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3"
          style={{ background: `linear-gradient(120deg, ${A}12, ${B}12)`, border: `1px solid ${A}22` }}>
          <p className="text-[13px] font-semibold" style={{ color: 'hsl(226,35%,16%)' }}>
            আরও সফটওয়্যার ও সাবস্ক্রিপশন খুঁজছেন?
          </p>
          <Link to="/shop" className="text-[12.5px] font-bold px-4 py-2 rounded-full text-white"
            style={{ background: `linear-gradient(120deg, ${A}, ${B})` }}>
            সব প্রোডাক্ট দেখুন
          </Link>
        </section>
      </main>

      <FloatingButtons />
      <Footer />
    </div>
  );
};

export default AntivirusBd;
