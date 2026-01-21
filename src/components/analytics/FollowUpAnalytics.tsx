import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFollowUpAnalytics } from "@/hooks/useFollowUpAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  PhoneCall,
  BarChart3 
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface FollowUpAnalyticsProps {
  academicYear?: string;
}

const COLORS = ["#51A6FF", "#33C3F0", "#4ADE80", "#F59E0B", "#EF4444"];

export function FollowUpAnalytics({ academicYear }: FollowUpAnalyticsProps) {
  const { data: analytics, isLoading } = useFollowUpAnalytics(academicYear);

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
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1).replace("_", " "),
    count: item.count,
    conversionRate: item.conversionRate,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
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
              {analytics.leadsWith3PlusFollowups} of {analytics.totalLeads} leads
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
              Average follow-ups before conversion
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
              Average hours from lead creation
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
              Successful contacts per follow-up
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
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

      {/* Follow-up Type Effectiveness */}
      {chartData.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Follow-up Type Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(0, 0%, 88%)",
                      borderRadius: "12px",
                    }}
                    formatter={(value: any) => [`${value}%`, "Conversion Rate"]}
                  />
                  <Bar dataKey="conversionRate" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

