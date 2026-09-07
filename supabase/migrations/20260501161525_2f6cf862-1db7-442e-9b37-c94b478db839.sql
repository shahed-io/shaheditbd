CREATE TABLE public.office365_check_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  status_acc TEXT NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_office365_check_history_user ON public.office365_check_history(user_id, checked_at DESC);

ALTER TABLE public.office365_check_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own office365 history"
ON public.office365_check_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own office365 history"
ON public.office365_check_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own office365 history"
ON public.office365_check_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all office365 history"
ON public.office365_check_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));