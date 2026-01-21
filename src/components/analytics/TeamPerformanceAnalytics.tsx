import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTeamPerformance } from "@/hooks/useTeamPerformance";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle2,
  PhoneCall,
  Award
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeamPerformanceAnalyticsProps {
  academicYear?: string;
}

const COLORS = ["#51A6FF", "#33C3F0", "#4ADE80", "#F59E0B", "#EF4444", "#A855F7"];

export function TeamPerformanceAnalytics({ academicYear }: TeamPerformanceAnalyticsProps) {
  const { data: teamMetrics, isLoading } = useTeamPerformance(academicYear);
  const { formatCurrency } = useSystemSettingsContext();
  const [sortBy, setSortBy] = useState<"revenue" | "conversions" | "compliance">("revenue");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teamMetrics || teamMetrics.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No team performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate team totals
  const teamTotals = teamMetrics.reduce(
    (acc, user) => ({
      totalLeads: acc.totalLeads + user.total_leads_assigned,
      totalConversions: acc.totalConversions + user.total_conversions,
      totalRevenue: acc.totalRevenue + user.total_revenue,
      totalFollowups: acc.totalFollowups + user.total_followups_recorded,
    }),
    { totalLeads: 0, totalConversions: 0, totalRevenue: 0, totalFollowups: 0 }
  );

  const teamAvgConversionRate =
    teamTotals.totalLeads > 0
      ? (teamTotals.totalConversions / teamTotals.totalLeads) * 100
      : 0;

  const teamAvgComplianceRate =
    teamMetrics.reduce((sum, u) => sum + u.followup_compliance_rate, 0) /
    teamMetrics.length;

  // Sort team metrics
  const sortedMetrics = [...teamMetrics].sort((a, b) => {
    switch (sortBy) {
      case "revenue":
        return b.total_revenue - a.total_revenue;
      case "conversions":
        return b.total_conversions - a.total_conversions;
      case "compliance":
        return b.followup_compliance_rate - a.followup_compliance_rate;
      default:
        return 0;
    }
  });

  // Chart data for revenue comparison
  const revenueChartData = sortedMetrics.slice(0, 6).map((user) => ({
    name: user.full_name.split(" ")[0], // First name only for chart
    revenue: user.total_revenue,
    conversions: user.total_conversions,
  }));

  // Chart data for conversion rate comparison
  const conversionChartData = sortedMetrics.slice(0, 6).map((user) => ({
    name: user.full_name.split(" ")[0],
    rate: user.conversion_rate,
  }));

  // Top performers
  const topRevenue = sortedMetrics[0];
  const topConversions = [...teamMetrics].sort(
    (a, b) => b.total_conversions - a.total_conversions
  )[0];
  const topCompliance = [...teamMetrics].sort(
    (a, b) => b.followup_compliance_rate - a.followup_compliance_rate
  )[0];

  return (
    <div className="space-y-6">
      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Team Conversion Rate</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-display font-bold">
              {teamAvgConversionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {teamTotals.totalConversions} of {teamTotals.totalLeads} leads
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Team Revenue</p>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-display font-bold">
              {formatCurrency(teamTotals.totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total revenue generated
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Team Compliance</p>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-display font-bold">
              {teamAvgComplianceRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Average follow-up compliance
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Follow-ups</p>
              <PhoneCall className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-display font-bold">
              {teamTotals.totalFollowups}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Follow-ups recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Revenue Generator
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topRevenue ? (
              <div>
                <p className="text-2xl font-bold">{topRevenue.full_name}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {formatCurrency(topRevenue.total_revenue)}
                </p>
                <Badge variant="outline" className="mt-2">
                  {topRevenue.total_conversions} conversions
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              Most Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topConversions ? (
              <div>
                <p className="text-2xl font-bold">{topConversions.full_name}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {topConversions.total_conversions} conversions
                </p>
                <Badge variant="outline" className="mt-2">
                  {topConversions.conversion_rate.toFixed(1)}% rate
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Most Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCompliance ? (
              <div>
                <p className="text-2xl font-bold">{topCompliance.full_name}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {topCompliance.followup_compliance_rate.toFixed(1)}% compliance
                </p>
                <Badge variant="outline" className="mt-2">
                  {topCompliance.avg_followups_per_lead.toFixed(1)} avg follow-ups
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Revenue by Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#51A6FF" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Conversion Rate by Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="rate" fill="#4ADE80" name="Conversion Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Performance Details</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("revenue")}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortBy === "revenue"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setSortBy("conversions")}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortBy === "conversions"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Conversions
              </button>
              <button
                onClick={() => setSortBy("compliance")}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortBy === "compliance"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Compliance
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Leads Assigned</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Follow-ups</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Avg Time to 1st FU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMetrics.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.total_leads_assigned}</TableCell>
                    <TableCell>{user.total_conversions}</TableCell>
                    <TableCell>{user.conversion_rate.toFixed(1)}%</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(user.total_revenue)}
                    </TableCell>
                    <TableCell>{user.total_followups_recorded}</TableCell>
                    <TableCell>
                      <span
                        className={
                          user.followup_compliance_rate >= 90
                            ? "text-green-600 font-medium"
                            : user.followup_compliance_rate >= 70
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {user.followup_compliance_rate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.avg_time_to_first_followup_hours
                        ? `${Math.round(user.avg_time_to_first_followup_hours)}h`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

