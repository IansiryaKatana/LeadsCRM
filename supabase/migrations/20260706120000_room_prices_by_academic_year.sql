-- Migrate flat room_prices to per-academic-year format
DO $$
DECLARE
  flat_prices jsonb;
  years jsonb;
  new_prices jsonb := '{}'::jsonb;
  yr text;
BEGIN
  SELECT setting_value INTO flat_prices
  FROM public.system_settings
  WHERE setting_key = 'room_prices';

  IF flat_prices IS NULL THEN
    RETURN;
  END IF;

  -- Legacy format: top-level room keys with numeric values
  IF flat_prices ? 'platinum' AND jsonb_typeof(flat_prices -> 'platinum') = 'number' THEN
    SELECT setting_value INTO years
    FROM public.system_settings
    WHERE setting_key = 'academic_years';

    IF years IS NULL OR jsonb_array_length(years) = 0 THEN
      years := '["2024/2025", "2025/2026"]'::jsonb;
    END IF;

    FOR yr IN SELECT jsonb_array_elements_text(years)
    LOOP
      new_prices := new_prices || jsonb_build_object(yr, flat_prices);
    END LOOP;

    UPDATE public.system_settings
    SET setting_value = new_prices,
        updated_at = now()
    WHERE setting_key = 'room_prices';
  END IF;
END $$;
