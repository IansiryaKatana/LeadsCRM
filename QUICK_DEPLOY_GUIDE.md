# Quick Deploy Guide: process-followup-reminders

## 🚀 Fastest Deployment Method

### Using Supabase CLI (Recommended)

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref btbsslznsexidjnzizre

# 4. Deploy the function
supabase functions deploy process-followup-reminders
```

That's it! The function is now deployed.

## ⚙️ Set Up Scheduled Execution

### Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Enable **pg_cron** extension
4. Go to **SQL Editor**
5. Run this SQL (replace placeholders):

```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function (replace YOUR_SERVICE_ROLE_KEY)
SELECT cron.schedule(
  'process-followup-reminders',
  '0 * * * *', -- Every hour
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

**To get your Service Role Key:**
- Supabase Dashboard → Settings → API → `service_role` key (secret)

### Option 2: External Cron Service (If pg_cron not available)

Use a free service like **cron-job.org**:

1. Sign up at https://cron-job.org
2. Create a new cron job:
   - **URL:** `https://btbsslznsexidjnzizre.supabase.co/functions/v1/process-followup-reminders`
   - **Method:** POST
   - **Headers:**
     - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
     - `Content-Type: application/json`
   - **Body:** `{}`
   - **Schedule:** Every hour (`0 * * * *`)

## ✅ Verify It's Working

1. **Test manually:**
   ```bash
   curl -X POST \
     'https://btbsslznsexidjnzizre.supabase.co/functions/v1/process-followup-reminders' \
     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
     -H 'Content-Type: application/json' \
     -d '{}'
   ```

2. **Check logs:**
   - Supabase Dashboard → Edge Functions → `process-followup-reminders` → Logs

3. **Check database:**
   - Look for new rows in `followup_reminders` table
   - Look for new rows in `notifications` table

## 🔧 Troubleshooting

**Function not found?**
- Make sure you deployed it: `supabase functions deploy process-followup-reminders`

**401 Unauthorized?**
- Check your service role key is correct
- Verify the key is set in function secrets (Dashboard → Edge Functions → Settings → Secrets)

**No reminders created?**
- Check that you have leads with `followup_count < 3`
- Verify leads are assigned (`assigned_to` is not null)
- Check function logs for errors

---

**That's it!** Your follow-up reminder system is now automated. 🎉

