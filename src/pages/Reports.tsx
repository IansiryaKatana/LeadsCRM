import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChannelPerformanceChart } from "@/components/dashboard/ChannelPerformance";
import { SkeletonChart, SkeletonCard } from "@/components/ui/skeleton-loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  BarChart3,
  Users,
  TrendingUp,
  Target,
  DollarSign,
} from "lucide-react";
import { LEAD_STATUS_CONFIG, ROOM_CHOICE_CONFIG } from "@/types/crm";
import { useDashboardStats, useChannelPerformance } from "@/hooks/useDashboardStats";
import { useMonthlyLeadData, useRoomDistribution, useStatusDistribution } from "@/hooks/useMonthlyData";
import { exportToCSV, exportToPDF, exportToExcel } from "@/utils/exportReports";
import { ExportFormatBar } from "@/components/dashboard/ExportFormatBar";
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
import {
  LeadVolumeChart,
  PipelineStatusChart,
  RoomDistributionChart,
} from "@/components/charts/analytics-charts";
import {
  getReportDateBounds,
  type ReportDateRangeKey,
} from "@/utils/reportDateRange";
import { pageTitleClass } from "@/lib/typography";
import { CHART_PALETTE } from "@/constants/chartTheme";

export default function Reports() {
  const [dateRange, setDateRange] = useState<ReportDateRangeKey>("30d");
  const [activeTab, setActiveTab] = useState("analytics");

  const [exportingAnalyticsExcel, setExportingAnalyticsExcel] = useState(false);
  const [exportingAnalyticsPDF, setExportingAnalyticsPDF] = useState(false);
  const [exportingFollowUpExcel, setExportingFollowUpExcel] = useState(false);
  const [exportingFollowUpPDF, setExportingFollowUpPDF] = useState(false);
  const [exportingTeamExcel, setExportingTeamExcel] = useState(false);
  const [exportingTeamPDF, setExportingTeamPDF] = useState(false);

  const { currency, academicYears, currentAcademicYear, setCurrentAcademicYear, formatCurrency } = useSystemSettingsContext();
  const { data: sources = [] } = useLeadSources();
  const yearFilter = currentAcademicYear === null ? null : (currentAcademicYear || undefined);

  const { startDate, endDate, label: dateRangeLabel } = useMemo(
    () => getReportDateBounds(dateRange),
    [dateRange]
  );

  const { data: stats, isLoading: statsLoading } = useDashboardStats(yearFilter, startDate, endDate);
  const { data: channels = [], isLoading: channelsLoading } = useChannelPerformance(yearFilter, startDate, endDate);
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyLeadData(yearFilter, startDate, endDate);
  const { data: roomData, isLoading: roomLoading } = useRoomDistribution(yearFilter, startDate, endDate);
  const { data: statusData, isLoading: statusLoading } = useStatusDistribution(yearFilter, startDate, endDate);
  const { data: followUpAnalytics, isLoading: followUpLoading } = useFollowUpAnalytics(yearFilter, startDate, endDate);
  const { data: teamMetrics, isLoading: teamLoading } = useTeamPerformance(
    yearFilter,
    startDate ?? undefined,
    endDate
  );

  const analyticsLoading = statsLoading || monthlyLoading || roomLoading || statusLoading || channelsLoading;

  const roomDistribution = Object.entries(ROOM_CHOICE_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: roomData?.[key] || 0,
  }));

  const statusDistribution = Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: statusData?.[key] || 0,
    fill: CHART_PALETTE[Object.keys(LEAD_STATUS_CONFIG).indexOf(key) % CHART_PALETTE.length],
  }));

  const filterSummary = [
    dateRangeLabel,
    currentAcademicYear ? `AY ${currentAcademicYear}` : "All academic years",
  ].join(" · ");

  const formatCompactCurrency = (value: number) =>
    `${currency.symbol}${(value / 1000).toFixed(0)}K`;

  const handleAnalyticsExcelExport = async () => {
    if (!stats || !monthlyData || !roomDistribution || !statusDistribution) {
      toast({ title: "Export Failed", description: "Please wait for data to load", variant: "destructive" });
      return;
    }
    setExportingAnalyticsExcel(true);
    try {
      await exportToExcel({
        stats,
        monthlyData,
        roomDistribution,
        statusDistribution,
        channelPerformance: channels,
        dateRange: filterSummary,
        currencySymbol: currency.symbol,
        sources: sources.map((s) => ({ slug: s.slug, name: s.name, icon: s.icon })),
      });
      toast({ title: "Export Successful", description: "Analytics Excel report has been downloaded" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export Excel";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    } finally {
      setExportingAnalyticsExcel(false);
    }
  };

  const handleAnalyticsPDFExport = async () => {
    if (!stats || !monthlyData || !roomDistribution || !statusDistribution) {
      toast({ title: "Export Failed", description: "Please wait for data to load", variant: "destructive" });
      return;
    }
    setExportingAnalyticsPDF(true);
    try {
      await exportToPDF({
        stats,
        monthlyData,
        roomDistribution,
        statusDistribution,
        channelPerformance: channels,
        dateRange: filterSummary,
        currencySymbol: currency.symbol,
        sources: sources.map((s) => ({ slug: s.slug, name: s.name, icon: s.icon })),
      });
      toast({ title: "Export Successful", description: "Analytics PDF report has been downloaded" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export PDF";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    } finally {
      setExportingAnalyticsPDF(false);
    }
  };

  const handleFollowUpCSVExport = () => {
    if (!followUpAnalytics) {
      toast({ title: "Export Failed", description: "Please wait for data to load", variant: "destructive" });
      return;
    }
    try {
      exportFollowUpAnalyticsToCSV({ analytics: followUpAnalytics, academicYear: yearFilter, dateRange: filterSummary });
      toast({ title: "Export Successful", description: "Follow-Up Analytics CSV downloaded" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export CSV";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    }
  };

  const handleFollowUpExcelExport = async () => {
    if (!followUpAnalytics) {
      toast({ title: "Export Failed", description: "Please wait for data to load", variant: "destructive" });
      return;
    }
    setExportingFollowUpExcel(true);
    try {
      await exportFollowUpAnalyticsToExcel({ analytics: followUpAnalytics, academicYear: yearFilter, dateRange: filterSummary });
      toast({ title: "Export Successful", description: "Follow-Up Analytics Excel downloaded" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export Excel";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    } finally {
      setExportingFollowUpExcel(false);
    }
  };

  const handleFollowUpPDFExport = async () => {
    if (!followUpAnalytics) {
      toast({ title: "Export Failed", description: "Please wait for data to load", variant: "destructive" });
      return;
    }
    setExportingFollowUpPDF(true);
    try {
      await exportFollowUpAnalyticsToPDF({ analytics: followUpAnalytics, academicYear: yearFilter, dateRange: filterSummary });
      toast({ title: "Export Successful", description: "Follow-Up Analytics PDF downloaded" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export PDF";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    } finally {
      setExportingFollowUpPDF(false);
    }
  };

  const handleTeamCSVExport = () => {
    if (!teamMetrics?.length) {
      toast({ title: "Export Failed", description: "Please wait for data to load", variant: "destructive" });
      return;
    }
    try {
      exportTeamPerformanceToCSV({ teamMetrics, academicYear: yearFilter, dateRange: filterSummary, currencySymbol: currency.symbol });
      toast({ title: "Export Successful", description: "Team Performance CSV downloaded" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export CSV";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    }
  };

  const handleTeamExcelExport = async () => {
    if (!teamMetrics?.length) {
      toast({ title: "Export Failed", description: "Please wait for data to load", variant: "destructive" });
      return;
    }
    setExportingTeamExcel(true);
    try {
      await exportTeamPerformanceToExcel({ teamMetrics, academicYear: yearFilter, dateRange: filterSummary, currencySymbol: currency.symbol });
      toast({ title: "Export Successful", description: "Team Performance Excel downloaded" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export Excel";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    } finally {
      setExportingTeamExcel(false);
    }
  };

  const handleTeamPDFExport = async () => {
    if (!teamMetrics?.length) {
      toast({ title: "Export Failed", description: "Please wait for data to load", variant: "destructive" });
      return;
    }
    setExportingTeamPDF(true);
    try {
      await exportTeamPerformanceToPDF({ teamMetrics, academicYear: yearFilter, dateRange: filterSummary, currencySymbol: currency.symbol });
      toast({ title: "Export Successful", description: "Team Performance PDF downloaded" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export PDF";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    } finally {
      setExportingTeamPDF(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className={pageTitleClass}>Reports</h1>
              <p className="text-muted-foreground mt-1 font-body">
                Live analytics from your CRM — filtered by period and academic year
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full sm:w-auto">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[140px]">
                <Calendar className="hidden sm:block h-4 w-4 text-muted-foreground shrink-0" />
                <Select
                  value={(currentAcademicYear ?? "") || "all"}
                  onValueChange={(value) => setCurrentAcademicYear(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
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
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as ReportDateRangeKey)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit font-body text-xs font-medium px-3 py-1">
            {filterSummary}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <TabsList
              fullWidth
              className="grid w-full grid-cols-3 bg-muted/50 p-1 h-auto sm:inline-flex sm:w-auto sm:grid-cols-none"
            >
              <TabsTrigger value="analytics" className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm font-body">
                <TrendingUp className="h-4 w-4 shrink-0" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="followups" className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm font-body">
                <BarChart3 className="h-4 w-4 shrink-0" />
                Follow-Ups
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm font-body">
                <Users className="h-4 w-4 shrink-0" />
                Team
              </TabsTrigger>
            </TabsList>

            <ExportFormatBar
              className="w-full sm:w-auto"
              disabled={
                (activeTab === "analytics" && (analyticsLoading || !stats)) ||
                (activeTab === "followups" && (followUpLoading || !followUpAnalytics)) ||
                (activeTab === "team" && (teamLoading || !teamMetrics?.length))
              }
              loadingExcel={
                (activeTab === "analytics" && exportingAnalyticsExcel) ||
                (activeTab === "followups" && exportingFollowUpExcel) ||
                (activeTab === "team" && exportingTeamExcel)
              }
              loadingPdf={
                (activeTab === "analytics" && exportingAnalyticsPDF) ||
                (activeTab === "followups" && exportingFollowUpPDF) ||
                (activeTab === "team" && exportingTeamPDF)
              }
              onCsv={
                activeTab === "analytics"
                  ? () =>
                      stats &&
                      exportToCSV({
                        stats,
                        monthlyData: monthlyData || [],
                        roomDistribution,
                        statusDistribution,
                        channelPerformance: channels,
                        dateRange: filterSummary,
                        currencySymbol: currency.symbol,
                        sources: sources.map((s) => ({ slug: s.slug, name: s.name, icon: s.icon })),
                        reportTitle: "Analytics Report",
                      })
                  : activeTab === "followups"
                    ? handleFollowUpCSVExport
                    : handleTeamCSVExport
              }
              onExcel={
                activeTab === "analytics"
                  ? handleAnalyticsExcelExport
                  : activeTab === "followups"
                    ? handleFollowUpExcelExport
                    : handleTeamExcelExport
              }
              onPdf={
                activeTab === "analytics"
                  ? handleAnalyticsPDFExport
                  : activeTab === "followups"
                    ? handleFollowUpPDFExport
                    : handleTeamPDFExport
              }
            />
          </div>

          <TabsContent value="analytics" className="space-y-6 mt-0">
            {analyticsLoading ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <SkeletonChart />
                  <SkeletonChart />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    title="Total Leads"
                    value={stats?.totalLeads || 0}
                    subtitle={dateRangeLabel}
                    icon={Users}
                  />
                  <StatCard
                    title="Conversion Rate"
                    value={`${(stats?.conversionRate || 0).toFixed(1)}%`}
                    subtitle={`${stats?.converted || 0} converted`}
                    icon={Target}
                    variant="success"
                  />
                  <StatCard
                    title="Revenue"
                    value={formatCompactCurrency(stats?.totalRevenue || 0)}
                    subtitle={formatCurrency(stats?.totalRevenue || 0)}
                    icon={DollarSign}
                    variant="primary"
                    className="sm:col-span-2 lg:col-span-1"
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                  <Card className="shadow-card rounded-2xl border-0 h-full flex flex-col">
                    <CardHeader className="pb-2 shrink-0">
                      <CardTitle>Lead Volume</CardTitle>
                      <CardDescription className="font-body">Leads vs conversions by month</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col min-h-0 pt-0">
                      <LeadVolumeChart data={monthlyData} />
                    </CardContent>
                  </Card>
                  <ChannelPerformanceChart data={channels} className="h-full" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-card rounded-2xl border-0">
                    <CardHeader className="pb-2">
                      <CardTitle>Room Distribution</CardTitle>
                      <CardDescription className="font-body">Preference mix in selected period</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <RoomDistributionChart roomData={roomData} />
                    </CardContent>
                  </Card>

                  <Card className="shadow-card rounded-2xl border-0">
                    <CardHeader className="pb-2">
                      <CardTitle>Pipeline Status</CardTitle>
                      <CardDescription className="font-body">Lead status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <PipelineStatusChart statusData={statusData} />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="followups" className="space-y-6 mt-0">
            <FollowUpAnalytics academicYear={yearFilter} startDate={startDate} endDate={endDate} />
          </TabsContent>

          <TabsContent value="team" className="space-y-6 mt-0">
            <TeamPerformanceAnalytics academicYear={yearFilter} startDate={startDate} endDate={endDate} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

