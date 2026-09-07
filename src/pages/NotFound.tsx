import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEOHead from "@/components/seo/SEOHead";
import NotFoundScreen from "@/components/store/NotFoundScreen";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEOHead
        title="Page Not Found (404)"
        description="The page you are looking for does not exist on Shahed IT."
        noIndex
      />
      <NotFoundScreen
        code="404"
        title="Looks like you're lost"
        message="The page you are looking for is currently unplugged from our digital cave."
        ctaLabel="Go to Home"
        ctaHref="/"
      />
    </>
  );
};

export default NotFound;
