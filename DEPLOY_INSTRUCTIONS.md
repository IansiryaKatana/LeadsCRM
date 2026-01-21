# Deploy Edge Function: process-followup-reminders

## ✅ Quick Deployment Steps

### Method 1: Using Supabase CLI (Recommended)

**If you have Supabase CLI installed:**

```powershell
# Navigate to project directory
cd "C:\Users\User\Videos\iskaleadscrm-main"

# Login to Supabase (if not already logged in)
supabase login

# Link to your project
supabase link --project-ref btbsslznsexidjnzizre

# Deploy the function
supabase functions deploy process-followup-reminders
```

**If Supabase CLI is not installed:**

1. Install it:
   ```powershell
   npm install -g supabase
   ```

2. Then run the deployment commands above

---

### Method 2: Using Supabase Dashboard (No CLI Required)

1. **Go to Supabase Dashboard:**
   - Open: https://app.supabase.com/project/btbsslznsexidjnzizre
   - Navigate to **Edge Functions** in the left sidebar

2. **Create New Function:**
   - Click **"Create a new function"** or **"New Function"**
   - Name: `process-followup-reminders`
   - Copy the entire contents from: `supabase/functions/process-followup-reminders/index.ts`
   - Paste into the code editor
   - Click **"Deploy"** or **"Save"**

3. **Verify Function:**
   - The function should appear in your Edge Functions list
   - Status should show as "Active"

---

## ⚙️ Configure Function Secrets

The function needs access to your Supabase project. Verify these secrets exist:

1. **Go to:** Edge Functions → Settings → Secrets
2. **Verify these secrets:**
   - `SUPABASE_URL` = `https://btbsslznsexidjnzizre.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service role key

**To get your Service Role Key:**
- Supabase Dashboard → Settings → API → `service_role` key (click "Reveal")

**If secrets don't exist, add them:**
- Click **"Add new secret"**
- Add each secret with the values above

---

## 🕐 Set Up Scheduled Execution

The function needs to run every hour to check for overdue follow-ups.

### Option A: Using pg_cron (Recommended - Runs in Supabase)

1. **Enable pg_cron extension:**
   - Go to **Database** → **Extensions**
   - Search for `pg_cron`
   - Click **Enable**

2. **Run this SQL in SQL Editor:**
   ```sql
   -- Replace YOUR_SERVICE_ROLE_KEY with your actual service role key
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
       );
     $$
   );
   ```

   **Important:** Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key from Settings → API

3. **Verify the job is scheduled:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-followup-reminders';
   ```

### Option B: External Cron Service (If pg_cron not available)

Use a free service like **cron-job.org**:

1. Sign up at https://cron-job.org (free)
2. Create new cron job:
   - **Title:** Follow-up Reminders
   - **URL:** `https://btbsslznsexidjnzizre.supabase.co/functions/v1/process-followup-reminders`
   - **Method:** POST
   - **Headers:**
     ```
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```
   - **Body:** `{}`
   - **Schedule:** Every hour (`0 * * * *`)
   - **Save**

---

## ✅ Test the Function

### Manual Test via Dashboard:

1. Go to **Edge Functions** → `process-followup-reminders`
2. Click **"Invoke function"**
3. Body: `{}`
4. Click **"Invoke"**
5. Check the response - should return:
   ```json
   {
     "success": true,
     "remindersCreated": 0,
     "notificationsSent": 0,
     "overdueLeads": 0
   }
   ```

### Manual Test via Command Line:

```powershell
# Using PowerShell
$headers = @{
    "Authorization" = "Bearer YOUR_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}
$body = "{}"
Invoke-RestMethod -Uri "https://btbsslznsexidjnzizre.supabase.co/functions/v1/process-followup-reminders" -Method Post -Headers $headers -Body $body
```

---

## 🔍 Verify It's Working

1. **Check Function Logs:**
   - Edge Functions → `process-followup-reminders` → **Logs**
   - You should see execution logs

2. **Check Database:**
   - Go to **Table Editor** → `followup_reminders`
   - Should see reminder records if there are overdue leads
   - Go to **Table Editor** → `notifications`
   - Should see notification records

3. **Check in App:**
   - Open your CRM app
   - Check the notification bell icon in the sidebar
   - Should show notifications for overdue follow-ups

---

## 🐛 Troubleshooting

### "Function not found" error:
- ✅ Make sure you deployed the function
- ✅ Check function name is exactly: `process-followup-reminders`

### "401 Unauthorized" error:
- ✅ Verify service role key is correct
- ✅ Check secrets are set in Edge Functions → Settings → Secrets

### "Function executed but no reminders created":
- ✅ Check you have leads with `followup_count < 3`
- ✅ Verify leads are assigned (`assigned_to` is not null)
- ✅ Check leads are not already converted/closed
- ✅ Review function logs for specific errors

### Cron job not running:
- ✅ Verify pg_cron extension is enabled
- ✅ Check cron job exists: `SELECT * FROM cron.job;`
- ✅ Check cron job history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

---

## 📋 Checklist

- [ ] Function deployed successfully
- [ ] Function secrets configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Function tested manually (returns success response)
- [ ] Scheduled job configured (pg_cron or external service)
- [ ] Verified function runs automatically
- [ ] Checked logs for any errors
- [ ] Tested with a real lead to verify reminders work

---

**Function Location:** `supabase/functions/process-followup-reminders/index.ts`  
**Config Updated:** ✅ `supabase/config.toml`  
**Recommended Schedule:** Every hour (`0 * * * *`)

Once deployed and scheduled, your follow-up reminder system will automatically:
- ✅ Check for overdue follow-ups every hour
- ✅ Create reminders for leads needing first follow-up (24-48h after creation)
- ✅ Create reminders for leads with overdue follow-ups (5+ days)
- ✅ Send in-app notifications to assigned users
- ✅ Send email notifications (if enabled in user preferences)

🎉 **Your automated follow-up reminder system is ready!**

