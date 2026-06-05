
-- Sync payment_proofs.status → orders.payment_status
CREATE OR REPLACE FUNCTION public.sync_payment_proof_to_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.order_id IS NOT NULL THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.orders
        SET payment_status = 'verified',
            status = CASE WHEN status IN ('pending') THEN 'processing' ELSE status END,
            updated_at = now()
        WHERE id = NEW.order_id
          AND (payment_status IS DISTINCT FROM 'verified' OR status = 'pending');
    ELSIF NEW.status = 'rejected' THEN
      UPDATE public.orders
        SET payment_status = 'failed',
            updated_at = now()
        WHERE id = NEW.order_id
          AND payment_status IS DISTINCT FROM 'failed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_payment_proof_to_order ON public.payment_proofs;
CREATE TRIGGER trg_sync_payment_proof_to_order
AFTER UPDATE OF status ON public.payment_proofs
FOR EACH ROW EXECUTE FUNCTION public.sync_payment_proof_to_order();

-- Sync orders.payment_status → payment_proofs.status
CREATE OR REPLACE FUNCTION public.sync_order_to_payment_proof()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    IF NEW.payment_status = 'verified' THEN
      UPDATE public.payment_proofs
        SET status = 'approved',
            reviewed_at = COALESCE(reviewed_at, now())
        WHERE order_id = NEW.id
          AND status IS DISTINCT FROM 'approved';
    ELSIF NEW.payment_status = 'failed' THEN
      UPDATE public.payment_proofs
        SET status = 'rejected',
            reviewed_at = COALESCE(reviewed_at, now())
        WHERE order_id = NEW.id
          AND status IS DISTINCT FROM 'rejected';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_to_payment_proof ON public.orders;
CREATE TRIGGER trg_sync_order_to_payment_proof
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_to_payment_proof();
