-- Migration: Add contact form fields to leads
-- Purpose: Store reason and message for Web - Contact Form submissions

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS contact_reason TEXT;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS contact_message TEXT;

