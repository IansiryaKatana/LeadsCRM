-- Weekly room pricing: convert legacy flat totals to per-week rates, then recalculate
-- potential_revenue for Book Viewing (web_booking) and Schedule Callback (web_callback) leads.

CREATE OR REPLACE FUNCTION public.get_stay_duration_weeks(p_stay_duration text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_stay_duration
    WHEN '45_weeks' THEN 45
    WHEN '51_weeks' THEN 51
    WHEN 'short_stay' THEN 12
    ELSE 51
  END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_weekly_room_rate(
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
      WHEN 'platinum' THEN 189
      WHEN 'gold' THEN 156
      WHEN 'silver' THEN 122
      WHEN 'bronze' THEN 100
      WHEN 'standard' THEN 78
      ELSE 122
    END
  );
$$;

CREATE OR REPLACE FUNCTION public.resolve_lead_potential_revenue(
  p_prices jsonb,
  p_academic_year text,
  p_room_choice text,
  p_stay_duration text,
  p_source text
) RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_source IN ('web_urban_hub_payment', 'web_deposit') THEN 0
    WHEN p_source IN ('web_booking', 'web_callback') THEN
      public.resolve_weekly_room_rate(p_prices, p_academic_year, p_room_choice)
      * public.get_stay_duration_weeks(p_stay_duration)
    ELSE 0
  END;
$$;

-- Backward-compatible alias used by earlier migrations.
CREATE OR REPLACE FUNCTION public.resolve_lead_room_price(
  p_prices jsonb,
  p_academic_year text,
  p_room_choice text
) RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.resolve_weekly_room_rate(p_prices, p_academic_year, p_room_choice);
$$;

-- Convert stored flat totals (> £300/week is unlikely) to weekly rates by dividing by 45.
DO $$
DECLARE
  prices jsonb;
  room_keys text[] := ARRAY['platinum', 'gold', 'silver', 'bronze', 'standard'];
  year_key text;
  room_key text;
  room_value numeric;
  updated_prices jsonb;
  needs_conversion boolean := false;
BEGIN
  SELECT setting_value INTO prices
  FROM public.system_settings
  WHERE setting_key = 'room_prices';

  IF prices IS NULL THEN
    RETURN;
  END IF;

  IF prices ? 'platinum' AND jsonb_typeof(prices -> 'platinum') = 'number' THEN
    FOREACH room_key IN ARRAY room_keys LOOP
      room_value := (prices ->> room_key)::numeric;
      IF room_value > 300 THEN
        needs_conversion := true;
        EXIT;
      END IF;
    END LOOP;

    IF needs_conversion THEN
      updated_prices := '{}'::jsonb;
      FOREACH room_key IN ARRAY room_keys LOOP
        room_value := ROUND(((prices ->> room_key)::numeric / 45.0)::numeric, 2);
        updated_prices := updated_prices || jsonb_build_object(room_key, room_value);
      END LOOP;
      prices := updated_prices;
    END IF;
  ELSE
    FOR year_key IN
      SELECT k
      FROM jsonb_object_keys(prices) AS t(k)
      WHERE k ~ '^\d{4}/\d{4}$'
    LOOP
      FOREACH room_key IN ARRAY room_keys LOOP
        room_value := (prices -> year_key ->> room_key)::numeric;
        IF room_value > 300 THEN
          needs_conversion := true;
          EXIT;
        END IF;
      END LOOP;
      EXIT WHEN needs_conversion;
    END LOOP;

    IF needs_conversion THEN
      updated_prices := prices;
      FOR year_key IN
        SELECT k
        FROM jsonb_object_keys(prices) AS t(k)
        WHERE k ~ '^\d{4}/\d{4}$'
      LOOP
        FOREACH room_key IN ARRAY room_keys LOOP
          room_value := ROUND(((prices -> year_key ->> room_key)::numeric / 45.0)::numeric, 2);
          updated_prices := jsonb_set(
            updated_prices,
            ARRAY[year_key, room_key],
            to_jsonb(room_value),
            true
          );
        END LOOP;
      END LOOP;
      prices := updated_prices;
    END IF;
  END IF;

  IF needs_conversion THEN
    UPDATE public.system_settings
    SET setting_value = prices,
        updated_at = now()
    WHERE setting_key = 'room_prices';
  END IF;
END $$;

-- Recalculate pipeline potential revenue for viewing/callback leads only.
UPDATE public.leads l
SET potential_revenue = public.resolve_lead_potential_revenue(
  (SELECT setting_value FROM public.system_settings WHERE setting_key = 'room_prices' LIMIT 1),
  l.academic_year,
  l.room_choice::text,
  l.stay_duration::text,
  l.source
)
WHERE l.source IN ('web_booking', 'web_callback');

CREATE OR REPLACE FUNCTION public.recalculate_pipeline_potential_revenue()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
  room_prices jsonb;
BEGIN
  SELECT setting_value INTO room_prices
  FROM public.system_settings
  WHERE setting_key = 'room_prices'
  LIMIT 1;

  UPDATE public.leads l
  SET potential_revenue = public.resolve_lead_potential_revenue(
    room_prices,
    l.academic_year,
    l.room_choice::text,
    l.stay_duration::text,
    l.source
  )
  WHERE l.source IN ('web_booking', 'web_callback');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_pipeline_potential_revenue() TO authenticated;
