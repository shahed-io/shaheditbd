import { Shield, Award, CheckCircle, Star, Users, Zap } from 'lucide-react';

const badges = [
  {
    icon: <Shield size={22} />,
    title: 'DBID Verified',
    desc: 'বাংলাদেশ Digital Store',
    color: 'from-blue-500 to-cyan-500',
    highlight: true,
  },
  {
    icon: <Award size={22} />,
    title: '100% Official',
    desc: 'Original License Keys',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: <CheckCircle size={22} />,
    title: 'Secure Payment',
    desc: 'bKash / Nagad / Rocket',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: <Zap size={22} />,
    title: 'Instant Delivery',
    desc: 'After Verification',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: <Users size={22} />,
    title: '5,000+ Customers',
    desc: 'Trusted Since 2020',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: <Star size={22} />,
    title: '4.9★ Rated',
    desc: 'Customer Satisfaction',
    color: 'from-teal-500 to-cyan-600',
  },
];

const TrustBadges = () => (
  <section className="py-10 px-4">
    <div className="max-w-7xl mx-auto">
      {/* DBID Verified Hero Badge */}
      <div className="glass-card rounded-2xl p-6 mb-6 border border-blue-500/30 bg-blue-500/5 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
          <Shield size={30} className="text-white" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <h3 className="font-black text-foreground text-xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>DBID Verified Seller</h3>
            <span className="bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">✓ VERIFIED</span>
          </div>
          <p className="text-muted-foreground text-sm">
            আমরা Digital Bangladesh Initiative Database (DBID) verified একটি legitimate online store। সকল পণ্য official sources থেকে সংগ্রহ করা হয়।
          </p>
        </div>
        <div className="flex-shrink-0 text-center">
          <div className="text-3xl font-black gradient-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>2020</div>
          <div className="text-muted-foreground text-xs">Established</div>
        </div>
      </div>

      {/* Trust Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {badges.map((badge, i) => (
          <div
            key={i}
            className="glass-card-hover rounded-xl p-4 flex flex-col items-center gap-2 text-center animate-slide-up"
            style={{ animationDelay: `${i * 0.07}s`, animationFillMode: 'both' }}
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-white shadow-md`}>
              {badge.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">{badge.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBadges;
