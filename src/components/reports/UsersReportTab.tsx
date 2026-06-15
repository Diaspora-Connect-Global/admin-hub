import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { truncateId } from "./shared";

interface UsersReportTabProps {
  userGrowthData: Array<{ date: string; newUsers: number }>;
  sortedUsers: Array<{ id: string; email: string; displayName?: string; createdAt: string }>;
}

export function UsersReportTab({ userGrowthData, sortedUsers }: UsersReportTabProps) {
  return (
    <TabsContent value="users" className="space-y-6">
      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">User Registrations Over Time</h3>
          <p className="text-sm text-muted-foreground">New user registrations per day (last 30 days)</p>
        </div>
        <div className="h-[300px]">
          {userGrowthData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No registrations in this period</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="newUsers" stroke="hsl(var(--primary))" strokeWidth={2} name="New Users" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Recent Users</h3>
          <p className="text-sm text-muted-foreground">Latest registered accounts on the platform</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>User ID</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers.map((user: { id: string; email: string; displayName?: string; createdAt: string }) => (
                <TableRow key={user.id} className="border-border/50">
                  <TableCell className="font-mono text-sm">{truncateId(user.id)}</TableCell>
                  <TableCell className="font-medium">{user.displayName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
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
