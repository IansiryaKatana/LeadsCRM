import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

export function useLeads(academicYear?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["leads", academicYear],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
    retry: 1,
    // Poll periodically so new webhook leads appear without manual refresh
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useLead(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["leads", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (lead: Omit<LeadInsert, "created_by">) => {
      // Validate required fields
      if (!lead.source) {
        throw new Error("Lead source is required");
      }
      if (!lead.full_name || !lead.email || !lead.phone) {
        throw new Error("Name, email, and phone are required");
      }

      const { data, error } = await supabase
        .from("leads")
        .insert({ ...lead, created_by: user?.id })
        .select()
        .single();

      if (error) {
        console.error("Lead creation error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error, null, 2)
        });
        console.error("Lead data being inserted:", {
          ...lead,
          created_by: user?.id
        });
        
        // Provide more helpful error messages
        if (error.message?.includes("Invalid lead source") || error.message?.includes("does not exist in lead_sources")) {
          throw new Error(`Invalid lead source: "${lead.source}". Please select a valid source from the dropdown.`);
        }
        if (error.code === "23503") {
          throw new Error("Invalid reference. Please check that all selected values are valid.");
        }
        if (error.code === "23502") {
          throw new Error(`Missing required field: ${error.message}`);
        }
        // Return the actual error message
        throw new Error(error.message || "Failed to create lead. Please check all fields are valid.");
      }
      return data;
    },
    onSuccess: (data) => {
      // Invalidate all leads queries (including those with academic year filters)
      queryClient.invalidateQueries({ queryKey: ["leads"], exact: false });
      // Also refetch to ensure immediate update
      queryClient.refetchQueries({ queryKey: ["leads"], exact: false });
      // Invalidate all dashboard stats queries (including those with academic year filters)
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["channel-performance"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["monthly-lead-data"], exact: false });
      toast({ title: "Lead created successfully" });
    },
    onError: (error: Error | unknown) => {
      console.error("Lead creation failed:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : "An unexpected error occurred. Please try again.";
      
      toast({ 
        title: "Failed to create lead", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: LeadUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", data.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Lead updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update lead", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      // First get the current lead to calculate revenue if converting
      const { data: currentLead } = await supabase
        .from("leads")
        .select("room_choice, stay_duration")
        .eq("id", id)
        .single();

      const updateData: Record<string, unknown> = { lead_status: status };
      
      // Calculate revenue only when status changes to converted
      if (status === "converted" && currentLead) {
        const roomPrices: Record<string, number> = {
          platinum: 8500, gold: 7000, silver: 5500, bronze: 4500, standard: 3500
        };
        const durationMultipliers: Record<string, number> = {
          "51_weeks": 1, "45_weeks": 0.88, short_stay: 0.4
        };
        const basePrice = roomPrices[currentLead.room_choice] || 5500;
        const multiplier = durationMultipliers[currentLead.stay_duration] || 1;
        updateData.potential_revenue = Math.round(basePrice * multiplier);
      } else if (status !== "converted") {
        // Reset revenue if moving away from converted
        updateData.potential_revenue = 0;
      }

      const { data, error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Trigger notification
      try {
        await supabase.functions.invoke("send-notification", {
          body: { leadId: id, type: "status_change", newStatus: status },
        });
      } catch (e) {
        console.error("Notification failed:", e);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", data.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Status updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });
}

export function useAssignLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update({ assigned_to: userId })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Trigger notification
      try {
        await supabase.functions.invoke("send-notification", {
          body: { leadId: id, type: "lead_assigned", assignedTo: userId },
        });
      } catch (e) {
        console.error("Notification failed:", e);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", data.id] });
      toast({ title: "Lead assigned successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to assign lead", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Lead deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete lead", description: error.message, variant: "destructive" });
    },
  });
}

export function useToggleHotLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isHot }: { id: string; isHot: boolean }) => {
      const { data, error } = await supabase
        .from("leads")
        .update({ is_hot: isHot })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", data.id] });
      toast({ title: data.is_hot ? "Marked as hot lead" : "Removed hot status" });
    },
    onError: (error) => {
      toast({ title: "Failed to update lead", description: error.message, variant: "destructive" });
    },
  });
}
