-- Migration: Add event reminder notification type
-- This enables notifications for calendar event reminders

-- Step 1: Add new notification type to enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_reminder';

-- Step 2: Add event_reminder preference to user_notification_preferences
ALTER TABLE public.user_notification_preferences
ADD COLUMN IF NOT EXISTS event_reminder BOOLEAN NOT NULL DEFAULT true;

-- Step 3: Update existing users to have event_reminder enabled by default
UPDATE public.user_notification_preferences
SET event_reminder = true
WHERE event_reminder IS NULL;
