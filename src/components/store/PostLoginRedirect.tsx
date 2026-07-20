import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'post_login_redirect';

/**
 * Global listener: when a user becomes authenticated, if a stored
 * post-login redirect path exists (saved before OAuth by AuthModal / Checkout),
 * navigate the user back to that path so they don't lose their checkout progress.
 *
 * Only same-origin absolute paths (starting with "/") are honored.
 */
const PostLoginRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    let target = '';
    try { target = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY) || ''; } catch {}
    if (!target || !target.startsWith('/')) return;
    // Don't redirect if we're already there or on admin routes
    const current = location.pathname + location.search;
    if (target === current) {
      try { sessionStorage.removeItem(STORAGE_KEY); localStorage.removeItem(STORAGE_KEY); } catch {}
      return;
    }
    if (location.pathname.startsWith('/ceo') || location.pathname === '/reset-password') return;
    try { sessionStorage.removeItem(STORAGE_KEY); localStorage.removeItem(STORAGE_KEY); } catch {}
    navigate(target, { replace: true });
  }, [user, loading, location.pathname, location.search, navigate]);

  return null;
};

export default PostLoginRedirect;
