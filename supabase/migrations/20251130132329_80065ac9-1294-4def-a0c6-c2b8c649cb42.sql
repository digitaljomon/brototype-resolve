-- Drop the existing check constraint
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_status_check;

-- Add new check constraint that accepts BOTH old and new status values
-- This allows existing data to remain while new complaints use new statuses
ALTER TABLE public.complaints 
ADD CONSTRAINT complaints_status_check 
CHECK (status IN ('pending', 'ongoing', 'completed', 'verified', 'assigned', 'in_progress', 'resolved', 'closed'));

-- Keep default as pending
ALTER TABLE public.complaints 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add comment to document valid statuses
COMMENT ON COLUMN public.complaints.status IS 'Valid values: pending, verified, assigned, in_progress, resolved, closed. (Legacy: ongoing, completed)';