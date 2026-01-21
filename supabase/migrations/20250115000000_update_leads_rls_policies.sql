-- Update RLS policies for leads table to allow all authenticated users to read and write
-- This replaces the previous role-based restrictions

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Elevated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Salespeople can view assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Elevated users can update any lead" ON public.leads;
DROP POLICY IF EXISTS "Salespeople can update assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

-- Create new policies that allow all authenticated users to read and write leads
CREATE POLICY "All authenticated users can view all leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can update all leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (true);

-- Update lead_notes policy to allow all users to view notes for all leads
DROP POLICY IF EXISTS "Users can view notes for accessible leads" ON public.lead_notes;

CREATE POLICY "All authenticated users can view all lead notes"
  ON public.lead_notes FOR SELECT
  TO authenticated
  USING (true);

