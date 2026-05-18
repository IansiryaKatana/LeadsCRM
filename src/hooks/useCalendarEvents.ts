import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { CalendarEventStatus } from "@/constants/calendarEvents";
import { formatEventNote } from "@/constants/calendarEvents";
import type { FollowUpOutcome, FollowUpType } from "@/types/crm";

export interface CalendarEventLead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  followup_count: number;
}

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
  status: CalendarEventStatus;
  outcome: string | null;
  outcome_notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string };
  leads?: CalendarEventLead | null;
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

export interface ResolveCalendarEventInput {
  id: string;
  leadId: string | null;
  eventType: CalendarEvent["event_type"];
  title: string;
  status: CalendarEventStatus;
  outcome?: string | null;
  outcomeNotes?: string | null;
  logFollowUp?: boolean;
  rescheduleStart?: string;
  rescheduleEnd?: string | null;
}

function mapOutcomeToFollowUp(
  eventType: CalendarEvent["event_type"],
  outcome: string | null | undefined,
  status: CalendarEventStatus
): FollowUpOutcome {
  if (status === "no_show") return "no_answer";
  switch (outcome) {
    case "interested":
    case "wants_to_apply":
      return "interested";
    case "not_interested":
      return "not_interested";
    case "contacted":
    case "done":
      return "contacted";
    case "no_answer":
      return "no_answer";
    case "voicemail":
      return "voicemail";
    case "callback_requested":
      return "callback_requested";
    default:
      return eventType === "viewing" ? "interested" : "contacted";
  }
}

function mapEventTypeToFollowUpType(eventType: CalendarEvent["event_type"]): FollowUpType {
  if (eventType === "viewing") return "in_person";
  return "call";
}

export function useCalendarEvents(leadId?: string, startDate?: Date, endDate?: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["calendar-events", leadId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<CalendarEvent[]> => {
      let query = supabase
        .from("calendar_events")
        .select(
          `
          *,
          leads (
            id,
            full_name,
            email,
            phone,
            followup_count
          )
        `
        )
        .order("start_date", { ascending: true });

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      if (startDate && endDate) {
        query = query
          .gte("start_date", startDate.toISOString())
          .lte("start_date", endDate.toISOString());
      } else if (!leadId) {
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

      const userIds = new Set<string>();
      eventsData.forEach((event) => {
        if (event.created_by) userIds.add(event.created_by);
      });

      const profilesMap = new Map<string, { full_name: string }>();
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", Array.from(userIds));

        profilesData?.forEach((profile) => {
          profilesMap.set(profile.user_id, { full_name: profile.full_name });
        });
      }

      return eventsData.map((event) => ({
        ...event,
        status: (event.status as CalendarEventStatus) || "scheduled",
        profiles: event.created_by ? profilesMap.get(event.created_by) : undefined,
        leads: Array.isArray(event.leads) ? event.leads[0] : event.leads,
      })) as CalendarEvent[];
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
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      if (variables.lead_id) {
        await queryClient.invalidateQueries({
          queryKey: ["calendar-events", variables.lead_id],
        });
      }
      toast({ title: "Event created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Failed to update event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useResolveCalendarEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ResolveCalendarEventInput) => {
      const now = new Date().toISOString();
      const hasNewSlot = !!input.rescheduleStart;
      const finalStatus =
        hasNewSlot && input.status !== "no_show" ? "rescheduled" : input.status;

      const updatePayload: Record<string, unknown> = {
        status: finalStatus,
        outcome: input.outcome ?? null,
        outcome_notes: input.outcomeNotes?.trim() || null,
        completed_at:
          finalStatus !== "scheduled" || hasNewSlot ? now : null,
        completed_by:
          finalStatus !== "scheduled" || hasNewSlot ? user?.id : null,
      };

      const { data: event, error: eventError } = await supabase
        .from("calendar_events")
        .update(updatePayload)
        .eq("id", input.id)
        .select()
        .single();

      if (eventError) throw eventError;

      if (input.leadId) {
        let noteText = formatEventNote(
          {
            event_type: input.eventType,
            title: input.title,
            status: input.status,
            outcome: input.outcome ?? null,
          },
          input.outcomeNotes
        );
        if (hasNewSlot && input.rescheduleStart) {
          noteText += `. Rescheduled to ${new Date(input.rescheduleStart).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          })}`;
        }

        const { error: noteError } = await supabase.from("lead_notes").insert({
          lead_id: input.leadId,
          note: noteText,
          created_by: user?.id,
        });
        if (noteError) console.error("Failed to create lead note:", noteError);

        if (input.logFollowUp && input.status !== "cancelled") {
          const { data: leadData } = await supabase
            .from("leads")
            .select("followup_count")
            .eq("id", input.leadId)
            .single();

          const nextNumber = (leadData?.followup_count || 0) + 1;
          const followUpOutcome = mapOutcomeToFollowUp(
            input.eventType,
            input.outcome,
            input.status
          );
          const followUpType =
            input.eventType === "viewing"
              ? "in_person"
              : input.eventType === "followup"
                ? "call"
                : mapEventTypeToFollowUpType(input.eventType);

          await supabase.from("lead_followups").insert({
            lead_id: input.leadId,
            followup_number: nextNumber,
            followup_type: followUpType,
            followup_date: now,
            outcome: followUpOutcome,
            notes: input.outcomeNotes?.trim() || formatEventNote(
              { event_type: input.eventType, title: input.title, status: input.status, outcome: input.outcome ?? null },
              null
            ),
            created_by: user?.id,
          });
        }
      }

      if (input.rescheduleStart && input.leadId) {
        const { error: newEventError } = await supabase.from("calendar_events").insert({
          lead_id: input.leadId,
          event_type: input.eventType,
          title: input.title,
          description: null,
          start_date: input.rescheduleStart,
          end_date: input.rescheduleEnd ?? null,
          location: "Urban Hub",
          status: "scheduled",
          created_by: user?.id,
        });
        if (newEventError) console.error("Failed to create rescheduled event:", newEventError);
      }

      return event;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      if (data.lead_id) {
        await queryClient.invalidateQueries({ queryKey: ["calendar-events", data.lead_id] });
        await queryClient.invalidateQueries({ queryKey: ["lead-notes", data.lead_id] });
        await queryClient.invalidateQueries({ queryKey: ["lead-followups", data.lead_id] });
        await queryClient.invalidateQueries({ queryKey: ["leads", data.lead_id] });
      }
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Event updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({ title: "Event deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
