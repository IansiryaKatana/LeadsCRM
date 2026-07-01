import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFollowUpAnalytics } from "@/hooks/useFollowUpAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  PhoneCall,
} from "lucide-react";
import { FollowUpTypeChart } from "@/components/charts/analytics-charts";

interface FollowUpAnalyticsProps {
  academicYear?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

export function FollowUpAnalytics({ academicYear, startDate, endDate }: FollowUpAnalyticsProps) {
  const { data: analytics, isLoading } = useFollowUpAnalytics(academicYear, startDate, endDate);

  if (isLoading) {
    return (
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
    );
  }

  if (!analytics) return null;

  const chartData = analytics.followupTypeEffectiveness.map((item) => ({
    typeKey: item.type,
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1).replace("_", " "),
    count: item.count,
    conversionRate: item.conversionRate,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Compliance Rate</p>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-display font-bold">
              {analytics.complianceRate.toFixed(1)}%
            </p>
            <Progress 
              value={analytics.complianceRate} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.closedLeads > 0
                ? `${analytics.leadsWith3PlusFollowups} of ${analytics.closedLeads} closed leads`
                : `${analytics.leadsWith3PlusFollowups} of ${analytics.totalLeads} leads with 3+ follow-ups`}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Avg Follow-ups to Convert</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-display font-bold">
              {analytics.averageFollowupsToConversion.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.convertedLeads > 0
                ? `Across ${analytics.convertedLeads} converted leads`
                : "No converted leads in this period"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Time to First Follow-up</p>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-display font-bold">
              {Math.round(analytics.averageTimeToFirstFollowup)}h
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.leadsWithFirstFollowup > 0
                ? `Across ${analytics.leadsWithFirstFollowup} leads with a logged follow-up`
                : "No logged follow-ups yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Response Rate</p>
              <PhoneCall className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-display font-bold">
              {analytics.followupResponseRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.loggedFollowupsInRange > 0
                ? `Based on ${analytics.loggedFollowupsInRange} logged follow-ups`
                : "No logged follow-ups in selected date range"}
            </p>
          </CardContent>
        </Card>
      </div>

      {(analytics.overdueFollowups > 0 || analytics.upcomingFollowups > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.overdueFollowups > 0 && (
            <Card className="shadow-card border-destructive/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm font-medium">Overdue Follow-ups</p>
                </div>
                <p className="text-2xl font-display font-bold text-destructive">
                  {analytics.overdueFollowups}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Leads requiring immediate attention
                </p>
              </CardContent>
            </Card>
          )}

          {analytics.upcomingFollowups > 0 && (
            <Card className="shadow-card border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium">Upcoming Follow-ups</p>
                </div>
                <p className="text-2xl font-display font-bold text-primary">
                  {analytics.upcomingFollowups}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled within next 7 days
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {chartData.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Follow-up Type Effectiveness</CardTitle>
            <CardDescription>Conversion rate by follow-up channel</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <FollowUpTypeChart data={chartData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
