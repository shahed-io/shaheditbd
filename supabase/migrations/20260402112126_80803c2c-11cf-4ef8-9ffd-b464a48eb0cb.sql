
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  user_agent TEXT,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (visitors chatting)
CREATE POLICY "Anyone can insert chat conversations"
ON public.chat_conversations FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can view chat history
CREATE POLICY "Admins can view chat conversations"
ON public.chat_conversations FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete chat conversations"
ON public.chat_conversations FOR DELETE
TO public
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_chat_conversations_session ON public.chat_conversations(session_id);
CREATE INDEX idx_chat_conversations_created ON public.chat_conversations(created_at DESC);
