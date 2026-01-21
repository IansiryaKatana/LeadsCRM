import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useSystemSettings, SystemSettings, CurrencySettings, RoomLabels, RoomPrices } from "@/hooks/useSystemSettings";

interface SystemSettingsContextValue {
  settings: SystemSettings;
  isLoading: boolean;
  getRoomLabel: (roomKey: string) => string;
  getRoomPrice: (roomKey: string) => number;
  formatCurrency: (amount: number) => string;
  currency: CurrencySettings;
  roomLabels: RoomLabels;
  roomPrices: RoomPrices;
  academicYears: string[];
  defaultAcademicYear: string;
  currentAcademicYear: string;
  setCurrentAcademicYear: (year: string) => void;
  systemName: string;
}

const SystemSettingsContext = createContext<SystemSettingsContextValue | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const { settings, isLoading } = useSystemSettings();

  // Track the currently selected academic year across the app.
  // Always initialise/sync from the value stored in system settings,
  // so refreshes and settings changes reflect the configured default.
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>("");

  useEffect(() => {
    setCurrentAcademicYear(settings.default_academic_year || "");
  }, [settings.default_academic_year]);

  const getRoomLabel = (roomKey: string): string => {
    return settings.room_labels[roomKey as keyof RoomLabels] || roomKey;
  };

  const getRoomPrice = (roomKey: string): number => {
    return settings.room_prices[roomKey as keyof RoomPrices] || 0;
  };

  const formatCurrency = (amount: number): string => {
    return `${settings.currency.symbol}${amount.toLocaleString()}`;
  };

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        isLoading,
        getRoomLabel,
        getRoomPrice,
        formatCurrency,
        currency: settings.currency,
        roomLabels: settings.room_labels,
        roomPrices: settings.room_prices,
        academicYears: settings.academic_years ?? [],
        defaultAcademicYear: settings.default_academic_year || "",
        currentAcademicYear,
        setCurrentAcademicYear,
        systemName: settings.system_name ?? "ISKA Leads CRM",
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettingsContext() {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error("useSystemSettingsContext must be used within SystemSettingsProvider");
  }
  return context;
}
