-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-attachments', 'complaint-attachments', true);

-- Create storage policies for complaint attachments
CREATE POLICY "Anyone can view complaint attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'complaint-attachments');

CREATE POLICY "Authenticated users can upload complaint attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-attachments' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own complaint attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'complaint-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add delete policy for complaints (admins only)
CREATE POLICY "Admins can delete complaints"
ON public.complaints
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));