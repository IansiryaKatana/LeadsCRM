import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { LeadStatusCard } from "@/components/dashboard/LeadStatusCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ChannelPerformanceChart } from "@/components/dashboard/ChannelPerformance";
import { CreateLeadForm } from "@/components/leads/CreateLeadForm";
import { ExportDialog } from "@/components/dashboard/ExportDialog";
import { OverdueFollowUpsWidget } from "@/components/dashboard/OverdueFollowUpsWidget";
import { SkeletonDashboard } from "@/components/ui/skeleton-loader";
import { useLeads } from "@/hooks/useLeads";
import { useDashboardStats, useChannelPerformance } from "@/hooks/useDashboardStats";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { LeadStatus } from "@/types/crm";
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Upload,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { exportDashboardToExcel, exportDashboardToPDF } from "@/utils/exportDashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { academicYears, defaultAcademicYear, currency } = useSystemSettingsContext();
  const [selectedYear, setSelectedYear] = useState<string>(defaultAcademicYear || "");
  const { data: stats, isLoading: statsLoading } = useDashboardStats(selectedYear || undefined);
  const { data: leads = [] } = useLeads(selectedYear || undefined);
  const { data: channels = [] } = useChannelPerformance(selectedYear || undefined);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loading = statsLoading;

  const handleExport = async (format: "excel" | "pdf", startDate: Date, endDate: Date) => {
    setIsExporting(true);
    try {
      if (format === "excel") {
        await exportDashboardToExcel({
          startDate,
          endDate,
          currencySymbol: currency.symbol,
        });
        toast({
          title: "Export Successful",
          description: "Excel file has been downloaded",
        });
      } else {
        await exportDashboardToPDF({
          startDate,
          endDate,
          currencySymbol: currency.symbol,
        });
        toast({
          title: "Export Successful",
          description: "PDF file has been downloaded",
        });
      }
      setExportDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatCompactCurrency = (value: number) => {
    return `${currency.symbol}${(value / 1000).toFixed(0)}K`;
  };

  const statusCards: { status: LeadStatus; count: number; revenue: number }[] = stats ? [
    { status: "new", count: stats.newLeads, revenue: leads.filter(l => l.lead_status === "new").reduce((s, l) => s + l.potential_revenue, 0) },
    { status: "awaiting_outreach", count: stats.awaitingOutreach, revenue: leads.filter(l => l.lead_status === "awaiting_outreach").reduce((s, l) => s + l.potential_revenue, 0) },
    { status: "high_interest", count: stats.highInterest, revenue: leads.filter(l => l.lead_status === "high_interest").reduce((s, l) => s + l.potential_revenue, 0) },
    { status: "converted", count: stats.converted, revenue: stats.totalRevenue },
    { status: "closed", count: stats.closed, revenue: leads.filter(l => l.lead_status === "closed").reduce((s, l) => s + l.potential_revenue, 0) },
  ] : [];

  if (loading) {
    return (
      <AppLayout>
        <SkeletonDashboard />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your lead overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <Link to="/upload">
              <Button variant="outline" className="gap-2" size="sm">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            </Link>
            <Button variant="outline" className="gap-2" size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <CreateLeadForm />
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={stats?.totalLeads || 0}
            subtitle="All time leads"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Conversion Rate"
            value={`${(stats?.conversionRate || 0).toFixed(1)}%`}
            subtitle="Lead to booking"
            icon={Target}
            trend={{ value: 3.2, isPositive: true }}
            variant="success"
          />
          <StatCard
            title="Total Revenue"
            value={formatCompactCurrency(stats?.totalRevenue || 0)}
            subtitle="Confirmed bookings"
            icon={DollarSign}
            trend={{ value: 18, isPositive: true }}
            variant="primary"
          />
          <StatCard
            title="Forecast"
            value={formatCompactCurrency(stats?.forecastRevenue || 0)}
            subtitle="Expected revenue"
            icon={TrendingUp}
            trend={{ value: 8, isPositive: true }}
            variant="warning"
          />
        </div>

        {/* Status Cards */}
        <div>
          <h2 className="font-display text-xl font-bold mb-4">Lead Pipeline</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statusCards.map((card) => (
              <LeadStatusCard
                key={card.status}
                status={card.status}
                count={card.count}
                revenue={card.revenue}
              />
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart academicYear={selectedYear || undefined} />
          </div>
          <div>
            <ChannelPerformanceChart data={channels} />
          </div>
        </div>

        {/* Overdue Follow-Ups Widget */}
        <OverdueFollowUpsWidget academicYear={selectedYear || undefined} />

        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          onExport={handleExport}
          isExporting={isExporting}
        />
      </div>
    </AppLayout>
  );
}