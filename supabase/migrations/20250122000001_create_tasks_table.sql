-- Create tasks table for task management
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = tasks.lead_id
      AND (leads.assigned_to = auth.uid() OR leads.created_by = auth.uid())
    )
  );

CREATE POLICY "Admins can view all tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (public.has_elevated_role(auth.uid()));

CREATE POLICY "Users can create tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their assigned tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    public.has_elevated_role(auth.uid())
  )
  WITH CHECK (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    public.has_elevated_role(auth.uid())
  );

CREATE POLICY "Users can delete their created tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    public.has_elevated_role(auth.uid())
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tasks_updated_at();
