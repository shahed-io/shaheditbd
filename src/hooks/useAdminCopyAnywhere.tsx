import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Admin-wide click-to-copy:
 *  - Alt + Click on any element → copies its visible text to clipboard
 *  - Double-click on any text node → copies that text
 *  Skips inputs, textareas, buttons (so normal interactions still work).
 */
export const useAdminCopyAnywhere = () => {
  useEffect(() => {
    const isInteractive = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const tag = el.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tag)) return true;
      if (el.isContentEditable) return true;
      if (el.closest('button, a, input, textarea, select, [contenteditable="true"], [role="button"], [role="tab"], [role="menuitem"]')) {
        return true;
      }
      return false;
    };

    const copyText = async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      try {
        await navigator.clipboard.writeText(clean);
        toast.success('Copied!', {
          description: clean.length > 60 ? clean.slice(0, 60) + '…' : clean,
          duration: 1500,
        });
      } catch {
        toast.error('Copy failed');
      }
    };

    const handleAltClick = (e: MouseEvent) => {
      if (!e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const text = target.innerText || target.textContent || '';
      if (!text.trim()) return;
      e.preventDefault();
      e.stopPropagation();
      copyText(text);
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (isInteractive(target)) return;
      // Use selection for precise text user double-clicked on
      const sel = window.getSelection?.()?.toString();
      const text = sel || target.innerText || target.textContent || '';
      if (!text.trim()) return;
      copyText(text);
    };

    // Auto-copy on left-mouse drag selection
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return; // left button only
      const target = e.target as HTMLElement | null;
      if (target && isInteractive(target)) return;
      // Defer so the selection is finalized
      setTimeout(() => {
        const sel = window.getSelection?.();
        const text = sel?.toString() ?? '';
        if (text.trim().length > 0) {
          copyText(text);
        }
      }, 0);
    };

    document.addEventListener('click', handleAltClick, true);
    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('click', handleAltClick, true);
      document.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
};
