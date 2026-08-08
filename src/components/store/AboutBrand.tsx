import { Link } from 'react-router-dom';

const QUICK_LINKS: { label: string; to: string }[] = [
  { label: 'Shop all digital products', to: '/shop' },
  { label: 'Windows license keys', to: '/shop?category=windows' },
  { label: 'Microsoft Office 365', to: '/shop?category=microsoft-office' },
  { label: 'Adobe Creative Cloud', to: '/shop?category=adobe' },
  { label: 'Antivirus & security', to: '/shop?category=antivirus' },
  { label: 'About Shahed Store', to: '/about' },
  { label: 'Contact Shahed Store', to: '/contact-us' },
  { label: 'Product key checker', to: '/check-key' },
  { label: 'Frequently asked questions', to: '/faqs' },
  { label: 'Delivery information', to: '/delivery-info' },
  { label: 'Refund policy', to: '/refund-policy' },
  { label: 'Blog & guides', to: '/blog' },
];

/**
 * Brand identity section — carries the single homepage <h1> and the
 * descriptive internal links Google uses to understand the site structure.
 */
const AboutBrand = () => (
  <section aria-labelledby="about-shahed-store" className="container-fluid py-14 md:py-20">
    <div className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 md:p-10 shadow-sm">
      <h1
        id="about-shahed-store"
        className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
      >
        Shahed Store — Digital Software &amp; Subscription Store in Bangladesh
      </h1>

      <p className="lead mt-4 text-muted-foreground leading-relaxed">
        Shahed Store is a Bangladesh-based digital software store offering Windows and Microsoft
        Office licenses, Adobe Creative Cloud, antivirus, VPN and other digital subscriptions.
        Orders are delivered digitally, payments are accepted through bKash, Nagad, Rocket and bank
        transfer, and support is available over WhatsApp and email.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-foreground">Explore the store</h2>
      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {QUICK_LINKS.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-foreground">Contact</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Email:{' '}
        <a className="hover:text-primary" href="mailto:info@shahedstore.com.bd">
          info@shahedstore.com.bd
        </a>{' '}
        · Phone/WhatsApp:{' '}
        <a className="hover:text-primary" href="tel:+8801840099853">
          +880 1840-099853
        </a>{' '}
        · Ishwardi, Pabna, Bangladesh
      </p>
    </div>
  </section>
);

export default AboutBrand;
