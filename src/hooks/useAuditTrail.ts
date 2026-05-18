import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAuditTrail(leadId?: string) {
  const { user, hasElevatedRole } = useAuth();

  return useQuery({
    queryKey: ["audit-trail", leadId],
    queryFn: async () => {
      let query = supabase
        .from("audit_trail")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      const userIds = [...new Set(data.map((entry) => entry.user_id).filter(Boolean))] as string[];
      const profilesMap = new Map<string, { full_name: string }>();

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        profilesData?.forEach((profile) => {
          profilesMap.set(profile.user_id, { full_name: profile.full_name });
        });
      }

      return data.map((entry) => ({
        ...entry,
        profiles: entry.user_id ? profilesMap.get(entry.user_id) : undefined,
      }));
    },
    enabled: !!user && hasElevatedRole,
  });
}
