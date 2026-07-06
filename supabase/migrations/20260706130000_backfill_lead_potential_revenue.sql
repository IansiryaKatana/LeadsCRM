-- Resolve flat or per-academic-year room price for a lead.
CREATE OR REPLACE FUNCTION public.resolve_lead_room_price(
  p_prices jsonb,
  p_academic_year text,
  p_room_choice text
) RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF((p_prices -> p_academic_year ->> p_room_choice)::numeric, 0),
    NULLIF((p_prices ->> p_room_choice)::numeric, 0),
    CASE p_room_choice
      WHEN 'platinum' THEN 8500
      WHEN 'gold' THEN 7000
      WHEN 'silver' THEN 5500
      WHEN 'bronze' THEN 4500
      WHEN 'standard' THEN 3500
      ELSE 5500
    END
  );
$$;

-- Pipeline leads: room price for academic year + room type.
UPDATE public.leads l
SET potential_revenue = public.resolve_lead_room_price(
  (SELECT setting_value FROM public.system_settings WHERE setting_key = 'room_prices' LIMIT 1),
  l.academic_year,
  l.room_choice::text
)
WHERE l.source NOT IN ('web_urban_hub_payment', 'web_deposit');

-- Payment leads: amount from metadata when available.
UPDATE public.leads l
SET potential_revenue = COALESCE(
  NULLIF((l.metadata->>'amount_pence')::numeric, 0) / 100,
  NULLIF((l.metadata->>'amount_gbp')::numeric, 0),
  NULLIF(
    NULLIF(regexp_replace(COALESCE(l.metadata->>'deposit_amount', ''), '[^0-9.]', '', 'g'), '')::numeric,
    0
  ),
  l.potential_revenue
)
WHERE l.source IN ('web_urban_hub_payment', 'web_deposit')
  AND l.metadata IS NOT NULL
  AND (
    l.metadata ? 'amount_pence'
    OR l.metadata ? 'amount_gbp'
    OR l.metadata ? 'deposit_amount'
  );

-- Recalculate pipeline revenue after room price changes (callable from settings).
CREATE OR REPLACE FUNCTION public.recalculate_pipeline_potential_revenue()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.leads l
  SET potential_revenue = public.resolve_lead_room_price(
    (SELECT setting_value FROM public.system_settings WHERE setting_key = 'room_prices' LIMIT 1),
    l.academic_year,
    l.room_choice::text
  )
  WHERE l.source NOT IN ('web_urban_hub_payment', 'web_deposit');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_pipeline_potential_revenue() TO authenticated;
