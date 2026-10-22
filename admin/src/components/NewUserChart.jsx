import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { COLORS } from "../theme";

export default function NewUserChart({ data }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1.5/1",
        maxWidth: 600,
        maxHeight: 250,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 15, left: 0, bottom: 1 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <Line
            dataKey="user"
            type="monotone"
            strokeWidth={2}
            name="New Users"
            stroke={COLORS.primary}
          />
          <XAxis dataKey="date" style={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            width="auto"
            label={{
              value: "New Users",
              position: "insideLeft",
              angle: -90,
              fontSize: 12,
            }}
          />
          <Tooltip />
          <Legend position="insideTopRight" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
