import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import CartDrawer from "@/components/store/CartDrawer";
import RedirectEnforcer from "@/components/seo/RedirectEnforcer";
import Index from "./pages/Index";
import Checkout from "./pages/Checkout";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminReports from "./pages/admin/AdminReports";
import AdminMarketing from "./pages/admin/AdminMarketing";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminBackup from "./pages/admin/AdminBackup";
import AdminReferrals from "./pages/admin/AdminReferrals";
import UserDashboard from "./pages/UserDashboard";
import ResetPassword from "./pages/ResetPassword";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import HelpCenter from "./pages/HelpCenter";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminHelp from "./pages/admin/AdminHelp";
import AdminSEO from "./pages/admin/AdminSEO";
import AdminAttributes from "./pages/admin/AdminAttributes";
import AdminPages from "./pages/admin/AdminPages";
import AdminSoftwareDownloads from "./pages/admin/AdminSoftwareDownloads";
import Shop from "./pages/Shop";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";
import OrderPolicy from "./pages/OrderPolicy";
import DeliveryInfo from "./pages/DeliveryInfo";
import ReturnPolicy from "./pages/ReturnPolicy";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import FAQs from "./pages/FAQs";
// SEO sub-pages
import AdminMetaTags from "./pages/admin/seo/AdminMetaTags";
import AdminSitemap from "./pages/admin/seo/AdminSitemap";
import AdminRobots from "./pages/admin/seo/AdminRobots";
import AdminSchema from "./pages/admin/seo/AdminSchema";
import AdminKeywords from "./pages/admin/seo/AdminKeywords";
import AdminPageSeo from "./pages/admin/seo/AdminPageSeo";
import AdminProductSeo from "./pages/admin/seo/AdminProductSeo";
import AdminFaqManager from "./pages/admin/seo/AdminFaqManager";
import AdminReviews from "./pages/admin/seo/AdminReviews";
import AdminGoogleAnalytics from "./pages/admin/seo/AdminGoogleAnalytics";
import AdminSearchConsole from "./pages/admin/seo/AdminSearchConsole";
import AdminSpeedOptimization from "./pages/admin/seo/AdminSpeedOptimization";
import AdminImageSeo from "./pages/admin/seo/AdminImageSeo";
import AdminSlugEditor from "./pages/admin/seo/AdminSlugEditor";
import AdminRedirects from "./pages/admin/seo/AdminRedirects";
import AdminBrokenLinks from "./pages/admin/seo/AdminBrokenLinks";
import AdminWallet from "./pages/admin/AdminWallet";
import AdminHeroBanner from "./pages/admin/AdminHeroBanner";
import AdminFlashSale from "./pages/admin/AdminFlashSale";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminAnnouncementBar from "./pages/admin/AdminAnnouncementBar";
import AdminNewsletterSubscribers from "./pages/admin/AdminNewsletterSubscribers";
import AdminProductImportExport from "./pages/admin/AdminProductImportExport";
import AdminProductReviews from "./pages/admin/AdminProductReviews";
import FreeTools from "./pages/FreeTools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
});

// Copy protection + admin body class management
const AppContent = () => {
  useCopyProtection();
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
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
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
