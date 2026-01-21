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
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && hasElevatedRole,
  });
}
