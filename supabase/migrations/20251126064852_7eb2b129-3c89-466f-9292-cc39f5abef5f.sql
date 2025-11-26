-- Create complaint notes table for admin internal notes
CREATE TABLE public.complaint_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaint_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can view notes
CREATE POLICY "Only admins can view notes"
ON public.complaint_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create notes
CREATE POLICY "Only admins can create notes"
ON public.complaint_notes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

-- Only admins can update their own notes
CREATE POLICY "Only admins can update own notes"
ON public.complaint_notes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

-- Only admins can delete their own notes
CREATE POLICY "Only admins can delete own notes"
ON public.complaint_notes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_complaint_notes_updated_at
BEFORE UPDATE ON public.complaint_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_complaint_notes_complaint_id ON public.complaint_notes(complaint_id);
CREATE INDEX idx_complaint_notes_created_at ON public.complaint_notes(created_at DESC);