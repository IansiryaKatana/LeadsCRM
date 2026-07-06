import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings, SystemSettings, CurrencySettings, RoomLabels } from "@/hooks/useSystemSettings";
import { resolveDefaultAcademicYear } from "@/utils/academicYear";
import { getRoomPriceForYear, type RoomPricesByYear } from "@/utils/roomPrices";

interface SystemSettingsContextValue {
  settings: SystemSettings;
  isLoading: boolean;
  getRoomLabel: (roomKey: string) => string;
  getRoomPrice: (roomKey: string, academicYear?: string | null) => number;
  formatCurrency: (amount: number) => string;
  currency: CurrencySettings;
  roomLabels: RoomLabels;
  roomPricesByYear: RoomPricesByYear;
  academicYears: string[];
  defaultAcademicYear: string;
  currentAcademicYear: string | null;
  setCurrentAcademicYear: (year: string) => void;
  systemName: string;
}

const SystemSettingsContext = createContext<SystemSettingsContextValue | undefined>(undefined);

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { settings, isLoading } = useSystemSettings();

  const academicYears = settings.academic_years ?? [];
  const defaultAcademicYear = useMemo(
    () => resolveDefaultAcademicYear(academicYears, settings.default_academic_year),
    [academicYears, settings.default_academic_year],
  );

  const [currentAcademicYear, setCurrentAcademicYearState] = useState<string | null>(null);
  const userChangedYearRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const setCurrentAcademicYear = useCallback((year: string) => {
    userChangedYearRef.current = true;
    setCurrentAcademicYearState(year);
  }, []);

  useEffect(() => {
    if (!user) {
      setCurrentAcademicYearState(null);
      userChangedYearRef.current = false;
      lastUserIdRef.current = null;
      return;
    }

    const isNewSession = lastUserIdRef.current !== user.id;
    if (isNewSession) {
      lastUserIdRef.current = user.id;
      userChangedYearRef.current = false;
    }

    if (isLoading) {
      return;
    }

    if (userChangedYearRef.current && !isNewSession) {
      return;
    }

    const resolvedYear = resolveDefaultAcademicYear(academicYears, settings.default_academic_year);
    setCurrentAcademicYearState((previous) => {
      if (!resolvedYear) {
        return previous;
      }

      if (isNewSession || !previous || !academicYears.includes(previous)) {
        return resolvedYear;
      }

      return previous;
    });
  }, [user, isLoading, academicYears, settings.default_academic_year]);

  const getRoomLabel = (roomKey: string): string => {
    return settings.room_labels[roomKey as keyof RoomLabels] || roomKey;
  };

  const getRoomPrice = (roomKey: string, academicYear?: string | null): number => {
    const resolvedYear =
      academicYear || currentAcademicYear || defaultAcademicYear || undefined;
    return getRoomPriceForYear(settings.room_prices, roomKey, resolvedYear, defaultAcademicYear);
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
        roomPricesByYear: settings.room_prices,
        academicYears,
        defaultAcademicYear,
        currentAcademicYear,
        setCurrentAcademicYear,
        systemName: settings.system_name ?? "Urban Hub Students Accommodations",
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
