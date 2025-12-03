import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  Landmark,
  FileText,
  Briefcase,
  Wallet,
  Plus,
  UserPlus,
  PlusSquare,
  RefreshCw,
  Search,
  Calendar,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UserGrowthChart } from "@/components/dashboard/UserGrowthChart";
import { CommunityEngagementChart } from "@/components/dashboard/CommunityEngagementChart";
import { EscrowActivityChart } from "@/components/dashboard/EscrowActivityChart";
import { RecentSignups } from "@/components/dashboard/RecentSignups";
import { PendingPosts } from "@/components/dashboard/PendingPosts";
import { SystemAlerts } from "@/components/dashboard/SystemAlerts";
import { QuickLinks } from "@/components/dashboard/QuickLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("30");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor platform health, user engagement, transactions, and critical alerts at a glance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Top Bar: Search & Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users, communities, associations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={() => navigate("/communities")}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Community</span>
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/users")}>
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite User</span>
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/associations")}>
              <PlusSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Create Association</span>
            </Button>
          </div>
        </div>

        {/* Metric Cards - First Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            label="Total Users"
            value="12,847"
            change={8.5}
            trend="up"
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            label="Active Communities"
            value="48"
            change={12.3}
            trend="up"
            icon={<Building2 className="w-5 h-5" />}
          />
          <MetricCard
            label="Associations"
            value="156"
            change={5.7}
            trend="up"
            icon={<Landmark className="w-5 h-5" />}
          />
          <MetricCard
            label="Pending Posts"
            value="23"
            trend="neutral"
            icon={<FileText className="w-5 h-5" />}
          />
          <MetricCard
            label="Pending Opportunities"
            value="12"
            trend="neutral"
            icon={<Briefcase className="w-5 h-5" />}
          />
          <MetricCard
            label="Escrow Transactions"
            value="$2.4M"
            change={24.3}
            trend="up"
            icon={<Wallet className="w-5 h-5" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <UserGrowthChart />
          <CommunityEngagementChart />
          <EscrowActivityChart />
        </div>

        {/* Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentSignups />
          <PendingPosts />
          <SystemAlerts />
        </div>

        {/* Quick Links Footer */}
        <QuickLinks />
      </div>
    </AdminLayout>
  );
}
