import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { statusConfig, truncateId } from "./shared";

interface HealthDatum {
  name: string;
  value: number;
  color: string;
}

interface ServiceRow {
  service: string;
  status: string;
  latencyMs?: number | null;
}

interface AuditItem {
  id: string;
  actorId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  createdAt: string;
}

interface SystemReportTabProps {
  systemHealthPieData: HealthDatum[];
  services: ServiceRow[];
  auditItems: AuditItem[];
}

export function SystemReportTab({ systemHealthPieData, services, auditItems }: SystemReportTabProps) {
  return (
    <TabsContent value="system" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Service Status Overview</h3>
            <p className="text-sm text-muted-foreground">Percentage of services by health state</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={systemHealthPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {systemHealthPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value}%`, ""]}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Health Summary</h3>
            <p className="text-sm text-muted-foreground">Service status breakdown</p>
          </div>
          <div className="space-y-3">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No service data available</p>
            ) : (
              services.map((svc, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: svc.status === "healthy" ? "hsl(142, 72%, 42%)" : "hsl(var(--destructive))" }}
                    />
                    <span className="text-sm font-medium capitalize">{svc.service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {svc.latencyMs != null && (
                      <span className="text-xs text-muted-foreground">{svc.latencyMs}ms</span>
                    )}
                    <Badge variant="outline" className={statusConfig[svc.status]?.className}>
                      {statusConfig[svc.status]?.label ?? svc.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Recent Audit Events</h3>
          <p className="text-sm text-muted-foreground">Latest admin actions and system events</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Event ID</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource Type</TableHead>
              <TableHead>Resource ID</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No audit events found
                </TableCell>
              </TableRow>
            ) : (
              auditItems.map((ev: { id: string; actorId?: string; action: string; resourceType?: string; resourceId?: string; createdAt: string }) => (
                <TableRow key={ev.id} className="border-border/50">
                  <TableCell className="font-mono text-sm">{truncateId(ev.id)}</TableCell>
                  <TableCell className="font-mono text-sm">{ev.actorId ? truncateId(ev.actorId) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
                      {ev.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{ev.resourceType ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {ev.resourceId ? truncateId(ev.resourceId) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(ev.createdAt).toLocaleString()}
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
