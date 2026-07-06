import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CHART_COLORS, CHART_PALETTE } from "@/constants/chartTheme";
import { LEAD_STATUS_CONFIG, ROOM_CHOICE_CONFIG } from "@/types/crm";
import { ChartEmptyState } from "@/components/charts/chart-empty-state";

const leadVolumeConfig = {
  leads: { label: "Leads", color: CHART_COLORS.primary },
  converted: { label: "Converted", color: CHART_COLORS.successMuted },
} satisfies ChartConfig;

const STATUS_CHART_COLORS: Record<string, string> = {
  new: CHART_COLORS.primary,
  awaiting_outreach: "hsl(211, 70%, 78%)",
  low_engagement: CHART_COLORS.mutedForeground,
  high_interest: CHART_COLORS.accent,
  converted: CHART_COLORS.success,
  closed: CHART_COLORS.destructive,
};

type MonthlyLeadDatum = {
  month: string;
  leads: number;
  converted: number;
  revenue?: number;
};

type DistributionDatum = {
  key: string;
  name: string;
  value: number;
};

interface LeadVolumeChartProps {
  data?: MonthlyLeadDatum[];
}

export function LeadVolumeChart({ data }: LeadVolumeChartProps) {
  if (!data?.length) {
    return <ChartEmptyState message="No leads in this period" />;
  }

  return (
    <ChartContainer config={leadVolumeConfig} className="h-full min-h-[12rem] w-full aspect-auto">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="24%" barGap={8}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="leads" fill="var(--color-leads)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="converted" fill="var(--color-converted)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

function buildRoomChartConfig(): ChartConfig {
  const config: ChartConfig = {};
  Object.keys(ROOM_CHOICE_CONFIG).forEach((key, index) => {
    config[key] = {
      label: ROOM_CHOICE_CONFIG[key as keyof typeof ROOM_CHOICE_CONFIG].label,
      color: CHART_PALETTE[index % CHART_PALETTE.length],
    };
  });
  return config;
}

function buildStatusChartConfig(): ChartConfig {
  const config: ChartConfig = {};
  Object.entries(LEAD_STATUS_CONFIG).forEach(([key, { label }]) => {
    config[key] = {
      label,
      color: STATUS_CHART_COLORS[key] ?? CHART_PALETTE[4],
    };
  });
  return config;
}

interface RoomDistributionChartProps {
  roomData?: Record<string, number>;
}

export function RoomDistributionChart({ roomData }: RoomDistributionChartProps) {
  const chartConfig = useMemo(() => buildRoomChartConfig(), []);

  const chartData = useMemo<DistributionDatum[]>(
    () =>
      Object.entries(ROOM_CHOICE_CONFIG)
        .map(([key, config]) => ({
          key,
          name: config.label,
          value: roomData?.[key] || 0,
        }))
        .filter((item) => item.value > 0),
    [roomData],
  );

  if (chartData.length === 0) {
    return <ChartEmptyState message="No room data in this period" />;
  }

  return (
    <ChartContainer config={chartConfig} className="mx-auto h-[18rem] w-full max-w-md aspect-square">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="key" />} />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="key"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={3}
          strokeWidth={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} className="-translate-y-2 flex-wrap gap-2" />
      </PieChart>
    </ChartContainer>
  );
}

interface PipelineStatusChartProps {
  statusData?: Record<string, number>;
}

export function PipelineStatusChart({ statusData }: PipelineStatusChartProps) {
  const chartConfig = useMemo(() => buildStatusChartConfig(), []);

  const chartData = useMemo<DistributionDatum[]>(
    () =>
      Object.entries(LEAD_STATUS_CONFIG)
        .map(([key, config]) => ({
          key,
          name: config.label,
          value: statusData?.[key] || 0,
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
    [statusData],
  );

  if (chartData.length === 0) {
    return <ChartEmptyState message="No status data in this period" />;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[18rem] w-full aspect-auto">
      <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          type="category"
          dataKey="name"
          width={112}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" name="Leads" radius={[0, 6, 6, 0]} barSize={24}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

interface NationalityDistributionChartProps {
  nationalityData?: Record<string, number>;
}

function nationalityKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

export function NationalityDistributionChart({ nationalityData }: NationalityDistributionChartProps) {
  const chartData = useMemo<DistributionDatum[]>(
    () =>
      Object.entries(nationalityData ?? {})
        .map(([name, value]) => ({
          key: nationalityKey(name),
          name,
          value,
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
    [nationalityData],
  );

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach((item, index) => {
      config[item.key] = {
        label: item.name,
        color: CHART_PALETTE[index % CHART_PALETTE.length],
      };
    });
    return config;
  }, [chartData]);

  if (chartData.length === 0) {
    return <ChartEmptyState message="No nationality data in this period" />;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[18rem] w-full aspect-auto">
      <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          type="category"
          dataKey="name"
          width={128}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" name="Leads" radius={[0, 6, 6, 0]} barSize={24}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

interface FollowUpTypeChartDatum {
  name: string;
  typeKey: string;
  conversionRate: number;
  count: number;
}

interface FollowUpTypeChartProps {
  data: FollowUpTypeChartDatum[];
}

export function FollowUpTypeChart({ data }: FollowUpTypeChartProps) {
  const chartConfig = useMemo(() => {
    const config: ChartConfig = { conversionRate: { label: "Conversion rate", color: CHART_COLORS.primary } };
    data.forEach((item, index) => {
      config[item.typeKey] = {
        label: item.name,
        color: CHART_PALETTE[index % CHART_PALETTE.length],
      };
    });
    return config;
  }, [data]);

  if (!data.length) {
    return <ChartEmptyState message="No follow-up type data in this period" />;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[18rem] w-full aspect-auto">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          angle={-32}
          textAnchor="end"
          height={72}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} tickFormatter={(v) => `${v}%`} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {Number(value).toFixed(1)}% ({item.payload.count} follow-ups)
                </span>
              )}
            />
          }
        />
        <Bar dataKey="conversionRate" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.typeKey} fill={`var(--color-${entry.typeKey})`} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

interface TeamMemberChartDatum {
  name: string;
  revenue?: number;
  rate?: number;
}

interface TeamRevenueChartProps {
  data: TeamMemberChartDatum[];
  formatValue: (value: number) => string;
}

export function TeamRevenueChart({ data, formatValue }: TeamRevenueChartProps) {
  const chartConfig = {
    revenue: { label: "Revenue", color: CHART_COLORS.primary },
  } satisfies ChartConfig;

  if (!data.length) {
    return <ChartEmptyState message="No revenue data available" />;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[18rem] w-full aspect-auto">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} tickFormatter={(v) => formatValue(v)} />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => formatValue(Number(value))} />}
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

interface TeamConversionChartProps {
  data: TeamMemberChartDatum[];
}

export function TeamConversionChart({ data }: TeamConversionChartProps) {
  const chartConfig = {
    rate: { label: "Conversion rate", color: CHART_COLORS.success },
  } satisfies ChartConfig;

  if (!data.length) {
    return <ChartEmptyState message="No conversion data available" />;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[18rem] w-full aspect-auto">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} tickFormatter={(v) => `${v}%`} />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(1)}%`} />}
        />
        <Bar dataKey="rate" fill="var(--color-rate)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
