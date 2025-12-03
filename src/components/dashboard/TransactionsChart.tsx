import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const data = [
  { date: "Nov 3", transactions: 120, volume: 45000 },
  { date: "Nov 5", transactions: 180, volume: 68000 },
  { date: "Nov 7", transactions: 150, volume: 52000 },
  { date: "Nov 9", transactions: 220, volume: 89000 },
  { date: "Nov 11", transactions: 190, volume: 76000 },
  { date: "Nov 13", transactions: 280, volume: 112000 },
  { date: "Nov 15", transactions: 240, volume: 95000 },
  { date: "Nov 17", transactions: 310, volume: 128000 },
  { date: "Nov 19", transactions: 260, volume: 105000 },
  { date: "Nov 21", transactions: 350, volume: 145000 },
  { date: "Nov 23", transactions: 290, volume: 118000 },
  { date: "Nov 25", transactions: 380, volume: 158000 },
  { date: "Nov 27", transactions: 320, volume: 132000 },
  { date: "Nov 29", transactions: 420, volume: 175000 },
  { date: "Dec 1", transactions: 360, volume: 148000 },
];

export function TransactionsChart() {
  return (
    <div className="glass rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Transactions</h3>
          <p className="text-sm text-muted-foreground">Last 30 days activity</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="transactionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
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
            <Area
              type="monotone"
              dataKey="transactions"
              stroke="hsl(174, 72%, 46%)"
              strokeWidth={2}
              fill="url(#transactionGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
