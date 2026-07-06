import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { isPaymentLeadSource } from "@/constants/leadSegments";
import {
  fetchRoomPricesByYear,
  resolveLeadPotentialRevenue,
} from "@/utils/leadPotentialRevenue";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

const REVENUE_FIELDS = ["room_choice", "academic_year", "source", "stay_duration"] as const;

async function withComputedPotentialRevenue(
  lead: Omit<LeadInsert, "created_by">,
): Promise<Omit<LeadInsert, "created_by">> {
  const roomPricesByYear = await fetchRoomPricesByYear(supabase);
  const potential_revenue = resolveLeadPotentialRevenue({
    roomChoice: lead.room_choice,
    academicYear: lead.academic_year,
    stayDuration: lead.stay_duration,
    source: lead.source,
    metadata: lead.metadata,
    roomPricesByYear,
    explicitAmount: lead.potential_revenue,
  });

  return { ...lead, potential_revenue };
}

export function useLeads(academicYear?: string | null) {
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
    enabled: !!user && academicYear !== null,
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

      const leadWithRevenue = await withComputedPotentialRevenue(lead);

      const { data, error } = await supabase
        .from("leads")
        .insert({ ...leadWithRevenue, created_by: user?.id })
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
          ...leadWithRevenue,
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
      const needsRevenueRecalc = REVENUE_FIELDS.some((field) => field in updates);

      let payload: LeadUpdate = { ...updates };

      if (needsRevenueRecalc) {
        const { data: currentLead, error: fetchError } = await supabase
          .from("leads")
          .select("room_choice, academic_year, source, stay_duration, metadata, potential_revenue")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;

        const mergedSource = (updates.source ?? currentLead.source) as string;

        if (!isPaymentLeadSource(mergedSource)) {
          const roomPricesByYear = await fetchRoomPricesByYear(supabase);
          payload.potential_revenue = resolveLeadPotentialRevenue({
            roomChoice: (updates.room_choice ?? currentLead.room_choice) as string,
            academicYear: (updates.academic_year ?? currentLead.academic_year) as string,
            stayDuration: (updates.stay_duration ?? currentLead.stay_duration) as string,
            source: mergedSource,
            metadata: updates.metadata ?? currentLead.metadata,
            roomPricesByYear,
          });
        }
      }

      const { data, error } = await supabase
        .from("leads")
        .update(payload)
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
      const { data, error } = await supabase
        .from("leads")
        .update({ lead_status: status })
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
