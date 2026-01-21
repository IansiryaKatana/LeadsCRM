import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WordPressFormPayload {
  // Required fields
  full_name?: string;
  name?: string;
  email: string;
  phone?: string;
  
  // Form type identification
  form_type?: "contact" | "booking" | "callback" | "deposit" | "keyworkers";
  form_name?: string; // Optional: name of the form for logging
  
  // Lead details (optional) - support multiple field name variations
  room_choice?: string;
  studio_type?: string; // Alternative field name for room_choice
  stay_duration?: string;
  duration?: string; // Alternative field name for stay_duration
  source?: string;
  
  // Additional fields that might come from forms
  message?: string;
  preferred_date?: string;
  preferred_time?: string;
  // Keyworkers fields (free text)
  length_of_stay?: string;
  date?: string; // Alternative for preferred_date
  time?: string; // Alternative for preferred_time
  academic_year?: string;
  landing_page?: string; // e.g. "Landing Page A"
  campaign?: string; // e.g. "Google Ads - Brand - UK"
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  
  // For deposit forms - indicates converted lead
  deposit_amount?: number | string; // Can be string like "£99" or number
  payment_status?: string;
  installment_plan?: string; // e.g., "Pay in 3 Installments"
  payment_plan?: string; // Alternative field name for installment_plan
  referral?: boolean | string; // Referral checkbox value
  referrer_full_name?: string; // Referrer's full name
  referrers_full_name?: string; // Alternative field name (with 's)
  referrer_room_number?: string; // Referrer's room number
  referrers_room_number?: string; // Alternative field name (with 's)
  
  // Additional metadata
  [key: string]: unknown; // Allow any additional fields
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("WordPress webhook received");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse payload based on Content-Type - Elementor sends URL-encoded form data
    let payload: WordPressFormPayload;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      // Elementor sends URL-encoded form data
      const formData = await req.formData();
      const flatPayload: Record<string, unknown> = {};
      
      // Convert FormData to flat object using field labels/IDs
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          flatPayload[key] = value.name;
        } else {
          flatPayload[key] = value;
        }
      }
      
      payload = flatPayload as WordPressFormPayload;
      console.log("Parsed URL-encoded payload:", JSON.stringify(payload));
    } else {
      // Try JSON first (WPForms, some Elementor configs)
      try {
        const rawBody: any = await req.json();

        if (!rawBody.email && (Array.isArray(rawBody.fields) || typeof rawBody.fields === "object")) {
          // Elementor Pro webhook format – flatten fields by ID
          const flat: Record<string, unknown> = {};

          const fieldsArray: any[] = Array.isArray(rawBody.fields)
            ? rawBody.fields
            : Object.values(rawBody.fields);

          for (const field of fieldsArray) {
            const id = field.id || field._id || field.name || field.key;
            const value = field.value ?? field.value_raw ?? field.value_html ?? field.default_value;
            if (id && value !== undefined) {
              flat[id] = value;
            }
          }

          // Carry over known top-level props
          if (rawBody.form_name) flat.form_name = rawBody.form_name;
          if (rawBody.form_type) flat.form_type = rawBody.form_type;
          if (rawBody.landing_page) flat.landing_page = rawBody.landing_page;
          if (rawBody.campaign) flat.campaign = rawBody.campaign;
          if (rawBody.utm_source) flat.utm_source = rawBody.utm_source;
          if (rawBody.utm_medium) flat.utm_medium = rawBody.utm_medium;
          if (rawBody.utm_campaign) flat.utm_campaign = rawBody.utm_campaign;

          payload = flat as WordPressFormPayload;
          console.log("Transformed Elementor payload:", JSON.stringify(payload));
        } else {
          payload = rawBody as WordPressFormPayload;
          console.log("Payload received:", JSON.stringify(payload));
        }
      } catch (jsonError) {
        // Fallback: try parsing as URL-encoded string
        try {
          const text = await req.text();
          const params = new URLSearchParams(text);
          const flatPayload: Record<string, unknown> = {};
          for (const [key, value] of params.entries()) {
            flatPayload[key] = value;
          }
          payload = flatPayload as WordPressFormPayload;
          console.log("Parsed URL-encoded string payload:", JSON.stringify(payload));
        } catch (parseError) {
          console.error("Failed to parse payload:", parseError);
          return new Response(
            JSON.stringify({ error: "Invalid payload format" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // Elementor Book Viewing fallback mapping (labels -> expected IDs)
    const anyPayload = payload as any;
    if (!payload.full_name && anyPayload["Name"]) {
      payload.full_name = anyPayload["Name"];
    }
    if (!payload.email && anyPayload["Email"]) {
      payload.email = anyPayload["Email"];
    }
    if (!payload.phone && anyPayload["Phone"]) {
      payload.phone = anyPayload["Phone"];
    }
    if (!payload.studio_type && anyPayload["Choose Studio Type"]) {
      payload.studio_type = anyPayload["Choose Studio Type"];
    }
    if (!payload.preferred_date && anyPayload["Choose Date"]) {
      payload.preferred_date = anyPayload["Choose Date"];
    }
    if (!payload.preferred_time && anyPayload["Pick a Time"]) {
      payload.preferred_time = anyPayload["Pick a Time"];
    }
    if (!payload.message && anyPayload["Message"]) {
      payload.message = anyPayload["Message"];
    }
    if (!payload.form_type && (anyPayload["form type"] || anyPayload["form_type"])) {
      payload.form_type = (anyPayload["form type"] || anyPayload["form_type"]) as any;
    }
    // Deposit form field mappings
    if (!payload.installment_plan && !payload.payment_plan && anyPayload["Payment Plan"]) {
      payload.installment_plan = anyPayload["Payment Plan"];
    }
    if (!payload.referrer_full_name && !payload.referrers_full_name && anyPayload["Referrer's Full Name"]) {
      payload.referrer_full_name = anyPayload["Referrer's Full Name"];
    }
    if (!payload.referrer_room_number && !payload.referrers_room_number && anyPayload["Referrer's Room Number"]) {
      payload.referrer_room_number = anyPayload["Referrer's Room Number"];
    }
    // Also check for "Were you referred by Someone" checkbox
    if (!payload.referral && (anyPayload["Were you referred by Someone"] || anyPayload["Were you referred by someone"])) {
      payload.referral = anyPayload["Were you referred by Someone"] || anyPayload["Were you referred by someone"];
    }
    
    // Validate required fields
    if (!payload.email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine form type and source
    const formType = payload.form_type || detectFormType(payload.form_name || "");
    const source = mapFormTypeToSource(formType);
    
    // For deposit forms, mark as converted
    const isDepositForm = formType === "deposit";
    const leadStatus = isDepositForm ? "converted" : "new";
    
    // Get default academic year from system settings, fallback to calculated default
    let academicYear = payload.academic_year;
    if (!academicYear) {
      const { data: settingsData } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "default_academic_year")
        .single();
      
      if (settingsData?.setting_value) {
        academicYear = settingsData.setting_value as string;
      } else {
        academicYear = getDefaultAcademicYear();
      }
    }

    // Map form fields to database fields
    // Support multiple field name variations
    const roomChoice = payload.room_choice || payload.studio_type;
    const stayDuration = payload.stay_duration || payload.duration;
    const preferredDate = payload.preferred_date || payload.date;
    const preferredTime = payload.preferred_time || payload.time;
    
    // Extract deposit amount (handle both string "£99" and number)
    let depositAmount = 0;
    if (isDepositForm && payload.deposit_amount) {
      if (typeof payload.deposit_amount === "string") {
        // Extract number from string like "£99" or "£99.00" or "99"
        const numericValue = parseFloat(payload.deposit_amount.replace(/[£,\s]/g, ""));
        depositAmount = isNaN(numericValue) ? 0 : numericValue;
      } else {
        depositAmount = payload.deposit_amount;
      }
    }
    
    const leadData: Record<string, unknown> = {
      full_name: payload.full_name || payload.name || "Unknown",
      email: payload.email,
      phone: payload.phone || "",
      source: source,
      room_choice: mapRoomChoice(roomChoice) || "silver",
      stay_duration: mapStayDuration(stayDuration) || "51_weeks",
      lead_status: leadStatus,
      potential_revenue: depositAmount,
      academic_year: academicYear,
      landing_page: payload.landing_page || payload.form_name || null,
      // Contact form specific fields
      contact_reason: formType === "contact" ? (payload as any).reason || null : null,
      contact_message: formType === "contact" ? payload.message || null : null,
      // Keyworkers form specific fields (free text, no enum mapping)
      keyworker_length_of_stay:
        formType === "keyworkers"
          ? (payload.length_of_stay || (payload as any).length_of_stay || (payload as any)["Length of Stay"] || (payload as any)["length of stay"] || stayDuration || null)
          : null,
      keyworker_preferred_date:
        formType === "keyworkers"
          ? (preferredDate || (payload as any)["Choose Date"] || (payload as any)["choose date"] || null)
          : null,
      is_hot: isDepositForm, // Deposit forms are hot leads
    };

    console.log("Inserting lead:", JSON.stringify(leadData));

    // First, ensure the source exists in lead_sources table
    const { data: sourceData, error: sourceError } = await supabase
      .from("lead_sources")
      .select("slug")
      .eq("slug", source)
      .eq("is_active", true)
      .single();

    if (sourceError || !sourceData) {
      console.warn(`Source ${source} not found, attempting to use 'website' as fallback`);
      leadData.source = "website";
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error("Error inserting lead:", error);
      return new Response(
        JSON.stringify({ 
          error: error.message,
          details: error.details,
          hint: error.hint 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Lead created successfully:", lead.id);

    // Add a note if there's additional information from the form
    const paymentPlan = payload.installment_plan || payload.payment_plan;
    const referrerName = payload.referrer_full_name || payload.referrers_full_name;
    const referrerRoom = payload.referrer_room_number || payload.referrers_room_number;
    
    const noteContent = [
      payload.message && `Message: ${payload.message}`,
      preferredDate && `Preferred Date: ${preferredDate}`,
      preferredTime && `Preferred Time: ${preferredTime}`,
      paymentPlan && `Payment Plan: ${paymentPlan}`,
      payload.campaign && `Campaign: ${payload.campaign}`,
      payload.landing_page && `Landing Page: ${payload.landing_page}`,
      payload.utm_source && `UTM Source: ${payload.utm_source}`,
      payload.utm_medium && `UTM Medium: ${payload.utm_medium}`,
      payload.utm_campaign && `UTM Campaign: ${payload.utm_campaign}`,
      payload.referral && (typeof payload.referral === "string" 
        ? `Referral: ${payload.referral}` 
        : `Referral: Yes`),
      referrerName && `Referrer's Full Name: ${referrerName}`,
      referrerRoom && `Referrer's Room Number: ${referrerRoom}`,
      payload.payment_status && `Payment Status: ${payload.payment_status}`,
      isDepositForm && depositAmount > 0 && `Deposit Amount: £${depositAmount}`,
      payload.form_name && `Form: ${payload.form_name}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (noteContent) {
      await supabase.from("lead_notes").insert({
        lead_id: lead.id,
        note: `WordPress Form Submission:\n${noteContent}`,
      });
    }

    // Automatically create calendar event for booking forms with preferred_date and preferred_time
    if ((formType === "booking" || formType === "callback") && preferredDate) {
      try {
        // Parse the date and time
        let startDateTime: string;
        if (preferredTime) {
          // Combine date and time
          const timeStr = preferredTime.includes(":") ? preferredTime : `${preferredTime}:00`;
          startDateTime = `${preferredDate}T${timeStr}`;
        } else {
          // Default to 12:00 PM if no time provided
          startDateTime = `${preferredDate}T12:00:00`;
        }

        // Create calendar event
        const eventTitle = formType === "booking" 
          ? `Viewing: ${lead.full_name}`
          : `Callback: ${lead.full_name}`;

        // Use the lead's assigned_to or created_by for the event creator, or null for system
        const eventCreator = lead.assigned_to || lead.created_by || null;

        const { error: eventError } = await supabase
          .from("calendar_events")
          .insert({
            lead_id: lead.id,
            event_type: formType === "booking" ? "viewing" : "callback",
            title: eventTitle,
            description: `Automatically created from ${payload.form_name || "web form"} submission`,
            start_date: startDateTime,
            end_date: null, // Can be set later if needed
            location: null,
            created_by: eventCreator, // Use lead's assigned user or creator
          });

        if (eventError) {
          console.error("Error creating calendar event:", eventError);
          // Don't fail the webhook if event creation fails
        } else {
          console.log("Calendar event created successfully for lead:", lead.id);
        }
      } catch (eventError) {
        console.error("Error creating calendar event:", eventError);
        // Don't fail the webhook if event creation fails
      }
    }

    // Trigger email notification for new leads (not deposits, as they're already converted)
    if (!isDepositForm) {
      try {
        await supabase.functions.invoke("send-notification", {
          body: { leadId: lead.id, type: "new_lead" },
        });
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId: lead.id,
        formType: formType,
        status: leadStatus 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
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

/**
 * Detect form type from form name if not explicitly provided
 */
function detectFormType(formName: string): "contact" | "booking" | "callback" | "deposit" | "keyworkers" {
  const name = formName.toLowerCase();
  
  if (name.includes("keyworker") || name.includes("key worker") || name.includes("key-workers")) {
    return "keyworkers";
  }
  if (name.includes("deposit") || name.includes("payment") || name.includes("paid")) {
    return "deposit";
  }
  if (name.includes("book") || name.includes("viewing") || name.includes("view")) {
    return "booking";
  }
  if (name.includes("callback") || name.includes("call back") || name.includes("schedule")) {
    return "callback";
  }
  
  return "contact"; // Default to contact form
}

/**
 * Map form type to lead source slug
 */
function mapFormTypeToSource(
  formType: "contact" | "booking" | "callback" | "deposit" | "keyworkers"
): string {
  const sourceMap: Record<string, string> = {
    contact: "web_contact",
    booking: "web_booking",
    callback: "web_callback",
    deposit: "web_deposit",
    keyworkers: "web_keyworkers",
  };
  
  return sourceMap[formType] || "web_contact";
}

/**
 * Map room choice string to valid enum value
 * Handles variations like "Studio Type: Silver" or just "Silver"
 */
function mapRoomChoice(room?: string): "platinum" | "gold" | "silver" | "bronze" | "standard" | null {
  if (!room) return null;
  
  // Normalize: convert to lowercase, remove common prefixes
  const normalized = room.toLowerCase().replace(/^(studio\s*type|room|choice):?\s*/i, "").trim();
  
  const roomMap: Record<string, "platinum" | "gold" | "silver" | "bronze" | "standard"> = {
    platinum: "platinum",
    gold: "gold",
    silver: "silver",
    bronze: "bronze",
    standard: "standard",
  };
  
  return roomMap[normalized] || roomMap[room.toLowerCase()] || null;
}

/**
 * Map stay duration string to valid enum value
 * Handles variations like "45 Weeks", "45 weeks", "45_weeks", etc.
 */
function mapStayDuration(duration?: string): "51_weeks" | "45_weeks" | "short_stay" | null {
  if (!duration) return null;
  
  // Normalize: remove spaces, convert to lowercase, handle underscores
  const normalized = duration.replace(/\s+/g, "_").toLowerCase();
  
  const durationMap: Record<string, "51_weeks" | "45_weeks" | "short_stay"> = {
    "51_weeks": "51_weeks",
    "51": "51_weeks",
    "45_weeks": "45_weeks",
    "45": "45_weeks",
    "45 weeks": "45_weeks",
    "51 weeks": "51_weeks",
    short_stay: "short_stay",
    short: "short_stay",
    "short stay": "short_stay",
  };
  
  return durationMap[normalized] || durationMap[duration.toLowerCase()] || null;
}

/**
 * Get default academic year (current or next year)
 */
function getDefaultAcademicYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth(); // 0-11
  
  // If we're in the second half of the year (July+), use next academic year
  if (month >= 6) {
    return `${currentYear}/${currentYear + 1}`;
  }
  
  // Otherwise use current academic year
  return `${currentYear - 1}/${currentYear}`;
}
