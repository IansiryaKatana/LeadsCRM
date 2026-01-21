import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventWithLead {
  id: string;
  lead_id: string | null;
  event_type: string;
  title: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  created_by: string | null;
  lead_assigned_to: string | null;
  lead_created_by: string | null;
  lead_full_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Processing event reminders...");

    // Calculate the time 6 hours from now
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const sixHoursFromNowISO = sixHoursFromNow.toISOString();

    // Find events that start in approximately 6 hours (within a 1-hour window to account for cron timing)
    // We check for events between 5.5 and 6.5 hours from now
    const fiveAndHalfHoursFromNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString();
    const sixAndHalfHoursFromNow = new Date(now.getTime() + 6.5 * 60 * 60 * 1000).toISOString();

    // Query events that:
    // 1. Start between 5.5 and 6.5 hours from now
    // 2. Haven't had a reminder sent yet (reminder_sent = false)
    // 3. Are linked to leads (so we can notify the assigned user)
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("calendar_events")
      .select(`
        id,
        lead_id,
        event_type,
        title,
        start_date,
        end_date,
        location,
        created_by,
        reminder_sent,
        leads!inner(
          id,
          full_name,
          assigned_to,
          created_by
        )
      `)
      .gte("start_date", fiveAndHalfHoursFromNow)
      .lte("start_date", sixAndHalfHoursFromNow)
      .eq("reminder_sent", false)
      .not("lead_id", "is", null);

    if (eventsError) {
      console.error("Error fetching upcoming events:", eventsError);
      throw eventsError;
    }

    console.log(`Found ${upcomingEvents?.length || 0} events needing reminders`);

    const notificationsSent: string[] = [];
    const eventsUpdated: string[] = [];

    // Process each event
    for (const event of (upcomingEvents || []) as any[]) {
      const lead = event.leads;
      if (!lead) continue;

      // Determine who to notify:
      // Priority: assigned_to > created_by > event creator
      const userIdToNotify = lead.assigned_to || lead.created_by || event.created_by;
      
      if (!userIdToNotify) {
        console.log(`No user to notify for event ${event.id}`);
        continue;
      }

      // Check if user wants event reminder notifications
      const { data: preferences } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", userIdToNotify)
        .maybeSingle();

      // Check if user has disabled event reminders
      if (preferences && preferences.event_reminder === false) {
        console.log(`User ${userIdToNotify} has disabled event reminder notifications`);
        continue;
      }

      // Format the event time
      const eventDate = new Date(event.start_date);
      const eventTime = eventDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const eventDateStr = eventDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      // Create notification
      const notificationTitle = "Event Reminder";
      const notificationMessage = `${event.title} is scheduled in 6 hours (${eventDateStr} at ${eventTime})${event.location ? ` at ${event.location}` : ""}`;

      const { data: notification, error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: userIdToNotify,
          type: "event_reminder",
          title: notificationTitle,
          message: notificationMessage,
          link: event.lead_id ? `/leads/${event.lead_id}` : "/calendar",
          metadata: {
            event_id: event.id,
            lead_id: event.lead_id,
            event_type: event.event_type,
            start_date: event.start_date,
          },
        })
        .select()
        .single();

      if (notificationError) {
        console.error(`Error creating notification for event ${event.id}:`, notificationError);
        continue;
      }

      notificationsSent.push(notification.id);

      // Mark reminder as sent
      const { error: updateError } = await supabase
        .from("calendar_events")
        .update({ reminder_sent: true })
        .eq("id", event.id);

      if (updateError) {
        console.error(`Error updating reminder_sent for event ${event.id}:`, updateError);
      } else {
        eventsUpdated.push(event.id);
      }

      // Send email if enabled
      if (preferences?.email_enabled !== false) {
        try {
          await supabase.functions.invoke("send-notification", {
            body: {
              userId: userIdToNotify,
              type: "event_reminder",
              subject: notificationTitle,
              message: notificationMessage,
              metadata: {
                event_id: event.id,
                lead_id: event.lead_id,
                event_type: event.event_type,
                start_date: event.start_date,
              },
            },
          });
        } catch (emailError) {
          console.error(`Error sending email for event ${event.id}:`, emailError);
          // Don't fail the whole process if email fails
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventsProcessed: upcomingEvents?.length || 0,
        notificationsSent: notificationsSent.length,
        eventsUpdated: eventsUpdated.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Event reminder processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
