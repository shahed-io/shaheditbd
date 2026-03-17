import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useCopyProtection = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    // Admin panel এ copy protection দরকার নেই
    if (isAdmin) return;

    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventKeyboard = (e: KeyboardEvent) => {
      const blocked = [
        e.ctrlKey && e.key === 'c',   // Ctrl+C (copy)
        e.ctrlKey && e.key === 'a',   // Ctrl+A (select all)
        e.ctrlKey && e.key === 'u',   // Ctrl+U (view source)
        e.ctrlKey && e.key === 's',   // Ctrl+S (save)
        e.ctrlKey && e.key === 'p',   // Ctrl+P (print)
        e.ctrlKey && e.shiftKey && e.key === 'I', // DevTools
        e.ctrlKey && e.shiftKey && e.key === 'J', // DevTools
        e.ctrlKey && e.shiftKey && e.key === 'C', // DevTools inspect
        e.key === 'F12',              // F12 DevTools
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    const preventDrag = (e: DragEvent) => e.preventDefault();
    const preventSelect = (e: Event) => e.preventDefault();

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyboard);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('selectstart', preventSelect);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyboard);
      document.removeEventListener('dragstart', preventDrag);
      document.removeEventListener('selectstart', preventSelect);
    };
  }, [isAdmin]);
};
