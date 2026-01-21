import { 
  Lead, 
  LeadSource, 
  LeadStatus, 
  RoomChoice, 
  StayDuration,
  DashboardStats,
  ChannelPerformance,
  User
} from "@/types/crm";

const generateId = () => Math.random().toString(36).substring(2, 15);

const leadSources: LeadSource[] = ["tiktok", "meta", "google_ads", "website", "whatsapp", "email", "referral"];
const leadStatuses: LeadStatus[] = ["new", "awaiting_outreach", "low_engagement", "high_interest", "converted", "closed"];
const roomChoices: RoomChoice[] = ["platinum", "gold", "silver", "bronze", "standard"];
const stayDurations: StayDuration[] = ["51_weeks", "45_weeks", "short_stay"];

const names = [
  "James Mwangi", "Amara Okonkwo", "Fatima Hassan", "David Kimani", "Grace Njeri",
  "Mohamed Ali", "Sarah Wanjiku", "Peter Ochieng", "Lucy Akinyi", "John Kariuki",
  "Esther Muthoni", "Brian Otieno", "Mary Wambui", "Samuel Kiprop", "Janet Achieng",
  "Michael Njoroge", "Catherine Wairimu", "Daniel Mutua", "Rose Nyambura", "Kevin Omondi"
];

const calculateRevenue = (room: RoomChoice, duration: StayDuration): number => {
  const roomPrices: Record<RoomChoice, number> = {
    platinum: 8500,
    gold: 7000,
    silver: 5500,
    bronze: 4500,
    standard: 3500,
  };
  const durationMultipliers: Record<StayDuration, number> = {
    "51_weeks": 1.0,
    "45_weeks": 0.88,
    "short_stay": 0.4,
  };
  return roomPrices[room] * durationMultipliers[duration];
};

export const generateMockLeads = (count: number = 50): Lead[] => {
  return Array.from({ length: count }, (_, i) => {
    const room = roomChoices[Math.floor(Math.random() * roomChoices.length)];
    const duration = stayDurations[Math.floor(Math.random() * stayDurations.length)];
    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    return {
      id: generateId(),
      full_name: names[i % names.length],
      email: `${names[i % names.length].toLowerCase().replace(" ", ".")}@email.com`,
      phone: `+254 7${Math.floor(Math.random() * 100000000).toString().padStart(8, "0")}`,
      source: leadSources[Math.floor(Math.random() * leadSources.length)],
      room_choice: room,
      stay_duration: duration,
      lead_status: leadStatuses[Math.floor(Math.random() * leadStatuses.length)],
      potential_revenue: calculateRevenue(room, duration),
      assigned_to: Math.random() > 0.3 ? generateId() : null,
      created_by: generateId(),
      created_at: createdAt.toISOString(),
      updated_at: new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_hot: Math.random() > 0.8,
    };
  });
};

export const mockLeads = generateMockLeads(50);

export const calculateDashboardStats = (leads: Lead[]): DashboardStats => {
  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.lead_status] = (acc[lead.lead_status] || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus, number>);

  const convertedLeads = leads.filter(l => l.lead_status === "converted");
  const totalRevenue = convertedLeads.reduce((sum, l) => sum + l.potential_revenue, 0);
  const forecastRevenue = leads
    .filter(l => l.lead_status === "high_interest")
    .reduce((sum, l) => sum + l.potential_revenue * 0.7, 0);

  return {
    totalLeads: leads.length,
    newLeads: statusCounts.new || 0,
    awaitingOutreach: statusCounts.awaiting_outreach || 0,
    lowEngagement: statusCounts.low_engagement || 0,
    highInterest: statusCounts.high_interest || 0,
    converted: statusCounts.converted || 0,
    closed: statusCounts.closed || 0,
    totalRevenue,
    forecastRevenue,
    conversionRate: leads.length > 0 ? ((statusCounts.converted || 0) / leads.length) * 100 : 0,
  };
};

export const calculateChannelPerformance = (leads: Lead[]): ChannelPerformance[] => {
  const channelData = leads.reduce((acc, lead) => {
    if (!acc[lead.source]) {
      acc[lead.source] = { count: 0, revenue: 0 };
    }
    acc[lead.source].count += 1;
    if (lead.lead_status === "converted") {
      acc[lead.source].revenue += lead.potential_revenue;
    }
    return acc;
  }, {} as Record<LeadSource, { count: number; revenue: number }>);

  const total = leads.length;

  return Object.entries(channelData).map(([source, data]) => ({
    source: source as LeadSource,
    count: data.count,
    percentage: total > 0 ? (data.count / total) * 100 : 0,
    revenue: data.revenue,
  })).sort((a, b) => b.count - a.count);
};

export const mockUsers: User[] = [
  { id: "1", email: "admin@urbanhub.com", full_name: "Ian Katana", role: "super_admin", created_at: new Date().toISOString() },
  { id: "2", email: "sales1@urbanhub.com", full_name: "Grace Njeri", role: "salesperson", created_at: new Date().toISOString() },
  { id: "3", email: "sales2@urbanhub.com", full_name: "Peter Ochieng", role: "salesperson", created_at: new Date().toISOString() },
  { id: "4", email: "manager@urbanhub.com", full_name: "Sarah Wanjiku", role: "manager", created_at: new Date().toISOString() },
];

export const mockDashboardStats = calculateDashboardStats(mockLeads);
export const mockChannelPerformance = calculateChannelPerformance(mockLeads);

export const getMonthlyLeadData = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map(month => ({
    month,
    leads: Math.floor(Math.random() * 50) + 20,
    converted: Math.floor(Math.random() * 20) + 5,
    revenue: Math.floor(Math.random() * 50000) + 20000,
  }));
};
