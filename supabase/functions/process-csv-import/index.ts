import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CSVRow {
  full_name: string;
  email: string;
  phone: string;
  source?: string;
  room_choice?: string;
  stay_duration?: string;
  lead_status?: string;
  notes?: string;
  latest_comment?: string;
  academic_year?: string;
  estimated_revenue?: number;
  date_of_inquiry?: string;
  landing_page?: string;
  contact_reason?: string;
  contact_message?: string;
  keyworker_length_of_stay?: string;
  keyworker_preferred_date?: string;
  referrer_full_name?: string;
  referrer_room_number?: string;
  payment_plan?: string;
}

interface ImportRequest {
  rows: CSVRow[];
  importId: string;
  userId: string;
  academicYear?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("CSV import processing started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { rows, importId, userId, academicYear = "2025/2026" }: ImportRequest = await req.json();
    console.log(`Processing ${rows.length} rows for import ${importId}, academic year: ${academicYear}`);

    // Update import status to processing
    await supabase
      .from("lead_imports")
      .update({ status: "processing" })
      .eq("id", importId);

    // Fetch all valid lead sources from database
    const { data: validSources, error: sourcesError } = await supabase
      .from("lead_sources")
      .select("slug")
      .eq("is_active", true);

    const [{ data: roomPricesSetting }, { data: academicYearsSetting }] = await Promise.all([
      supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "room_prices")
        .maybeSingle(),
      supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "academic_years")
        .maybeSingle(),
    ]);

    const configuredAcademicYears = Array.isArray(academicYearsSetting?.setting_value)
      ? (academicYearsSetting.setting_value as string[])
      : [academicYear];
    const roomPricesByYear = normalizeRoomPricesByYear(
      roomPricesSetting?.setting_value,
      configuredAcademicYears,
    );
    
    const validSourceSlugs = new Set(validSources?.map(s => s.slug) || []);
    console.log(`Valid lead sources: ${Array.from(validSourceSlugs).join(", ")}`);

    // Process and validate all rows first
    const validLeads: any[] = [];
    const leadNotes: { leadIndex: number; note: string }[] = [];
    const errors: { row: number; error: string }[] = [];
    let failCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const emailLower = row.email?.toLowerCase()?.trim() || "";
      const phone = row.phone || "";

      // Validate email format (only basic validation, allow duplicates)
      if (!row.email || !isValidEmail(row.email)) {
        errors.push({ row: i + 1, error: "Invalid email format" });
        failCount++;
        continue;
      }

      const mappedStatus = mapStatus(row.lead_status);
      const roomChoice = mapRoomChoice(row.room_choice);
      const stayDuration = mapStayDuration(row.stay_duration);
      
      const mappedSource = mapSource(row.source);
      const finalSource = validSourceSlugs.has(mappedSource) ? mappedSource : "website";
      const isPaymentSource =
        finalSource === "web_urban_hub_payment" || finalSource === "web_deposit";

      const potentialRevenue = isPaymentSource
        ? (row.estimated_revenue || 0)
        : row.estimated_revenue ||
          calculatePotentialRevenue(roomChoice, roomPricesByYear, academicYear);

      // Map source and validate it exists in database
      
      if (!validSourceSlugs.has(mappedSource)) {
        console.warn(`Source "${mappedSource}" not found in database, using "website" as fallback for row ${i + 1}`);
      }

      const leadData = {
        full_name: row.full_name || "Unknown",
        email: emailLower,
        phone: phone,
        source: finalSource,
        room_choice: roomChoice,
        stay_duration: stayDuration,
        lead_status: mappedStatus,
        potential_revenue: potentialRevenue,
        created_by: userId,
        academic_year: academicYear,
        created_at: row.date_of_inquiry ? parseDate(row.date_of_inquiry) : new Date().toISOString(),
        landing_page: row.landing_page || null,
        contact_reason: row.contact_reason || null,
        contact_message: row.contact_message || null,
        keyworker_length_of_stay: row.keyworker_length_of_stay || null,
        keyworker_preferred_date: row.keyworker_preferred_date || null,
      };

      validLeads.push(leadData);
      
      // Store note info for later (including referrer and payment plan)
      const noteParts: string[] = [];
      if (row.notes && row.notes !== "<em>No comments</em>" && row.notes.trim()) {
        noteParts.push(row.notes);
      }
      if (row.latest_comment && row.latest_comment.trim()) {
        noteParts.push(row.latest_comment);
      }
      if (row.referrer_full_name) {
        noteParts.push(`Referrer: ${row.referrer_full_name}${row.referrer_room_number ? ` (Room: ${row.referrer_room_number})` : ""}`);
      }
      if (row.payment_plan) {
        noteParts.push(`Payment Plan: ${row.payment_plan}`);
      }
      
      if (noteParts.length > 0) {
        leadNotes.push({ leadIndex: validLeads.length - 1, note: noteParts.join("\n") });
      }
    }

    console.log(`Validated ${validLeads.length} leads, ${failCount} failed validation`);

    // Batch insert leads (chunks of 100)
    let successCount = 0;
    const insertedLeadIds: string[] = [];
    const BATCH_SIZE = 100;

    for (let i = 0; i < validLeads.length; i += BATCH_SIZE) {
      const batch = validLeads.slice(i, i + BATCH_SIZE);
      const { data: inserted, error } = await supabase
        .from("leads")
        .insert(batch)
        .select("id");

      if (error) {
        console.error(`Batch insert error at index ${i}:`, error.message);
        failCount += batch.length;
        for (let j = 0; j < batch.length; j++) {
          errors.push({ row: i + j + 1, error: error.message });
        }
      } else if (inserted) {
        successCount += inserted.length;
        insertedLeadIds.push(...inserted.map(l => l.id));
      }
    }

    console.log(`Inserted ${successCount} leads`);

    // Batch insert notes
    if (leadNotes.length > 0 && insertedLeadIds.length > 0) {
      const notesToInsert = leadNotes
        .filter(n => insertedLeadIds[n.leadIndex])
        .map(n => ({
          lead_id: insertedLeadIds[n.leadIndex],
          note: n.note,
          created_by: userId,
        }));

      if (notesToInsert.length > 0) {
        for (let i = 0; i < notesToInsert.length; i += BATCH_SIZE) {
          const batch = notesToInsert.slice(i, i + BATCH_SIZE);
          await supabase.from("lead_notes").insert(batch);
        }
        console.log(`Inserted ${notesToInsert.length} notes`);
      }
    }

    // Update import record with results
    await supabase
      .from("lead_imports")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        successful_rows: successCount,
        failed_rows: failCount,
        error_log: errors.length > 0 ? errors.slice(0, 100) : null,
      })
      .eq("id", importId);

    console.log(`Import completed: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        successCount,
        failCount,
        errors: errors.slice(0, 10),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("CSV import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function parseDate(dateStr: string): string {
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {}
  return new Date().toISOString();
}

function mapSource(
  source?: string,
): "tiktok" | "meta" | "google_ads" | "website" | "whatsapp" | "email" | "referral" | "web_contact" | "web_booking" | "web_callback" | "web_deposit" {
  const sourceMap: Record<
    string,
    "tiktok" | "meta" | "google_ads" | "website" | "whatsapp" | "email" | "referral" | "web_contact" | "web_booking" | "web_callback" | "web_deposit"
  > = {
    tiktok: "tiktok",
    meta: "meta",
    "meta ads": "meta",
    facebook: "meta",
    google: "google_ads",
    "google ads": "google_ads",
    google_ads: "google_ads",
    website: "website",
    "web - contact form": "web_contact",
    "web - book viewing": "web_booking",
    "web - schedule callback": "web_callback",
    "web - deposit payment": "web_deposit",
    whatsapp: "whatsapp",
    email: "email",
    "email marketing": "email",
    referral: "referral",
    referrals: "referral",
  };
  return sourceMap[source?.toLowerCase()?.trim() || ""] || "website";
}

function mapStatus(status?: string): "new" | "awaiting_outreach" | "low_engagement" | "high_interest" | "converted" | "closed" {
  const statusMap: Record<string, "new" | "awaiting_outreach" | "low_engagement" | "high_interest" | "converted" | "closed"> = {
    new: "new",
    "new lead": "new",
    "awaiting outreach": "awaiting_outreach",
    awaiting_outreach: "awaiting_outreach",
    cold: "low_engagement",
    "low engagement": "low_engagement",
    low_engagement: "low_engagement",
    warm: "high_interest",
    hot: "high_interest",
    "high interest": "high_interest",
    high_interest: "high_interest",
    converted: "converted",
    closed: "closed",
    dead: "closed",
    lost: "closed",
  };
  return statusMap[status?.toLowerCase()?.trim() || ""] || "new";
}

function mapRoomChoice(room?: string): "platinum" | "gold" | "silver" | "bronze" | "standard" {
  const roomMap: Record<string, "platinum" | "gold" | "silver" | "bronze" | "standard"> = {
    platinum: "platinum",
    "platinum studio": "platinum",
    gold: "gold",
    "gold studio": "gold",
    silver: "silver",
    "silver studio": "silver",
    bronze: "bronze",
    rhodium: "bronze",
    standard: "standard",
    "rhodium plus": "standard",
    "not specified": "silver",
  };
  return roomMap[room?.toLowerCase()?.trim() || ""] || "silver";
}

function mapStayDuration(duration?: string): "51_weeks" | "45_weeks" | "short_stay" {
  const durationMap: Record<string, "51_weeks" | "45_weeks" | "short_stay"> = {
    "51_weeks": "51_weeks",
    "51 weeks": "51_weeks",
    "51": "51_weeks",
    "long-term stay": "51_weeks",
    "long term stay": "51_weeks",
    "long term": "51_weeks",
    "45_weeks": "45_weeks",
    "45 weeks": "45_weeks",
    "45": "45_weeks",
    short_stay: "short_stay",
    "short stay": "short_stay",
    short: "short_stay",
    "not specified": "51_weeks",
  };
  return durationMap[duration?.toLowerCase()?.trim() || ""] || "51_weeks";
}

function calculatePotentialRevenue(
  room: string,
  roomPricesByYear: Record<string, Record<string, number>>,
  academicYear: string,
): number {
  const yearPrices =
    roomPricesByYear[academicYear] ||
    roomPricesByYear[Object.keys(roomPricesByYear).sort().at(-1) || ""] ||
    {
      platinum: 8500,
      gold: 7000,
      silver: 5500,
      bronze: 4500,
      standard: 3500,
    };

  return yearPrices[room] || yearPrices.silver || 5500;
}

function normalizeRoomPricesByYear(
  raw: unknown,
  academicYears: string[],
): Record<string, Record<string, number>> {
  const defaultPrices = {
    platinum: 8500,
    gold: 7000,
    silver: 5500,
    bronze: 4500,
    standard: 3500,
  };

  if (raw && typeof raw === "object" && !Array.isArray(raw) && typeof (raw as Record<string, unknown>).platinum === "number") {
    const flat = raw as Record<string, number>;
    return Object.fromEntries(academicYears.map((year) => [year, { ...flat }]));
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return Object.fromEntries(academicYears.map((year) => [year, { ...defaultPrices }]));
  }

  const record = raw as Record<string, Record<string, number>>;
  const yearKeys = Object.keys(record).filter((key) => /^\d{4}\/\d{4}$/.test(key));
  const fallbackYear = yearKeys.sort().at(-1);
  const fallbackPrices = fallbackYear ? record[fallbackYear] : defaultPrices;
  const result: Record<string, Record<string, number>> = {};

  for (const year of academicYears) {
    result[year] = yearKeys.includes(year) ? record[year] : { ...fallbackPrices };
  }

  return result;
}
