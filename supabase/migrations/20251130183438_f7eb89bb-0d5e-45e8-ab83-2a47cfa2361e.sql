-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can send messages for any complaint" ON complaint_messages;

-- Create updated policy that includes all admin types
CREATE POLICY "Admins can send messages for any complaint" 
ON complaint_messages 
FOR INSERT 
WITH CHECK (
  (sender_id = auth.uid()) AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    is_super_admin(auth.uid()) OR 
    is_category_admin(auth.uid())
  )
);