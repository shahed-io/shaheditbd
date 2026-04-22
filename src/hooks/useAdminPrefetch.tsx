/**
 * useAdminPrefetch — Eager-loads all admin sub-page chunks during browser idle time.
 *
 * When an admin lands on /ceo, this hook fires off all admin route imports in the
 * background so subsequent menu clicks resolve INSTANTLY (no network/parse delay).
 *
 * Strategy:
 *  - Wave 1 (immediate): Top-used pages (Orders, Products, Customers, Payments)
 *  - Wave 2 (idle, ~500ms): Catalog + Marketing
 *  - Wave 3 (idle, ~1500ms): SEO, System, Integrations
 */
import { useEffect } from 'react';

const _started = new Set<string>();

const safeImport = (key: string, fn: () => Promise<unknown>) => {
  if (_started.has(key)) return;
  _started.add(key);
  fn().catch(() => _started.delete(key));
};

const idle = (cb: () => void, delay = 0) => {
  if (typeof window === 'undefined') return;
  const run = () => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(cb, { timeout: 2500 });
    } else {
      setTimeout(cb, 50);
    }
  };
  if (delay > 0) setTimeout(run, delay);
  else run();
};

export function useAdminPrefetch() {
  useEffect(() => {
    // ── Wave 1: HOT pages (load immediately during idle) ─────────────────────
    idle(() => {
      safeImport('orders', () => import('@/pages/admin/AdminOrders'));
      safeImport('products', () => import('@/pages/admin/AdminProducts'));
      safeImport('customers', () => import('@/pages/admin/AdminCustomers'));
      safeImport('payments', () => import('@/pages/admin/AdminPayments'));
      safeImport('quick-sale', () => import('@/pages/admin/AdminQuickSale'));
      safeImport('invoices', () => import('@/pages/admin/AdminInvoiceGenerator'));
      safeImport('licenses', () => import('@/pages/admin/AdminLicenses'));
      safeImport('tickets', () => import('@/pages/admin/AdminTickets'));
    }, 200);

    // ── Wave 2: Catalog + Customer + Marketing ───────────────────────────────
    idle(() => {
      safeImport('categories', () => import('@/pages/admin/AdminCategories'));
      safeImport('attributes', () => import('@/pages/admin/AdminAttributes'));
      safeImport('inventory-alerts', () => import('@/pages/admin/AdminInventoryAlerts'));
      safeImport('product-reviews', () => import('@/pages/admin/AdminProductReviews'));
      safeImport('import-export', () => import('@/pages/admin/AdminProductImportExport'));
      safeImport('software-downloads', () => import('@/pages/admin/AdminSoftwareDownloads'));
      safeImport('wallet', () => import('@/pages/admin/AdminWallet'));
      safeImport('live-chat', () => import('@/pages/admin/AdminLiveChat'));
      safeImport('newsletter', () => import('@/pages/admin/AdminNewsletterSubscribers'));
      safeImport('coupons', () => import('@/pages/admin/AdminCoupons'));
      safeImport('welcome-discount', () => import('@/pages/admin/AdminWelcomeDiscount'));
      safeImport('referrals', () => import('@/pages/admin/AdminReferrals'));
      safeImport('affiliates', () => import('@/pages/admin/AdminAffiliates'));
      safeImport('marketing', () => import('@/pages/admin/AdminMarketing'));
    }, 800);

    // ── Wave 3: Storefront + Reports + AI + Settings ─────────────────────────
    idle(() => {
      safeImport('hero-banner', () => import('@/pages/admin/AdminHeroBanner'));
      safeImport('flash-sale', () => import('@/pages/admin/AdminFlashSale'));
      safeImport('testimonials', () => import('@/pages/admin/AdminTestimonials'));
      safeImport('announcement-bar', () => import('@/pages/admin/AdminAnnouncementBar'));
      safeImport('popup-banner', () => import('@/pages/admin/AdminPopupBanner'));
      safeImport('pages', () => import('@/pages/admin/AdminPages'));
      safeImport('footer-settings', () => import('@/pages/admin/AdminFooterSettings'));
      safeImport('themes', () => import('@/pages/admin/AdminThemes'));
      safeImport('blog', () => import('@/pages/admin/AdminBlog'));
      safeImport('help', () => import('@/pages/admin/AdminHelp'));
      safeImport('media-library', () => import('@/pages/admin/AdminMediaLibrary'));
      safeImport('reports', () => import('@/pages/admin/AdminReports'));
      safeImport('ai-assistant', () => import('@/pages/admin/AdminAiAssistant'));
      safeImport('ai-config', () => import('@/pages/admin/AdminAiConfig'));
    }, 1800);

    // ── Wave 4: Integrations + System + Pixels + SEO sub-pages ───────────────
    idle(() => {
      safeImport('telegram-bot', () => import('@/pages/admin/AdminTelegramBot'));
      safeImport('reseller-accounts', () => import('@/pages/admin/AdminResellerAccounts'));
      safeImport('staff', () => import('@/pages/admin/AdminStaffManagement'));
      safeImport('roles', () => import('@/pages/admin/AdminRoles'));
      safeImport('backup', () => import('@/pages/admin/AdminBackup'));
      safeImport('settings', () => import('@/pages/admin/AdminSettings'));
      safeImport('facebook-pixel', () => import('@/pages/admin/AdminFacebookPixel'));
      safeImport('custom-audiences', () => import('@/pages/admin/AdminCustomAudiences'));
      safeImport('google-ads', () => import('@/pages/admin/AdminGoogleAds'));
      safeImport('marketing-pixels', () => import('@/pages/admin/AdminMarketingPixels'));
      safeImport('seo', () => import('@/pages/admin/AdminSEO'));
      safeImport('site-verification', () => import('@/pages/admin/AdminSiteVerification'));
    }, 3000);

    // ── Wave 5: SEO sub-pages (lowest priority) ──────────────────────────────
    idle(() => {
      safeImport('seo-meta', () => import('@/pages/admin/seo/AdminMetaTags'));
      safeImport('seo-sitemap', () => import('@/pages/admin/seo/AdminSitemap'));
      safeImport('seo-robots', () => import('@/pages/admin/seo/AdminRobots'));
      safeImport('seo-schema', () => import('@/pages/admin/seo/AdminSchema'));
      safeImport('seo-keywords', () => import('@/pages/admin/seo/AdminKeywords'));
      safeImport('seo-pages', () => import('@/pages/admin/seo/AdminPageSeo'));
      safeImport('seo-products', () => import('@/pages/admin/seo/AdminProductSeo'));
      safeImport('seo-faq', () => import('@/pages/admin/seo/AdminFaqManager'));
      safeImport('seo-reviews', () => import('@/pages/admin/seo/AdminReviews'));
      safeImport('seo-analytics', () => import('@/pages/admin/seo/AdminGoogleAnalytics'));
      safeImport('seo-search-console', () => import('@/pages/admin/seo/AdminSearchConsole'));
      safeImport('seo-speed', () => import('@/pages/admin/seo/AdminSpeedOptimization'));
      safeImport('seo-images', () => import('@/pages/admin/seo/AdminImageSeo'));
      safeImport('seo-slugs', () => import('@/pages/admin/seo/AdminSlugEditor'));
      safeImport('seo-redirects', () => import('@/pages/admin/seo/AdminRedirects'));
      safeImport('seo-broken', () => import('@/pages/admin/seo/AdminBrokenLinks'));
      safeImport('seo-content', () => import('@/pages/admin/seo/AdminContentSeo'));
    }, 4500);
  }, []);
}

/**
 * Map menu paths to their dynamic-import factories so we can fire a HOVER prefetch
 * the moment a user mouse-enters / touches a sidebar link.
 */
const HOVER_LOADERS: Record<string, () => Promise<unknown>> = {
  '/ceo':                       () => import('@/pages/admin/AdminDashboard'),
  '/ceo/orders':                () => import('@/pages/admin/AdminOrders'),
  '/ceo/quick-sale':            () => import('@/pages/admin/AdminQuickSale'),
  '/ceo/invoices':              () => import('@/pages/admin/AdminInvoiceGenerator'),
  '/ceo/payments':              () => import('@/pages/admin/AdminPayments'),
  '/ceo/licenses':              () => import('@/pages/admin/AdminLicenses'),
  '/ceo/products':              () => import('@/pages/admin/AdminProducts'),
  '/ceo/categories':            () => import('@/pages/admin/AdminCategories'),
  '/ceo/attributes':            () => import('@/pages/admin/AdminAttributes'),
  '/ceo/inventory-alerts':      () => import('@/pages/admin/AdminInventoryAlerts'),
  '/ceo/import-export':         () => import('@/pages/admin/AdminProductImportExport'),
  '/ceo/product-reviews':       () => import('@/pages/admin/AdminProductReviews'),
  '/ceo/software-downloads':    () => import('@/pages/admin/AdminSoftwareDownloads'),
  '/ceo/customers':             () => import('@/pages/admin/AdminCustomers'),
  '/ceo/wallet':                () => import('@/pages/admin/AdminWallet'),
  '/ceo/tickets':               () => import('@/pages/admin/AdminTickets'),
  '/ceo/live-chat':             () => import('@/pages/admin/AdminLiveChat'),
  '/ceo/newsletter':            () => import('@/pages/admin/AdminNewsletterSubscribers'),
  '/ceo/hero-banner':           () => import('@/pages/admin/AdminHeroBanner'),
  '/ceo/flash-sale':            () => import('@/pages/admin/AdminFlashSale'),
  '/ceo/testimonials':          () => import('@/pages/admin/AdminTestimonials'),
  '/ceo/announcement-bar':      () => import('@/pages/admin/AdminAnnouncementBar'),
  '/ceo/popup-banner':          () => import('@/pages/admin/AdminPopupBanner'),
  '/ceo/pages':                 () => import('@/pages/admin/AdminPages'),
  '/ceo/footer-settings':       () => import('@/pages/admin/AdminFooterSettings'),
  '/ceo/themes':                () => import('@/pages/admin/AdminThemes'),
  '/ceo/coupons':               () => import('@/pages/admin/AdminCoupons'),
  '/ceo/welcome-discount':      () => import('@/pages/admin/AdminWelcomeDiscount'),
  '/ceo/referrals':             () => import('@/pages/admin/AdminReferrals'),
  '/ceo/affiliates':            () => import('@/pages/admin/AdminAffiliates'),
  '/ceo/marketing':             () => import('@/pages/admin/AdminMarketing'),
  '/ceo/facebook-pixel':        () => import('@/pages/admin/AdminFacebookPixel'),
  '/ceo/custom-audiences':      () => import('@/pages/admin/AdminCustomAudiences'),
  '/ceo/google-ads':            () => import('@/pages/admin/AdminGoogleAds'),
  '/ceo/marketing-pixels':      () => import('@/pages/admin/AdminMarketingPixels'),
  '/ceo/blog':                  () => import('@/pages/admin/AdminBlog'),
  '/ceo/help':                  () => import('@/pages/admin/AdminHelp'),
  '/ceo/media-library':         () => import('@/pages/admin/AdminMediaLibrary'),
  '/ceo/seo':                   () => import('@/pages/admin/AdminSEO'),
  '/ceo/site-verification':     () => import('@/pages/admin/AdminSiteVerification'),
  '/ceo/reports':               () => import('@/pages/admin/AdminReports'),
  '/ceo/telegram-bot':          () => import('@/pages/admin/AdminTelegramBot'),
  '/ceo/reseller-accounts':     () => import('@/pages/admin/AdminResellerAccounts'),
  '/ceo/ai-assistant':          () => import('@/pages/admin/AdminAiAssistant'),
  '/ceo/ai-config':             () => import('@/pages/admin/AdminAiConfig'),
  '/ceo/staff':                 () => import('@/pages/admin/AdminStaffManagement'),
  '/ceo/roles':                 () => import('@/pages/admin/AdminRoles'),
  '/ceo/backup':                () => import('@/pages/admin/AdminBackup'),
  '/ceo/settings':              () => import('@/pages/admin/AdminSettings'),
};

export function prefetchAdminRoute(path: string): void {
  const loader = HOVER_LOADERS[path];
  if (!loader || _started.has(path)) return;
  _started.add(path);
  loader().catch(() => _started.delete(path));
}
