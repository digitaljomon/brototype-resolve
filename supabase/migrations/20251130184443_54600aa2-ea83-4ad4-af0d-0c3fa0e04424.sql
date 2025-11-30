-- Fix complaint_messages RLS policies to support all admin types

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Students can view messages for own complaints" ON complaint_messages;

-- Create comprehensive SELECT policy
CREATE POLICY "Users can view messages for accessible complaints"
ON complaint_messages
FOR SELECT
USING (
  -- Students can view messages for their own complaints
  EXISTS (
    SELECT 1 FROM complaints
    WHERE complaints.id = complaint_messages.complaint_id
    AND complaints.user_id = auth.uid()
  )
  OR
  -- Super admins can view all messages
  is_super_admin(auth.uid())
  OR
  -- Regular admins can view all messages
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Category admins can view messages for complaints in their assigned categories
  (
    is_category_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.id = complaint_messages.complaint_id
      AND c.category_id IN (
        SELECT category_id FROM get_admin_categories(auth.uid())
      )
    )
  )
);

-- Drop existing admin INSERT policy
DROP POLICY IF EXISTS "Admins can send messages for accessible complaints" ON complaint_messages;
DROP POLICY IF EXISTS "Admins can send messages for any complaint" ON complaint_messages;

-- Create updated INSERT policy with proper scoping
CREATE POLICY "Admins can send messages for accessible complaints"
ON complaint_messages
FOR INSERT
WITH CHECK (
  (sender_id = auth.uid())
  AND (
    -- Super admins can send to any complaint
    is_super_admin(auth.uid())
    OR
    -- Regular admins can send to any complaint
    has_role(auth.uid(), 'admin'::app_role)
    OR
    -- Category admins can only send to complaints in their categories
    (
      is_category_admin(auth.uid())
      AND EXISTS (
        SELECT 1 FROM complaints c
        WHERE c.id = complaint_messages.complaint_id
        AND c.category_id IN (
          SELECT category_id FROM get_admin_categories(auth.uid())
        )
      )
    )
  )
);