import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "Funded", value: 45, color: "hsl(174, 72%, 46%)" },
  { name: "Released", value: 32, color: "hsl(142, 72%, 42%)" },
  { name: "Disputed", value: 8, color: "hsl(0, 72%, 51%)" },
  { name: "Pending", value: 15, color: "hsl(38, 92%, 50%)" },
];

export function EscrowActivityChart() {
  return (
    <div className="glass rounded-xl p-5 animate-fade-in h-full">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Escrow Activity</h3>
        <p className="text-sm text-muted-foreground">Distribution by status</p>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 10%)",
                border: "1px solid hsl(222, 30%, 18%)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
              labelStyle={{ color: "hsl(210, 40%, 98%)" }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: "hsl(215, 20%, 55%)", fontSize: "12px" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
