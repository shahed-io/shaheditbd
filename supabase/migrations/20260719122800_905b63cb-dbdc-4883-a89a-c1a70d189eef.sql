
-- 1) Restore Telegram status-change trigger on orders
DROP TRIGGER IF EXISTS on_order_status_change_notify_telegram ON public.orders;
CREATE TRIGGER on_order_status_change_notify_telegram
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_order_status_change_telegram();

-- 2) Restore public SELECT for approved blog comments
DROP POLICY IF EXISTS "Public read approved comments" ON public.blog_comments;
CREATE POLICY "Public read approved comments"
  ON public.blog_comments
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');
