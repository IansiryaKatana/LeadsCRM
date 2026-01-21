-- Create system_settings table for app configuration
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings
CREATE POLICY "Authenticated users can view settings"
ON public.system_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only super_admin and admin can modify settings
CREATE POLICY "Admins can update settings"
ON public.system_settings
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
ON public.system_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
('currency', '{"code": "GBP", "symbol": "£", "name": "British Pound"}'),
('branding', '{"logo_url": null, "favicon_url": null}'),
('room_prices', '{
  "platinum": 8500,
  "gold": 7000,
  "silver": 5500,
  "bronze": 4500,
  "standard": 3500
}'),
('room_labels', '{
  "platinum": "Platinum",
  "gold": "Gold",
  "silver": "Silver",
  "bronze": "Rhodium",
  "standard": "Rhodium Plus"
}');

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();