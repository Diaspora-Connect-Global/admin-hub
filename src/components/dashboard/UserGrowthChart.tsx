import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { date: "Nov 3", new_users: 45 },
  { date: "Nov 5", new_users: 52 },
  { date: "Nov 7", new_users: 38 },
  { date: "Nov 9", new_users: 65 },
  { date: "Nov 11", new_users: 48 },
  { date: "Nov 13", new_users: 72 },
  { date: "Nov 15", new_users: 58 },
  { date: "Nov 17", new_users: 81 },
  { date: "Nov 19", new_users: 63 },
  { date: "Nov 21", new_users: 95 },
  { date: "Nov 23", new_users: 78 },
  { date: "Nov 25", new_users: 110 },
  { date: "Nov 27", new_users: 88 },
  { date: "Nov 29", new_users: 125 },
  { date: "Dec 1", new_users: 102 },
];

export function UserGrowthChart() {
  return (
    <div className="glass rounded-xl p-5 animate-fade-in h-full">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">User Growth Trend</h3>
        <p className="text-sm text-muted-foreground">Daily new user registrations</p>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 10%)",
                border: "1px solid hsl(222, 30%, 18%)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
              labelStyle={{ color: "hsl(210, 40%, 98%)" }}
              itemStyle={{ color: "hsl(174, 72%, 46%)" }}
            />
            <Line
              type="monotone"
              dataKey="new_users"
              name="New Users"
              stroke="hsl(174, 72%, 46%)"
              strokeWidth={2}
              dot={{ fill: "hsl(174, 72%, 46%)", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "hsl(174, 72%, 46%)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
