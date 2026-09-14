import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Bot, BriefcaseBusiness, Check, ChevronDown, Code2, Database, Globe2, Megaphone, Palette, Rocket, ShieldCheck, ShoppingCart, Smartphone, Sparkles, Target, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

const technologies = [['React', Code2], ['Next.js', Rocket], ['Node.js', Code2], ['TypeScript', Code2], ['WordPress', Globe2], ['PHP', Code2], ['Laravel', Wrench], ['MongoDB', Database], ['MySQL', Database], ['Figma', Palette], ['Flutter', Smartphone], ['Python', Bot]] as const;
const process = [{ step: 'STEP 01', title: 'Consultation', text: 'আপনার লক্ষ্য, বাজেট এবং ব্যবসার প্রয়োজন বুঝে সঠিক পরিকল্পনা তৈরি করি।', icon: BriefcaseBusiness, tone: 'violet' }, { step: 'STEP 02', title: 'Customization', text: 'আপনার brand identity অনুযায়ী unique design এবং scalable solution তৈরি করি।', icon: Palette, tone: 'pink' }, { step: 'STEP 03', title: 'Implementation', text: 'পরিষ্কার code, tested workflow এবং conversion-focused experience তৈরি করি।', icon: Rocket, tone: 'rose' }, { step: 'STEP 04', title: 'Ongoing Support', text: 'সফল launch-এর পরেও maintenance, updates এবং dedicated support পাই।', icon: ShieldCheck, tone: 'gold' }] as const;
const industries = [['E-commerce', 'অনলাইন বিক্রির জন্য conversion-ready store', ShoppingCart], ['Restaurant', 'ডিজিটাল menu ও ordering experience', Sparkles], ['SaaS Systems', 'স্কেল করার মতো modern product interface', Database], ['Digital Solutions', 'আপনার service business-এর complete web presence', Code2], ['Marketing', 'campaign, content এবং growth support', Megaphone], ['Local Business', 'স্থানীয় business-এর জন্য trusted online identity', BriefcaseBusiness], ['Mobile Apps', 'দ্রুত এবং intuitive mobile-first experience', Smartphone], ['Brand Design', 'মনে থাকার মতো visual identity ও creative', Palette]] as const;
const faqs = [['আপনাদের service নেওয়ার প্রক্রিয়া কী?', 'প্রথমে consultation-এর মাধ্যমে আপনার প্রয়োজন বুঝে scope, timeline এবং quote শেয়ার করি।'], ['কাজ শেষ হতে কত সময় লাগে?', 'Project-এর ধরন অনুযায়ী সময় বদলায়। সাধারণ business website ৭ থেকে ১৪ কর্মদিবসে সম্পন্ন হয়।'], ['কাজ শেষ হওয়ার পর support পাওয়া যাবে?', 'হ্যাঁ। Launch-এর পর maintenance, update এবং technical support-এর package available আছে।'], ['আপনারা কি custom solution তৈরি করেন?', 'অবশ্যই। Template-এর পাশাপাশি business goal অনুযায়ী custom design ও development করি।']] as const;
const projects = [
  { title: 'Fintech Dashboard', category: 'SaaS Product', description: 'A conversion-led analytics platform built for modern financial operations.', accent: 'violet' },
  { title: 'Luxury Brand Site', category: 'Brand Experience', description: 'A premium ecommerce storefront with faster checkout and stronger storytelling.', accent: 'pink' },
  { title: 'Startup Launch Kit', category: 'Marketing Stack', description: 'A fully branded experience for rapid market entry, lead capture, and scaling.', accent: 'cyan' },
] as const;

const ReferenceHomepageSections = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="reference-sections">
      <section className="reference-section">
        <div className="container-fluid">
          <div className="reference-centered project-header">
            <span className="reference-kicker">◈ OUR WORK</span>
            <h2>Recent <span>Projects</span></h2>
          </div>
          <div className="project-grid">
            {projects.map((project, index) => (
              <Link to="/shop" key={project.title} className={`project-card project-${project.accent}`}>
                <div className="project-visual" aria-hidden="true">
                  <div className="project-orb project-orb-a" />
                  <div className="project-orb project-orb-b" />
                  <div className="project-window project-window--primary" />
                  <div className="project-window project-window--secondary" />
                </div>
                <div className="project-meta">
                  <div className="project-topline">
                    <span className="project-category">{project.category}</span>
                    <span className="project-index">0{index + 1}</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <span className="project-link">View case study <ArrowUpRight size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="reference-section reference-story">
        <div className="container-fluid reference-split">
          <div className="reference-copy">
            <span className="reference-kicker">◈ OUR TECH STACK</span>
            <h2>
              Powered by<br />
              <span>Best-in-Class</span><br />
              Technology
            </h2>
            <div className="reference-underline" />
            <p>We leverage the latest and most powerful technologies to build scalable, high-performance solutions. Our tech stack is carefully selected for reliability, speed, and flexibility.</p>
            <p>From cutting-edge frontend frameworks to robust backend infrastructure — your project is built on a solid foundation ready for the future.</p>
            <p className="reference-hint">
              <Sparkles size={14} /> যেকোনো technology এর নামে click করুন — বিস্তারিত page এ যান
            </p>
            <Link to="/shop" className="reference-button">Explore Our Services <ArrowRight size={15} /></Link>
          </div>
          <div className="technology-grid">
            {technologies.map(([name, Icon]) => (
              <Link to="/shop" className="technology-tile" key={name}>
                <span className="technology-icon"><Icon size={17} /></span>
                <span className="technology-label">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="reference-section">
        <div className="container-fluid reference-split reference-split-reverse">
          <div className="reference-copy">
            <span className="reference-kicker">◈ ABOUT SHAHED IT</span>
            <h2>
              We Build <span>Digital Experiences</span>
            </h2>
            <p>Shahed IT is a professional digital service agency focused on web development and graphics design for modern businesses and growing brands.</p>
            <div className="reference-proof">
              <strong>150+</strong><span>Projects</span>
              <strong>5+</strong><span>Years</span>
              <strong>98%</strong><span>Satisfied</span>
            </div>
            <Link to="/about" className="reference-button reference-button-soft">Learn More About Us <ArrowRight size={15} /></Link>
          </div>
          <div className="reference-checklist">
            {['Responsive, user-friendly websites built to convert', 'Clean, visually consistent brand design', 'Cross-device & cross-platform delivery', 'Quality-driven development with ROI focus'].map(item => (
              <div className="reference-check" key={item}><Check size={14} />{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="reference-section">
        <div className="container-fluid reference-centered">
          <span className="reference-kicker">◈ OUR PROCESS</span>
          <h2>How We <span>Help You Grow</span></h2>
          <p>৪টি proven step-এ Shahed IT আপনার business-এর জন্য focused digital solution তৈরি করে।</p>
          <div className="process-grid">
            {process.map(({ step, title, text, icon: Icon, tone }, index) => (
              <div className={`process-card process-${tone}`} key={title}>
                <span className="process-number">0{index + 1}</span>
                <Icon size={17} />
                <small>{step}</small>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="reference-section">
        <div className="container-fluid reference-centered">
          <span className="reference-kicker">◈ INDUSTRY SOLUTIONS</span>
          <h2>Solutions <span>for Every Industry</span></h2>
          <p>আপনার industry অনুযায়ী practical digital solution এবং measurable growth support।</p>
          <div className="industry-grid">
            {industries.map(([title, text, Icon]) => (
              <Link to="/contact-us" className="industry-card" key={title}>
                <Icon size={15} />
                <strong>{title}</strong>
                <span>{text}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="reference-section reference-faq">
        <div className="container-fluid reference-centered">
          <span className="reference-kicker">◈ NEED TO KNOW</span>
          <h2>আপনার <span>প্রশ্নের উত্তর</span></h2>
          <p>সার্ভিস সম্পর্কে সবচেয়ে সাধারণ প্রশ্নগুলোর সংক্ষিপ্ত উত্তর।</p>
          <div className="faq-list">
            {faqs.map(([question, answer], index) => (
              <div className="reference-faq-item" key={question}>
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>
                  <span>{question}</span>
                  <ChevronDown size={15} />
                </button>
                {openFaq === index && <p>{answer}</p>}
              </div>
            ))}
          </div>
          <Link to="/help" className="reference-more">View all FAQs <ArrowRight size={13} /></Link>
        </div>
      </section>

      <section className="reference-section">
        <div className="container-fluid">
          <div className="cta-panel">
            <div className="cta-glow cta-glow-one" aria-hidden="true" />
            <div className="cta-glow cta-glow-two" aria-hidden="true" />
            <div className="cta-inner">
              <span className="reference-kicker">◈ READY TO SCALE</span>
              <h2>Build a smarter digital presence that converts.</h2>
              <p>From strategy and branding to development and launch, we build premium digital experiences designed to help your business grow faster.</p>
              <div className="cta-actions">
                <Link to="/contact-us" className="reference-button">Start Your Project <ArrowRight size={15} /></Link>
                <Link to="/shop" className="reference-button reference-button-soft">Browse Services</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReferenceHomepageSections;
