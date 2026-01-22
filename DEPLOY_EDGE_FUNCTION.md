# Deploy Edge Function: process-followup-reminders

## Step 1: Deploy Using Supabase CLI

If you have Supabase CLI installed, run:

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref btbsslznsexidjnzizre

# Deploy the function
supabase functions deploy process-followup-reminders
```

## Step 2: Deploy Using Supabase Dashboard

### Option A: Manual Upload via Dashboard

1. **Go to Supabase Dashboard:**
   - Navigate to: https://app.supabase.com/project/btbsslznsexidjnzizre
   - Go to **Edge Functions** in the sidebar

2. **Create New Function:**
   - Click **"Create a new function"**
   - Name it: `process-followup-reminders`
   - Copy the contents of `supabase/functions/process-followup-reminders/index.ts`
   - Paste into the editor
   - Click **Deploy**

### Option B: Using Supabase CLI (Recommended)

```bash
# Navigate to project root
cd /path/to/urbanhubleadscrm-main

# Deploy the function
supabase functions deploy process-followup-reminders --project-ref btbsslznsexidjnzizre
```

## Step 3: Configure Function Secrets

The function needs access to your Supabase project. These should already be set, but verify:

1. **Go to Edge Functions → Settings → Secrets**
2. **Verify these secrets exist:**
   - `SUPABASE_URL` - Your project URL (e.g., `https://btbsslznsexidjnzizre.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (⚠️ Keep secret!)

If they don't exist, add them:
- Click **"Add new secret"**
- Add `SUPABASE_URL` with your project URL
- Add `SUPABASE_SERVICE_ROLE_KEY` with your service role key

## Step 4: Set Up Scheduled Execution

The function needs to run periodically (recommended: every hour) to check for overdue follow-ups.

### Option A: Using pg_cron (Recommended - Runs in Supabase)

Create a scheduled job in your database:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every hour
SELECT cron.schedule(
  'process-followup-reminders',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://btbsslznsexidjnzizre.supabase.co/functions/v1/process-followup-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Important:** Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key.

### Option B: Using External Cron Service

You can use services like:
- **cron-job.org** (free)
- **EasyCron** (free tier available)
- **GitHub Actions** (if using GitHub)
- **Vercel Cron** (if deployed on Vercel)

**Cron Expression:** `0 * * * *` (every hour)

**URL to call:**
```
POST https://btbsslznsexidjnzizre.supabase.co/functions/v1/process-followup-reminders
Headers:
  Authorization: Bearer YOUR_SERVICE_ROLE_KEY
  Content-Type: application/json
Body: {}
```

### Option C: Manual Testing

You can test the function manually:

```bash
# Using curl
curl -X POST \
  'https://btbsslznsexidjnzizre.supabase.co/functions/v1/process-followup-reminders' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Or use the Supabase Dashboard:
1. Go to **Edge Functions** → `process-followup-reminders`
2. Click **"Invoke function"**
3. Use empty body: `{}`
4. Click **"Invoke"**

## Step 5: Verify Deployment

1. **Check Function Logs:**
   - Go to **Edge Functions** → `process-followup-reminders` → **Logs**
   - You should see logs when the function runs

2. **Test the Function:**
   - Manually invoke it (see Option C above)
   - Check that it returns:
     ```json
     {
       "success": true,
       "remindersCreated": 0,
       "notificationsSent": 0,
       "overdueLeads": 0
     }
     ```

3. **Check Database:**
   - Verify that `followup_reminders` table exists
   - Verify that `notifications` table exists
   - Check if any reminders were created

## Step 6: Monitor Function Execution

### View Logs in Dashboard:
- **Edge Functions** → `process-followup-reminders` → **Logs**
- Look for execution logs, errors, and success messages

### Check Function Metrics:
- **Edge Functions** → `process-followup-reminders` → **Metrics**
- Monitor invocations, errors, and execution time

## Troubleshooting

### Function Not Deploying:
- Check that you're logged into Supabase CLI: `supabase login`
- Verify project ID in `supabase/config.toml` matches your project
- Check function syntax for errors

### Function Not Running:
- Verify secrets are set correctly
- Check cron job is scheduled (if using pg_cron)
- Verify service role key has correct permissions

### No Reminders Created:
- Check that leads exist with `followup_count < 3`
- Verify leads are assigned (`assigned_to` is not null)
- Check that leads are not already converted/closed
- Review function logs for errors

### Notifications Not Appearing:
- Verify user notification preferences are set
- Check that `notifications` table has proper RLS policies
- Verify user has notification preferences enabled

## Next Steps

After deployment:
1. ✅ Function is deployed and accessible
2. ✅ Scheduled job is running (every hour)
3. ✅ Test with a real lead to verify reminders work
4. ✅ Monitor logs for the first few days

---

**Function Location:** `supabase/functions/process-followup-reminders/index.ts`  
**Config Updated:** `supabase/config.toml`  
**Recommended Schedule:** Every hour (`0 * * * *`)

