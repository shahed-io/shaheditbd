-- Import the service catalog shown on the attached Shahed IT reference site.
-- Idempotent by slug so existing catalog rows are never duplicated.

INSERT INTO public.categories (name, slug, description, is_active, sort_order)
VALUES
  ('Web Development', 'web-development', 'Professional websites and e-commerce solutions.', true, 10),
  ('Website Maintenance', 'website-maintenance', 'Reliable ongoing website care and support.', true, 20),
  ('Graphics Design', 'graphics-design', 'Brand identity and creative design services.', true, 30),
  ('Facebook Services', 'facebook-services', 'Facebook advertising and social media services.', true, 40),
  ('Digital Marketing', 'digital-marketing', 'SEO, content and growth marketing solutions.', true, 50),
  ('Business Solutions', 'business-solutions', 'Practical digital solutions for growing businesses.', true, 60)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

INSERT INTO public.products (name, slug, price, original_price, short_description, description, category_id, stock_quantity, status, is_featured, is_digital, tags, sort_order)
VALUES
  ('Business Website (5 Pages)', 'business-website-5-pages', 14999, 19999, 'A polished five-page business website for a professional online presence.', 'Responsive business website with essential pages, modern design and launch support.', (SELECT id FROM public.categories WHERE slug = 'web-development'), 999, 'active', true, true, ARRAY['web-development', 'business-website', 'popular'], 10),
  ('E-commerce Website', 'e-commerce-website', 34999, 44999, 'A conversion-focused online store for selling products and services.', 'Modern e-commerce website with product catalog, cart, checkout-ready structure and responsive design.', (SELECT id FROM public.categories WHERE slug = 'web-development'), 999, 'active', true, true, ARRAY['web-development', 'ecommerce', 'popular'], 20),
  ('Facebook Ads Management', 'facebook-ads-management', 6999, 8999, 'Campaign planning and Facebook ads management for measurable growth.', 'Audience research, campaign setup, creative direction and performance-focused Facebook advertising support.', (SELECT id FROM public.categories WHERE slug = 'facebook-services'), 999, 'active', true, true, ARRAY['facebook-services', 'advertising', 'marketing'], 30),
  ('Domain + Hosting Bundle', 'domain-hosting-bundle', 3999, 5499, 'A simple domain and hosting setup for launching your website.', 'Domain setup, hosting configuration and essential deployment support for a smooth launch.', (SELECT id FROM public.categories WHERE slug = 'business-solutions'), 999, 'active', false, true, ARRAY['business-solutions', 'hosting', 'domain'], 40),
  ('Monthly Care Plan', 'monthly-care-plan', 2999, 3999, 'Ongoing maintenance, updates and support for your website.', 'Monthly website maintenance with updates, fixes, monitoring and priority support.', (SELECT id FROM public.categories WHERE slug = 'website-maintenance'), 999, 'active', false, true, ARRAY['website-maintenance', 'support', 'monthly'], 50),
  ('Logo Design Package', 'logo-design-package', 4999, 6999, 'A distinctive logo package for a memorable brand identity.', 'Professional logo concepts, refinement rounds and export-ready brand assets.', (SELECT id FROM public.categories WHERE slug = 'graphics-design'), 999, 'active', true, true, ARRAY['graphics-design', 'logo', 'branding'], 60),
  ('Social Media Creative Pack', 'social-media-creative-pack', 3499, 4499, 'A coordinated set of social media creatives for your brand.', 'Branded social media posts and creative assets designed for consistent online communication.', (SELECT id FROM public.categories WHERE slug = 'graphics-design'), 999, 'active', false, true, ARRAY['graphics-design', 'social-media', 'branding'], 70),
  ('SEO Starter Package', 'seo-starter-package', 7999, 9999, 'A practical SEO foundation for improving search visibility.', 'Technical SEO basics, on-page optimization and a clear starter growth plan.', (SELECT id FROM public.categories WHERE slug = 'digital-marketing'), 999, 'active', true, true, ARRAY['digital-marketing', 'seo', 'growth'], 80)
ON CONFLICT (slug) DO NOTHING;
