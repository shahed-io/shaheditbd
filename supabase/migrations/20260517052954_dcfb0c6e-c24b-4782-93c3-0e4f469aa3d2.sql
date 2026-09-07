ALTER TABLE public.admin_2fa_config 
ADD COLUMN IF NOT EXISTS system_enabled boolean NOT NULL DEFAULT true;

INSERT INTO public.admin_2fa_config (id, system_enabled) 
VALUES (1, true) 
ON CONFLICT (id) DO NOTHING;