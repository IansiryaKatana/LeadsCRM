-- Migration: Set up pg_cron job for follow-up reminders
-- This schedules the process-followup-reminders edge function to run every hour

-- Step 1: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create a function to call the edge function
-- Note: Replace YOUR_SERVICE_ROLE_KEY with your actual service role key
-- You can get this from: Supabase Dashboard → Settings → API → service_role key

CREATE OR REPLACE FUNCTION public.invoke_followup_reminder_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_role_key TEXT;
  v_project_url TEXT;
BEGIN
  -- Get service role key from environment or set it here
  -- IMPORTANT: Replace this with your actual service role key
  v_service_role_key := current_setting('app.settings.service_role_key', true);
  v_project_url := current_setting('app.settings.project_url', true);
  
  -- If not set via settings, you'll need to set it manually
  -- For security, consider using Supabase secrets instead
  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    RAISE EXCEPTION 'Service role key not configured. Please set app.settings.service_role_key';
  END IF;
  
  -- Call the edge function via HTTP
  PERFORM net.http_post(
    url := v_project_url || '/functions/v1/process-followup-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Step 3: Schedule the cron job to run every hour
-- This will run at minute 0 of every hour (e.g., 1:00, 2:00, 3:00, etc.)

-- First, remove any existing job with the same name
SELECT cron.unschedule('process-followup-reminders') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-followup-reminders'
);

-- Schedule the job
-- Note: You need to configure the service role key first
-- Option 1: Set it as a database setting (less secure, but works)
-- Option 2: Use Supabase secrets (more secure, recommended)

-- For now, we'll create a placeholder that you need to configure
-- You can either:
-- A) Set the service role key in the function above
-- B) Use Supabase Edge Function secrets (recommended)
-- C) Create a separate function that reads from a secure config table

-- IMPORTANT: Before enabling the cron job, you must:
-- 1. Get your service role key from Supabase Dashboard → Settings → API
-- 2. Either hardcode it in the function (not recommended for production)
--    OR use Supabase Edge Function secrets and modify the function to use them
-- 3. Update the function to use the correct project URL

-- Example cron schedule (every hour):
-- SELECT cron.schedule(
--   'process-followup-reminders',
--   '0 * * * *', -- Every hour at minute 0
--   $$SELECT public.invoke_followup_reminder_function();$$
-- );

-- Alternative: Use a simpler approach with direct HTTP call
-- You'll need to replace YOUR_SERVICE_ROLE_KEY and YOUR_PROJECT_URL
-- This is commented out for security - uncomment and configure:

/*
SELECT cron.schedule(
  'process-followup-reminders',
  '0 * * * *', -- Every hour
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-followup-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
*/

-- Step 4: Verify pg_cron is working
-- Check existing jobs:
-- SELECT * FROM cron.job;

-- Check job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Note: If pg_cron is not available in your Supabase plan,
-- you'll need to use an external cron service (see DEPLOY_EDGE_FUNCTION.md)

