import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";

import CartDrawer from "@/components/store/CartDrawer";
import RedirectEnforcer from "@/components/seo/RedirectEnforcer";

// Critical pages — eager load
import Index from "./pages/Index";

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
const AdminCoupons          = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminSettings         = lazy(() => import("./pages/admin/AdminSettings"));
const AdminTickets          = lazy(() => import("./pages/admin/AdminTickets"));
const AdminPayments         = lazy(() => import("./pages/admin/AdminPayments"));
const AdminCustomers        = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminReports          = lazy(() => import("./pages/admin/AdminReports"));
const AdminMarketing        = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminRoles            = lazy(() => import("./pages/admin/AdminRoles"));
const AdminBackup           = lazy(() => import("./pages/admin/AdminBackup"));
const AdminReferrals        = lazy(() => import("./pages/admin/AdminReferrals"));
const UserDashboard         = lazy(() => import("./pages/UserDashboard"));
const ResetPassword         = lazy(() => import("./pages/ResetPassword"));
const Blog                  = lazy(() => import("./pages/Blog"));
const BlogPost              = lazy(() => import("./pages/BlogPost"));
const HelpCenter            = lazy(() => import("./pages/HelpCenter"));
const AdminBlog             = lazy(() => import("./pages/admin/AdminBlog"));
const AdminHelp             = lazy(() => import("./pages/admin/AdminHelp"));
const AdminSEO              = lazy(() => import("./pages/admin/AdminSEO"));
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
const AdminWallet           = lazy(() => import("./pages/admin/AdminWallet"));
const AdminHeroBanner       = lazy(() => import("./pages/admin/AdminHeroBanner"));
const AdminFlashSale        = lazy(() => import("./pages/admin/AdminFlashSale"));
const AdminTestimonials     = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminAnnouncementBar  = lazy(() => import("./pages/admin/AdminAnnouncementBar"));
const AdminNewsletterSubscribers = lazy(() => import("./pages/admin/AdminNewsletterSubscribers"));
const AdminProductImportExport   = lazy(() => import("./pages/admin/AdminProductImportExport"));
const AdminProductReviews        = lazy(() => import("./pages/admin/AdminProductReviews"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
});

// Minimal spinner for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

// Admin body class management
const AppContent = () => {
  const location = useLocation();

  useEffect(() => {
    const isAdmin = location.pathname.startsWith('/admin');
    if (isAdmin) {
      document.body.classList.add('admin-page');
    } else {
      document.body.classList.remove('admin-page');
    }
  }, [location.pathname]);

  return (
    <>
      <CartDrawer />
      <RedirectEnforcer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/help/:slug" element={<HelpCenter />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="categories/new" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="marketing" element={<AdminMarketing />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="backup" element={<AdminBackup />} />
            <Route path="referrals" element={<AdminReferrals />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="help" element={<AdminHelp />} />
            <Route path="seo" element={<AdminSEO />} />
            <Route path="seo/meta-tags" element={<AdminMetaTags />} />
            <Route path="seo/sitemap" element={<AdminSitemap />} />
            <Route path="seo/robots" element={<AdminRobots />} />
            <Route path="seo/schema" element={<AdminSchema />} />
            <Route path="seo/keywords" element={<AdminKeywords />} />
            <Route path="seo/pages" element={<AdminPageSeo />} />
            <Route path="seo/products" element={<AdminProductSeo />} />
            <Route path="seo/faq" element={<AdminFaqManager />} />
            <Route path="seo/reviews" element={<AdminReviews />} />
            <Route path="seo/analytics" element={<AdminGoogleAnalytics />} />
            <Route path="seo/search-console" element={<AdminSearchConsole />} />
            <Route path="seo/speed" element={<AdminSpeedOptimization />} />
            <Route path="seo/images" element={<AdminImageSeo />} />
            <Route path="seo/slugs" element={<AdminSlugEditor />} />
            <Route path="seo/redirects" element={<AdminRedirects />} />
            <Route path="seo/broken-links" element={<AdminBrokenLinks />} />
            <Route path="attributes" element={<AdminAttributes />} />
            <Route path="pages" element={<AdminPages />} />
            <Route path="software-downloads" element={<AdminSoftwareDownloads />} />
            <Route path="wallet" element={<AdminWallet />} />
            <Route path="hero-banner" element={<AdminHeroBanner />} />
            <Route path="flash-sale" element={<AdminFlashSale />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="announcement-bar" element={<AdminAnnouncementBar />} />
            <Route path="newsletter" element={<AdminNewsletterSubscribers />} />
            <Route path="product-reviews" element={<AdminProductReviews />} />
            <Route path="import-export" element={<AdminProductImportExport />} />
          </Route>
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/order-policy" element={<OrderPolicy />} />
          <Route path="/delivery-info" element={<DeliveryInfo />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/free-tools" element={<FreeTools />} />
          <Route path="/refund-request" element={<RefundRequest />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
