export type LeadStatus = 
  | "new"
  | "awaiting_outreach"
  | "low_engagement"
  | "high_interest"
  | "converted"
  | "closed";

// LeadSource is now a string (slug) that references lead_sources table
// Use useLeadSources() hook to get source metadata
export type LeadSource = string;

export type RoomChoice = 
  | "silver"
  | "bronze"
  | "platinum"
  | "gold"
  | "standard";

export type StayDuration = 
  | "45_weeks"
  | "51_weeks"
  | "short_stay";

export type UserRole = 
  | "super_admin"
  | "admin"
  | "manager"
  | "salesperson"
  | "viewer";

export interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  source: LeadSource;
  room_choice: RoomChoice;
  stay_duration: StayDuration;
  lead_status: LeadStatus;
  potential_revenue: number;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_hot: boolean;
  landing_page?: string | null;
  contact_reason?: string | null;
  contact_message?: string | null;
  keyworker_length_of_stay?: string | null;
  keyworker_preferred_date?: string | null;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  note: string;
  created_by: string;
  created_at: string;
}

export type FollowUpType = 
  | "call"
  | "email"
  | "whatsapp"
  | "in_person"
  | "other";

export type FollowUpOutcome = 
  | "contacted"
  | "no_answer"
  | "voicemail"
  | "not_interested"
  | "interested"
  | "callback_requested"
  | "wrong_contact_info";

export interface LeadFollowUp {
  id: string;
  lead_id: string;
  followup_number: number;
  followup_type: FollowUpType;
  followup_date: string;
  outcome: FollowUpOutcome;
  notes: string | null;
  next_action_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateFollowUpInput {
  leadId: string;
  followupType: FollowUpType;
  followupDate: string;
  outcome: FollowUpOutcome;
  notes?: string;
  nextActionDate?: string;
}

export const FOLLOWUP_TYPE_CONFIG: Record<FollowUpType, { label: string; icon: string }> = {
  call: { label: "Call", icon: "📞" },
  email: { label: "Email", icon: "📧" },
  whatsapp: { label: "WhatsApp", icon: "💬" },
  in_person: { label: "In-Person", icon: "👤" },
  other: { label: "Other", icon: "📋" },
};

export const FOLLOWUP_OUTCOME_CONFIG: Record<FollowUpOutcome, { label: string; icon: string; color: string }> = {
  contacted: { label: "Contacted Successfully", icon: "✅", color: "text-success" },
  no_answer: { label: "No Answer", icon: "⚠️", color: "text-warning" },
  voicemail: { label: "Voicemail Left", icon: "📞", color: "text-primary" },
  not_interested: { label: "Not Interested", icon: "❌", color: "text-destructive" },
  interested: { label: "Interested, Needs More Info", icon: "💡", color: "text-success" },
  callback_requested: { label: "Callback Requested", icon: "📅", color: "text-primary" },
  wrong_contact_info: { label: "Wrong Contact Info", icon: "❌", color: "text-destructive" },
};

export interface AuditTrail {
  id: string;
  lead_id: string;
  action: string;
  user_id: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  awaitingOutreach: number;
  lowEngagement: number;
  highInterest: number;
  converted: number;
  closed: number;
  totalRevenue: number;
  forecastRevenue: number;
  conversionRate: number;
}

export interface ChannelPerformance {
  source: LeadSource;
  count: number;
  percentage: number;
  revenue: number;
}

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  new: { label: "New Lead", color: "text-primary-foreground", bgColor: "bg-primary/80" },
  awaiting_outreach: { label: "Awaiting Outreach", color: "text-warning-foreground", bgColor: "bg-warning/80" },
  low_engagement: { label: "Low Engagement", color: "text-muted-foreground", bgColor: "bg-muted/80" },
  high_interest: { label: "High Interest", color: "text-success-foreground", bgColor: "bg-success/80" },
  converted: { label: "Converted", color: "text-success-foreground", bgColor: "bg-success" },
  closed: { label: "Closed", color: "text-destructive-foreground", bgColor: "bg-destructive/80" },
};

// LEAD_SOURCE_CONFIG is deprecated - use useLeadSources() hook instead
// This is kept for backward compatibility during migration
export const LEAD_SOURCE_CONFIG: Record<string, { label: string; icon: string }> = {
  tiktok: { label: "TikTok", icon: "🎵" },
  meta: { label: "Meta Ads", icon: "📘" },
  google_ads: { label: "Google Ads", icon: "🔍" },
  website: { label: "Website", icon: "🌐" },
  whatsapp: { label: "WhatsApp", icon: "💬" },
  email: { label: "Email", icon: "📧" },
  referral: { label: "Referral", icon: "👥" },
};

// Helper function to get source config (fallback to default if not found)
export function getSourceConfig(source: string, sources?: Array<{ slug: string; name: string; icon: string }>) {
  if (sources) {
    const found = sources.find(s => s.slug === source);
    if (found) {
      return { label: found.name, icon: found.icon };
    }
  }
  // Fallback to old config
  return LEAD_SOURCE_CONFIG[source] || { label: source, icon: "📋" };
}

export const ROOM_CHOICE_CONFIG: Record<RoomChoice, { label: string; basePrice: number }> = {
  platinum: { label: "Platinum", basePrice: 8500 },
  gold: { label: "Gold", basePrice: 7000 },
  silver: { label: "Silver", basePrice: 5500 },
  bronze: { label: "Rhodium", basePrice: 4500 },
  standard: { label: "Rhodium Plus", basePrice: 3500 },
};

export const STAY_DURATION_CONFIG: Record<StayDuration, { label: string; multiplier: number }> = {
  "51_weeks": { label: "51 Weeks", multiplier: 1.0 },
  "45_weeks": { label: "45 Weeks", multiplier: 0.88 },
  "short_stay": { label: "Short Stay", multiplier: 0.4 },
};
