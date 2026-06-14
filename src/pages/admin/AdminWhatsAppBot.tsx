import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Copy, Send, MessageSquare, Settings, History, Loader2, Eye } from "lucide-react";

type Config = {
  enabled: boolean;
  greeting_enabled: boolean;
  greeting_message: string;
  away_enabled: boolean;
  away_message: string;
  business_hours_start: number;
  business_hours_end: number;
  product_reply_enabled: boolean;
  order_status_enabled: boolean;
  fallback_message: string;
  greeting_cooldown_hours: number;
};

const PROJECT_REF = "dpvdavjwqyviredzoorj";
const WEBHOOK_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/whatsapp-webhook`;

export default function AdminWhatsAppBot() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testMsg, setTestMsg] = useState("Hello from Shahed Store WhatsApp Bot ✅");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [verifyToken, setVerifyToken] = useState<string>("");
  const [tokenRevealed, setTokenRevealed] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from("whatsapp_bot_config").select("*").eq("id", 1).maybeSingle();
    if (data) setCfg(data as Config);
    const { data: msgs } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setMessages(msgs || []);
    const { data: ct } = await supabase
      .from("whatsapp_contacts")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(50);
    setContacts(ct || []);
  };

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    const { error } = await supabase.from("whatsapp_bot_config").update(cfg).eq("id", 1);
    setSaving(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Saved", description: "WhatsApp bot config updated." });
  };

  const sendTest = async () => {
    if (!testTo || !testMsg) return;
    setSending(true);
    const { data: sess } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("whatsapp-send-test", {
      body: { to: testTo, message: testMsg },
      headers: sess.session ? { Authorization: `Bearer ${sess.session.access_token}` } : undefined,
    });
    setSending(false);
    if (res.error) {
      toast({ title: "Failed", description: res.error.message, variant: "destructive" });
    } else if ((res.data as any)?.success) {
      toast({ title: "Sent ✅", description: "Test message delivered." });
      load();
    } else {
      toast({
        title: "WhatsApp API Error",
        description: JSON.stringify((res.data as any)?.data?.error || res.data),
        variant: "destructive",
      });
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    toast({ title: "Copied", description: "Webhook URL copied to clipboard." });
  };

  if (!cfg) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-green-500" />
            WhatsApp Bot
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-reply system for your verified WhatsApp Business number
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={cfg.enabled ? "default" : "secondary"}>
            {cfg.enabled ? "🟢 LIVE" : "⚪ OFF"}
          </Badge>
          <Switch
            checked={cfg.enabled}
            onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })}
          />
        </div>
      </div>

      {/* Webhook setup info */}
      <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-base">📌 One-Time Setup (Meta Developer Console)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Go to <b>developers.facebook.com</b> → Your App → WhatsApp → Configuration → Webhook.</p>
          <div className="space-y-2">
            <Label>Callback URL (paste this):</Label>
            <div className="flex gap-2">
              <Input value={WEBHOOK_URL} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyWebhook}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Verify Token (paste this in Meta Console):</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setRevealLoading(true);
                  const { data: sess } = await supabase.auth.getSession();
                  const res = await supabase.functions.invoke("get-whatsapp-config", {
                    headers: sess.session ? { Authorization: `Bearer ${sess.session.access_token}` } : undefined,
                  });
                  setRevealLoading(false);
                  if (res.error || (res.data as any)?.error) {
                    toast({ title: "Failed", description: (res.data as any)?.error || res.error?.message, variant: "destructive" });
                    return;
                  }
                  setVerifyToken((res.data as any)?.verify_token || "");
                  setTokenRevealed(true);
                }}
                disabled={revealLoading}
              >
                {revealLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                {tokenRevealed ? "Refresh" : "Show Token"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={tokenRevealed ? verifyToken : "•••••••••••• (click Show Token)"}
                readOnly
                className="font-mono text-xs"
                type={tokenRevealed ? "text" : "password"}
              />
              <Button
                variant="outline"
                size="icon"
                disabled={!tokenRevealed || !verifyToken}
                onClick={() => {
                  navigator.clipboard.writeText(verifyToken);
                  toast({ title: "Copied", description: "Verify token copied to clipboard." });
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p>After saving the webhook, subscribe to webhook field: <b>messages</b></p>
        </CardContent>
      </Card>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config"><Settings className="w-4 h-4 mr-1" /> Config</TabsTrigger>
          <TabsTrigger value="test"><Send className="w-4 h-4 mr-1" /> Test</TabsTrigger>
          <TabsTrigger value="messages"><History className="w-4 h-4 mr-1" /> Messages</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        {/* CONFIG TAB */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">👋 Greeting Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Enable greeting for new customers</Label>
                <Switch checked={cfg.greeting_enabled} onCheckedChange={(v) => setCfg({ ...cfg, greeting_enabled: v })} />
              </div>
              <Textarea
                rows={6}
                value={cfg.greeting_message}
                onChange={(e) => setCfg({ ...cfg, greeting_message: e.target.value })}
              />
              <div>
                <Label>Re-greet after how many hours of silence?</Label>
                <Input
                  type="number"
                  value={cfg.greeting_cooldown_hours}
                  onChange={(e) => setCfg({ ...cfg, greeting_cooldown_hours: Number(e.target.value) || 24 })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">🌙 Away Message (Outside Business Hours)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Send away message after hours</Label>
                <Switch checked={cfg.away_enabled} onCheckedChange={(v) => setCfg({ ...cfg, away_enabled: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Open Hour (0-23, Dhaka time)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={cfg.business_hours_start}
                    onChange={(e) => setCfg({ ...cfg, business_hours_start: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Close Hour (0-23)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={cfg.business_hours_end}
                    onChange={(e) => setCfg({ ...cfg, business_hours_end: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Textarea
                rows={5}
                value={cfg.away_message}
                onChange={(e) => setCfg({ ...cfg, away_message: e.target.value })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">🛒 Smart Product Reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Auto-reply with product info when name matches</Label>
                <Switch checked={cfg.product_reply_enabled} onCheckedChange={(v) => setCfg({ ...cfg, product_reply_enabled: v })} />
              </div>
              <p className="text-sm text-muted-foreground">
                When a customer types "Windows 11", "Office 2021" etc., the bot will fuzzy-match against your products and send name, price, image, and order link automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">📦 Order Status Lookup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Reply to "order status" queries</Label>
                <Switch checked={cfg.order_status_enabled} onCheckedChange={(v) => setCfg({ ...cfg, order_status_enabled: v })} />
              </div>
              <p className="text-sm text-muted-foreground">
                Looks up the most recent order matching the customer's WhatsApp phone number.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">💬 Fallback Message</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={5}
                value={cfg.fallback_message}
                onChange={(e) => setCfg({ ...cfg, fallback_message: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Sent when no product matches and it's during business hours.
              </p>
            </CardContent>
          </Card>

          <Button onClick={save} disabled={saving} size="lg" className="w-full md:w-auto">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save All Settings
          </Button>
        </TabsContent>

        {/* TEST TAB */}
        <TabsContent value="test" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Send Test Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>To (with country code, no +)</Label>
                <Input placeholder="8801XXXXXXXXX" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea rows={4} value={testMsg} onChange={(e) => setTestMsg(e.target.value)} />
              </div>
              <Button onClick={sendTest} disabled={sending}>
                {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                <Send className="w-4 h-4 mr-2" /> Send Test
              </Button>
              <p className="text-xs text-muted-foreground">
                Note: WhatsApp only allows free-form text within 24 hours after a customer messages you. Otherwise you need a pre-approved template.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MESSAGES TAB */}
        <TabsContent value="messages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Messages ({messages.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg border text-sm ${
                    m.direction === "inbound"
                      ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200"
                      : "bg-green-50 dark:bg-green-950/20 border-green-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs">
                      {m.direction === "inbound" ? "📥" : "📤"} {m.wa_phone}
                    </span>
                    <div className="flex gap-2 items-center">
                      {m.reply_type && <Badge variant="outline" className="text-[10px]">{m.reply_type}</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleString("bn-BD")}
                      </span>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTACTS TAB */}
        <TabsContent value="contacts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacts ({contacts.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {contacts.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border flex justify-between items-center">
                  <div>
                    <p className="font-medium">{c.wa_name || "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{c.wa_phone}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{c.total_messages} msgs</p>
                    <p>{new Date(c.last_message_at).toLocaleDateString("bn-BD")}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
