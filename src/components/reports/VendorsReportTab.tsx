import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatAmount } from "./shared";

interface TopVendor {
  vendorId: string;
  vendorName: string;
  productsSold: number;
  revenue: number;
  currency?: string;
  rating?: number | null;
}

interface VendorsReportTabProps {
  vendorPeriod: string;
  setVendorPeriod: (value: string) => void;
  vendorTotalRevenue: number;
  vendorTotalOrders: number;
  vendorAnalyticsLoading: boolean;
  vendorSalesByDay: Array<{ date: string; sales: number; orders: number }>;
  topVendors: TopVendor[];
}

export function VendorsReportTab({
  vendorPeriod,
  setVendorPeriod,
  vendorTotalRevenue,
  vendorTotalOrders,
  vendorAnalyticsLoading,
  vendorSalesByDay,
  topVendors,
}: VendorsReportTabProps) {
  return (
    <TabsContent value="vendors" className="space-y-6">
      {/* Period selector + summary row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Select value={vendorPeriod} onValueChange={setVendorPeriod}>
            <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="last_365_days">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">
            Total Revenue:{" "}
            <span className="font-semibold text-foreground">
              {formatAmount(vendorTotalRevenue)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Total Orders:{" "}
            <span className="font-semibold text-foreground">
              {vendorTotalOrders.toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      {/* Sales Over Time chart */}
      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Vendor Sales Over Time</h3>
          <p className="text-sm text-muted-foreground">Daily sales revenue across all vendors</p>
        </div>
        <div className="h-[300px]">
          {vendorAnalyticsLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Loading…</p>
            </div>
          ) : vendorSalesByDay.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                No sales data available for this period
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vendorSalesByDay}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) =>
                    name === "sales"
                      ? [formatAmount(value), "Revenue"]
                      : [value.toLocaleString(), "Orders"]
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Revenue"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(142, 72%, 42%)"
                  strokeWidth={2}
                  name="Orders"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Selling Vendors table */}
      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Top Selling Vendors</h3>
          <p className="text-sm text-muted-foreground">
            Vendors with highest revenue for the selected period
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Vendor Name</TableHead>
              <TableHead>Products Sold</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendorAnalyticsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Loading…
                </TableCell>
              </TableRow>
            ) : topVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  No vendor data available for this period
                </TableCell>
              </TableRow>
            ) : (
              topVendors.map((v) => (
                <TableRow key={v.vendorId} className="border-border/50">
                  <TableCell className="font-medium">{v.vendorName}</TableCell>
                  <TableCell>{v.productsSold.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">
                    {formatAmount(v.revenue, v.currency)}
                  </TableCell>
                  <TableCell>
                    {v.rating != null ? (
                      <span className="text-sm">{v.rating.toFixed(1)} / 5.0</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
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
