import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { useAdminOrderNotification } from "@/hooks/useAdminOrderNotification";
import { prefetchOnIdle } from "@/hooks/usePrefetchRoute";
import { ViewTransitions } from "@/components/ViewTransitions";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useCustomAudiences } from "@/hooks/useCustomAudiences";
import { useMarketingPixelsPageView } from "@/hooks/useMarketingPixelsPageView";
import { useCart } from "@/hooks/useCart";

// Critical pages — eager load
import Index from "./pages/Index";

// Deferred non-critical components — lazy loaded
const CartDrawer = lazy(() => import("@/components/store/CartDrawer"));
const RedirectEnforcer = lazy(() => import("@/components/seo/RedirectEnforcer"));
const FacebookPixel = lazy(() => import("@/components/store/FacebookPixel"));
const GoogleTracking = lazy(() => import("@/components/store/GoogleTracking"));
const MarketingPixels = lazy(() => import("@/components/store/MarketingPixels"));
const MobileBottomNav = lazy(() => import("@/components/store/MobileBottomNav"));
const FloatingSupport = lazy(() => import("@/components/store/FloatingSupport").then(m => ({ default: m.FloatingSupport })));

// All other pages — lazy loaded
const Checkout              = lazy(() => import("./pages/Checkout"));
const ProductDetail         = lazy(() => import("./pages/ProductDetail"));
const NotFound              = lazy(() => import("./pages/NotFound"));
const AdminLogin            = lazy(() => import("./pages/AdminLogin"));
const AdminLayout           = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard        = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts         = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories       = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders           = lazy(() => import("./pages/admin/AdminOrders"));
const AdminAbandonedCheckouts = lazy(() => import("./pages/admin/AdminAbandonedCheckouts"));
const AdminCoupons          = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminSettings         = lazy(() => import("./pages/admin/AdminSettings"));
const AdminTickets          = lazy(() => import("./pages/admin/AdminTickets"));
const AdminPayments         = lazy(() => import("./pages/admin/AdminPayments"));
const AdminCustomers        = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminReports          = lazy(() => import("./pages/admin/AdminReports"));
const AdminMarketing        = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminRoles            = lazy(() => import("./pages/admin/AdminRoles"));
const AdminBackup           = lazy(() => import("./pages/admin/AdminBackup"));
const AdminAiConfig         = lazy(() => import("./pages/admin/AdminAiConfig"));
const AdminReferrals        = lazy(() => import("./pages/admin/AdminReferrals"));
const UserDashboard         = lazy(() => import("./pages/UserDashboard"));
const ResetPassword         = lazy(() => import("./pages/ResetPassword"));
const Blog                  = lazy(() => import("./pages/Blog"));
const BlogPost              = lazy(() => import("./pages/BlogPost"));
const HelpCenter            = lazy(() => import("./pages/HelpCenter"));
const AdminBlog             = lazy(() => import("./pages/admin/AdminBlog"));
const AdminHelp             = lazy(() => import("./pages/admin/AdminHelp"));
const AdminSEO              = lazy(() => import("./pages/admin/AdminSEO"));
const AdminSEOMonitor       = lazy(() => import("./pages/admin/AdminSEOMonitor"));
const AdminAttributes       = lazy(() => import("./pages/admin/AdminAttributes"));
const AdminPages            = lazy(() => import("./pages/admin/AdminPages"));
const AdminSoftwareDownloads= lazy(() => import("./pages/admin/AdminSoftwareDownloads"));
const Shop                  = lazy(() => import("./pages/Shop"));
const PrivacyPolicy         = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions       = lazy(() => import("./pages/TermsConditions"));
const RefundPolicy          = lazy(() => import("./pages/RefundPolicy"));
const OrderPolicy           = lazy(() => import("./pages/OrderPolicy"));
const DeliveryInfo          = lazy(() => import("./pages/DeliveryInfo"));
const ReturnPolicy          = lazy(() => import("./pages/ReturnPolicy"));
const ContactUs             = lazy(() => import("./pages/ContactUs"));
const AboutUs               = lazy(() => import("./pages/AboutUs"));
const FAQs                  = lazy(() => import("./pages/FAQs"));
const FreeTools             = lazy(() => import("./pages/FreeTools"));
const RefundRequest         = lazy(() => import("./pages/RefundRequest"));
const InstallApp            = lazy(() => import("./pages/InstallApp"));
const Unsubscribe           = lazy(() => import("./pages/Unsubscribe"));

// SEO sub-pages
const AdminMetaTags         = lazy(() => import("./pages/admin/seo/AdminMetaTags"));
const AdminSitemap          = lazy(() => import("./pages/admin/seo/AdminSitemap"));
const AdminRobots           = lazy(() => import("./pages/admin/seo/AdminRobots"));
const AdminSchema           = lazy(() => import("./pages/admin/seo/AdminSchema"));
const AdminKeywords         = lazy(() => import("./pages/admin/seo/AdminKeywords"));
const AdminPageSeo          = lazy(() => import("./pages/admin/seo/AdminPageSeo"));
const AdminProductSeo       = lazy(() => import("./pages/admin/seo/AdminProductSeo"));
const AdminFaqManager       = lazy(() => import("./pages/admin/seo/AdminFaqManager"));
const AdminReviews          = lazy(() => import("./pages/admin/seo/AdminReviews"));
const AdminGoogleAnalytics  = lazy(() => import("./pages/admin/seo/AdminGoogleAnalytics"));
const AdminSearchConsole    = lazy(() => import("./pages/admin/seo/AdminSearchConsole"));
const AdminSpeedOptimization= lazy(() => import("./pages/admin/seo/AdminSpeedOptimization"));
const AdminImageSeo         = lazy(() => import("./pages/admin/seo/AdminImageSeo"));
const AdminSlugEditor       = lazy(() => import("./pages/admin/seo/AdminSlugEditor"));
const AdminRedirects        = lazy(() => import("./pages/admin/seo/AdminRedirects"));
const AdminBrokenLinks      = lazy(() => import("./pages/admin/seo/AdminBrokenLinks"));
const AdminOutreach         = lazy(() => import("./pages/admin/seo/AdminOutreach"));
const AdminWallet           = lazy(() => import("./pages/admin/AdminWallet"));
const AdminHeroBanner       = lazy(() => import("./pages/admin/AdminHeroBanner"));
const AdminFlashSale        = lazy(() => import("./pages/admin/AdminFlashSale"));
const AdminTestimonials     = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminAnnouncementBar  = lazy(() => import("./pages/admin/AdminAnnouncementBar"));
const AdminNewsletterSubscribers = lazy(() => import("./pages/admin/AdminNewsletterSubscribers"));
const AdminProductImportExport   = lazy(() => import("./pages/admin/AdminProductImportExport"));
const AdminMediaLibrary          = lazy(() => import("./pages/admin/AdminMediaLibrary"));
const AdminProductReviews        = lazy(() => import("./pages/admin/AdminProductReviews"));
const AdminFacebookPixel         = lazy(() => import("./pages/admin/AdminFacebookPixel"));
const AdminLicenses              = lazy(() => import("./pages/admin/AdminLicenses"));
const AdminCustomerLicenses      = lazy(() => import("./pages/admin/AdminCustomerLicenses"));
const AdminSubscriptionReminders = lazy(() => import("./pages/admin/AdminSubscriptionReminders"));
const AdminQuickSale             = lazy(() => import("./pages/admin/AdminQuickSale"));
const AdminPopupBanner           = lazy(() => import("./pages/admin/AdminPopupBanner"));
const AdminInvoiceGenerator      = lazy(() => import("./pages/admin/AdminInvoiceGenerator"));
const AdminInvoiceDesign         = lazy(() => import("./pages/admin/AdminInvoiceDesign"));
const AdminFooterSettings        = lazy(() => import("./pages/admin/AdminFooterSettings"));
const AdminTextManager           = lazy(() => import("./pages/admin/AdminTextManager"));
const AdminLiveChat              = lazy(() => import("./pages/admin/AdminLiveChat"));
const AdminTelegramBot           = lazy(() => import("./pages/admin/AdminTelegramBot"));
const AdminStaffManagement       = lazy(() => import("./pages/admin/AdminStaffManagement"));
const AdminInventoryAlerts       = lazy(() => import("./pages/admin/AdminInventoryAlerts"));
const AdminThemes                = lazy(() => import("./pages/admin/AdminThemes"));
const AdminAiAssistant           = lazy(() => import("./pages/admin/AdminAiAssistant"));
const AdminWelcomeDiscount       = lazy(() => import("./pages/admin/AdminWelcomeDiscount"));
const AdminAffiliates            = lazy(() => import("./pages/admin/AdminAffiliates"));
const AdminGoogleAds             = lazy(() => import("./pages/admin/AdminGoogleAds"));
const AdminCustomAudiences       = lazy(() => import("./pages/admin/AdminCustomAudiences"));
const AdminMarketingPixels       = lazy(() => import("./pages/admin/AdminMarketingPixels"));
const AdminSiteVerification      = lazy(() => import("./pages/admin/AdminSiteVerification"));
const AdminContentSeo            = lazy(() => import("./pages/admin/seo/AdminContentSeo"));
const Affiliate                  = lazy(() => import("./pages/Affiliate"));
const AdminGetCIDTools           = lazy(() => import("./pages/admin/AdminGetCIDTools"));
const AdminCidCredits            = lazy(() => import("./pages/admin/AdminCidCredits"));
const GetCID                     = lazy(() => import("./pages/GetCID"));
const CheckKey                   = lazy(() => import("./pages/CheckKey"));
const AdminSecurity2FA           = lazy(() => import("./pages/admin/AdminSecurity2FA"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime:    1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,       // Don't refetch if data is fresh
      refetchOnReconnect: false,   // Don't refetch on reconnect
    },
  },
});

// Branded loader for Suspense fallback
import BrandLoader from "@/components/store/BrandLoader";
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <BrandLoader size="md" />
  </div>
);

// Lightweight spinner for admin sub-pages (no full-screen loader)
const AdminPageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

// Wrapper to use lighter fallback for admin child routes
const AdminSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<AdminPageLoader />}>{children}</Suspense>
);

// Admin notification listener (only active when user is admin)
const AdminNotificationListener = () => {
  const { isAdmin } = useAuth();
  useAdminOrderNotification(isAdmin);
  return null;
};

// Admin body class management
const AppContent = () => {
  const location = useLocation();
  const [deferReady, setDeferReady] = useState(false);
  useTheme(); // Apply saved theme on load
  useAffiliateTracking(); // Capture ?ref=CODE on every navigation
  const { subtotal } = useCart();
  useCustomAudiences({ cartValue: subtotal }); // Fire FB custom-audience events on route changes
  useMarketingPixelsPageView(); // Fire PageView on TikTok/Snap/Pin/LinkedIn/X on every route change

  useEffect(() => {
    // Defer non-critical components until after first paint (~20ms)
    const id = requestAnimationFrame(() => {
      setDeferReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Warm critical route chunks during browser idle time → instant navigation
  useEffect(() => {
    prefetchOnIdle([
      '/shop',
      '/product/',     // ProductDetail chunk
      '/checkout',
      '/blog',
      '/free-tools',
      '/dashboard',
      '/contact',
      '/about',
      '/faqs',
    ], 1500);
  }, []);

  useEffect(() => {
    const isAdmin = location.pathname.startsWith('/ceo');
    if (isAdmin) {
      document.body.classList.add('admin-page');
    } else {
      document.body.classList.remove('admin-page');
    }
  }, [location.pathname]);

  return (
    <>
      {deferReady && (
        <Suspense fallback={null}>
          <AdminNotificationListener />
          <FacebookPixel />
          <GoogleTracking />
          <MarketingPixels />
          <CartDrawer />
          <RedirectEnforcer />
        </Suspense>
      )}
      <ViewTransitions />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/link" element={<HelpCenter />} />
          <Route path="/link/:slug" element={<HelpCenter />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/ceo/login" element={<AdminLogin />} />
          <Route path="/ceo" element={<AdminLayout />}>
            <Route index element={<AdminSuspense><AdminDashboard /></AdminSuspense>} />
            <Route path="products" element={<AdminSuspense><AdminProducts /></AdminSuspense>} />
            <Route path="products/new" element={<AdminSuspense><AdminProducts /></AdminSuspense>} />
            <Route path="categories" element={<AdminSuspense><AdminCategories /></AdminSuspense>} />
            <Route path="categories/new" element={<AdminSuspense><AdminCategories /></AdminSuspense>} />
            <Route path="orders" element={<AdminSuspense><AdminOrders /></AdminSuspense>} />
            <Route path="abandoned-checkouts" element={<AdminSuspense><AdminAbandonedCheckouts /></AdminSuspense>} />
            <Route path="coupons" element={<AdminSuspense><AdminCoupons /></AdminSuspense>} />
            <Route path="settings" element={<AdminSuspense><AdminSettings /></AdminSuspense>} />
            <Route path="ai-config" element={<AdminSuspense><AdminAiConfig /></AdminSuspense>} />
            <Route path="customers" element={<AdminSuspense><AdminCustomers /></AdminSuspense>} />
            <Route path="payments" element={<AdminSuspense><AdminPayments /></AdminSuspense>} />
            <Route path="tickets" element={<AdminSuspense><AdminTickets /></AdminSuspense>} />
            <Route path="reports" element={<AdminSuspense><AdminReports /></AdminSuspense>} />
            <Route path="marketing" element={<AdminSuspense><AdminMarketing /></AdminSuspense>} />
            <Route path="roles" element={<AdminSuspense><AdminRoles /></AdminSuspense>} />
            <Route path="backup" element={<AdminSuspense><AdminBackup /></AdminSuspense>} />
            <Route path="referrals" element={<AdminSuspense><AdminReferrals /></AdminSuspense>} />
            <Route path="blog" element={<AdminSuspense><AdminBlog /></AdminSuspense>} />
            <Route path="help" element={<AdminSuspense><AdminHelp /></AdminSuspense>} />
            <Route path="seo" element={<AdminSuspense><AdminSEO /></AdminSuspense>} />
            <Route path="seo-monitor" element={<AdminSuspense><AdminSEOMonitor /></AdminSuspense>} />
            <Route path="seo/meta-tags" element={<AdminSuspense><AdminMetaTags /></AdminSuspense>} />
            <Route path="seo/sitemap" element={<AdminSuspense><AdminSitemap /></AdminSuspense>} />
            <Route path="seo/robots" element={<AdminSuspense><AdminRobots /></AdminSuspense>} />
            <Route path="seo/schema" element={<AdminSuspense><AdminSchema /></AdminSuspense>} />
            <Route path="seo/keywords" element={<AdminSuspense><AdminKeywords /></AdminSuspense>} />
            <Route path="seo/pages" element={<AdminSuspense><AdminPageSeo /></AdminSuspense>} />
            <Route path="seo/products" element={<AdminSuspense><AdminProductSeo /></AdminSuspense>} />
            <Route path="seo/faq" element={<AdminSuspense><AdminFaqManager /></AdminSuspense>} />
            <Route path="seo/reviews" element={<AdminSuspense><AdminReviews /></AdminSuspense>} />
            <Route path="seo/analytics" element={<AdminSuspense><AdminGoogleAnalytics /></AdminSuspense>} />
            <Route path="seo/search-console" element={<AdminSuspense><AdminSearchConsole /></AdminSuspense>} />
            <Route path="seo/speed" element={<AdminSuspense><AdminSpeedOptimization /></AdminSuspense>} />
            <Route path="seo/images" element={<AdminSuspense><AdminImageSeo /></AdminSuspense>} />
            <Route path="seo/slugs" element={<AdminSuspense><AdminSlugEditor /></AdminSuspense>} />
            <Route path="seo/redirects" element={<AdminSuspense><AdminRedirects /></AdminSuspense>} />
            <Route path="seo/broken-links" element={<AdminSuspense><AdminBrokenLinks /></AdminSuspense>} />
            <Route path="seo/outreach" element={<AdminSuspense><AdminOutreach /></AdminSuspense>} />
            <Route path="attributes" element={<AdminSuspense><AdminAttributes /></AdminSuspense>} />
            <Route path="pages" element={<AdminSuspense><AdminPages /></AdminSuspense>} />
            <Route path="software-downloads" element={<AdminSuspense><AdminSoftwareDownloads /></AdminSuspense>} />
            <Route path="media-library" element={<AdminSuspense><AdminMediaLibrary /></AdminSuspense>} />
            <Route path="wallet" element={<AdminSuspense><AdminWallet /></AdminSuspense>} />
            <Route path="hero-banner" element={<AdminSuspense><AdminHeroBanner /></AdminSuspense>} />
            <Route path="flash-sale" element={<AdminSuspense><AdminFlashSale /></AdminSuspense>} />
            <Route path="testimonials" element={<AdminSuspense><AdminTestimonials /></AdminSuspense>} />
            <Route path="announcement-bar" element={<AdminSuspense><AdminAnnouncementBar /></AdminSuspense>} />
            <Route path="newsletter" element={<AdminSuspense><AdminNewsletterSubscribers /></AdminSuspense>} />
            <Route path="product-reviews" element={<AdminSuspense><AdminProductReviews /></AdminSuspense>} />
            <Route path="import-export" element={<AdminSuspense><AdminProductImportExport /></AdminSuspense>} />
            <Route path="facebook-pixel" element={<AdminSuspense><AdminFacebookPixel /></AdminSuspense>} />
            <Route path="licenses" element={<AdminSuspense><AdminLicenses /></AdminSuspense>} />
            <Route path="customer-licenses" element={<AdminSuspense><AdminCustomerLicenses /></AdminSuspense>} />
            <Route path="quick-sale" element={<AdminSuspense><AdminQuickSale /></AdminSuspense>} />
            <Route path="popup-banner" element={<AdminSuspense><AdminPopupBanner /></AdminSuspense>} />
            <Route path="invoices" element={<AdminSuspense><AdminInvoiceGenerator /></AdminSuspense>} />
            <Route path="invoice-design" element={<AdminSuspense><AdminInvoiceDesign /></AdminSuspense>} />
            <Route path="footer-settings" element={<AdminSuspense><AdminFooterSettings /></AdminSuspense>} />
            <Route path="text-manager" element={<AdminSuspense><AdminTextManager /></AdminSuspense>} />
            <Route path="live-chat" element={<AdminSuspense><AdminLiveChat /></AdminSuspense>} />
            <Route path="telegram-bot" element={<AdminSuspense><AdminTelegramBot /></AdminSuspense>} />
            <Route path="staff" element={<AdminSuspense><AdminStaffManagement /></AdminSuspense>} />
            <Route path="inventory-alerts" element={<AdminSuspense><AdminInventoryAlerts /></AdminSuspense>} />
            <Route path="themes" element={<AdminSuspense><AdminThemes /></AdminSuspense>} />
            <Route path="ai-assistant" element={<AdminSuspense><AdminAiAssistant /></AdminSuspense>} />
            <Route path="welcome-discount" element={<AdminSuspense><AdminWelcomeDiscount /></AdminSuspense>} />
            <Route path="affiliates" element={<AdminSuspense><AdminAffiliates /></AdminSuspense>} />
            <Route path="google-ads" element={<AdminSuspense><AdminGoogleAds /></AdminSuspense>} />
            <Route path="custom-audiences" element={<AdminSuspense><AdminCustomAudiences /></AdminSuspense>} />
            <Route path="marketing-pixels" element={<AdminSuspense><AdminMarketingPixels /></AdminSuspense>} />
            <Route path="site-verification" element={<AdminSuspense><AdminSiteVerification /></AdminSuspense>} />
            <Route path="seo/content-analyzer" element={<AdminSuspense><AdminContentSeo /></AdminSuspense>} />

            <Route path="getcid-tools" element={<AdminSuspense><AdminGetCIDTools /></AdminSuspense>} />
            <Route path="cid-credits" element={<AdminSuspense><AdminCidCredits /></AdminSuspense>} />
            <Route path="security" element={<AdminSuspense><AdminSecurity2FA /></AdminSuspense>} />
          </Route>
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/order-policy" element={<OrderPolicy />} />
          <Route path="/delivery-info" element={<DeliveryInfo />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/contact" element={<Navigate to="/contact-us" replace />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/free-tools" element={<FreeTools />} />
          <Route path="/free-tools/:toolId" element={<FreeTools />} />
          <Route path="/refund-request" element={<RefundRequest />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/get-cid" element={<GetCID />} />
          <Route path="/check-key" element={<CheckKey />} />
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/install" element={<InstallApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {deferReady && (
        <Suspense fallback={null}>
          <MobileBottomNav />
          {!location.pathname.startsWith('/ceo') && <FloatingSupport />}
        </Suspense>
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
