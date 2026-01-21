import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderLead {
  lead_id: string;
  lead_name: string;
  assigned_to: string | null;
  followup_count: number;
  days_since_last_followup: number;
  next_followup_date: string | null;
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

    console.log("Processing follow-up reminders...");

    // Get overdue follow-ups
    const { data: overdueLeads, error: overdueError } = await supabase
      .rpc("get_overdue_followups");

    if (overdueError) {
      console.error("Error fetching overdue follow-ups:", overdueError);
      throw overdueError;
    }

    console.log(`Found ${overdueLeads?.length || 0} overdue follow-ups`);

    const remindersCreated: string[] = [];
    const notificationsSent: string[] = [];

    // Process each overdue lead
    for (const lead of (overdueLeads || []) as ReminderLead[]) {
      if (!lead.assigned_to) continue; // Skip unassigned leads

      // Check if reminder already exists and not dismissed
      const { data: existingReminder } = await supabase
        .from("followup_reminders")
        .select("id")
        .eq("lead_id", lead.lead_id)
        .eq("dismissed", false)
        .is("sent_at", null)
        .maybeSingle();

      if (existingReminder) {
        console.log(`Reminder already exists for lead ${lead.lead_id}`);
        continue;
      }

      // Determine reminder type
      let reminderType = "interval_reminder";
      if (lead.followup_count === 0) {
        reminderType = "first_followup";
      } else if (lead.days_since_last_followup > 5) {
        reminderType = "overdue";
      }

      // Create reminder record
      const { data: reminder, error: reminderError } = await supabase
        .from("followup_reminders")
        .insert({
          lead_id: lead.lead_id,
          reminder_type: reminderType,
          scheduled_for: new Date().toISOString(),
        })
        .select()
        .single();

      if (reminderError) {
        console.error(`Error creating reminder for lead ${lead.lead_id}:`, reminderError);
        continue;
      }

      remindersCreated.push(reminder.id);

      // Get user notification preferences
      const { data: preferences } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", lead.assigned_to)
        .maybeSingle();

      // Check if user wants this type of notification
      const shouldNotify = !preferences || (
        (reminderType === "first_followup" && preferences.followup_reminder) ||
        (reminderType === "overdue" && preferences.followup_overdue) ||
        (reminderType === "interval_reminder" && preferences.followup_reminder)
      );

      if (!shouldNotify) {
        console.log(`User ${lead.assigned_to} has disabled ${reminderType} notifications`);
        continue;
      }

      // Create notification
      let notificationTitle = "";
      let notificationMessage = "";

      if (reminderType === "first_followup") {
        notificationTitle = "First Follow-Up Required";
        notificationMessage = `${lead.lead_name} requires your first follow-up. Lead was created ${lead.days_since_last_followup} days ago.`;
      } else if (reminderType === "overdue") {
        notificationTitle = "Overdue Follow-Up";
        notificationMessage = `${lead.lead_name} has an overdue follow-up. Last contact was ${lead.days_since_last_followup} days ago (${lead.followup_count}/3 follow-ups completed).`;
      } else {
        notificationTitle = "Follow-Up Reminder";
        notificationMessage = `${lead.lead_name} is ready for follow-up #${lead.followup_count + 1}. Last contact was ${lead.days_since_last_followup} days ago.`;
      }

      const { data: notification, error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: lead.assigned_to,
          type: reminderType === "overdue" ? "followup_overdue" : "followup_reminder",
          title: notificationTitle,
          message: notificationMessage,
          link: `/leads?lead=${lead.lead_id}`,
          metadata: {
            lead_id: lead.lead_id,
            followup_count: lead.followup_count,
            reminder_type: reminderType,
          },
        })
        .select()
        .single();

      if (notificationError) {
        console.error(`Error creating notification for user ${lead.assigned_to}:`, notificationError);
        continue;
      }

      notificationsSent.push(notification.id);

      // Mark reminder as sent
      await supabase
        .from("followup_reminders")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", reminder.id);

      // Send email if enabled
      if (preferences?.email_enabled) {
        try {
          await supabase.functions.invoke("send-notification", {
            body: {
              leadId: lead.lead_id,
              type: reminderType === "overdue" ? "followup_overdue" : "followup_reminder",
              userId: lead.assigned_to,
              message: notificationMessage,
            },
          });
        } catch (emailError) {
          console.error("Email notification failed:", emailError);
        }
      }
    }

    // Process leads that need first follow-up reminder (24-48 hours after creation)
    const { data: newLeads, error: newLeadsError } = await supabase
      .from("leads")
      .select("id, full_name, assigned_to, created_at, followup_count")
      .eq("followup_count", 0)
      .in("lead_status", ["new", "awaiting_outreach"])
      .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .lte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not("assigned_to", "is", null);

    if (!newLeadsError && newLeads) {
      for (const lead of newLeads) {
        // Check if reminder already exists
        const { data: existing } = await supabase
          .from("followup_reminders")
          .select("id")
          .eq("lead_id", lead.id)
          .eq("reminder_type", "first_followup")
          .eq("dismissed", false)
          .maybeSingle();

        if (existing) continue;

        // Create first follow-up reminder
        const { data: reminder } = await supabase
          .from("followup_reminders")
          .insert({
            lead_id: lead.id,
            reminder_type: "first_followup",
            scheduled_for: new Date().toISOString(),
          })
          .select()
          .single();

        if (reminder) {
          // Get preferences
          const { data: prefs } = await supabase
            .from("user_notification_preferences")
            .select("*")
            .eq("user_id", lead.assigned_to)
            .maybeSingle();

          if (!prefs || prefs.followup_reminder) {
            // Create notification
            await supabase
              .from("notifications")
              .insert({
                user_id: lead.assigned_to!,
                type: "followup_reminder",
                title: "First Follow-Up Required",
                message: `${lead.full_name} requires your first follow-up. Lead was created 24+ hours ago.`,
                link: `/leads?lead=${lead.id}`,
                metadata: { lead_id: lead.id, followup_count: 0 },
              });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        remindersCreated: remindersCreated.length,
        notificationsSent: notificationsSent.length,
        overdueLeads: overdueLeads?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Reminder processing error:", error);
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

