import { TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface NotifTypeDatum {
  name: string;
  value: number;
  color: string;
}

interface NotifHour {
  hour: number;
  deliveredPct: number;
  failedPct: number;
}

interface NotificationsReportTabProps {
  notifLoading: boolean;
  notifVolumeByDay: Array<{ date: string; pushCount: number; inAppCount: number; emailCount: number }>;
  notifTypePieData: NotifTypeDatum[];
  notifTopHours: NotifHour[];
}

export function NotificationsReportTab({
  notifLoading,
  notifVolumeByDay,
  notifTypePieData,
  notifTopHours,
}: NotificationsReportTabProps) {
  return (
    <TabsContent value="notifications" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: BarChart - Notification Volume by Day */}
        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Notification Volume Over Time</h3>
            <p className="text-sm text-muted-foreground">Daily push, in-app, and email notification counts (last 30 days)</p>
          </div>
          <div className="h-[300px]">
            {notifLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading…</div>
            ) : notifVolumeByDay.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data for selected period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={notifVolumeByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="pushCount" name="Push" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="inAppCount" name="In-App" fill="hsl(142, 72%, 42%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="emailCount" name="Email" fill="hsl(38, 92%, 50%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: PieChart - Type Distribution */}
        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Notification Type Distribution</h3>
            <p className="text-sm text-muted-foreground">Breakdown of notifications by type</p>
          </div>
          <div className="h-[300px]">
            {notifLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading…</div>
            ) : notifTypePieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={notifTypePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {notifTypePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Rate by Hour Table */}
      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Delivery Rate by Hour</h3>
          <p className="text-sm text-muted-foreground">Top 10 peak hours by notification activity — delivered vs failed rates</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Hour (UTC)</TableHead>
              <TableHead>Delivered %</TableHead>
              <TableHead>Failed %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">Loading…</TableCell>
              </TableRow>
            ) : notifTopHours.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">No delivery data available</TableCell>
              </TableRow>
            ) : (
              notifTopHours.map((entry) => (
                <TableRow key={entry.hour} className="border-border/50">
                  <TableCell className="font-mono text-sm">
                    {String(entry.hour).padStart(2, "0")}:00
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${Math.min(entry.deliveredPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {entry.deliveredPct.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-destructive"
                          style={{ width: `${Math.min(entry.failedPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {entry.failedPct.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TabsContent>
  );
}
