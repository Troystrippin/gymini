import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { COLORS } from "../theme";

export default function NewUserBar({ data }) {
  return (
    <div style={{ width: "100%", aspectRatio: "1.618/1", maxWidth: 600 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            stroke="#94a3b8"
            strokeDasharray="5 5"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            minTickGap={16}
            tickMargin={8}
          />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={32} />
          <Tooltip />
          <Bar
            dataKey="value"
            fill={COLORS.primary}
            fillOpacity={0.85}
            stroke={COLORS.success}
            strokeWidth={2}
            radius={4}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
