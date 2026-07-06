import { StatCard } from "@/components/dashboard/StatCard";
import { SkeletonChart, SkeletonCard } from "@/components/ui/skeleton-loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Users, DollarSign, Filter, TrendingUp, BarChart3 } from "lucide-react";
import {
  LeadVolumeChart,
  PipelineStatusChart,
  PipelineRevenueByStatusChart,
  RoomDistributionChart,
  NationalityDistributionChart,
} from "@/components/charts/analytics-charts";
import { SourceIcon } from "@/utils/sourceIcons";
import { useSourceReports } from "@/hooks/useSourceReports";
import { useLeadSources } from "@/hooks/useLeadSources";
import { subsectionTitleClass } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface SourceReportsPanelProps {
  selectedSource: string;
  onSourceChange: (slug: string) => void;
  academicYear?: string | null;
  startDate: Date | null;
  endDate: Date;
  dateRangeLabel: string;
  formatCompactCurrency: (value: number) => string;
  formatCurrency: (value: number) => string;
}

export function SourceReportsPanel({
  selectedSource,
  onSourceChange,
  academicYear,
  startDate,
  endDate,
  dateRangeLabel,
  formatCompactCurrency,
  formatCurrency,
}: SourceReportsPanelProps) {
  const { data: sources = [] } = useLeadSources();
  const { data: reports, isLoading } = useSourceReports(
    selectedSource || undefined,
    academicYear,
    startDate,
    endDate,
  );

  const selectedSourceName =
    sources.find((s) => s.slug === selectedSource)?.name ?? selectedSource;

  if (!selectedSource) {
    return (
      <div className="space-y-6">
        <Card className="shadow-card rounded-2xl border-0">
          <CardHeader className="pb-2">
            <CardTitle>Lead source</CardTitle>
            <CardDescription className="font-body">
              Choose a source to generate volume, room, nationality, and pipeline reports
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Select value="" onValueChange={onSourceChange}>
              <SelectTrigger className="w-full sm:max-w-md">
                <SelectValue placeholder="Select lead source…" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((source) => (
                  <SelectItem key={source.slug} value={source.slug}>
                    <span className="flex items-center gap-2">
                      <SourceIcon slug={source.slug} className="h-4 w-4" />
                      {source.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center">
          <Filter className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className={cn(subsectionTitleClass, "text-muted-foreground")}>Select a lead source</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md font-body">
            Reports for lead volume, room mix, nationality, and pipeline status will appear here
            once you pick a source.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card rounded-2xl border-0">
        <CardHeader className="pb-2">
          <CardTitle>Lead source</CardTitle>
          <CardDescription className="font-body">
            Viewing reports for <span className="font-medium text-foreground">{selectedSourceName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Select value={selectedSource} onValueChange={onSourceChange}>
            <SelectTrigger className="w-full sm:max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sources.map((source) => (
                <SelectItem key={source.slug} value={source.slug}>
                  <span className="flex items-center gap-2">
                    <SourceIcon slug={source.slug} className="h-4 w-4" />
                    {source.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Leads"
              value={reports?.stats.totalLeads || 0}
              subtitle={dateRangeLabel}
              icon={Users}
            />
            <StatCard
              title="Conversion Rate"
              value={`${(reports?.stats.conversionRate || 0).toFixed(1)}%`}
              subtitle={`${reports?.stats.converted || 0} converted`}
              icon={Target}
              variant="success"
            />
            <StatCard
              title="Confirmed Revenue"
              value={formatCompactCurrency(reports?.stats.totalRevenue || 0)}
              subtitle={formatCurrency(reports?.stats.totalRevenue || 0)}
              icon={DollarSign}
              variant="primary"
            />
            <StatCard
              title="Forecast"
              value={formatCompactCurrency(reports?.stats.forecastRevenue || 0)}
              subtitle="High interest pipeline"
              icon={TrendingUp}
              variant="warning"
            />
            <StatCard
              title="Pipeline Potential"
              value={formatCompactCurrency(reports?.stats.pipelineRevenue || 0)}
              subtitle="Active leads value"
              icon={BarChart3}
            />
          </div>

          <Card className="shadow-card rounded-2xl border-0">
            <CardHeader className="pb-2">
              <CardTitle>Lead Volume</CardTitle>
              <CardDescription className="font-body">
                Leads vs conversions by month — {selectedSourceName}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <LeadVolumeChart data={reports?.monthlyData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card className="shadow-card rounded-2xl border-0">
              <CardHeader className="pb-2">
                <CardTitle>Room Distribution</CardTitle>
                <CardDescription className="font-body">Preference mix for this source</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <RoomDistributionChart roomData={reports?.roomData} />
              </CardContent>
            </Card>

            <Card className="shadow-card rounded-2xl border-0">
              <CardHeader className="pb-2">
                <CardTitle>Nationality</CardTitle>
                <CardDescription className="font-body">Inferred from phone country codes</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <NationalityDistributionChart nationalityData={reports?.nationalityData} />
              </CardContent>
            </Card>

            <Card className="shadow-card rounded-2xl border-0 lg:col-span-2 xl:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle>Pipeline Status</CardTitle>
                <CardDescription className="font-body">Lead status breakdown for this source</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <PipelineStatusChart statusData={reports?.statusData} />
              </CardContent>
            </Card>

            <Card className="shadow-card rounded-2xl border-0 lg:col-span-2 xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Pipeline Revenue</CardTitle>
                <CardDescription className="font-body">
                  Potential revenue by status — room price per lead
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <PipelineRevenueByStatusChart
                  statusRevenueData={reports?.statusRevenueData}
                  formatCurrency={formatCurrency}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
