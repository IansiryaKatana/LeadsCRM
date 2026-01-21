import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface NotificationRequest {
  leadId?: string;
  type: "new_lead" | "lead_assigned" | "status_change" | "email";
  assignedTo?: string;
  newStatus?: string;
  // For direct email sending
  to?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  // For template-based email sending
  templateId?: string;
  templateName?: string;
  placeholders?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Send notification function called");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { leadId, type, assignedTo, newStatus, to, subject, bodyHtml, bodyText, templateId, templateName, placeholders }: NotificationRequest = await req.json();
    console.log("Notification request:", { leadId, type, assignedTo, newStatus, to, templateId, templateName });

    // Get email from address from system settings
    const { data: emailFromSetting } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "email_from_address")
      .single();
    
    const fromAddress = emailFromSetting?.setting_value as string || "ISKA CRM <noreply@send.portal.urbanhub.uk>";

    // Handle direct email sending (with optional template support)
    if (type === "email" && to) {
      let finalSubject = subject || "";
      let finalBodyHtml = bodyHtml || "";
      let finalBodyText = bodyText || "";

      // If template is provided, fetch and use it
      if (templateId || templateName) {
        let templateQuery = supabase.from("email_templates").select("*");
        
        if (templateId) {
          templateQuery = templateQuery.eq("id", templateId);
        } else if (templateName) {
          templateQuery = templateQuery.eq("name", templateName);
        }

        const { data: template, error: templateError } = await templateQuery.eq("is_active", true).single();

        if (templateError || !template) {
          console.error("Template not found:", templateError);
          return new Response(JSON.stringify({ error: "Email template not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        finalSubject = template.subject;
        finalBodyHtml = template.body_html;
        finalBodyText = template.body_text || "";
      }

      // Replace placeholders in subject and body
      if (placeholders) {
        for (const [key, value] of Object.entries(placeholders)) {
          const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          finalSubject = finalSubject.replace(placeholder, String(value));
          finalBodyHtml = finalBodyHtml.replace(placeholder, String(value));
          finalBodyText = finalBodyText.replace(placeholder, String(value));
        }
      }

      if (!finalSubject || !finalBodyHtml) {
        return new Response(JSON.stringify({ error: "Subject and body are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if RESEND_API_KEY is configured
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error("RESEND_API_KEY is not configured");
        return new Response(JSON.stringify({ error: "Email service is not configured. Please set RESEND_API_KEY secret." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resendClient = new Resend(resendApiKey);

      const emailResponse = await resendClient.emails.send({
        from: fromAddress,
        to: [to],
        subject: finalSubject,
        html: finalBodyHtml,
        text: finalBodyText || undefined,
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ success: true, data: emailResponse }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For other notification types, leadId is required
    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId is required for notification types" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("Lead not found:", leadError);
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin emails for notifications
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["super_admin", "admin", "manager"]);

    const adminUserIds = adminRoles?.map(r => r.user_id) || [];

    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("user_id", adminUserIds);

    const adminEmails = adminProfiles?.map(p => p.email) || [];

    if (adminEmails.length === 0) {
      console.log("No admin emails found for notification");
      return new Response(JSON.stringify({ success: true, message: "No recipients" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notificationSubject = "";
    let htmlContent = "";

    const emailStyle = `
      <style>
        .email-container { font-family: 'Inter Tight', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #51A6FF 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
        .accent-bar { height: 6px; background: #FFD700; }
        .content { padding: 30px; line-height: 1.6; color: #374151; }
        .content h2 { color: #111827; font-size: 20px; margin-top: 0; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #eff6ff; padding-bottom: 10px; margin-bottom: 20px; }
        .info-card { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .info-item { margin-bottom: 10px; font-size: 14px; }
        .info-item strong { color: #3b82f6; width: 140px; display: inline-block; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; background: #51A6FF; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
      </style>
    `;

    switch (type) {
      case "new_lead":
        notificationSubject = `🔔 New Lead: ${lead.full_name}`;
        htmlContent = `
          ${emailStyle}
          <div class="email-container">
            <div class="header"><h1>ISKA CRM</h1></div>
            <div class="accent-bar"></div>
            <div class="content">
              <h2>New Lead Received!</h2>
              <p>A new lead has just entered the system from <strong>${lead.source}</strong>.</p>
              <div class="info-card">
                <div class="info-item"><strong>Name:</strong> ${lead.full_name}</div>
                <div class="info-item"><strong>Email:</strong> ${lead.email}</div>
                <div class="info-item"><strong>Phone:</strong> ${lead.phone}</div>
                <div class="info-item"><strong>Room Choice:</strong> ${lead.room_choice}</div>
                <div class="info-item"><strong>Stay Duration:</strong> ${lead.stay_duration}</div>
                <div class="info-item"><strong>Potential Revenue:</strong> GBP ${lead.potential_revenue.toLocaleString()}</div>
              </div>
              <p>Log in to the CRM to follow up with this lead as soon as possible.</p>
              <div style="text-align: center;">
                <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".supabase.in")}" class="button">View Lead in CRM</a>
              </div>
            </div>
            <div class="footer"><p>&copy; 2026 ISKA CRM System</p></div>
          </div>
        `;
        break;

      case "lead_assigned":
        // Get assigned user's name
        const { data: assignedProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", assignedTo)
          .single();

        notificationSubject = `📋 Lead Assigned: ${lead.full_name}`;
        htmlContent = `
          ${emailStyle}
          <div class="email-container">
            <div class="header"><h1>ISKA CRM</h1></div>
            <div class="accent-bar"></div>
            <div class="content">
              <h2>Lead Assignment Update</h2>
              <p>The following lead has been assigned to <strong>${assignedProfile?.full_name || "Unknown"}</strong>.</p>
              <div class="info-card">
                <div class="info-item"><strong>Lead Name:</strong> ${lead.full_name}</div>
                <div class="info-item"><strong>Assigned To:</strong> ${assignedProfile?.full_name || "Unknown"}</div>
                <div class="info-item"><strong>Email:</strong> ${lead.email}</div>
                <div class="info-item"><strong>Phone:</strong> ${lead.phone}</div>
              </div>
            </div>
            <div class="footer"><p>&copy; 2026 ISKA CRM System</p></div>
          </div>
        `;

        // Also notify the assigned user
        if (assignedProfile?.email) {
          const resendClient = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");
          await resendClient.emails.send({
            from: fromAddress,
            to: [assignedProfile.email],
            subject: `🎯 New Lead Assigned to You: ${lead.full_name}`,
            html: `
              ${emailStyle}
              <div class="email-container">
                <div class="header"><h1>ISKA CRM</h1></div>
                <div class="accent-bar"></div>
                <div class="content">
                  <h2>You Have a New Lead!</h2>
                  <p>Hello ${assignedProfile.full_name}, you have been assigned a new lead to follow up with.</p>
                  <div class="info-card">
                    <div class="info-item"><strong>Name:</strong> ${lead.full_name}</div>
                    <div class="info-item"><strong>Email:</strong> ${lead.email}</div>
                    <div class="info-item"><strong>Phone:</strong> ${lead.phone}</div>
                    <div class="info-item"><strong>Room Choice:</strong> ${lead.room_choice}</div>
                    <div class="info-item"><strong>Potential Revenue:</strong> GBP ${lead.potential_revenue.toLocaleString()}</div>
                  </div>
                  <p>Please reach out to this lead as soon as possible to maximize conversion chance!</p>
                  <div style="text-align: center;">
                    <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".supabase.in")}" class="button">Go to Lead</a>
                  </div>
                </div>
                <div class="footer"><p>&copy; 2026 ISKA CRM System</p></div>
              </div>
            `,
          });
        }
        break;

      case "status_change":
        notificationSubject = `📊 Lead Status Updated: ${lead.full_name}`;
        htmlContent = `
          ${emailStyle}
          <div class="email-container">
            <div class="header"><h1>ISKA CRM</h1></div>
            <div class="accent-bar"></div>
            <div class="content">
              <h2>Lead Status Changed</h2>
              <p>The status for <strong>${lead.full_name}</strong> has been updated.</p>
              <div class="info-card">
                <div class="info-item"><strong>Lead Name:</strong> ${lead.full_name}</div>
                <div class="info-item"><strong>New Status:</strong> ${newStatus || lead.lead_status}</div>
                <div class="info-item"><strong>Email:</strong> ${lead.email}</div>
              </div>
            </div>
            <div class="footer"><p>&copy; 2026 ISKA CRM System</p></div>
          </div>
        `;
        break;
    }

    console.log("Sending email to:", adminEmails);

    const resendClient = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

    const emailResponse = await resendClient.emails.send({
      from: fromAddress,
      to: adminEmails,
      subject: notificationSubject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Notification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
