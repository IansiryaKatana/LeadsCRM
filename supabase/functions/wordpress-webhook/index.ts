import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WordPressFormPayload {
  full_name?: string;
  name?: string;
  email: string;
  phone?: string;
  form_type?: string;
  form_name?: string;
  room_choice?: string;
  studio_type?: string;
  stay_duration?: string;
  duration?: string;
  message?: string;
  preferred_date?: string;
  preferred_time?: string;
  date?: string;
  time?: string;
  deposit_amount?: number | string;
  landing_page?: string;
  campaign?: string;
  // Short term stay fields
  guest_type?: string;
  rooms_count?: number | string;
  start_date?: string;
  end_date?: string;
  // Content creator fields
  city_university?: string;
  instagram?: string;
  tiktok?: string;
  snapchat?: string;
  youtube?: string;
  total_followers?: string;
  content_type?: string;
  content_type_other?: string;
  content_style_summary?: string;
  example_links?: string;
  worked_with_brands?: string;
  urbanhub_content_idea?: string;
  can_visit_preston?: string;
  collaboration_format?: string;
  additional_info?: string;
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

    // 1. Parse and normalize payload
    let payload: WordPressFormPayload;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const flatPayload: any = {};
      for (const [key, value] of formData.entries()) {
        flatPayload[key] = value;
      }
      payload = flatPayload;
    } else {
      const rawBody = await req.json();
      if (rawBody.fields) {
        const flat: any = {};
        const fields = Array.isArray(rawBody.fields) ? rawBody.fields : Object.values(rawBody.fields);
        for (const f of fields) {
          const key = f.id || f.name || f.label;
          flat[key] = f.value;
        }
        payload = { ...rawBody, ...flat };
      } else {
        payload = rawBody;
      }
    }

    // Apply mappings for common labels
    const email = payload.email || (payload as any)["Email"];
    const fullName = payload.full_name || payload.name || (payload as any)["Name"] || "Unknown";
    if (!email) throw new Error("Email is required");

    // 2. Fetch settings in one parallel call
    console.time("fetch-settings");
    const { data: settings } = await supabase
      .from("system_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["default_academic_year", "currency"]);
    console.timeEnd("fetch-settings");

    const settingsMap = new Map(settings?.map(s => [s.setting_key, s.setting_value]));
    const academicYear = settingsMap.get("default_academic_year") as string || "2024/2025";
    const currency = settingsMap.get("currency") as { symbol: string } || { symbol: "KES" };

    // 3. Insert lead
    console.time("insert-lead");
    const incomingFormType = payload.form_type || detectFormType(payload.form_name || "");
    const source = mapFormTypeToSource(incomingFormType);
    const isPaymentForm = incomingFormType === "deposit" || incomingFormType === "secure_booking" || incomingFormType === "refer_friend";

    // Capture all metadata
    const metadata: Record<string, any> = {};
    const metadataFields = [
      "city_university", "instagram", "tiktok", "snapchat", "youtube", 
      "total_followers", "content_type", "content_type_other", 
      "content_style_summary", "example_links", "worked_with_brands", 
      "urbanhub_content_idea", "can_visit_preston", "collaboration_format", 
      "additional_info", "rooms_count", "start_date", "end_date", "guest_type",
      "preferred_date", "preferred_time",
      "payment_intent_id", "amount_pence", "studio_preference", "friend_name", "friend_studio_number"
    ];

    for (const field of metadataFields) {
      if (payload[field]) metadata[field] = payload[field];
    }

    const leadData: any = {
      full_name: fullName,
      email: email,
      phone: payload.phone || (payload as any)["Phone"] || "",
      source: source,
      room_choice: mapRoomChoice(payload.room_choice || payload.studio_type || payload.studio_preference || (payload as any)["Choose Studio Type"]) || "silver",
      stay_duration: mapStayDuration(payload.stay_duration || payload.duration || (payload as any)["Stay Duration"]) || "51_weeks",
      lead_status: isPaymentForm ? "converted" : "new",
      academic_year: academicYear,
      landing_page: payload.landing_page || payload.campaign || payload.lp || payload.lp_campaign || (payload as any)["Landing Page"] || (payload as any)["Campaign"] || (payload as any)["LP"] || "",
      is_hot: isPaymentForm,
      metadata: metadata
    };

    // Add contact form specific fields if present
    const message = payload.message || (payload as any)["Message"] || (payload as any)["Comments"] || "";
    if (message) {
      leadData.contact_message = message;
      leadData.contact_reason = payload.reason || payload.form_name || incomingFormType;
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (leadError) throw leadError;
    console.timeEnd("insert-lead");

    // 4. Parallel secondary tasks
    console.time("parallel-tasks");
    const tasks = [];

    // Note creation with all fields
    let noteContent = `Form: ${payload.form_name || incomingFormType}`;
    if (message) noteContent += `\nMessage: ${message}`;
    
    // Add metadata to note for easy viewing in timeline
    if (Object.keys(metadata).length > 0) {
      noteContent += `\n\n--- Submission Details ---`;
      for (const [key, value] of Object.entries(metadata)) {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        noteContent += `\n${label}: ${value}`;
      }
    }
    
    tasks.push(supabase.from("lead_notes").insert({
      lead_id: lead.id,
      note: noteContent
    }));

    // Calendar creation
    const preferredDate = payload.preferred_date || payload.date || (payload as any)["Choose Date"] || payload.start_date;
    const preferredTime = payload.preferred_time || payload.time || (payload as any)["Pick a Time"];
    
    if ((incomingFormType === "booking" || incomingFormType === "callback" || incomingFormType === "viewing") && preferredDate) {
      const start = preferredTime 
        ? `${preferredDate}T${preferredTime.includes(":") ? preferredTime : preferredTime + ":00"}`
        : `${preferredDate}T12:00:00`;
      
      tasks.push(supabase.from("calendar_events").insert({
        lead_id: lead.id,
        event_type: (incomingFormType === "booking" || incomingFormType === "viewing") ? "viewing" : "callback",
        title: `${(incomingFormType === "booking" || incomingFormType === "viewing") ? "Viewing" : "Callback"}: ${lead.full_name}`,
        start_date: start,
        location: "Urban Hub"
      }));
    }

    // Notification
    if (!isDeposit) {
      tasks.push(supabase.functions.invoke("send-notification", {
        body: { leadId: lead.id, type: "new_lead" }
      }));
    }

    await Promise.allSettled(tasks);
    console.timeEnd("parallel-tasks");
    console.timeEnd("webhook-total");

    return new Response(JSON.stringify({ success: true, leadId: lead.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});

function detectFormType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("book") || n.includes("viewing")) return "booking";
  if (n.includes("callback")) return "callback";
  if (n.includes("deposit")) return "deposit";
  if (n.includes("tourist")) return "tourist_inquiry";
  if (n.includes("keyworker")) return "keyworker_inquiry";
  if (n.includes("creator")) return "content_creator";
  if (n.includes("support")) return "resident_support";
  if (n.includes("secure")) return "secure_booking";
  if (n.includes("refer")) return "refer_friend";
  return "contact";
}

function mapFormTypeToSource(type: string): string {
  const map: Record<string, string> = { 
    booking: "web_booking", 
    viewing: "web_booking",
    callback: "web_callback", 
    deposit: "web_deposit", 
    contact: "web_contact",
    inquiry: "web_contact",
    resident_support: "web_contact",
    tourist_inquiry: "web_tourist",
    keyworker_inquiry: "web_keyworker",
    content_creator: "web_creator",
    secure_booking: "web_secure_booking",
    refer_friend: "web_refer_friend"
  };
  return map[type] || "web_contact";
}

function mapRoomChoice(r?: string): any {
  if (!r) return null;
  const v = r.toLowerCase();
  if (v.includes("platinum")) return "platinum";
  if (v.includes("gold")) return "gold";
  if (v.includes("silver")) return "silver";
  return "standard";
}

function mapStayDuration(d?: string): any {
  if (!d) return null;
  if (d.includes("51")) return "51_weeks";
  if (d.includes("45")) return "45_weeks";
  return "short_stay";
}
