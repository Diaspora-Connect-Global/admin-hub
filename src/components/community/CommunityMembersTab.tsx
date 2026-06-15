import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, UserPlus } from "lucide-react";
import { getStatusBadge } from "./statusBadge";

interface CommunityMemberRow {
  id: string;
  name: string;
  roles: string[];
  associationsCount: number;
  joinedAt?: string;
  status: string;
}

interface CommunityMembersTabProps {
  communityMemberRows: CommunityMemberRow[];
  setInviteMemberOpen: (open: boolean) => void;
}

export function CommunityMembersTab({
  communityMemberRows,
  setInviteMemberOpen,
}: CommunityMembersTabProps) {
  return (
    <TabsContent value="members" className="space-y-4">
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
