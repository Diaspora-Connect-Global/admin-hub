import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { community: "Belgian GH", posts: 245, reactions: 1820 },
  { community: "UK Diaspora", posts: 198, reactions: 1450 },
  { community: "US Connect", posts: 312, reactions: 2340 },
  { community: "Canada Net", posts: 156, reactions: 980 },
  { community: "Germany Hub", posts: 189, reactions: 1280 },
];

export function CommunityEngagementChart() {
  return (
    <div className="glass rounded-xl p-5 animate-fade-in h-full">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Community Engagement</h3>
        <p className="text-sm text-muted-foreground">Posts + reactions per community</p>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
            <XAxis
              dataKey="community"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
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
            />
            <Bar
              dataKey="posts"
              name="Posts"
              fill="hsl(174, 72%, 46%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="reactions"
              name="Reactions"
              fill="hsl(217, 91%, 60%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
