import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Download, UserPlus, X } from "lucide-react";
import { getStatusBadge } from "./statusBadge";
import { JoinPolicyBanner, type JoinPolicyValue } from "@/components/JoinPolicyBanner";

interface CommunityMemberRow {
  id: string;
  name: string;
  roles: string[];
  associationsCount: number;
  joinedAt?: string;
  status: string;
}

interface PendingRequest {
  userId: string;
  requestedAt: string;
}

interface CommunityMembersTabProps {
  communityMemberRows: CommunityMemberRow[];
  setInviteMemberOpen: (open: boolean) => void;
  joinPolicy: JoinPolicyValue;
  pendingRequests: PendingRequest[];
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  /** Resolve a userId to a display name + email for the pending list. */
  resolveUser: (userId: string) => { name: string; email: string };
}

export function CommunityMembersTab({
  communityMemberRows,
  setInviteMemberOpen,
  joinPolicy,
  pendingRequests,
  onApprove,
  onReject,
  resolveUser,
}: CommunityMembersTabProps) {
  return (
    <TabsContent value="members" className="space-y-4">
      <JoinPolicyBanner joinPolicy={joinPolicy} entityLabel="community" />

      {pendingRequests.length > 0 && (
        <Card className="glass border-warning/30">
          <CardHeader>
            <CardTitle className="text-base">Pending join requests ({pendingRequests.length})</CardTitle>
            <CardDescription>Review each request and approve or decline it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map((req) => {
              const u = resolveUser(req.userId);
              return (
              <div
                key={req.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20"
              >
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.email}
                    {req.requestedAt ? ` · ${new Date(req.requestedAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-success" onClick={() => onApprove(req.userId)}>
                    <Check className="mr-1 h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => onReject(req.userId)}>
                    <X className="mr-1 h-3 w-3" /> Decline
                  </Button>
                </div>
              </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Members ({communityMemberRows.length})</CardTitle>
              <CardDescription>Community members and their roles.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
              <Button size="sm" onClick={() => setInviteMemberOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Invite Member</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Member Name</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Associations</TableHead>
                <TableHead>Joined At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {communityMemberRows.map((member) => (
                <TableRow key={member.id} className="border-border/50">
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">{member.roles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}</div>
                  </TableCell>
                  <TableCell>{member.associationsCount}</TableCell>
                  <TableCell className="text-muted-foreground">{member.joinedAt}</TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">View</Button>
                      <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
