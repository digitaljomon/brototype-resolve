-- Create complaint history table for tracking all changes
CREATE TABLE public.complaint_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  change_type TEXT NOT NULL, -- 'status_change', 'priority_change', 'note_added', 'created'
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;

-- Students can view history of their own complaints, admins can view all
CREATE POLICY "Users can view history of own complaints"
ON public.complaint_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = complaint_history.complaint_id
    AND (complaints.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Only system can insert history (via triggers and functions)
CREATE POLICY "System can insert history"
ON public.complaint_history
FOR INSERT
WITH CHECK (auth.uid() = changed_by);

-- Add indexes for faster queries
CREATE INDEX idx_complaint_history_complaint_id ON public.complaint_history(complaint_id);
CREATE INDEX idx_complaint_history_created_at ON public.complaint_history(created_at DESC);

-- Create function to log status changes
CREATE OR REPLACE FUNCTION public.log_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log status change
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.complaint_history (complaint_id, changed_by, change_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status);
  END IF;
  
  -- Log priority change
  IF (TG_OP = 'UPDATE' AND OLD.priority IS DISTINCT FROM NEW.priority) THEN
    INSERT INTO public.complaint_history (complaint_id, changed_by, change_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority_change', OLD.priority, NEW.priority);
  END IF;
  
  -- Log creation
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.complaint_history (complaint_id, changed_by, change_type, new_value)
    VALUES (NEW.id, NEW.user_id, 'created', NEW.status);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic status logging
CREATE TRIGGER complaint_status_change_trigger
AFTER INSERT OR UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.log_complaint_status_change();