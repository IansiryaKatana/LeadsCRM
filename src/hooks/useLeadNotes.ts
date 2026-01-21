import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export function useLeadNotes(leadId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lead-notes", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (notesError) {
        console.error("Error fetching notes:", notesError);
        throw notesError;
      }

      if (!notesData || notesData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(notesData.map(note => note.created_by).filter(Boolean))];
      
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

      // Merge profiles with notes
      return notesData.map(note => ({
        ...note,
        profiles: note.created_by ? profilesMap.get(note.created_by) : undefined,
      }));
    },
    enabled: !!user && !!leadId,
    staleTime: 0, // Always refetch
    refetchOnWindowFocus: true,
  });
}

export function useCreateLeadNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ leadId, note }: { leadId: string; note: string }) => {
      const { data, error } = await supabase
        .from("lead_notes")
        .insert({
          lead_id: leadId,
          note,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      // Optimistically add the note to the cache
      queryClient.setQueryData(["lead-notes", variables.leadId], (old: any[] = []) => {
        return [
          {
            ...data,
            profiles: { full_name: "You" }, // Temporary until refetch
          },
          ...old,
        ];
      });

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["lead-notes", variables.leadId] });
      await queryClient.refetchQueries({ queryKey: ["lead-notes", variables.leadId] });

      toast({ title: "Note added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add note", description: error.message, variant: "destructive" });
    },
  });
}
