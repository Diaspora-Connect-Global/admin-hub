import { Users, Wallet, AlertTriangle, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { TransactionsChart } from "@/components/dashboard/TransactionsChart";
import { RecentDisputes } from "@/components/dashboard/RecentDisputes";

export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            High-level operational overview of your platform
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Users"
            value="12,847"
            change={12.5}
            trend="up"
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            label="Total Escrow Balance"
            value="$2.4M"
            change={8.2}
            trend="up"
            icon={<Wallet className="w-5 h-5" />}
          />
          <MetricCard
            label="Active Disputes"
            value="23"
            change={-15}
            trend="down"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <MetricCard
            label="Monthly Volume"
            value="$847K"
            change={24.3}
            trend="up"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Charts & Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionsChart />
          </div>
          <div>
            <CriticalAlerts />
          </div>
        </div>

        {/* Recent Disputes Table */}
        <RecentDisputes />
      </div>
    </AdminLayout>
  );
}
