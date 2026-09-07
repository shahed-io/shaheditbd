REVOKE ALL ON FUNCTION public.protect_paid_bkash_online_order_state() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_convert_abandoned_checkout_for_order() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_paid_bkash_online_order_state() TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_convert_abandoned_checkout_for_order() TO service_role;