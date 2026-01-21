import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type LeadImport = Database["public"]["Tables"]["lead_imports"]["Row"];

export function useBulkUploadHistory() {
  const { user, hasElevatedRole } = useAuth();

  return useQuery({
    queryKey: ["bulk-upload-history"],
    queryFn: async () => {
      let query = supabase
        .from("lead_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      // If not elevated role, only show own imports
      if (!hasElevatedRole && user) {
        query = query.eq("created_by", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LeadImport[];
    },
    enabled: !!user,
  });
}

