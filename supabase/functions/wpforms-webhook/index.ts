import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WPFormsPayload {
  full_name?: string;
  name?: string;
  email: string;
  phone?: string;
  room_choice?: string;
  stay_duration?: string;
  source?: string;
  form_name?: string;
  preferred_date?: string;
  preferred_time?: string;
  [key: string]: unknown;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.time("webhook-total");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const rawPayload = await req.json();
    console.log("WPForms payload received:", JSON.stringify(rawPayload));

    // Support both direct fields and WPForms nested fields format
    const payload: WPFormsPayload = {
      full_name: rawPayload.full_name || rawPayload.name || rawPayload["Name"] || "Unknown",
      email: rawPayload.email || rawPayload["Email"],
      phone: rawPayload.phone || rawPayload["Phone"] || "",
      room_choice: rawPayload.room_choice || rawPayload["Choose Studio Type"] || rawPayload["Room Choice"],
      stay_duration: rawPayload.stay_duration || rawPayload["Stay Duration"],
      source: rawPayload.source,
      form_name: rawPayload.form_name || "WPForms Submission",
      preferred_date: rawPayload.preferred_date || rawPayload["Choose Date"] || rawPayload["Preferred Date"],
      preferred_time: rawPayload.preferred_time || rawPayload["Pick a Time"] || rawPayload["Preferred Time"],
    };

    if (!payload.email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine form type and source
    const formNameLower = (payload.form_name || "").toLowerCase();
    const isBooking = formNameLower.includes("book") || formNameLower.includes("viewing");
    const isCallback = formNameLower.includes("callback");
    const formType = isBooking ? "booking" : isCallback ? "callback" : "contact";

    // 1. Fetch necessary settings in parallel
    console.time("fetch-settings");
    const { data: settings } = await supabase
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["default_academic_year", "currency"]);
    console.timeEnd("fetch-settings");

    const settingsMap = new Map(settings?.map(s => [s.setting_key, s.setting_value]));
    const academicYear = settingsMap.get("default_academic_year") as string || "2024/2025";
    const currency = settingsMap.get("currency") as { code: string, symbol: string } || { code: "KES", symbol: "KES" };

    // 2. Insert Lead
    console.time("insert-lead");
    const leadData = {
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      source: "web_booking", // Defaulting to web_booking for WPForms
      room_choice: mapRoomChoice(payload.room_choice as string) || "silver",
      stay_duration: mapStayDuration(payload.stay_duration as string) || "51_weeks",
      lead_status: "new",
      academic_year: academicYear,
    };

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (leadError) throw leadError;
    console.timeEnd("insert-lead");

    // 3. Execute secondary tasks in parallel (Notes, Calendar, Notifications)
    console.time("parallel-tasks");
    const secondaryTasks = [];

    // Add note
    secondaryTasks.push(
      supabase.from("lead_notes").insert({
        lead_id: lead.id,
        note: `WPForms Submission (${payload.form_name})\nPreferred Date: ${payload.preferred_date || 'N/A'}\nPreferred Time: ${payload.preferred_time || 'N/A'}`,
      })
    );

    // Create Calendar Event if booking/callback
    if ((isBooking || isCallback) && payload.preferred_date) {
      const startDateTime = payload.preferred_time 
        ? `${payload.preferred_date}T${payload.preferred_time.includes(":") ? payload.preferred_time : payload.preferred_time + ":00"}`
        : `${payload.preferred_date}T12:00:00`;

      secondaryTasks.push(
        supabase.from("calendar_events").insert({
          lead_id: lead.id,
          event_type: isBooking ? "viewing" : "callback",
          title: `${isBooking ? "Viewing" : "Callback"}: ${lead.full_name}`,
          description: `Automatically created from ${payload.form_name}`,
          start_date: startDateTime,
          location: "Urban Hub",
        })
      );
    }

    // Trigger notification
    secondaryTasks.push(
      supabase.functions.invoke("send-notification", {
        body: { leadId: lead.id, type: "new_lead" },
      })
    );

    await Promise.allSettled(secondaryTasks);
    console.timeEnd("parallel-tasks");
    console.timeEnd("webhook-total");

    return new Response(JSON.stringify({ success: true, leadId: lead.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function mapRoomChoice(room?: string): string | null {
  if (!room) return null;
  const r = room.toLowerCase();
  if (r.includes("platinum")) return "platinum";
  if (r.includes("gold")) return "gold";
  if (r.includes("silver")) return "silver";
  if (r.includes("bronze")) return "bronze";
  return "standard";
}

function mapStayDuration(duration?: string): string | null {
  if (!duration) return null;
  if (duration.includes("51")) return "51_weeks";
  if (duration.includes("45")) return "45_weeks";
  return "short_stay";
}
