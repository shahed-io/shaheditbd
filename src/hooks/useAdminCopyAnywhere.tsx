import { useEffect } from 'react';

/**
 * Admin-wide copy freedom:
 *  - Keeps normal browser drag-selection and Ctrl/Cmd+C working across admin.
 *  - Shields admin pages from any site-wide copy/select/context-menu blockers.
 */
export const useAdminCopyAnywhere = () => {
  useEffect(() => {
    const allowAdminNativeCopy = (event: Event) => {
      if (!document.body.classList.contains('admin-page')) return;
      event.stopImmediatePropagation();
    };

    document.addEventListener('copy', allowAdminNativeCopy, true);
    document.addEventListener('cut', allowAdminNativeCopy, true);
    document.addEventListener('selectstart', allowAdminNativeCopy, true);
    document.addEventListener('contextmenu', allowAdminNativeCopy, true);
    document.addEventListener('dragstart', allowAdminNativeCopy, true);

    return () => {
      document.removeEventListener('copy', allowAdminNativeCopy, true);
      document.removeEventListener('cut', allowAdminNativeCopy, true);
      document.removeEventListener('selectstart', allowAdminNativeCopy, true);
      document.removeEventListener('contextmenu', allowAdminNativeCopy, true);
      document.removeEventListener('dragstart', allowAdminNativeCopy, true);
    };
  }, []);
};
