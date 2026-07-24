
-- 1. Currencies table
CREATE TABLE public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  -- rate_from_bdt: how many BDT = 1 unit of THIS currency.
  -- e.g. USD -> 130 means 1 USD = 130 BDT.
  -- To convert BDT price to this currency: price_bdt / rate_from_bdt.
  rate_from_bdt NUMERIC(18, 6) NOT NULL DEFAULT 1,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  decimals SMALLINT NOT NULL DEFAULT 2,
  symbol_position TEXT NOT NULL DEFAULT 'before', -- 'before' or 'after'
  flag_emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Grants
GRANT SELECT ON public.currencies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.currencies TO authenticated;
GRANT ALL ON public.currencies TO service_role;

-- 3. Enable RLS
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Anyone can view active currencies"
  ON public.currencies FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert currencies"
  ON public.currencies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update currencies"
  ON public.currencies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete currencies"
  ON public.currencies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Updated_at trigger
CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Ensure only one default currency
CREATE OR REPLACE FUNCTION public.ensure_single_default_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.currencies
    SET is_default = false
    WHERE id <> NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_single_default_currency
  AFTER INSERT OR UPDATE OF is_default ON public.currencies
  FOR EACH ROW WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_currency();

-- 7. Seed base + common currencies (admin can edit / delete)
INSERT INTO public.currencies (code, name, symbol, rate_from_bdt, is_default, is_active, position, decimals, symbol_position, flag_emoji) VALUES
  ('BDT', 'Bangladeshi Taka', '৳', 1,        true,  true, 0, 0, 'before', '🇧🇩'),
  ('USD', 'US Dollar',        '$', 120,      false, true, 1, 2, 'before', '🇺🇸'),
  ('EUR', 'Euro',              '€', 130,     false, true, 2, 2, 'before', '🇪🇺'),
  ('GBP', 'British Pound',     '£', 150,     false, true, 3, 2, 'before', '🇬🇧'),
  ('INR', 'Indian Rupee',      '₹', 1.40,    false, true, 4, 2, 'before', '🇮🇳'),
  ('SAR', 'Saudi Riyal',       '﷼', 32,      false, true, 5, 2, 'before', '🇸🇦'),
  ('AED', 'UAE Dirham',        'د.إ', 33,    false, true, 6, 2, 'before', '🇦🇪'),
  ('MYR', 'Malaysian Ringgit', 'RM',26,      false, true, 7, 2, 'before', '🇲🇾');
