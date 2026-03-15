import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Loader2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  customer_email: z.string().trim().email(),
  customer_phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(5).max(200),
  order_number: z.string().trim().max(50).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  message: z.string().trim().min(10).max(2000),
});

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SupportTicketModal = ({ open, onClose }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ticketNum, setTicketNum] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    subject: '',
    order_number: '',
    priority: 'normal' as const,
    message: '',
  });

  const set = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const submit = async () => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(e => { errs[e.path[0]] = e.message; });
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const ticket_number = 'TKT-' + Array.from(crypto.getRandomValues(new Uint8Array(5))).map(b => b.toString(36)).join('').toUpperCase().slice(0, 8);
      const { error } = await supabase.from('support_tickets').insert([{
        customer_name: result.data.customer_name,
        customer_email: result.data.customer_email,
        customer_phone: result.data.customer_phone,
        subject: result.data.subject,
        order_number: result.data.order_number,
        priority: result.data.priority,
        message: result.data.message,
        ticket_number,
        status: 'open',
      }]);
      if (error) throw error;
      setTicketNum(ticket_number);
      setDone(true);
    } catch (e) {
      toast({ variant: 'destructive', title: 'সমস্যা হয়েছে', description: 'অনুগ্রহ করে আবার চেষ্টা করুন' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setForm({ customer_name: '', customer_email: '', customer_phone: '', subject: '', order_number: '', priority: 'normal', message: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket size={18} className="text-primary" />
            সাপোর্ট টিকেট খুলুন
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground">টিকেট সফলভাবে জমা হয়েছে!</h3>
            <p className="text-muted-foreground text-sm">আপনার টিকেট নম্বর:</p>
            <p className="text-xl font-mono font-bold text-primary">{ticketNum}</p>
            <p className="text-xs text-muted-foreground">আমরা শীঘ্রই আপনার ইমেইলে যোগাযোগ করব</p>
            <Button onClick={handleClose} className="mt-2">বন্ধ করুন</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">নাম *</label>
                <Input placeholder="আপনার নাম" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} className={errors.customer_name ? 'border-red-500' : ''} />
                {errors.customer_name && <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">ইমেইল *</label>
                <Input type="email" placeholder="email@example.com" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} className={errors.customer_email ? 'border-red-500' : ''} />
                {errors.customer_email && <p className="text-xs text-red-500 mt-1">{errors.customer_email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">ফোন</label>
                <Input placeholder="01XXXXXXXXX" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">অর্ডার নম্বর</label>
                <Input placeholder="ORD-XXXXXXXX" value={form.order_number} onChange={e => set('order_number', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">বিষয় *</label>
              <Input placeholder="সমস্যার সংক্ষিপ্ত বিবরণ" value={form.subject} onChange={e => set('subject', e.target.value)} className={errors.subject ? 'border-red-500' : ''} />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">অগ্রাধিকার</label>
              <Select value={form.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">কম জরুরি</SelectItem>
                  <SelectItem value="normal">স্বাভাবিক</SelectItem>
                  <SelectItem value="high">জরুরি</SelectItem>
                  <SelectItem value="urgent">অতি জরুরি</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">বিস্তারিত বার্তা *</label>
              <Textarea placeholder="আপনার সমস্যা বিস্তারিত জানান..." value={form.message} onChange={e => set('message', e.target.value)} rows={4} className={`resize-none ${errors.message ? 'border-red-500' : ''}`} />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              <p className="text-xs text-muted-foreground mt-1 text-right">{form.message.length}/2000</p>
            </div>

            <Button onClick={submit} disabled={loading} className="w-full">
              {loading ? <><Loader2 size={14} className="mr-2 animate-spin" /> জমা হচ্ছে...</> : <><Ticket size={14} className="mr-2" /> টিকেট জমা দিন</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
