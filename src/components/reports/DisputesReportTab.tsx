import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { statusConfig, truncateId } from "./shared";

interface StatusDatum {
  name: string;
  value: number;
  color: string;
}

interface DisputeRow {
  id: string;
  escrowId?: string | null;
  paymentIntentId?: string | null;
  status: string;
  reason?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

interface DisputesReportTabProps {
  disputeSummary: {
    total: number;
    open: number;
    resolved: number;
    resolutionRate: number;
    avgResolutionDays: number | null;
  };
  disputeStatusData: StatusDatum[];
  disputes: DisputeRow[];
}

export function DisputesReportTab({ disputeSummary, disputeStatusData, disputes }: DisputesReportTabProps) {
  return (
    <TabsContent value="disputes" className="space-y-6">
      {/* Summary metrics row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Disputes</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {disputeSummary.total.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Open</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {disputeSummary.open.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {disputeSummary.resolved.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">
            {disputeSummary.avgResolutionDays !== null ? "Avg Resolution Time" : "Resolution Rate"}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {disputeSummary.avgResolutionDays !== null
              ? `${disputeSummary.avgResolutionDays}d`
              : `${disputeSummary.resolutionRate}%`}
          </p>
          {disputeSummary.avgResolutionDays !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Resolution rate: {disputeSummary.resolutionRate}%
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Disputes by Status</h3>
            <p className="text-sm text-muted-foreground">Distribution of dispute statuses</p>
          </div>
          <div className="h-[250px]">
            {disputeStatusData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No dispute data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={disputeStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {disputeStatusData.map((entry, index) => (
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
                    formatter={(value) => <span className="text-muted-foreground text-sm">{statusConfig[value]?.label ?? value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Dispute Summary</h3>
            <p className="text-sm text-muted-foreground">Breakdown by status</p>
          </div>
          <div className="space-y-4">
            {disputeStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No dispute data available</p>
            ) : (
              disputeStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{statusConfig[item.name]?.label ?? item.name}</span>
                  </div>
                  <span className="text-lg font-bold">{item.value}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Recent Disputes</h3>
          <p className="text-sm text-muted-foreground">Latest disputes on the platform</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Dispute ID</TableHead>
              <TableHead>Escrow ID</TableHead>
              <TableHead>Payment Intent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Resolved At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                  No disputes found
                </TableCell>
              </TableRow>
            ) : (
              disputes.map((d) => (
                <TableRow key={d.id} className="border-border/50">
                  <TableCell className="font-mono text-sm">{truncateId(d.id)}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {d.escrowId ? truncateId(d.escrowId) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {d.paymentIntentId ? truncateId(d.paymentIntentId) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusConfig[d.status]?.className}>
                      {statusConfig[d.status]?.label ?? d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-muted-foreground">
                    {d.reason ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
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
