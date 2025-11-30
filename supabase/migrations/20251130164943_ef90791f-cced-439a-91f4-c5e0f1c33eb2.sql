-- Migration 2: Create tables, functions, and policies

-- 1. Create admin_category_assignments table
CREATE TABLE IF NOT EXISTS public.admin_category_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(admin_id, category_id)
);

ALTER TABLE public.admin_category_assignments ENABLE ROW LEVEL SECURITY;

-- 2. Add columns to complaints table
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deadline timestamptz,
ADD COLUMN IF NOT EXISTS deadline_note text;

-- 3. Create admin_messages table
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES public.complaints(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  recipient_id uuid REFERENCES auth.users(id),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- 4. Create helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_category_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'category_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_admin_categories(_user_id uuid)
RETURNS TABLE(category_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT category_id
  FROM public.admin_category_assignments
  WHERE admin_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.can_view_complaint(_user_id uuid, _complaint_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.complaints c
    WHERE c.id = _complaint_id
    AND (
      public.is_super_admin(_user_id)
      OR public.has_role(_user_id, 'admin')
      OR (
        public.is_category_admin(_user_id)
        AND c.category_id IN (
          SELECT category_id FROM public.get_admin_categories(_user_id)
        )
      )
      OR c.user_id = _user_id
    )
  )
$$;

-- 5. Update RLS policies for complaints
DROP POLICY IF EXISTS "Students can view own complaints" ON public.complaints;
CREATE POLICY "Users can view accessible complaints"
ON public.complaints
FOR SELECT
USING (public.can_view_complaint(auth.uid(), id));

DROP POLICY IF EXISTS "Admins can update all complaints" ON public.complaints;
CREATE POLICY "Admins can update accessible complaints"
ON public.complaints
FOR UPDATE
USING (
  public.is_super_admin(auth.uid()) 
  OR public.has_role(auth.uid(), 'admin')
  OR (
    public.is_category_admin(auth.uid())
    AND category_id IN (SELECT category_id FROM public.get_admin_categories(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admins can delete complaints" ON public.complaints;
CREATE POLICY "Super admins can delete complaints"
ON public.complaints
FOR DELETE
USING (
  public.is_super_admin(auth.uid()) 
  OR public.has_role(auth.uid(), 'admin')
);

-- 6. RLS policies for admin_category_assignments
CREATE POLICY "Super admins can manage category assignments"
ON public.admin_category_assignments
FOR ALL
USING (
  public.is_super_admin(auth.uid()) 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can view their category assignments"
ON public.admin_category_assignments
FOR SELECT
USING (
  admin_id = auth.uid()
  OR public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 7. RLS policies for admin_messages
CREATE POLICY "Admins can view their messages"
ON public.admin_messages
FOR SELECT
USING (
  sender_id = auth.uid() 
  OR recipient_id = auth.uid()
  OR public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can send messages"
ON public.admin_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    public.is_super_admin(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_category_admin(auth.uid())
  )
);

CREATE POLICY "Admins can update their received messages"
ON public.admin_messages
FOR UPDATE
USING (recipient_id = auth.uid());

-- 8. Update user_roles policies
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 9. Migrate existing admin to super_admin
UPDATE public.user_roles
SET role = 'super_admin'
WHERE role = 'admin';