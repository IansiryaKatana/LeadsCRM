import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SkeletonChart, SkeletonCard } from "@/components/ui/skeleton-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, FileText, Loader2, Calendar, BarChart3, Users, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { LEAD_STATUS_CONFIG, ROOM_CHOICE_CONFIG } from "@/types/crm";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useMonthlyLeadData, useRoomDistribution, useStatusDistribution } from "@/hooks/useMonthlyData";
import { exportToCSV, exportToPDF, exportToExcel } from "@/utils/exportReports";
import { exportFollowUpAnalyticsToCSV, exportFollowUpAnalyticsToExcel, exportFollowUpAnalyticsToPDF } from "@/utils/exportFollowUpAnalytics";
import { exportTeamPerformanceToCSV, exportTeamPerformanceToExcel, exportTeamPerformanceToPDF } from "@/utils/exportTeamPerformance";
import { toast } from "@/hooks/use-toast";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { useLeadSources } from "@/hooks/useLeadSources";
import { FollowUpAnalytics } from "@/components/analytics/FollowUpAnalytics";
import { TeamPerformanceAnalytics } from "@/components/analytics/TeamPerformanceAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFollowUpAnalytics } from "@/hooks/useFollowUpAnalytics";
import { useTeamPerformance } from "@/hooks/useTeamPerformance";

const COLORS = [
  "hsl(211, 100%, 66%)",
  "hsl(47, 100%, 50%)",
  "hsl(166, 58%, 47%)",
  "hsl(0, 100%, 47%)",
  "hsl(280, 70%, 50%)",
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("analytics");
  
  // Export states for each tab
  const [exportingAnalyticsExcel, setExportingAnalyticsExcel] = useState(false);
  const [exportingAnalyticsPDF, setExportingAnalyticsPDF] = useState(false);
  const [exportingFollowUpExcel, setExportingFollowUpExcel] = useState(false);
  const [exportingFollowUpPDF, setExportingFollowUpPDF] = useState(false);
  const [exportingTeamExcel, setExportingTeamExcel] = useState(false);
  const [exportingTeamPDF, setExportingTeamPDF] = useState(false);
  
  const { currency, academicYears, defaultAcademicYear } = useSystemSettingsContext();
  const [selectedYear, setSelectedYear] = useState<string>(defaultAcademicYear || "");
  const { data: sources = [] } = useLeadSources();
  
  // Analytics tab data
  const { data: stats, isLoading: statsLoading } = useDashboardStats(selectedYear || undefined);
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyLeadData(selectedYear || undefined);
  const { data: roomData, isLoading: roomLoading } = useRoomDistribution(selectedYear || undefined);
  const { data: statusData, isLoading: statusLoading } = useStatusDistribution(selectedYear || undefined);
  
  // Follow-Up Analytics data
  const { data: followUpAnalytics, isLoading: followUpLoading } = useFollowUpAnalytics(selectedYear || undefined);
  
  // Team Performance data
  const { data: teamMetrics, isLoading: teamLoading } = useTeamPerformance(selectedYear || undefined);

  const analyticsLoading = statsLoading || monthlyLoading || roomLoading || statusLoading;

  // Calculate room distribution from real data
  const roomDistribution = Object.entries(ROOM_CHOICE_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: roomData?.[key] || 0,
  }));

  // Calculate status distribution from real data
  const statusDistribution = Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: statusData?.[key] || 0,
    fill: key === "converted" ? COLORS[2] : key === "high_interest" ? COLORS[0] : COLORS[4],
  }));

  // Analytics tab export handlers
  const handleAnalyticsExcelExport = async () => {
    if (!stats || !monthlyData || !roomDistribution || !statusDistribution) {
      toast({
        title: "Export Failed",
        description: "Please wait for data to load before exporting",
        variant: "destructive",
      });
      return;
    }

    setExportingAnalyticsExcel(true);
    try {
      await exportToExcel({
        stats,
        monthlyData,
        roomDistribution,
        statusDistribution,
        dateRange,
        currencySymbol: currency.symbol,
        sources: sources.map(s => ({ slug: s.slug, name: s.name, icon: s.icon })),
      });
      toast({
        title: "Export Successful",
        description: "Analytics Excel report has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export Excel",
        variant: "destructive",
      });
    } finally {
      setExportingAnalyticsExcel(false);
    }
  };

  const handleAnalyticsPDFExport = async () => {
    if (!stats || !monthlyData || !roomDistribution || !statusDistribution) {
      toast({
        title: "Export Failed",
        description: "Please wait for data to load before exporting",
        variant: "destructive",
      });
      return;
    }

    setExportingAnalyticsPDF(true);
    try {
      await exportToPDF({
        stats,
        monthlyData,
        roomDistribution,
        statusDistribution,
        dateRange,
        currencySymbol: currency.symbol,
        sources: sources.map(s => ({ slug: s.slug, name: s.name, icon: s.icon })),
      });
      toast({
        title: "Export Successful",
        description: "Analytics PDF report has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export PDF",
        variant: "destructive",
      });
    } finally {
      setExportingAnalyticsPDF(false);
    }
  };

  // Follow-Up Analytics export handlers
  const handleFollowUpCSVExport = () => {
    if (!followUpAnalytics) {
      toast({
        title: "Export Failed",
        description: "Please wait for data to load before exporting",
        variant: "destructive",
      });
      return;
    }

    try {
      exportFollowUpAnalyticsToCSV({
        analytics: followUpAnalytics,
        academicYear: selectedYear || undefined,
        dateRange,
      });
      toast({
        title: "Export Successful",
        description: "Follow-Up Analytics CSV report has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export CSV",
        variant: "destructive",
      });
    }
  };

  const handleFollowUpExcelExport = async () => {
    if (!followUpAnalytics) {
      toast({
        title: "Export Failed",
        description: "Please wait for data to load before exporting",
        variant: "destructive",
      });
      return;
    }

    setExportingFollowUpExcel(true);
    try {
      await exportFollowUpAnalyticsToExcel({
        analytics: followUpAnalytics,
        academicYear: selectedYear || undefined,
        dateRange,
      });
      toast({
        title: "Export Successful",
        description: "Follow-Up Analytics Excel report has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export Excel",
        variant: "destructive",
      });
    } finally {
      setExportingFollowUpExcel(false);
    }
  };

  const handleFollowUpPDFExport = async () => {
    if (!followUpAnalytics) {
      toast({
        title: "Export Failed",
        description: "Please wait for data to load before exporting",
        variant: "destructive",
      });
      return;
    }

    setExportingFollowUpPDF(true);
    try {
      await exportFollowUpAnalyticsToPDF({
        analytics: followUpAnalytics,
        academicYear: selectedYear || undefined,
        dateRange,
      });
      toast({
        title: "Export Successful",
        description: "Follow-Up Analytics PDF report has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export PDF",
        variant: "destructive",
      });
    } finally {
      setExportingFollowUpPDF(false);
    }
  };

  // Team Performance export handlers
  const handleTeamCSVExport = () => {
    if (!teamMetrics || teamMetrics.length === 0) {
      toast({
        title: "Export Failed",
        description: "Please wait for data to load before exporting",
        variant: "destructive",
      });
      return;
    }

    try {
      exportTeamPerformanceToCSV({
        teamMetrics,
        academicYear: selectedYear || undefined,
        dateRange,
        currencySymbol: currency.symbol,
      });
      toast({
        title: "Export Successful",
        description: "Team Performance CSV report has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export CSV",
        variant: "destructive",
      });
    }
  };

  const handleTeamExcelExport = async () => {
    if (!teamMetrics || teamMetrics.length === 0) {
      toast({
        title: "Export Failed",
        description: "Please wait for data to load before exporting",
        variant: "destructive",
      });
      return;
    }

    setExportingTeamExcel(true);
    try {
      await exportTeamPerformanceToExcel({
        teamMetrics,
        academicYear: selectedYear || undefined,
        dateRange,
        currencySymbol: currency.symbol,
      });
      toast({
        title: "Export Successful",
        description: "Team Performance Excel report has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export Excel",
        variant: "destructive",
      });
    } finally {
      setExportingTeamExcel(false);
    }
  };

  const handleTeamPDFExport = async () => {
    if (!teamMetrics || teamMetrics.length === 0) {
      toast({
        title: "Export Failed",
        description: "Please wait for data to load before exporting",
        variant: "destructive",
      });
      return;
    }

    setExportingTeamPDF(true);
    try {
      await exportTeamPerformanceToPDF({
        teamMetrics,
        academicYear: selectedYear || undefined,
        dateRange,
        currencySymbol: currency.symbol,
      });
      toast({
        title: "Export Successful",
        description: "Team Performance PDF report has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export PDF",
        variant: "destructive",
      });
    } finally {
      setExportingTeamPDF(false);
    }
  };

  const isLoading = analyticsLoading || followUpLoading || teamLoading;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Analytics and performance insights
            </p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedYear || undefined} onValueChange={(value) => setSelectedYear(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tabs and Export Buttons Row - Same row on desktop */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <TabsList className="bg-muted/50 p-1 w-full md:w-auto">
              <TabsTrigger value="analytics" className="gap-2 shrink-0">
                <TrendingUp className="h-4 w-4 shrink-0" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="followups" className="gap-2 shrink-0">
                <BarChart3 className="h-4 w-4 shrink-0" />
                Follow-Ups
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2 shrink-0">
                <Users className="h-4 w-4 shrink-0" />
                Team Performance
              </TabsTrigger>
            </TabsList>

            {/* Export Buttons - Conditionally rendered based on active tab */}
            <div className="flex justify-end gap-2">
              {activeTab === "analytics" && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2" 
                    onClick={() => exportToCSV({
                      stats: stats!,
                      monthlyData: monthlyData || [],
                      roomDistribution,
                      statusDistribution,
                      dateRange,
                      currencySymbol: currency.symbol,
                      sources: sources.map(s => ({ slug: s.slug, name: s.name, icon: s.icon })),
                    })}
                    disabled={analyticsLoading || !stats}
                  >
                    <FileText className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2" 
                    onClick={handleAnalyticsExcelExport}
                    disabled={exportingAnalyticsExcel || analyticsLoading || !stats}
                  >
                    {exportingAnalyticsExcel ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                    Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2" 
                    onClick={handleAnalyticsPDFExport}
                    disabled={exportingAnalyticsPDF || analyticsLoading || !stats}
                  >
                    {exportingAnalyticsPDF ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    PDF
                  </Button>
                </>
              )}
              {activeTab === "followups" && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2" 
                    onClick={handleFollowUpCSVExport}
                    disabled={followUpLoading || !followUpAnalytics}
                  >
                    <FileText className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2" 
                    onClick={handleFollowUpExcelExport}
                    disabled={exportingFollowUpExcel || followUpLoading || !followUpAnalytics}
                  >
                    {exportingFollowUpExcel ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                    Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2" 
                    onClick={handleFollowUpPDFExport}
                    disabled={exportingFollowUpPDF || followUpLoading || !followUpAnalytics}
                  >
                    {exportingFollowUpPDF ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    PDF
                  </Button>
                </>
              )}
              {activeTab === "team" && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2" 
                    onClick={handleTeamCSVExport}
                    disabled={teamLoading || !teamMetrics || teamMetrics.length === 0}
                  >
                    <FileText className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2" 
                    onClick={handleTeamExcelExport}
                    disabled={exportingTeamExcel || teamLoading || !teamMetrics || teamMetrics.length === 0}
                  >
                    {exportingTeamExcel ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                    Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2" 
                    onClick={handleTeamPDFExport}
                    disabled={exportingTeamPDF || teamLoading || !teamMetrics || teamMetrics.length === 0}
                  >
                    {exportingTeamPDF ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    PDF
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-3xl font-display font-bold">{stats?.totalLeads || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-3xl font-display font-bold">
                    {(stats?.conversionRate || 0).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Based on converted leads</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Revenue Generated</p>
                  <p className="text-3xl font-display font-bold">
                    {currency.symbol}{((stats?.totalRevenue || 0) / 1000).toFixed(0)}K
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">From converted leads</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Performance */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display">Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    {!monthlyData || monthlyData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No data available yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          barCategoryGap="24%"
                          barGap={8}
                        >
                          <CartesianGrid
                            vertical={false}
                            stroke="hsl(210, 20%, 92%)"
                            strokeDasharray="4 4"
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fill: "hsl(210, 10%, 40%)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: "hsl(210, 10%, 40%)", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "hsl(210, 20%, 95%)" }}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid hsl(210, 20%, 90%)",
                              borderRadius: 12,
                              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                            }}
                            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                          />
                          {/* Total leads bar (primary, teal like reference) */}
                          <Bar
                            dataKey="leads"
                            name="Leads"
                            fill="hsl(188, 80%, 35%)"
                            radius={[6, 6, 0, 0]}
                          />
                          {/* Converted overlay with lighter shade to subtly show performance */}
                          <Bar
                            dataKey="converted"
                            name="Converted"
                            fill="hsl(188, 70%, 60%)"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Room Distribution */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display">Room Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 flex items-center justify-center">
                    {roomDistribution.every(r => r.value === 0) ? (
                      <div className="text-muted-foreground">No data available yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={roomDistribution.filter(r => r.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {roomDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lead Status Breakdown */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">Lead Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {statusDistribution.every(s => s.value === 0) ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data available yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusDistribution.filter(s => s.value > 0)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" horizontal={true} vertical={false} />
                        <XAxis type="number" tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                          {statusDistribution.filter(s => s.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Follow-Up Analytics Tab */}
          <TabsContent value="followups" className="space-y-6">
            <FollowUpAnalytics academicYear={selectedYear || undefined} />
          </TabsContent>

          {/* Team Performance Tab */}
          <TabsContent value="team" className="space-y-6">
            <TeamPerformanceAnalytics academicYear={selectedYear || undefined} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
