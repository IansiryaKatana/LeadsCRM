import { useMemo } from "react";
import { getSourceConfig } from "@/types/crm";
import { useLeadSources } from "@/hooks/useLeadSources";
import { CHART_PALETTE } from "@/constants/chartTheme";
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
  name: string;
  icon: string;
  leads: number;
  color: string;
}

/** Source | bar track | count */
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
          name: sourceConfig?.label || item.source,
          icon: sourceConfig?.icon || "📊",
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
    <div
      className={cn(
        "bg-card rounded-2xl p-5 sm:p-6 shadow-card flex flex-col min-h-[420px] h-full",
        className
      )}
    >
      <div className="mb-4 sm:mb-5 shrink-0">
        <h3 className="font-display text-xl font-bold tracking-tight">Channel Performance</h3>
        <p className="text-sm text-muted-foreground font-body mt-0.5">
          Leads by acquisition source
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground font-body text-sm">
          No channel data in this period
        </div>
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
                key={channel.name}
                className="grid items-center gap-x-3 py-2.5 sm:py-3 border-b border-border/40 last:border-b-0"
                style={{ gridTemplateColumns: ROW_GRID }}
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <span
                    className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-base sm:text-lg shadow-sm"
                    style={{ backgroundColor: channel.color }}
                    aria-hidden
                  >
                    {channel.icon}
                  </span>
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
    </div>
  );
}
