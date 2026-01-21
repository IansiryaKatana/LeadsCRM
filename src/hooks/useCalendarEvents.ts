import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface CalendarEvent {
  id: string;
  lead_id: string | null;
  event_type: "viewing" | "callback" | "followup" | "task";
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  google_calendar_id: string | null;
  outlook_calendar_id: string | null;
  reminder_sent: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string };
}

export interface CreateCalendarEventInput {
  lead_id?: string | null;
  event_type: "viewing" | "callback" | "followup" | "task";
  title: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  location?: string;
}

export function useCalendarEvents(leadId?: string, startDate?: Date, endDate?: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["calendar-events", leadId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<CalendarEvent[]> => {
      let query = supabase
        .from("calendar_events")
        .select("*")
        .order("start_date", { ascending: true });

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      if (startDate && endDate) {
        // Query events that start within the date range
        query = query
          .gte("start_date", startDate.toISOString())
          .lte("start_date", endDate.toISOString());
      } else if (!leadId) {
        // If no date range specified and no lead filter, get all events (for calendar page)
        // Limit to reasonable range to avoid performance issues
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const sixMonthsAhead = new Date();
        sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);
        query = query
          .gte("start_date", sixMonthsAgo.toISOString())
          .lte("start_date", sixMonthsAhead.toISOString());
      }

      const { data: eventsData, error: eventsError } = await query;

      if (eventsError) {
        console.error("Error fetching calendar events:", eventsError);
        throw eventsError;
      }

      if (!eventsData || eventsData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = new Set<string>();
      eventsData.forEach(event => {
        if (event.created_by) userIds.add(event.created_by);
      });

      // Fetch profiles
      const profilesMap = new Map<string, { full_name: string }>();
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", Array.from(userIds));

        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.user_id, { full_name: profile.full_name });
          });
        }
      }

      return eventsData.map(event => ({
        ...event,
        profiles: event.created_by ? profilesMap.get(event.created_by) : undefined,
      }));
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      if (variables.lead_id) {
        await queryClient.invalidateQueries({ queryKey: ["calendar-events", variables.lead_id] });
      }

      toast({ title: "Event created successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to create event", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      if (data.lead_id) {
        await queryClient.invalidateQueries({ queryKey: ["calendar-events", data.lead_id] });
      }

      toast({ title: "Event updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update event", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });

      toast({ title: "Event deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete event", description: error.message, variant: "destructive" });
    },
  });
}
