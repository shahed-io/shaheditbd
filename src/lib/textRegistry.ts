// Central registry of all editable texts on the website.
// Each entry's `key` is the unique identifier used by <T id="..."/> and the admin Text Manager.
// Add new entries here whenever you wrap a new piece of copy with <T>.

export interface TextRegistryEntry {
  key: string;
  defaultValue: string;
  category: string;
  description?: string;
}

export const TEXT_REGISTRY: TextRegistryEntry[] = [
  // ---------- Homepage / Hero ----------
  { key: 'home.hero.badge',       category: 'Homepage — Hero',  defaultValue: 'বিশ্বস্ত ডিজিটাল স্টোর',           description: 'Hero ছোট badge text' },
  { key: 'home.hero.cta_primary', category: 'Homepage — Hero',  defaultValue: 'এখনই কিনুন',                       description: 'প্রধান CTA বাটন' },
  { key: 'home.hero.cta_secondary', category: 'Homepage — Hero', defaultValue: 'সব প্রোডাক্ট দেখুন',              description: 'সেকেন্ডারি বাটন' },

  // ---------- Why Choose Us ----------
  { key: 'home.why.title',        category: 'Why Choose Us',     defaultValue: 'কেন আমাদের বেছে নেবেন?',           description: 'সেকশন হেডিং' },
  { key: 'home.why.subtitle',     category: 'Why Choose Us',     defaultValue: 'বাংলাদেশের সবচেয়ে বিশ্বস্ত ডিজিটাল সফটওয়্যার স্টোর', description: 'সেকশন সাবটাইটেল' },

  // ---------- Flash Sale ----------
  { key: 'home.flash.title',      category: 'Flash Sale',        defaultValue: 'ফ্ল্যাশ সেল',                      description: 'Flash sale heading' },
  { key: 'home.flash.subtitle',   category: 'Flash Sale',        defaultValue: 'সীমিত সময়ের জন্য বিশেষ অফার',     description: 'Flash sale tagline' },

  // ---------- Top Products ----------
  { key: 'home.top.title',        category: 'Top Products',      defaultValue: 'জনপ্রিয় প্রোডাক্ট',                description: 'Top product section title' },
  { key: 'home.top.subtitle',     category: 'Top Products',      defaultValue: 'গ্রাহকদের সবচেয়ে পছন্দের পণ্যসমূহ', description: 'Top product subtitle' },

  // ---------- Categories ----------
  { key: 'home.categories.title', category: 'Categories',        defaultValue: 'আমাদের ক্যাটাগরি',                description: 'Category section heading' },

  // ---------- Testimonials ----------
  { key: 'home.testimonials.title', category: 'Testimonials',    defaultValue: 'গ্রাহকদের মতামত',                  description: 'Testimonial section heading' },

  // ---------- Footer ----------
  { key: 'footer.copyright',      category: 'Footer',            defaultValue: '© Shahed Store. All rights reserved.', description: 'Footer copyright text' },
  { key: 'footer.newsletter.title',  category: 'Footer',         defaultValue: 'আপডেট পেতে সাবস্ক্রাইব করুন',     description: 'Newsletter heading' },
  { key: 'footer.newsletter.placeholder', category: 'Footer',    defaultValue: 'আপনার ইমেইল লিখুন',                description: 'Newsletter input placeholder' },
  { key: 'footer.newsletter.button', category: 'Footer',         defaultValue: 'সাবস্ক্রাইব',                      description: 'Newsletter button label' },

  // ---------- Common ----------
  { key: 'common.loading',        category: 'Common',            defaultValue: 'লোড হচ্ছে...',                     description: 'Loading text' },
  { key: 'common.view_all',       category: 'Common',            defaultValue: 'সব দেখুন',                         description: '"View all" link text' },
];

export const TEXT_CATEGORIES = Array.from(new Set(TEXT_REGISTRY.map(e => e.category)));

export const getRegistryEntry = (key: string) => TEXT_REGISTRY.find(e => e.key === key);
