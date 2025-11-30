-- Create complaint_messages table
CREATE TABLE public.complaint_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;

-- Students can view messages for their own complaints
CREATE POLICY "Students can view messages for own complaints"
ON public.complaint_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = complaint_messages.complaint_id
    AND (complaints.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Students can send messages for their own complaints
CREATE POLICY "Students can send messages for own complaints"
ON public.complaint_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = complaint_messages.complaint_id
    AND complaints.user_id = auth.uid()
  )
);

-- Admins can send messages for any complaint
CREATE POLICY "Admins can send messages for any complaint"
ON public.complaint_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_messages;

-- Create index for better performance
CREATE INDEX idx_complaint_messages_complaint_id ON public.complaint_messages(complaint_id);
CREATE INDEX idx_complaint_messages_created_at ON public.complaint_messages(created_at);