-- Migration: Remap legacy 'website' leads to 'web_booking'

UPDATE public.leads
SET source = 'web_booking'
WHERE source = 'website';

