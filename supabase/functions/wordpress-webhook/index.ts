import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WordPressFormPayload {
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  form_type?: string;
  lead_type?: string;
  inquiry_type?: string;
  submission_type?: string;
  email_template?: string;
  form_name?: string;
  room_choice?: string;
  studio_type?: string;
  studio_preference?: string;
  stay_duration?: string;
  duration?: string;
  message?: string;
  reason?: string;
  preferred_date?: string;
  preferred_time?: string;
  date?: string;
  time?: string;
  deposit_amount?: number | string;
  payment_status?: string;
  payment_description?: string;
  payment_intent_id?: string;
  amount_pence?: number | string;
  amount_gbp?: number | string;
  friend_name?: string;
  friend_studio_number?: string;
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
    const incomingEmail = String(payload.email || (payload as any)["Email"] || "").trim().toLowerCase();
    const fullName = String(payload.full_name || payload.name || (payload as any)["Name"] || "Unknown Name").trim() || "Unknown Name";
    const rawPhone = String(payload.phone || (payload as any)["Phone"] || "").trim();
    const normalizedPhone = normalizePhone(rawPhone);
    const safeEmail = incomingEmail || `email-missing+${Date.now()}@missing.local`;
    const contactability = incomingEmail ? "contactable" : "email_missing";

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
    const formTypeRaw = String(payload.form_type || detectFormType(payload.form_name || "")).trim().toLowerCase();
    const leadTypeRaw = String(payload.lead_type || "").trim().toLowerCase();
    const inquiryTypeRaw = String(payload.inquiry_type || "").trim().toLowerCase();
    const resolvedLeadType = resolveLeadType(leadTypeRaw, inquiryTypeRaw, formTypeRaw);
    const normalizedLeadType = normalizeLeadType(resolvedLeadType);
    const source = mapFormTypeToSource(resolvedLeadType);
    const resolvedEmailTemplate = resolveEmailTemplate(
      String(payload.email_template || "").trim(),
      normalizedLeadType
    );
    const isPaymentLead = Boolean(payload.payment_intent_id || payload.amount_pence || payload.deposit_amount);
    const paymentIntentId = String(payload.payment_intent_id || "").trim();

    // Capture all metadata
    const metadata: Record<string, any> = {};
    const metadataFields = [
      "form_type", "lead_type", "inquiry_type", "submission_type", "email_template",
      "city_university", "instagram", "tiktok", "snapchat", "youtube", 
      "total_followers", "content_type", "content_type_other", 
      "content_style_summary", "example_links", "worked_with_brands", 
      "urbanhub_content_idea", "can_visit_preston", "collaboration_format", 
      "additional_info", "rooms_count", "start_date", "end_date", "guest_type",
      "preferred_date", "preferred_time",
      "payment_intent_id", "amount_pence", "amount_gbp", "payment_status", "payment_description",
      "studio_type", "studio_preference", "reason", "message", "friend_name", "friend_studio_number"
    ];

    for (const field of metadataFields) {
      if (payload[field]) metadata[field] = payload[field];
    }
    metadata.form_type_raw = formTypeRaw;
    metadata.lead_type_normalized = normalizedLeadType;
    metadata.inquiry_type_raw = inquiryTypeRaw || null;
    metadata.submission_type = payload.submission_type || null;
    metadata.email_template = resolvedEmailTemplate;
    metadata.contactability = contactability;
    metadata.is_payment_lead = isPaymentLead;
    metadata.normalized_phone = normalizedPhone;
    metadata.raw_payload_json = payload;

    // Dedupe checks before inserting
    const duplicateLead = await findDuplicateLead({
      supabase,
      isPaymentLead,
      paymentIntentId,
      email: safeEmail,
      normalizedPhone,
    });
    if (duplicateLead) {
      console.timeEnd("insert-lead");
      console.timeEnd("webhook-total");
      return new Response(JSON.stringify({
        success: true,
        deduped: true,
        leadId: duplicateLead.id,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leadData: any = {
      full_name: fullName,
      email: safeEmail,
      phone: rawPhone || normalizedPhone || "",
      source: source,
      room_choice: mapRoomChoice(payload.room_choice || payload.studio_type || payload.studio_preference || (payload as any)["Choose Studio Type"]) || "silver",
      stay_duration: mapStayDuration(payload.stay_duration || payload.duration || (payload as any)["Stay Duration"]) || "51_weeks",
      lead_status: isPaymentLead ? "converted" : "new",
      academic_year: academicYear,
      landing_page: payload.landing_page || payload.campaign || payload.lp || payload.lp_campaign || (payload as any)["Landing Page"] || (payload as any)["Campaign"] || (payload as any)["LP"] || "",
      is_hot: isPaymentLead,
      metadata: metadata
    };

    // Add contact form specific fields if present
    const message = payload.message || (payload as any)["Message"] || (payload as any)["Comments"] || "";
    if (message) {
      leadData.contact_message = message;
      leadData.contact_reason = payload.reason || payload.form_name || formTypeRaw;
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
    let noteContent = `Form: ${payload.form_name || formTypeRaw}`;
    noteContent += `\nLead Type: ${normalizedLeadType}`;
    noteContent += `\nEmail Template: ${resolvedEmailTemplate}`;
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
    
    if ((resolvedLeadType === "booking" || resolvedLeadType === "callback" || resolvedLeadType === "viewing") && preferredDate) {
      const start = preferredTime 
        ? `${preferredDate}T${preferredTime.includes(":") ? preferredTime : preferredTime + ":00"}`
        : `${preferredDate}T12:00:00`;
      
      tasks.push(supabase.from("calendar_events").insert({
        lead_id: lead.id,
        event_type: (resolvedLeadType === "booking" || resolvedLeadType === "viewing") ? "viewing" : "callback",
        title: `${(resolvedLeadType === "booking" || resolvedLeadType === "viewing") ? "Viewing" : "Callback"}: ${lead.full_name}`,
        start_date: start,
        location: "Urban Hub"
      }));
    }

    // Notification: always trigger for every source, including payment/deposit leads.
    tasks.push(supabase.functions.invoke("send-notification", {
      body: { leadId: lead.id, type: "new_lead" }
    }));

    // Auto-response email for contactable leads
    if (incomingEmail) {
      const autoResponse = buildAutoResponse({
        fullName,
        normalizedLeadType,
        emailTemplate: resolvedEmailTemplate,
        preferredDate: String(payload.preferred_date || payload.date || ""),
        preferredTime: String(payload.preferred_time || payload.time || ""),
        startDate: String(payload.start_date || ""),
        endDate: String(payload.end_date || ""),
        amountPence: Number(payload.amount_pence || payload.deposit_amount || 0),
        paymentIntentId: paymentIntentId,
        studioPreference: String(payload.studio_preference || payload.studio_type || payload.room_choice || ""),
        reason: String(payload.reason || ""),
        message: String(payload.message || ""),
      });

      // Prefer CRM-managed templates when available; fallback to generated body.
      const { data: templateMatch } = await supabase
        .from("email_templates")
        .select("id, name")
        .eq("name", resolvedEmailTemplate)
        .eq("is_active", true)
        .maybeSingle();

      tasks.push(
        supabase.functions.invoke("send-notification", {
          body: {
            type: "email",
            to: incomingEmail,
            ...(templateMatch
              ? {
                  templateId: templateMatch.id,
                  placeholders: autoResponse.placeholders,
                }
              : {
                  subject: autoResponse.subject,
                  bodyHtml: autoResponse.bodyHtml,
                  bodyText: autoResponse.bodyText,
                }),
          },
        })
      );
      tasks.push(
        supabase.from("email_history").insert({
          lead_id: lead.id,
          template_id: templateMatch?.id || null,
          sent_to: incomingEmail,
          subject: autoResponse.subject,
          body_html: autoResponse.bodyHtml,
          sent_by: null,
          metadata: {
            auto_response: true,
            template_key: resolvedEmailTemplate,
            delivery_status: "queued",
            template_source: templateMatch ? "crm_template" : "webhook_fallback",
          },
        })
      );
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
  if (n.includes("secure")) return "pay_deposit";
  if (n.includes("refer")) return "refer_friend";
  return "inquiry";
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
    pay_deposit: "web_secure_booking",
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

function normalizePhone(phone: string): string {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function resolveLeadType(leadType?: string, inquiryType?: string, formType?: string): string {
  if (leadType) return leadType;
  if (inquiryType) return inquiryType;
  if (formType) return formType;
  return "web_contact_form";
}

function normalizeLeadType(raw: string): string {
  const map: Record<string, string> = {
    booking: "viewing",
    viewing: "viewing",
    callback: "callback_request",
    inquiry: "general_inquiry",
    resident_support: "resident_support",
    tourist_inquiry: "short_stay_tourist",
    keyworker_inquiry: "short_stay_keyworker",
    refer_friend: "refer_friend_deposit",
    pay_deposit: "pay_deposit",
    content_creator: "content_creator_application",
  };
  return map[raw] || raw || "web_contact_form";
}

function resolveEmailTemplate(incomingTemplate: string, normalizedLeadType: string): string {
  if (incomingTemplate) return incomingTemplate;
  const map: Record<string, string> = {
    viewing: "viewing_confirmation",
    callback_request: "callback_confirmation",
    general_inquiry: "inquiry_confirmation",
    resident_support: "resident_support_confirmation",
    short_stay_tourist: "shortstay_tourist_confirmation",
    short_stay_keyworker: "shortstay_keyworker_confirmation",
    refer_friend_deposit: "refer_friend_deposit_confirmation",
    pay_deposit: "pay_deposit",
    content_creator_application: "content_creator_confirmation",
  };
  return map[normalizedLeadType] || "inquiry_confirmation";
}

async function findDuplicateLead({
  supabase,
  isPaymentLead,
  paymentIntentId,
  email,
  normalizedPhone,
}: {
  supabase: any;
  isPaymentLead: boolean;
  paymentIntentId: string;
  email: string;
  normalizedPhone: string;
}) {
  if (isPaymentLead && paymentIntentId) {
    const { data } = await supabase
      .from("leads")
      .select("id")
      .contains("metadata", { payment_intent_id: paymentIntentId })
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  const { data: sameDayEmail } = await supabase
    .from("leads")
    .select("id, phone")
    .eq("email", email)
    .gte("created_at", dayStart.toISOString())
    .lte("created_at", dayEnd.toISOString())
    .limit(20);

  const match = (sameDayEmail || []).find((lead: any) => normalizePhone(lead.phone || "") === normalizedPhone);
  return match || null;
}

function buildAutoResponse(args: {
  fullName: string;
  normalizedLeadType: string;
  emailTemplate: string;
  preferredDate: string;
  preferredTime: string;
  startDate: string;
  endDate: string;
  amountPence: number;
  paymentIntentId: string;
  studioPreference: string;
  reason: string;
  message: string;
}) {
  const subjectByTemplate: Record<string, string> = {
    viewing_confirmation: `Viewing Request Received - ${args.preferredDate || "Date TBC"} ${args.preferredTime || ""}`.trim(),
    callback_confirmation: "Callback Request Received - Urban Hub",
    inquiry_confirmation: "We Received Your Inquiry - Urban Hub",
    resident_support_confirmation: "Resident Support Request Logged - Urban Hub",
    shortstay_tourist_confirmation: `Short Stay Request Received - Tourist (${args.startDate || "TBC"} to ${args.endDate || "TBC"})`,
    shortstay_keyworker_confirmation: `Short Stay Request Received - Keyworker (${args.startDate || "TBC"} to ${args.endDate || "TBC"})`,
    refer_friend_deposit_confirmation: "Deposit Received - Refer a Friend Application",
    pay_deposit: "Deposit Payment Received - Booking Secured",
    content_creator_confirmation: "Content Creator Application Received - Urban Hub",
  };
  const subject = subjectByTemplate[args.emailTemplate] || "Thank you for contacting Urban Hub";
  const amountGbp = args.amountPence > 0 ? (args.amountPence / 100).toFixed(2) : "0.00";

  const bodyText =
    `Hello ${args.fullName},\n\n` +
    `We have received your submission (${args.normalizedLeadType.replace(/_/g, " ")}).\n` +
    (args.preferredDate ? `Requested date/time: ${args.preferredDate} ${args.preferredTime}\n` : "") +
    (args.startDate ? `Requested stay: ${args.startDate} to ${args.endDate}\n` : "") +
    (args.studioPreference ? `Studio preference: ${args.studioPreference}\n` : "") +
    (args.reason ? `Reason: ${args.reason}\n` : "") +
    (args.message ? `Message: ${args.message}\n` : "") +
    (args.amountPence > 0 ? `Payment received: GBP ${amountGbp} (Ref: ${args.paymentIntentId || "N/A"})\n` : "") +
    `\nOur team will follow up shortly.\n\nUrban Hub Team`;

  const bodyHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:16px;">
      <h2>${subject}</h2>
      <p>Hello ${args.fullName},</p>
      <p>We have received your submission for <strong>${args.normalizedLeadType.replace(/_/g, " ")}</strong>.</p>
      ${args.preferredDate ? `<p><strong>Requested date/time:</strong> ${args.preferredDate} ${args.preferredTime || ""}</p>` : ""}
      ${args.startDate ? `<p><strong>Requested stay:</strong> ${args.startDate} to ${args.endDate || "TBC"}</p>` : ""}
      ${args.studioPreference ? `<p><strong>Studio preference:</strong> ${args.studioPreference}</p>` : ""}
      ${args.reason ? `<p><strong>Reason:</strong> ${args.reason}</p>` : ""}
      ${args.message ? `<p><strong>Message:</strong> ${args.message}</p>` : ""}
      ${args.amountPence > 0 ? `<p><strong>Payment received:</strong> GBP ${amountGbp}<br/><strong>Reference:</strong> ${args.paymentIntentId || "N/A"}</p>` : ""}
      <p>Our team will follow up shortly.</p>
      <p>Urban Hub Team</p>
    </div>
  `;

  const placeholders: Record<string, string> = {
    lead_name: args.fullName,
    preferred_date: args.preferredDate || "",
    preferred_time: args.preferredTime || "",
    start_date: args.startDate || "",
    end_date: args.endDate || "",
    amount_gbp: amountGbp,
    payment_intent_id: args.paymentIntentId || "",
    studio_preference: args.studioPreference || "",
    reason: args.reason || "",
    message: args.message || "",
    lead_type: args.normalizedLeadType,
  };

  return { subject, bodyHtml, bodyText, placeholders };
}
