-- Allow authenticated users to update and delete lead notes they created,
-- or any note when they have an elevated role (matching lead_followups policies).

CREATE POLICY "Users can update accessible notes"
  ON public.lead_notes FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_elevated_role(auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.has_elevated_role(auth.uid())
  );

CREATE POLICY "Users can delete accessible notes"
  ON public.lead_notes FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_elevated_role(auth.uid())
  );
