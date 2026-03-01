import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/admin/customers': 'Customers',
  '/admin/payments': 'Payments',
  '/admin/tickets': 'Support Tickets',
  '/admin/reports': 'Reports',
  '/admin/marketing': 'Marketing',
  '/admin/roles': 'Admin Roles',
  '/admin/backup': 'Backup',
};

const AdminPlaceholder = () => {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || 'Page';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Construction size={28} className="text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        এই পেজটি শীঘ্রই আসছে। আমরা এখনো এটি তৈরি করছি।
      </p>
      <div className="flex gap-2 mt-2">
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
          Coming Soon
        </span>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
