import { useEffect } from 'react';
import { installCopyDeterrents, evaluateClientProtection } from '@/lib/antiScraping';

/**
 * useCopyProtection
 * --------------------------------------------------------------
 * Mounts site-wide design copy protection for real human visitors.
 * Search engine bots (Googlebot, GPTBot, etc.) are skipped so SEO
 * and AI ranking remain intact.
 *
 * Active deterrents:
 *  - Right-click block (except in inputs / .allow-select / .prose)
 *  - Copy / cut / drag block (clipboard replaced with copyright notice)
 *  - DevTools shortcuts blocked (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
 *  - DevTools open detection → page blurs while open
 *  - selectstart blocked on chrome regions
 */
export const useCopyProtection = () => {
  useEffect(() => {
    const decision = evaluateClientProtection();
    if (decision.classification !== 'human') return;
    const cleanup = installCopyDeterrents();
    return cleanup;
  }, []);
};
