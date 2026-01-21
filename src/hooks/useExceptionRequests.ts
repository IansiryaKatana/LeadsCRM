import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ExceptionRequest {
  id: string;
  lead_id: string;
  requested_by: string;
  reason: string;
  justification: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExceptionRequestInput {
  lead_id: string;
  reason: string;
  justification?: string;
}

export function useExceptionRequests(leadId?: string) {
  const { user, hasElevatedRole } = useAuth();

  return useQuery({
    queryKey: ["exception-requests", leadId],
    queryFn: async (): Promise<ExceptionRequest[]> => {
      let query = supabase
        .from("lead_exception_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ExceptionRequest[];
    },
    enabled: !!user,
  });
}

export function usePendingExceptionRequests() {
  const { user, hasElevatedRole } = useAuth();

  return useQuery({
    queryKey: ["exception-requests", "pending"],
    queryFn: async (): Promise<ExceptionRequest[]> => {
      const { data, error } = await supabase
        .from("lead_exception_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ExceptionRequest[];
    },
    enabled: !!user && hasElevatedRole,
  });
}

export function useCreateExceptionRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateExceptionRequestInput) => {
      const { data, error } = await supabase
        .from("lead_exception_requests")
        .insert({
          lead_id: input.lead_id,
          requested_by: user?.id || "",
          reason: input.reason,
          justification: input.justification || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data as ExceptionRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["exception-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useReviewExceptionRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      reviewNotes,
    }: {
      requestId: string;
      status: "approved" | "rejected";
      reviewNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from("lead_exception_requests")
        .update({
          status,
          reviewed_by: user?.id || "",
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data as ExceptionRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["exception-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      
      // If approved, allow closing the lead
      if (data.status === "approved") {
        queryClient.invalidateQueries({ queryKey: ["leads", data.lead_id] });
      }
    },
  });
}

