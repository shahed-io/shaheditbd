
CREATE OR REPLACE FUNCTION public.place_guest_order(
  p_order jsonb,
  p_items jsonb,
  p_proof jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  it jsonb;
BEGIN
  new_id := COALESCE(NULLIF(p_order->>'id','')::uuid, gen_random_uuid());

  INSERT INTO public.orders (
    id, order_number, customer_name, customer_email, customer_phone,
    subtotal, discount_amount, total, payment_method, transaction_id,
    coupon_code, coupon_id, status, payment_status, user_id, notes,
    affiliate_referral_code
  ) VALUES (
    new_id,
    p_order->>'order_number',
    p_order->>'customer_name',
    p_order->>'customer_email',
    p_order->>'customer_phone',
    (p_order->>'subtotal')::numeric,
    COALESCE((p_order->>'discount_amount')::numeric, 0),
    (p_order->>'total')::numeric,
    p_order->>'payment_method',
    p_order->>'transaction_id',
    NULLIF(p_order->>'coupon_code',''),
    NULLIF(p_order->>'coupon_id','')::uuid,
    COALESCE(NULLIF(p_order->>'status',''), 'pending')::order_status,
    COALESCE(NULLIF(p_order->>'payment_status',''), 'pending'),
    NULL,
    NULLIF(p_order->>'notes',''),
    NULLIF(p_order->>'affiliate_referral_code','')
  );

  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
    FOR it IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO public.order_items (order_id, product_id, product_name, price, quantity, total)
      VALUES (
        new_id,
        NULLIF(it->>'product_id','')::uuid,
        it->>'product_name',
        (it->>'price')::numeric,
        (it->>'quantity')::int,
        (it->>'total')::numeric
      );
    END LOOP;
  END IF;

  IF p_proof IS NOT NULL AND jsonb_typeof(p_proof) = 'object' THEN
    INSERT INTO public.payment_proofs (order_id, user_id, transaction_id, payment_method, amount, screenshot_url, status)
    VALUES (
      new_id, NULL,
      p_proof->>'transaction_id',
      p_proof->>'payment_method',
      (p_proof->>'amount')::numeric,
      NULLIF(p_proof->>'screenshot_url',''),
      COALESCE(NULLIF(p_proof->>'status',''), 'pending')
    );
  END IF;

  RETURN new_id;
END;
$$;
