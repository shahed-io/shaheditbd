import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Send, RefreshCw, Image } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
};

// Extract screenshot URLs from message text
const extractScreenshots = (message: string): string[] => {
  const urls: string[] = [];
  const lines = message.split('\n');
  let inScreenshotSection = false;
  for (const line of lines) {
    if (line.includes('স্ক্রিনশট')) inScreenshotSection = true;
    if (inScreenshotSection) {
      const match = line.match(/https?:\/\/[^\s]+/);
      if (match) urls.push(match[0]);
    }
  }
  return urls;
};

const AdminTickets = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'refund' | 'support'>('all');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: replies = [] } = useQuery({
    queryKey: ['admin-all-replies', expanded],
    queryFn: async () => {
      if (!expanded) return [];
      const { data, error } = await supabase
        .from('support_replies')
        .select('*')
        .eq('ticket_id', expanded)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!expanded,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('support_tickets').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tickets'] }); toast({ title: 'Status updated' }); },
  });

  const sendReply = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { error } = await supabase.from('support_replies').insert({
        ticket_id: ticketId,
        message,
        author_name: 'Shahed Store Support',
        is_admin: true,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-all-replies', vars.ticketId] });
      setReplyText(prev => ({ ...prev, [vars.ticketId]: '' }));
      toast({ title: 'Reply sent!' });
    },
  });

  const refundTickets = tickets.filter(t => t.ticket_number?.startsWith('RF-'));
  const supportTickets = tickets.filter(t => !t.ticket_number?.startsWith('RF-'));

  const displayTickets =
    activeTab === 'refund' ? refundTickets :
    activeTab === 'support' ? supportTickets :
    tickets;

  if (isLoading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">{tickets.length} টি টিকেট</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle size={14} className="text-red-500" /> Urgent &nbsp;
          <Clock size={14} className="text-yellow-500" /> Open &nbsp;
          <CheckCircle size={14} className="text-green-500" /> Resolved
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {[
          { key: 'all', label: 'সব টিকেট', count: tickets.length, icon: <MessageCircle size={14} /> },
          { key: 'refund', label: 'রিফান্ড রিকোয়েস্ট', count: refundTickets.length, icon: <RefreshCw size={14} /> },
          { key: 'support', label: 'সাপোর্ট', count: supportTickets.length, icon: <MessageCircle size={14} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {displayTickets.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            {activeTab === 'refund' ? <RefreshCw size={40} className="mx-auto mb-3 opacity-30" /> : <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />}
            <p>{activeTab === 'refund' ? 'কোনো রিফান্ড রিকোয়েস্ট নেই' : 'কোনো টিকেট নেই'}</p>
          </div>
        )}

        {displayTickets.map(ticket => {
          const isRefund = ticket.ticket_number?.startsWith('RF-');
          const screenshots = extractScreenshots(ticket.message || '');

          return (
            <div key={ticket.id} className={`rounded-xl border overflow-hidden ${isRefund ? 'border-orange-200 bg-orange-50/30 dark:border-orange-900/30 dark:bg-orange-950/10' : 'border-border bg-card'}`}>
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isRefund ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-primary/10'}`}>
                    {isRefund
                      ? <RefreshCw size={16} className="text-orange-500" />
                      : <MessageCircle size={16} className="text-primary" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">#{ticket.ticket_number}</span>
                      {isRefund && <Badge variant="outline" className="text-xs bg-orange-100/60 text-orange-600 border-orange-200">রিফান্ড</Badge>}
                      <Badge variant="outline" className={`text-xs ${statusColors[ticket.status] || ''}`}>{ticket.status}</Badge>
                      <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority] || ''}`}>{ticket.priority}</Badge>
                      {screenshots.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                          <Image size={10} className="mr-1" />{screenshots.length} স্ক্রিনশট
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground mt-0.5">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ticket.customer_name} · {ticket.customer_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {new Date(ticket.created_at).toLocaleDateString('bn-BD')}
                  </span>
                  {expanded === ticket.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expanded === ticket.id && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/10">
                  {/* Ticket message */}
                  <div className="rounded-lg bg-background border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">গ্রাহকের বার্তা</p>
                    <p className="text-sm text-foreground whitespace-pre-line">{ticket.message}</p>
                    {ticket.order_number && <p className="text-xs text-muted-foreground mt-2">অর্ডার: #{ticket.order_number}</p>}
                  </div>

                  {/* Screenshot previews */}
                  {screenshots.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">📸 স্ক্রিনশট</p>
                      <div className="flex flex-wrap gap-2">
                        {screenshots.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="block w-24 h-20 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors">
                            <img src={url} alt={`স্ক্রিনশট ${i + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="space-y-2">
                      {replies.map(reply => (
                        <div key={reply.id} className={`rounded-lg p-3 text-sm ${reply.is_admin ? 'bg-primary/5 border border-primary/20 ml-8' : 'bg-background border border-border mr-8'}`}>
                          <p className="text-xs font-medium mb-1 text-muted-foreground">{reply.author_name} {reply.is_admin && '(Admin)'}</p>
                          <p className="text-foreground">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply + Status */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Reply লিখুন..."
                        value={replyText[ticket.id] || ''}
                        onChange={e => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                        rows={2}
                        className="text-sm resize-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => sendReply.mutate({ ticketId: ticket.id, message: replyText[ticket.id] || '' })}
                        disabled={!replyText[ticket.id]?.trim() || sendReply.isPending}
                        className="w-full sm:w-auto"
                      >
                        <Send size={14} className="mr-1.5" /> Reply পাঠান
                      </Button>
                    </div>
                    <div className="sm:w-40">
                      <p className="text-xs text-muted-foreground mb-1">Status পরিবর্তন</p>
                      <Select value={ticket.status} onValueChange={status => updateStatus.mutate({ id: ticket.id, status })}>
                        <SelectTrigger className="text-sm h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTickets;
