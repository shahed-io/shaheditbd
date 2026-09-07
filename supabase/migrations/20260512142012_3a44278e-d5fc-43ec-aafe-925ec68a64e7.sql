
CREATE OR REPLACE FUNCTION public.append_product_disclaimer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  disclaimer TEXT := E'\n\n<!-- shahed-disclaimer -->\n### 📌 Disclaimer\n\nআমাদের কোনো প্রোডাক্ট কপি (pirated/cracked) নয়। সকল প্রোডাক্ট সাধারণ ব্যবহারকারীদের সাধ্যের মধ্যে কম দামে অফার হিসেবে বিক্রি করা হয়। আমরা কোনো ধরনের copyright claim গ্রহণ করি না।\n\n*None of our products are copies (pirated/cracked). All products are sold at affordable prices as special offers for general users. We do not accept any copyright claims.*';
BEGIN
  IF NEW.description IS NULL THEN
    NEW.description := disclaimer;
  ELSIF position('shahed-disclaimer' in NEW.description) = 0 THEN
    NEW.description := NEW.description || disclaimer;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_append_product_disclaimer ON public.products;
CREATE TRIGGER trg_append_product_disclaimer
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.append_product_disclaimer();
