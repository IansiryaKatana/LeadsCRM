import { useMemo } from "react";
import { getSourceConfig } from "@/types/crm";
import { useLeadSources } from "@/hooks/useLeadSources";
import { CHART_PALETTE } from "@/constants/chartTheme";
import { SourceIconBadge } from "@/utils/sourceIcons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import { cn } from "@/lib/utils";

interface ChannelData {
  source: string;
  leads: number;
  converted: number;
  revenue: number;
}

interface ChannelPerformanceProps {
  data: ChannelData[];
  className?: string;
}

interface ChannelRow {
  slug: string;
  name: string;
  leads: number;
  color: string;
}

const ROW_GRID = "minmax(0, 1.15fr) minmax(0, 1.6fr) 3rem";

function getAxisMax(value: number): number {
  if (value <= 0) return 80;
  if (value <= 10) return 10;
  if (value <= 20) return 20;
  if (value <= 40) return 40;
  if (value <= 60) return 60;
  if (value <= 80) return 80;
  const step = value <= 200 ? 20 : value <= 500 ? 50 : 100;
  return Math.ceil(value / step) * step;
}

export function ChannelPerformanceChart({ data, className }: ChannelPerformanceProps) {
  const { data: sources = [] } = useLeadSources();

  const { rows, axisMax } = useMemo(() => {
    const chartRows: ChannelRow[] = data
      .map((item, index) => {
        const sourceConfig = getSourceConfig(item.source, sources);
        return {
          slug: item.source,
          name: sourceConfig?.label || item.source,
          leads: item.leads,
          color: CHART_PALETTE[index % CHART_PALETTE.length],
        };
      })
      .sort((a, b) => b.leads - a.leads);

    const maxLeads = chartRows.reduce((m, r) => Math.max(m, r.leads), 0);

    return {
      rows: chartRows,
      axisMax: getAxisMax(maxLeads),
    };
  }, [data, sources]);

  return (
    <Card
      className={cn(
        "shadow-card rounded-2xl border-0 flex flex-col min-h-[26.25rem] h-full",
        className,
      )}
    >
      <CardHeader className="shrink-0 pb-2">
        <CardTitle className="font-display text-xl">Channel Performance</CardTitle>
        <CardDescription className="font-body">Leads by acquisition source</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col min-h-0 pt-0">
        {rows.length === 0 ? (
          <ChartEmptyState message="No channel data in this period" />
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div
              className="grid items-end gap-x-3 pb-2 border-b border-border/80 shrink-0"
              style={{ gridTemplateColumns: ROW_GRID }}
            >
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
                Source
              </span>
              <span className="sr-only">Bar</span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body text-right">
                Enquiries
              </span>
            </div>

            <div className="flex-1 flex flex-col py-1 min-h-0 overflow-y-auto scrollbar-thin">
              {rows.map((channel) => (
                <div
                  key={channel.slug}
                  className="grid items-center gap-x-3 py-2.5 sm:py-3 border-b border-border/40 last:border-b-0"
                  style={{ gridTemplateColumns: ROW_GRID }}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <SourceIconBadge slug={channel.slug} color={channel.color} />
                    <span
                      className="text-xs sm:text-sm font-medium text-foreground font-body leading-tight line-clamp-2"
                      title={channel.name}
                    >
                      {channel.name}
                    </span>
                  </div>

                  <div className="relative h-7 sm:h-8 flex items-center">
                    <div className="absolute inset-y-1.5 inset-x-0 rounded-full bg-muted/60" aria-hidden />
                    <div
                      className="relative h-4 sm:h-5 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width:
                          axisMax > 0
                            ? `${Math.max((channel.leads / axisMax) * 100, channel.leads > 0 ? 4 : 0)}%`
                            : "0%",
                        backgroundColor: channel.color,
                        minWidth: channel.leads > 0 ? "6px" : 0,
                      }}
                    />
                  </div>

                  <span className="text-sm sm:text-base font-display font-bold text-foreground text-right tabular-nums">
                    {channel.leads}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
