import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY_PREFIX = "urban_hub_web_leads_viewed_";

function getStorageKey(userId?: string | null) {
  return `${STORAGE_KEY_PREFIX}${userId ?? "anonymous"}`;
}

function getViewedSet(userId?: string | null): Set<string> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveViewedSet(userId: string | null | undefined, set: Set<string>) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage errors
  }
}

export function useUnreadWebLeadsCount(academicYear?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["web-leads", "unread-count", academicYear || "all", user?.id],
    queryFn: async (): Promise<number> => {
      const viewed = getViewedSet(user?.id);

      let query = supabase
        .from("leads")
        .select("id, source")
        .in("source", ["web_contact", "web_booking", "web_callback", "web_deposit", "web_keyworkers"]);

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return 0;

      const unreadCount = data.filter((lead) => !viewed.has(lead.id as string)).length;
      return unreadCount;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useUnreadWebLeadsCountBySource(sourceSlug: string, academicYear?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["web-leads", "unread-count", sourceSlug, academicYear || "all", user?.id],
    queryFn: async (): Promise<number> => {
      const viewed = getViewedSet(user?.id);

      let query = supabase
        .from("leads")
        .select("id, source")
        .eq("source", sourceSlug);

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return 0;

      const unreadCount = data.filter((lead) => !viewed.has(lead.id as string)).length;
      return unreadCount;
    },
    enabled: !!user && ["web_contact", "web_booking", "web_callback", "web_deposit", "web_keyworkers"].includes(sourceSlug),
    refetchInterval: 30000,
  });
}

export function useWebLeadReadManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const markLeadAsRead = (leadId: string) => {
    const viewed = getViewedSet(user?.id);
    if (!viewed.has(leadId)) {
      viewed.add(leadId);
      saveViewedSet(user?.id, viewed);
      // Invalidate all unread web lead count queries (totals and per source, all years)
      queryClient.invalidateQueries({ queryKey: ["web-leads", "unread-count"], exact: false });
    }
  };

  const isLeadUnread = (leadId: string, source: string) => {
    const isWebSource = ["web_contact", "web_booking", "web_callback", "web_deposit", "web_keyworkers"].includes(source);
    if (!isWebSource) return false;
    const viewed = getViewedSet(user?.id);
    return !viewed.has(leadId);
  };

  return { markLeadAsRead, isLeadUnread };
}

