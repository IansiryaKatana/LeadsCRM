import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrencySettings {
  code: string;
  symbol: string;
  name: string;
}

export interface BrandingSettings {
  logo_url: string | null;
  favicon_url: string | null;
}

export interface RoomPrices {
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  standard: number;
}

export interface RoomLabels {
  platinum: string;
  gold: string;
  silver: string;
  bronze: string;
  standard: string;
}

export interface SystemSettings {
  currency: CurrencySettings;
  branding: BrandingSettings;
  room_prices: RoomPrices;
  room_labels: RoomLabels;
  academic_years?: string[];
  default_academic_year?: string;
  system_name?: string;
  email_from_address?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  currency: { code: "GBP", symbol: "£", name: "British Pound" },
  branding: { logo_url: null, favicon_url: null },
  room_prices: {
    platinum: 8500,
    gold: 7000,
    silver: 5500,
    bronze: 4500,
    standard: 3500,
  },
  room_labels: {
    platinum: "Platinum",
    gold: "Gold",
    silver: "Silver",
    bronze: "Rhodium",
    standard: "Rhodium Plus",
  },
  academic_years: ["2024/2025", "2025/2026"],
  default_academic_year: "2025/2026",
  system_name: "Urban Hub Students Accommodations",
  email_from_address: "Urban Hub <noreply@send.portal.urbanhub.uk>",
};

export const CURRENCY_OPTIONS: CurrencySettings[] = [
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "KES", symbol: "KES", name: "Kenyan Shilling" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
];

export function useSystemSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async (): Promise<SystemSettings> => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const settingsMap: SystemSettings = { ...DEFAULT_SETTINGS };

      data?.forEach((row) => {
        const key = row.setting_key;
        if (key === "system_name" || key === "email_from_address") {
          settingsMap[key] = row.setting_value as string;
        } else if (key in settingsMap) {
          settingsMap[key as keyof SystemSettings] = row.setting_value as any;
        }
      });

      return settingsMap;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: keyof SystemSettings;
      value: any;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("system_settings")
        .upsert({ 
          setting_key: key,
          setting_value: value,
          updated_by: user?.user?.id,
        }, {
          onConflict: "setting_key"
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
  });

  return {
    settings: settings ?? DEFAULT_SETTINGS,
    isLoading,
    error,
    updateSetting,
  };
}

export function useRoomConfig() {
  const { settings } = useSystemSettings();

  const getRoomLabel = (roomKey: string): string => {
    return settings.room_labels[roomKey as keyof RoomLabels] || roomKey;
  };

  const getRoomPrice = (roomKey: string): number => {
    return settings.room_prices[roomKey as keyof RoomPrices] || 0;
  };

  const formatCurrency = (amount: number): string => {
    return `${settings.currency.symbol}${amount.toLocaleString()}`;
  };

  return {
    getRoomLabel,
    getRoomPrice,
    formatCurrency,
    currency: settings.currency,
    roomLabels: settings.room_labels,
    roomPrices: settings.room_prices,
    academicYears: settings.academic_years ?? DEFAULT_SETTINGS.academic_years!,
    defaultAcademicYear: settings.default_academic_year ?? DEFAULT_SETTINGS.default_academic_year!,
  };
}