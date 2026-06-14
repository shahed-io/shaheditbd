-- ===== whatsapp_bot_config (singleton settings) =====
CREATE TABLE public.whatsapp_bot_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled BOOLEAN NOT NULL DEFAULT true,
  greeting_enabled BOOLEAN NOT NULL DEFAULT true,
  greeting_message TEXT NOT NULL DEFAULT 'আসসালামু আলাইকুম! 👋 Shahed Store এ স্বাগতম।

আপনি যেকোনো প্রোডাক্টের নাম লিখুন (যেমন: Windows 11, Office 2021) — আমি সাথে সাথে দাম ও অর্ডার লিংক পাঠিয়ে দিব।

🛒 ওয়েবসাইট: https://shahedstore.com.bd
📞 সাপোর্ট: সকাল ১০টা – রাত ১০টা',
  away_enabled BOOLEAN NOT NULL DEFAULT true,
  away_message TEXT NOT NULL DEFAULT 'আসসালামু আলাইকুম! এখন আমরা অফলাইনে আছি 🌙

আপনার মেসেজ পেয়েছি। সকাল ১০টার মধ্যে আমাদের টিম রিপ্লাই দিবে ইনশাআল্লাহ।

জরুরি হলে ওয়েবসাইট থেকে সরাসরি অর্ডার করতে পারেন:
🛒 https://shahedstore.com.bd',
  business_hours_start INTEGER NOT NULL DEFAULT 10,
  business_hours_end INTEGER NOT NULL DEFAULT 22,
  product_reply_enabled BOOLEAN NOT NULL DEFAULT true,
  order_status_enabled BOOLEAN NOT NULL DEFAULT true,
  fallback_message TEXT NOT NULL DEFAULT 'আপনার মেসেজের জন্য ধন্যবাদ! 🙏

আমি যা যা করতে পারি:
• প্রোডাক্টের নাম লিখুন → দাম ও অর্ডার লিংক পাবেন
• "order status" লিখুন → অর্ডারের আপডেট পাবেন
• ওয়েবসাইট দেখুন: https://shahedstore.com.bd

কোনো সাহায্য লাগলে অপেক্ষা করুন, আমাদের টিম যোগাযোগ করবে।',
  greeting_cooldown_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_bot_config TO authenticated;
GRANT ALL ON public.whatsapp_bot_config TO service_role;

ALTER TABLE public.whatsapp_bot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp config"
ON public.whatsapp_bot_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.whatsapp_bot_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ===== whatsapp_contacts =====
CREATE TABLE public.whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_phone TEXT NOT NULL UNIQUE,
  wa_name TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_greeted_at TIMESTAMPTZ,
  total_messages INTEGER NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_contacts TO authenticated;
GRANT ALL ON public.whatsapp_contacts TO service_role;

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp contacts"
ON public.whatsapp_contacts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_whatsapp_contacts_phone ON public.whatsapp_contacts(wa_phone);
CREATE INDEX idx_whatsapp_contacts_last_msg ON public.whatsapp_contacts(last_message_at DESC);

-- ===== whatsapp_messages (chat log) =====
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_type TEXT NOT NULL DEFAULT 'text',
  body TEXT,
  wa_message_id TEXT,
  matched_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  reply_type TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp messages"
ON public.whatsapp_messages FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_whatsapp_messages_phone_time ON public.whatsapp_messages(wa_phone, created_at DESC);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);

-- update timestamp trigger
CREATE TRIGGER trg_whatsapp_bot_config_updated
BEFORE UPDATE ON public.whatsapp_bot_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_whatsapp_contacts_updated
BEFORE UPDATE ON public.whatsapp_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();