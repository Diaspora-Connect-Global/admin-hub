import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Eye, Users, Activity, MessageSquare } from "lucide-react";
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
import { truncateId } from "./shared";

interface ChatTypeDatum {
  name: string;
  value: number;
  color: string;
}

interface ActiveChat {
  chatId: string;
  chatName: string;
  chatType: string;
  memberCount: number;
  messageCount: number;
  lastActiveAt: string;
}

interface ChatsReportTabProps {
  chatPeriod: string;
  setChatPeriod: (value: string) => void;
  chatAnalyticsLoading: boolean;
  chatAnalyticsData:
    | {
        getChatVolumeAnalytics?: {
          totalMessages?: number;
          dmCount?: number;
          groupCount?: number;
        } | null;
      }
    | undefined
    | null;
  chatVolumeByDay: Array<{ date: string; dm: number; group: number }>;
  chatTypePieData: ChatTypeDatum[];
  topActiveChats: ActiveChat[];
}

export function ChatsReportTab({
  chatPeriod,
  setChatPeriod,
  chatAnalyticsLoading,
  chatAnalyticsData,
  chatVolumeByDay,
  chatTypePieData,
  topActiveChats,
}: ChatsReportTabProps) {
  return (
    <TabsContent value="chats" className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={chatPeriod} onValueChange={setChatPeriod}>
            <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key metrics cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-xl p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MessageSquare className="h-4 w-4" />
            Total Messages
          </div>
          <p className="text-2xl font-bold text-foreground">
            {chatAnalyticsLoading
              ? "—"
              : (chatAnalyticsData?.getChatVolumeAnalytics?.totalMessages ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">across DMs and group chats</p>
        </div>
        <div className="glass rounded-xl p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Activity className="h-4 w-4" />
            Active Conversations
          </div>
          <p className="text-2xl font-bold text-foreground">
            {chatAnalyticsLoading
              ? "—"
              : ((chatAnalyticsData?.getChatVolumeAnalytics?.dmCount ?? 0) +
                  (chatAnalyticsData?.getChatVolumeAnalytics?.groupCount ?? 0)).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {chatAnalyticsLoading
              ? ""
              : `${(chatAnalyticsData?.getChatVolumeAnalytics?.dmCount ?? 0).toLocaleString()} DM · ${(chatAnalyticsData?.getChatVolumeAnalytics?.groupCount ?? 0).toLocaleString()} group`}
          </p>
        </div>
        <div className="glass rounded-xl p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            Active Users
          </div>
          <p className="text-2xl font-bold text-foreground">
            {chatAnalyticsLoading
              ? "—"
              : topActiveChats.length > 0
              ? topActiveChats.reduce((sum, c) => sum + c.memberCount, 0).toLocaleString()
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground">total members across top chats</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: BarChart - Message Volume by Day */}
        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Message Volume Over Time</h3>
            <p className="text-sm text-muted-foreground">DM vs Group message counts by day (metadata only)</p>
          </div>
          <div className="h-[300px]">
            {chatAnalyticsLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading…</div>
            ) : chatVolumeByDay.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data for selected period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chatVolumeByDay}>
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
                  <Bar dataKey="dm" name="Direct Messages" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="group" name="Group Chats" fill="hsl(262, 83%, 58%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: PieChart - DM vs Group split */}
        <div className="glass rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Chat Type Distribution</h3>
            <p className="text-sm text-muted-foreground">
              {chatAnalyticsData?.getChatVolumeAnalytics
                ? `Total messages: ${(chatAnalyticsData.getChatVolumeAnalytics.totalMessages ?? 0).toLocaleString()}`
                : "DM vs Group conversation split"}
            </p>
          </div>
          <div className="h-[300px]">
            {chatAnalyticsLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading…</div>
            ) : chatTypePieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chatTypePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chatTypePieData.map((entry, index) => (
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
            )}
          </div>
        </div>
      </div>

      {/* Top Active Chats Table */}
      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Most Active Chats</h3>
          <p className="text-sm text-muted-foreground">Chats with highest message activity (E2E encrypted - metadata only)</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Chat ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chatAnalyticsLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">Loading…</TableCell>
              </TableRow>
            ) : topActiveChats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">No active chats found</TableCell>
              </TableRow>
            ) : (
              topActiveChats.map((chat) => (
                <TableRow key={chat.chatId} className="border-border/50">
                  <TableCell className="font-mono text-sm">{truncateId(chat.chatId)}</TableCell>
                  <TableCell className="max-w-[180px] truncate font-medium">{chat.chatName}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        chat.chatType === "DM"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                      }
                    >
                      {chat.chatType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {chat.memberCount}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{chat.messageCount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(chat.lastActiveAt).toLocaleDateString()}
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
