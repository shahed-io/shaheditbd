import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { usePrefetchHandlers } from "@/hooks/usePrefetchRoute";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onMouseEnter, onTouchStart, onFocus, ...props }, ref) => {
    // Auto-prefetch the route chunk on hover/touch/focus
    const targetPath = typeof to === "string" ? to : (to as { pathname?: string })?.pathname;
    const prefetch = usePrefetchHandlers(targetPath);

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        onMouseEnter={(e) => { prefetch.onMouseEnter(); onMouseEnter?.(e); }}
        onTouchStart={(e) => { prefetch.onTouchStart(); onTouchStart?.(e); }}
        onFocus={(e) => { prefetch.onFocus(); onFocus?.(e); }}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
