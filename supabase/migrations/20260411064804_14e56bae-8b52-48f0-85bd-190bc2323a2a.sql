-- Recreate trigger for Telegram notification on new orders
DROP TRIGGER IF EXISTS on_new_order_notify_telegram ON public.orders;

CREATE TRIGGER on_new_order_notify_telegram
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order_telegram();

-- Also ensure the status change triggers exist
DROP TRIGGER IF EXISTS on_order_created_log ON public.orders;
CREATE TRIGGER on_order_created_log
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_created();

DROP TRIGGER IF EXISTS on_order_status_change_log ON public.orders;
CREATE TRIGGER on_order_status_change_log
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();