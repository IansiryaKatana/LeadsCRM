# Event Reminders Setup Guide

## Overview

The event reminder system automatically sends notifications 6 hours before scheduled calendar events (viewings, callbacks, follow-ups, tasks). Notifications appear in the in-app notification center and optionally via email.

## What Happens

1. **Every hour**, the system checks for events starting in 6 hours
2. **For each event**, it:
   - Creates an in-app notification for the assigned user
   - Optionally sends an email (if user has email enabled)
   - Marks the event as `reminder_sent = true` (so it doesn't send duplicate reminders)

3. **Notifications appear in:**
   - The notification bell icon in the sidebar
   - The notification center dropdown
   - User's email inbox (if enabled)

## Setup Instructions

### Step 1: Run Database Migration

Apply the migration to add the `event_reminder` notification type:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20250122000003_add_event_reminder_notification_type.sql
```

Or manually run:
```sql
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_reminder';
ALTER TABLE public.user_notification_preferences
ADD COLUMN IF NOT EXISTS event_reminder BOOLEAN NOT NULL DEFAULT true;
UPDATE public.user_notification_preferences
SET event_reminder = true
WHERE event_reminder IS NULL;
```

### Step 2: Deploy the Edge Function

```bash
supabase functions deploy process-event-reminders --project-ref btbsslznsexidjnzizre
```

### Step 3: Set Up Scheduled Execution

The function needs to run **every hour** to check for upcoming events.

#### Option A: Using pg_cron (Recommended)

1. **Enable pg_cron extension:**
   - Go to **Database** → **Extensions**
   - Search for `pg_cron`
   - Click **Enable**

2. **Run this SQL in SQL Editor:**
   ```sql
   -- Replace YOUR_SERVICE_ROLE_KEY with your actual service role key
   SELECT cron.schedule(
     'process-event-reminders',
     '0 * * * *', -- Every hour at minute 0
     $$
     SELECT
       net.http_post(
         url := 'https://btbsslznsexidjnzizre.supabase.co/functions/v1/process-event-reminders',
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
   SELECT * FROM cron.job WHERE jobname = 'process-event-reminders';
   ```

#### Option B: External Cron Service

Use a free service like **cron-job.org**:

1. Sign up at https://cron-job.org (free)
2. Create new cron job:
   - **Title:** Event Reminders
   - **URL:** `https://btbsslznsexidjnzizre.supabase.co/functions/v1/process-event-reminders`
   - **Method:** POST
   - **Headers:**
     ```
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
     Content-Type: application/json
     ```
   - **Body:** `{}`
   - **Schedule:** Every hour (`0 * * * *`)
   - **Save**

### Step 4: Test the Function

**Manual Test via Dashboard:**
1. Go to **Edge Functions** → `process-event-reminders`
2. Click **"Invoke function"**
3. Body: `{}`
4. Click **"Invoke"**
5. Check the response - should return:
   ```json
   {
     "success": true,
     "eventsProcessed": 0,
     "notificationsSent": 0,
     "eventsUpdated": 0
   }
   ```

**Manual Test via Command Line:**
```powershell
# Using PowerShell
$headers = @{
    "Authorization" = "Bearer YOUR_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "https://btbsslznsexidjnzizre.supabase.co/functions/v1/process-event-reminders" -Method POST -Headers $headers -Body '{}'
```

## How It Works

### Event Selection Criteria

The system checks for events that:
- Start between **5.5 and 6.5 hours** from now (1-hour window to account for cron timing)
- Have `reminder_sent = false` (haven't been reminded yet)
- Are linked to a lead (`lead_id` is not null)

### Notification Recipients

Priority order for who gets notified:
1. **Lead's assigned user** (`leads.assigned_to`)
2. **Lead's creator** (`leads.created_by`)
3. **Event creator** (`calendar_events.created_by`)

### User Preferences

Users can control event reminders in:
- **Settings** → **Notifications** → **Event Reminders** toggle

If disabled, they won't receive:
- In-app notifications
- Email reminders

## Notification Format

**In-App Notification:**
- **Title:** "Event Reminder"
- **Message:** "[Event Title] is scheduled in 6 hours (Mon, Jan 22 at 2:00 PM at Urban Hub)"
- **Link:** Opens the lead detail dialog or calendar page

**Email Notification:**
- **Subject:** "Event Reminder"
- **Body:** Formatted HTML email with event details
- **From:** Uses the configured `email_from_address` from system settings

## Troubleshooting

### Notifications Not Appearing

1. **Check function logs:**
   - Go to **Edge Functions** → `process-event-reminders` → **Logs**
   - Look for errors or warnings

2. **Verify cron job is running:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobname = 'process-event-reminders' 
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

3. **Check user preferences:**
   - Ensure `event_reminder = true` in `user_notification_preferences`
   - Check Settings → Notifications → Event Reminders is enabled

4. **Verify events exist:**
   ```sql
   SELECT * FROM calendar_events 
   WHERE start_date BETWEEN NOW() + INTERVAL '5.5 hours' AND NOW() + INTERVAL '6.5 hours'
   AND reminder_sent = false;
   ```

### Duplicate Notifications

- The system marks `reminder_sent = true` after sending
- If you see duplicates, check if multiple cron jobs are running

### Email Not Sending

- Verify `RESEND_API_KEY` is set in Edge Function secrets
- Check user has `email_enabled = true` in preferences
- Check Resend dashboard for email delivery status

## Testing with a Test Event

To test the system:

1. **Create a test event:**
   - Open a lead
   - Go to Calendar tab
   - Schedule an event for **6 hours from now**

2. **Wait for the next cron run** (or manually invoke the function)

3. **Check notifications:**
   - Look for the notification bell icon
   - Check your email inbox
   - Verify the event shows `reminder_sent = true` in the database

## Next Steps

Once set up, the system will automatically:
- ✅ Check for upcoming events every hour
- ✅ Send notifications 6 hours before events
- ✅ Respect user notification preferences
- ✅ Send both in-app and email notifications
- ✅ Prevent duplicate reminders

No manual intervention needed!
