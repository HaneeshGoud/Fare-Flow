import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { FareHistoryPoint } from "@/lib/simulation";

interface FareHistoryChartProps {
  data: FareHistoryPoint[];
}

const PROVIDER_COLORS: Record<string, string> = {
  Uber: "#3b82f6",
  Ola: "#a855f7",
  Rapido: "#f97316",
  "Namma Yatri": "#22c55e",
};

const PROVIDERS = ["Uber", "Ola", "Rapido", "Namma Yatri"] as const;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-xl text-sm space-y-1.5">
      <p className="text-muted-foreground font-medium mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground">{entry.name}</span>
          </span>
          <span className="font-mono font-semibold">₹{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function FareHistoryChart({ data }: FareHistoryChartProps) {
  const allFares = data.flatMap((d) =>
    PROVIDERS.map((p) => d[p])
  );
  const minFare = Math.min(...allFares);
  const maxFare = Math.max(...allFares);
  const padding = Math.round((maxFare - minFare) * 0.2) || 20;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.4}
        />
        <XAxis
          dataKey="time"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={2}
        />
        <YAxis
          domain={[minFare - padding, maxFare + padding]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `₹${v}`}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
          formatter={(value) => (
            <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
          )}
        />
        {PROVIDERS.map((name) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={PROVIDER_COLORS[name]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
