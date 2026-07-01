import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMonthlyLeadData } from "@/hooks/useMonthlyData";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { CHART_COLORS } from "@/constants/chartTheme";
import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import { cn } from "@/lib/utils";

const revenueChartConfig = {
  revenue: { label: "Revenue", color: CHART_COLORS.primary },
  converted: { label: "Converted value", color: CHART_COLORS.success },
} satisfies ChartConfig;

interface RevenueChartProps {
  academicYear?: string | null;
  className?: string;
}

export function RevenueChart({ academicYear, className }: RevenueChartProps) {
  const { data, isLoading } = useMonthlyLeadData(academicYear);
  const { currency } = useSystemSettingsContext();

  if (isLoading) {
    return (
      <Card className={cn("shadow-card rounded-2xl border-0 flex flex-col h-full min-h-[26.25rem]", className)}>
        <CardHeader className="shrink-0">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="h-full min-h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data || [];
  const formatCurrency = (value: number) => `${currency.symbol}${value.toLocaleString()}`;

  return (
    <Card className={cn("shadow-card rounded-2xl border-0 flex flex-col h-full min-h-[26.25rem]", className)}>
      <CardHeader className="shrink-0 pb-2">
        <CardTitle>Revenue Forecast</CardTitle>
        <CardDescription className="font-body">Monthly revenue trends</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col min-h-0 pt-0">
        {chartData.length === 0 ? (
          <ChartEmptyState message="No data available yet" />
        ) : (
          <ChartContainer config={revenueChartConfig} className="h-full min-h-[12rem] w-full aspect-auto">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillConverted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-converted)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-converted)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                fill="url(#fillRevenue)"
              />
              <Area
                type="monotone"
                dataKey="converted"
                stroke="var(--color-converted)"
                strokeWidth={2}
                fill="url(#fillConverted)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
