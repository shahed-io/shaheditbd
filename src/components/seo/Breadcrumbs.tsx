import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  const all = [{ label: 'Home', href: '/' }, ...items];

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {all.map((item, i) => {
        const isLast = i === all.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i === 0 ? (
              item.href && !isLast ? (
                <Link to={item.href} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Home size={13} />
                </Link>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Home size={13} />
                </span>
              )
            ) : (
              <>
                <ChevronRight size={13} className="text-muted-foreground/50" />
                {item.href && !isLast ? (
                  <Link to={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                    {item.label}
                  </span>
                )}
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
