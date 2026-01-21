import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useMonthlyLeadData } from "@/hooks/useMonthlyData";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";

interface RevenueChartProps {
  academicYear?: string;
}

export function RevenueChart({ academicYear }: RevenueChartProps) {
  const { data, isLoading } = useMonthlyLeadData(academicYear);
  const { currency } = useSystemSettingsContext();

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const chartData = data || [];

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-bold">Revenue Forecast</h3>
          <p className="text-sm text-muted-foreground">Monthly revenue trends</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Converted</span>
          </div>
        </div>
      </div>
      
      <div className="h-72">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(211, 100%, 66%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(211, 100%, 66%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(166, 58%, 47%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(166, 58%, 47%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(0, 0%, 88%)" }}
              />
              <YAxis 
                tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(0, 0%, 88%)" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(0, 0%, 88%)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 24px -4px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number) => [`${currency.symbol}${value.toLocaleString()}`, ""]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(211, 100%, 66%)"
                strokeWidth={3}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="converted"
                stroke="hsl(166, 58%, 47%)"
                strokeWidth={2}
                fill="url(#colorConverted)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
