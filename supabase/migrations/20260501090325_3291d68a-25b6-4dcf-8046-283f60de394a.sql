UPDATE public.key_check_history
SET error_code = TRIM(REGEXP_REPLACE(error_code, '\s*\[.*?\]\s*', '', 'g'))
WHERE error_code ~ '\[.*\]';