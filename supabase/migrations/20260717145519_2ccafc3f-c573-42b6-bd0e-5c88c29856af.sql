
-- 1) Drop duplicate triggers on public.orders (keep the trg_/trigger_ named ones)
DROP TRIGGER IF EXISTS on_order_created_log ON public.orders;
DROP TRIGGER IF EXISTS on_new_order_notify_telegram ON public.orders;
DROP TRIGGER IF EXISTS on_order_status_change_log ON public.orders;
DROP TRIGGER IF EXISTS on_order_status_change_notify_telegram ON public.orders;

-- 2) Wrap timeline logger with exception handler
CREATE OR REPLACE FUNCTION public.log_order_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  BEGIN
    INSERT INTO public.order_timeline (order_id, status, note, created_by)
    VALUES (NEW.id, NEW.status::text, 'অর্ডার তৈরি হয়েছে', 'system');
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'log_order_created failed: %', SQLERRM;
  END;
  RETURN NEW;
END; $$;

-- 3) Wrap status change logger
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.order_timeline (order_id, status, note, created_by)
      VALUES (NEW.id, NEW.status::text, 'স্ট্যাটাস পরিবর্তন', 'system');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'log_order_status_change failed: %', SQLERRM;
  END;
  RETURN NEW;
END; $$;

-- 4) Wrap auto award points
CREATE OR REPLACE FUNCTION public.auto_award_points_on_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.user_id IS NOT NULL THEN
      PERFORM public.earn_order_points(NEW.user_id, NEW.id::text, NEW.total);
    END IF;
    IF (NEW.status IN ('cancelled', 'refunded')) AND OLD.status = 'completed' AND NEW.user_id IS NOT NULL THEN
      PERFORM public.deduct_order_points(NEW.user_id, NEW.id::text, NEW.total);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'auto_award_points failed: %', SQLERRM;
  END;
  RETURN NEW;
END; $$;

-- 5) Wrap CID credit
CREATE OR REPLACE FUNCTION public.auto_credit_cid_on_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_item RECORD; v_credits integer; v_total_credits integer := 0;
BEGIN
  BEGIN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' AND NEW.user_id IS NOT NULL THEN
      FOR v_item IN SELECT oi.product_id, oi.quantity FROM public.order_items oi WHERE oi.order_id = NEW.id AND oi.product_id IS NOT NULL LOOP
        SELECT cpc.cid_credits INTO v_credits FROM public.cid_product_credits cpc WHERE cpc.product_id = v_item.product_id AND cpc.is_active = true;
        IF FOUND AND v_credits > 0 THEN
          v_total_credits := v_total_credits + (v_credits * v_item.quantity);
        END IF;
      END LOOP;
      IF v_total_credits > 0 THEN
        INSERT INTO public.cid_balances (user_id, balance, total_added)
        VALUES (NEW.user_id, v_total_credits, v_total_credits)
        ON CONFLICT (user_id) DO UPDATE
          SET balance = cid_balances.balance + v_total_credits,
              total_added = cid_balances.total_added + v_total_credits,
              updated_at = now();
        INSERT INTO public.notifications (user_id, title, message, type, is_read)
        VALUES (NEW.user_id, '🎁 CID Credit পেয়েছেন!', 'অর্ডার #' || NEW.order_number || ' সম্পন্ন হওয়ায় ' || v_total_credits || ' টি CID credit আপনার অ্যাকাউন্টে যোগ হয়েছে।', 'promo', false);
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'auto_credit_cid failed: %', SQLERRM;
  END;
  RETURN NEW;
END; $$;

-- 6) Wrap affiliate auto approve
CREATE OR REPLACE FUNCTION public.auto_approve_conversion_on_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_conv RECORD; v_aff RECORD; v_wallet numeric;
BEGIN
  BEGIN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
      SELECT * INTO v_conv FROM public.affiliate_conversions WHERE order_id = NEW.id AND status = 'pending';
      IF FOUND THEN
        SELECT * INTO v_aff FROM public.affiliate_accounts WHERE id = v_conv.affiliate_id FOR UPDATE;
        UPDATE public.affiliate_conversions SET status = 'approved' WHERE id = v_conv.id;
        UPDATE public.affiliate_accounts SET available_balance = available_balance + v_conv.commission_amount, total_earned = total_earned + v_conv.commission_amount, total_conversions = total_conversions + 1 WHERE id = v_conv.affiliate_id;
        UPDATE public.profiles SET wallet_balance = wallet_balance + v_conv.commission_amount WHERE user_id = v_aff.user_id RETURNING wallet_balance INTO v_wallet;
        INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, note, reference_id, created_by)
        VALUES (v_aff.user_id, 'credit', v_conv.commission_amount, v_wallet, 'Affiliate commission — Order ' || v_conv.order_number, v_conv.order_id::text, 'affiliate');
        INSERT INTO public.notifications (user_id, title, message, type, is_read)
        VALUES (v_aff.user_id, '💰 Affiliate Commission!', 'অর্ডার #' || v_conv.order_number || ' থেকে ৳' || v_conv.commission_amount || ' ওয়ালেটে জমা হয়েছে।', 'promo', false);
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'auto_approve_conversion failed: %', SQLERRM;
  END;
  RETURN NEW;
END; $$;

-- 7) Wrap auto-assign licenses
CREATE OR REPLACE FUNCTION public.trigger_assign_licenses_on_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
      PERFORM public.auto_assign_licenses(NEW.id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'trigger_assign_licenses failed: %', SQLERRM;
  END;
  RETURN NEW;
END; $$;

-- 8) Wrap payment proof sync
CREATE OR REPLACE FUNCTION public.sync_order_to_payment_proof()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  BEGIN
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      IF NEW.payment_status = 'verified' THEN
        UPDATE public.payment_proofs
          SET status = 'approved', reviewed_at = COALESCE(reviewed_at, now())
          WHERE order_id = NEW.id AND status IS DISTINCT FROM 'approved';
      ELSIF NEW.payment_status = 'failed' THEN
        UPDATE public.payment_proofs
          SET status = 'rejected', reviewed_at = COALESCE(reviewed_at, now())
          WHERE order_id = NEW.id AND status IS DISTINCT FROM 'rejected';
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'sync_order_to_payment_proof failed: %', SQLERRM;
  END;
  RETURN NEW;
END; $$;
