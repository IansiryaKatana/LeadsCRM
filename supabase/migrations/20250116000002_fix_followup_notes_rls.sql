-- Fix RLS policies for lead_followups and lead_notes
-- Allow users to see follow-ups and notes they created, or if they have access to the lead

-- Step 1: Drop existing restrictive policies for lead_followups
DROP POLICY IF EXISTS "Users can view follow-ups for accessible leads" ON public.lead_followups;

-- Step 2: Create new policy that allows:
-- - Users to see follow-ups they created
-- - Users to see follow-ups for leads they have access to (elevated role OR assigned)
-- - All authenticated users can see all follow-ups (matching the leads policy update)
CREATE POLICY "All authenticated users can view all follow-ups"
  ON public.lead_followups FOR SELECT
  TO authenticated
  USING (true);

-- Step 3: Ensure lead_notes policy allows all authenticated users to view all notes
-- (This should already exist from migration 20250115000000, but ensuring it's correct)
DROP POLICY IF EXISTS "Users can view notes for accessible leads" ON public.lead_notes;
DROP POLICY IF EXISTS "All authenticated users can view all lead notes" ON public.lead_notes;

CREATE POLICY "All authenticated users can view all lead notes"
  ON public.lead_notes FOR SELECT
  TO authenticated
  USING (true);

-- Step 4: Ensure INSERT policies allow creation (these should already be correct, but verifying)
-- Follow-ups INSERT policy should allow any authenticated user to create follow-ups for accessible leads
DROP POLICY IF EXISTS "Authenticated users can create follow-ups" ON public.lead_followups;

CREATE POLICY "All authenticated users can create follow-ups"
  ON public.lead_followups FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_followups.lead_id
    )
  );

-- Notes INSERT policy should already allow creation, but ensuring it's correct
DROP POLICY IF EXISTS "Authenticated users can create notes" ON public.lead_notes;

CREATE POLICY "All authenticated users can create notes"
  ON public.lead_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

