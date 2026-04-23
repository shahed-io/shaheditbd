import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const AdminResellerAccounts = () => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>CID Credit Management</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 space-y-4">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">
            New CID credit management UI coming next — admin will add/deduct CID balance for any user, configure per-product auto-credit, and view generation history.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResellerAccounts;
