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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Community {
  id: string;
  name: string;
  communityType?: { name?: string } | null;
  memberCount?: number | null;
  joinPolicy: string;
  createdAt: string;
}

interface Association {
  id: string;
  name: string;
  description?: string;
}

interface CommunitiesReportTabProps {
  communityEngagementLoading: boolean;
  communityEngagementData:
    | { getCommunityEngagementStatsFull: { byDay: Array<{ date: string; posts?: number; reactions?: number }> } }
    | undefined
    | null;
  communities: Community[];
  communitiesLoading: boolean;
  associations: Association[];
  associationsLoading: boolean;
}

export function CommunitiesReportTab({
  communityEngagementLoading,
  communityEngagementData,
  communities,
  communitiesLoading,
  associations,
  associationsLoading,
}: CommunitiesReportTabProps) {
  return (
    <TabsContent value="communities" className="space-y-6">
      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Posts &amp; Reactions Over Time</h3>
          <p className="text-sm text-muted-foreground">
            Daily posts and reactions across all communities (last 30 days)
          </p>
        </div>
        <div className="h-[300px]">
          {communityEngagementLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          ) : (communityEngagementData?.getCommunityEngagementStatsFull?.byDay ?? []).reduce(
              (sum, d) => sum + (d.posts ?? 0),
              0
            ) === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No posts in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={communityEngagementData!.getCommunityEngagementStatsFull.byDay}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="posts"
                  fill="hsl(var(--primary))"
                  name="Posts"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="reactions"
                  fill="hsl(142, 72%, 42%)"
                  name="Reactions"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Communities table */}
      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Communities</h3>
          <p className="text-sm text-muted-foreground">
            All communities on the platform, sorted by most recently created
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Join Policy</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {communitiesLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : communities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No communities found
                </TableCell>
              </TableRow>
            ) : (
              communities.map((community) => (
                <TableRow key={community.id} className="border-border/50">
                  <TableCell className="font-medium">{community.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {community.communityType?.name ?? "—"}
                  </TableCell>
                  <TableCell>{community.memberCount?.toLocaleString() ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {community.joinPolicy.toLowerCase().replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(community.createdAt).toLocaleDateString()}
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

      {/* Associations table */}
      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Associations</h3>
          <p className="text-sm text-muted-foreground">
            All associations registered on the platform
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {associationsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : associations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  No associations found
                </TableCell>
              </TableRow>
            ) : (
              associations.map((assoc) => (
                <TableRow key={assoc.id} className="border-border/50">
                  <TableCell className="font-medium">{assoc.name}</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
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
