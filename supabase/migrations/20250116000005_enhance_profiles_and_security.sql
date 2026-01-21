-- Migration: Enhance profiles and add security features
-- This enables avatar uploads, profile updates, password changes, and session management

-- Step 1: Add columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN phone TEXT;
  END IF;
  
  -- Add updated_by column if it doesn't exist (for tracking who updated)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 2: Create user sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL, -- Supabase session token
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Step 3: Create password change requests table (for tracking password changes)
CREATE TABLE IF NOT EXISTS public.password_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Usually the same user
);

-- Step 4: Create two-factor authentication table
CREATE TABLE IF NOT EXISTS public.user_2fa (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  secret TEXT NOT NULL, -- TOTP secret
  backup_codes TEXT[], -- Backup codes for recovery
  enabled BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_password_change_log_user_id ON public.password_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_password_change_log_changed_at ON public.password_change_log(changed_at DESC);

-- Step 6: Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (public.has_elevated_role(auth.uid()));

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Step 8: RLS Policies for password_change_log
CREATE POLICY "Users can view their own password change history"
  ON public.password_change_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all password change history"
  ON public.password_change_log FOR SELECT
  TO authenticated
  USING (public.has_elevated_role(auth.uid()));

CREATE POLICY "System can log password changes"
  ON public.password_change_log FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Controlled by service role

-- Step 9: RLS Policies for user_2fa
CREATE POLICY "Users can manage their own 2FA"
  ON public.user_2fa FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 10: Create function to update profile updated_at and updated_by
CREATE OR REPLACE FUNCTION public.update_profile_updated_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- Step 11: Create trigger for profile updates
DROP TRIGGER IF EXISTS update_profile_updated_fields_trigger ON public.profiles;
CREATE TRIGGER update_profile_updated_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_updated_fields();

-- Step 12: Create function to log password changes
CREATE OR REPLACE FUNCTION public.log_password_change(
  p_user_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.password_change_log (
    user_id,
    ip_address,
    user_agent,
    changed_by
  )
  VALUES (
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_user_id
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Step 13: Create function to get active sessions count
CREATE OR REPLACE FUNCTION public.get_active_sessions_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now();
  
  RETURN v_count;
END;
$$;

