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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("WPForms webhook received");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: WPFormsPayload = await req.json();
    console.log("Payload received:", JSON.stringify(payload));

    // Map WPForms fields to database fields
    const leadData = {
      full_name: payload.full_name || payload.name || "Unknown",
      email: payload.email,
      phone: payload.phone || "",
      source: mapSource(payload.source),
      room_choice: mapRoomChoice(payload.room_choice),
      stay_duration: mapStayDuration(payload.stay_duration),
      lead_status: "new" as const,
      potential_revenue: calculateRevenue(payload.room_choice, payload.stay_duration),
    };

    console.log("Inserting lead:", JSON.stringify(leadData));

    const { data: lead, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error("Error inserting lead:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Lead created successfully:", lead.id);

    // Trigger email notification
    try {
      await supabase.functions.invoke("send-notification", {
        body: { leadId: lead.id, type: "new_lead" },
      });
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
    }

    return new Response(JSON.stringify({ success: true, leadId: lead.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function mapSource(source?: string): "tiktok" | "meta" | "google_ads" | "website" | "whatsapp" | "email" | "referral" {
  const sourceMap: Record<string, "tiktok" | "meta" | "google_ads" | "website" | "whatsapp" | "email" | "referral"> = {
    tiktok: "tiktok",
    meta: "meta",
    facebook: "meta",
    instagram: "meta",
    google: "google_ads",
    google_ads: "google_ads",
    website: "website",
    whatsapp: "whatsapp",
    email: "email",
    referral: "referral",
  };
  return sourceMap[source?.toLowerCase() || ""] || "website";
}

function mapRoomChoice(room?: string): "platinum" | "gold" | "silver" | "bronze" | "standard" {
  const roomMap: Record<string, "platinum" | "gold" | "silver" | "bronze" | "standard"> = {
    platinum: "platinum",
    gold: "gold",
    silver: "silver",
    bronze: "bronze",
    standard: "standard",
  };
  return roomMap[room?.toLowerCase() || ""] || "silver";
}

function mapStayDuration(duration?: string): "51_weeks" | "45_weeks" | "short_stay" {
  const durationMap: Record<string, "51_weeks" | "45_weeks" | "short_stay"> = {
    "51_weeks": "51_weeks",
    "51": "51_weeks",
    "45_weeks": "45_weeks",
    "45": "45_weeks",
    short_stay: "short_stay",
    short: "short_stay",
  };
  return durationMap[duration?.toLowerCase() || ""] || "51_weeks";
}

function calculateRevenue(room?: string, duration?: string): number {
  const roomPrices: Record<string, number> = {
    platinum: 850000,
    gold: 650000,
    silver: 450000,
    bronze: 350000,
    standard: 250000,
  };
  const durationMultipliers: Record<string, number> = {
    "51_weeks": 1,
    "45_weeks": 0.88,
    short_stay: 0.5,
  };
  
  const basePrice = roomPrices[room?.toLowerCase() || "silver"] || 450000;
  const multiplier = durationMultipliers[mapStayDuration(duration)] || 1;
  
  return Math.round(basePrice * multiplier);
}
