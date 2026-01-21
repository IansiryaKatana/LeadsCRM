-- Migration: Add Keyworkers form fields to leads
-- Purpose: Store free-text length of stay and preferred date for Web - Keyworkers submissions

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS keyworker_length_of_stay TEXT;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS keyworker_preferred_date TEXT;

