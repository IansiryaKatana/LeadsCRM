import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getSourceConfig } from "@/types/crm";
import { useLeadSources } from "@/hooks/useLeadSources";

interface ChannelData {
  source: string;
  leads: number;
  converted: number;
  revenue: number;
}

interface ChannelPerformanceProps {
  data: ChannelData[];
}

const COLORS = [
  "hsl(211, 100%, 66%)",
  "hsl(47, 100%, 50%)",
  "hsl(166, 58%, 47%)",
  "hsl(0, 100%, 47%)",
  "hsl(280, 70%, 50%)",
  "hsl(30, 100%, 50%)",
  "hsl(180, 70%, 45%)",
];

export function ChannelPerformanceChart({ data }: ChannelPerformanceProps) {
  const { data: sources = [] } = useLeadSources();
  const totalLeads = data.reduce((sum, item) => sum + item.leads, 0);
  
  const chartData = data.map((item) => {
    const sourceConfig = getSourceConfig(item.source, sources);
    return {
      name: sourceConfig?.label || item.source,
      icon: sourceConfig?.icon || "📊",
      leads: item.leads,
      percentage: totalLeads > 0 ? (item.leads / totalLeads) * 100 : 0,
      revenue: item.revenue,
      converted: item.converted,
    };
  }).sort((a, b) => b.leads - a.leads);

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <div className="mb-6">
          <h3 className="font-display text-xl font-bold">Channel Performance</h3>
          <p className="text-sm text-muted-foreground">Leads by acquisition source</p>
        </div>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card">
      <div className="mb-6">
        <h3 className="font-display text-xl font-bold">Channel Performance</h3>
        <p className="text-sm text-muted-foreground">Leads by acquisition source</p>
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 12 }}
              axisLine={{ stroke: "hsl(0, 0%, 88%)" }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={80}
              tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 12 }}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(0, 0%, 88%)",
                borderRadius: "12px",
                boxShadow: "0 4px 24px -4px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [value, "Leads"]}
            />
            <Bar dataKey="leads" radius={[0, 8, 8, 0]} barSize={24}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {chartData.slice(0, 4).map((channel, index) => (
          <div
            key={channel.name}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
          >
            <span className="text-xl">{channel.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{channel.name}</p>
              <p className="text-xs text-muted-foreground">
                {channel.leads} leads • {channel.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
