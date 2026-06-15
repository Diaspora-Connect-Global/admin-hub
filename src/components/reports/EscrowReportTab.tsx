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
import { statusConfig, formatAmount, truncateId } from "./shared";

interface StatusDatum {
  name: string;
  value: number;
  color: string;
}

interface EscrowRow {
  id: string;
  buyerId?: string | null;
  sellerId?: string | null;
  amount?: number | null;
  currency?: string;
  status: string;
  createdAt: string;
}

interface EscrowReportTabProps {
  escrowSummary: {
    totalValue: number;
    pendingCount: number;
    releasedCount: number;
    currency: string;
  };
  escrowStatusData: StatusDatum[];
  escrows: EscrowRow[];
}

export function EscrowReportTab({ escrowSummary, escrowStatusData, escrows }: EscrowReportTabProps) {
  return (
    <TabsContent value="escrow" className="space-y-6">
      {/* Summary metrics row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Escrow Value</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {formatAmount(escrowSummary.totalValue, escrowSummary.currency)}
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Pending / Held</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {escrowSummary.pendingCount.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Released</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {escrowSummary.releasedCount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Escrow Transactions by Status</h3>
            <p className="text-sm text-muted-foreground">Distribution of transaction statuses</p>
          </div>
          <div className="h-[250px]">
            {escrowStatusData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No escrow data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={escrowStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {escrowStatusData.map((entry, index) => (
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
            <h3 className="font-semibold text-foreground">Escrow Summary</h3>
            <p className="text-sm text-muted-foreground">Key escrow metrics</p>
          </div>
          <div className="space-y-4">
            {escrowStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No escrow data available</p>
            ) : (
              escrowStatusData.map((item, index) => (
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
          <h3 className="font-semibold text-foreground">Recent Escrow Transactions</h3>
          <p className="text-sm text-muted-foreground">Latest transactions on the platform</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Transaction ID</TableHead>
              <TableHead>Buyer ID</TableHead>
              <TableHead>Seller ID</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {escrows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  No escrow transactions found
                </TableCell>
              </TableRow>
            ) : (
              escrows.map((e) => (
                <TableRow key={e.id} className="border-border/50">
                  <TableCell className="font-mono text-sm">{truncateId(e.id)}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {e.buyerId ? truncateId(e.buyerId) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {e.sellerId ? truncateId(e.sellerId) : "—"}
                  </TableCell>
                  <TableCell className="font-semibold">{formatAmount(e.amount ?? 0, e.currency)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusConfig[e.status]?.className}>
                      {statusConfig[e.status]?.label ?? e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(e.createdAt).toLocaleDateString()}
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
