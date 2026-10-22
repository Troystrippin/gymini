import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
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
        <PieChart
          data={data}
          margin={{ top: 20, right: 15, left: 0, bottom: 1 }}
        >
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            fill={COLORS.primary}
          />
        </PieChart>
        <Tooltip />
      </ResponsiveContainer>
    </div>
  );
}
