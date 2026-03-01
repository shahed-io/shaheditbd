import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Rakib Hasan',
    role: 'Graphic Designer, Dhaka',
    avatar: '👨‍💻',
    rating: 5,
    text: 'Got Adobe Creative Cloud at an amazing price! Key worked instantly and the support team was very helpful. Will definitely buy again.',
  },
  {
    name: 'Fatema Begum',
    role: 'Student, Chittagong',
    avatar: '👩‍🎓',
    rating: 5,
    text: 'Bought Office 365 for my studies. The price was unbelievably low compared to official Microsoft. Instant delivery as promised!',
  },
  {
    name: 'Mehedi Islam',
    role: 'IT Professional, Sylhet',
    avatar: '👨‍💼',
    rating: 5,
    text: 'Purchased Windows 11 Pro for my office computers. All 5 keys worked perfectly. Best digital store in Bangladesh without doubt.',
  },
  {
    name: 'Nusrat Jahan',
    role: 'Freelancer, Rajshahi',
    avatar: '👩‍💻',
    rating: 5,
    text: 'Netflix subscription at this price? Unreal! I\'ve been buying from Shahed Store for 2 years now. Always reliable and fast.',
  },
  {
    name: 'Tanvir Ahmed',
    role: 'Business Owner, Comilla',
    avatar: '🧑‍💼',
    rating: 5,
    text: 'Bought multiple Office licenses for my team. The bulk pricing was excellent and keys were activated without any issue.',
  },
  {
    name: 'Sadia Islam',
    role: 'Content Creator, Khulna',
    avatar: '🧑‍🎨',
    rating: 5,
    text: 'ElevenLabs subscription from Shahed Store saved me so much money! Great service and the Telegram support is super quick.',
  },
];

const Testimonials = () => {
  return (
    <section className="py-16 px-4 relative overflow-hidden">
      <div className="orb orb-3 opacity-8" style={{ top: '10%', right: '-5%' }} />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-2">Reviews</p>
          <h2 className="text-4xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            What Our <span className="gradient-text">Customers Say</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="glass-card-hover rounded-2xl p-6 animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
            >
              <Quote size={24} className="text-primary/40 mb-3" />
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{t.text}</p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{t.name}</div>
                  <div className="text-muted-foreground text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
