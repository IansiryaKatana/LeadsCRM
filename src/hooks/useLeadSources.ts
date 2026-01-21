import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export interface LeadSource {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useLeadSources(includeInactive = false) {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["lead-sources", includeInactive],
    queryFn: async (): Promise<LeadSource[]> => {
      let query = supabase
        .from("lead_sources")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      // Only show inactive sources to admins
      if (!includeInactive || (role !== "super_admin" && role !== "admin")) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useCreateLeadSource() {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  return useMutation({
    mutationFn: async (source: Omit<LeadSource, "id" | "created_at" | "updated_at">) => {
      if (role !== "super_admin") {
        throw new Error("Only super administrators can create lead sources");
      }

      const { data, error } = await supabase
        .from("lead_sources")
        .insert({
          name: source.name,
          slug: source.slug,
          icon: source.icon || "📋",
          color: source.color || "#6366f1",
          is_active: source.is_active ?? true,
          display_order: source.display_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-sources"] });
      toast({
        title: "Source Created",
        description: "Lead source has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead source",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLeadSource() {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LeadSource> & { id: string }) => {
      if (role !== "super_admin") {
        throw new Error("Only super administrators can update lead sources");
      }

      const { data, error } = await supabase
        .from("lead_sources")
        .update({
          name: updates.name,
          slug: updates.slug,
          icon: updates.icon,
          color: updates.color,
          is_active: updates.is_active,
          display_order: updates.display_order,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-sources"] });
      toast({
        title: "Source Updated",
        description: "Lead source has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead source",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLeadSource() {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (role !== "super_admin") {
        throw new Error("Only super administrators can delete lead sources");
      }

      // First get the source slug
      const { data: source, error: sourceError } = await supabase
        .from("lead_sources")
        .select("slug")
        .eq("id", id)
        .single();

      if (sourceError) throw sourceError;
      if (!source) throw new Error("Source not found");

      // Check if source is being used by any leads
      const { count, error: countError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("source", source.slug);

      if (countError) throw countError;

      if (count && count > 0) {
        // Instead of deleting, deactivate the source
        const { data, error } = await supabase
          .from("lead_sources")
          .update({ is_active: false })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return { deactivated: true, data };
      } else {
        // Safe to delete if no leads are using it
        const { error } = await supabase
          .from("lead_sources")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return { deactivated: false, data: null };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["lead-sources"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: result.deactivated ? "Source Deactivated" : "Source Deleted",
        description: result.deactivated
          ? "Source has been deactivated because it's being used by existing leads"
          : "Lead source has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead source",
        variant: "destructive",
      });
    },
  });
}

