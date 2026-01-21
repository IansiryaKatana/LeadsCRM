import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { LeadFollowUp, CreateFollowUpInput } from "@/types/crm";

export function useFollowUps(leadId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lead-followups", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      // Fetch follow-ups
      const { data: followUpsData, error: followUpsError } = await supabase
        .from("lead_followups")
        .select("*")
        .eq("lead_id", leadId)
        .order("followup_number", { ascending: false });

      if (followUpsError) {
        console.error("Error fetching follow-ups:", followUpsError);
        throw followUpsError;
      }

      if (!followUpsData || followUpsData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(followUpsData.map(fu => fu.created_by).filter(Boolean))];
      
      // Fetch profiles for those users
      const profilesMap = new Map<string, { full_name: string }>();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.user_id, { full_name: profile.full_name });
          });
        }
      }

      // Merge profiles with follow-ups
      return followUpsData.map(followUp => ({
        ...followUp,
        profiles: followUp.created_by ? profilesMap.get(followUp.created_by) : undefined,
      })) as (LeadFollowUp & { profiles?: { full_name: string } })[];
    },
    enabled: !!user && !!leadId,
    staleTime: 0, // Always refetch
    refetchOnWindowFocus: true,
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateFollowUpInput) => {
      // Get current follow-up count to determine next number
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .select("followup_count")
        .eq("id", input.leadId)
        .single();

      if (leadError) throw leadError;

      const nextFollowUpNumber = (leadData?.followup_count || 0) + 1;

      const { data, error } = await supabase
        .from("lead_followups")
        .insert({
          lead_id: input.leadId,
          followup_number: nextFollowUpNumber,
          followup_type: input.followupType,
          followup_date: input.followupDate,
          outcome: input.outcome,
          notes: input.notes || null,
          next_action_date: input.nextActionDate || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      // Optimistically update the lead's follow-up count in all query caches
      queryClient.setQueryData(["leads", variables.leadId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          followup_count: (old.followup_count || 0) + 1,
          last_followup_date: variables.followupDate,
          next_followup_date: variables.nextActionDate || old.next_followup_date,
        };
      });

      // Optimistically add follow-up to the list
      queryClient.setQueryData(["lead-followups", variables.leadId], (old: any[] = []) => {
        return [
          {
            ...data,
            profiles: { full_name: "You" }, // Temporary until refetch
          },
          ...old,
        ];
      });

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["lead-followups", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      // Force immediate refetch in background
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["lead-followups", variables.leadId] });
        queryClient.refetchQueries({ queryKey: ["leads", variables.leadId] });
      }, 100);

      toast({ title: "Follow-up recorded successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to record follow-up", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followUpId, leadId }: { followUpId: string; leadId: string }) => {
      const { error } = await supabase
        .from("lead_followups")
        .delete()
        .eq("id", followUpId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-followups", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Follow-up deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete follow-up", description: error.message, variant: "destructive" });
    },
  });
}

export function useCanCloseLead(leadId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["can-close-lead", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("can_close_lead", { _lead_id: leadId });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user && !!leadId,
  });
}

