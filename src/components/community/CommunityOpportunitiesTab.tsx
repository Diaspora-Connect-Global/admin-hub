import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Eye } from "lucide-react";
import { getStatusBadge } from "./statusBadge";

interface CommunityOpportunity {
  id: string;
  title?: string;
  type?: string;
  applicationCount?: number;
  status?: string;
  createdAt?: string;
}

interface CommunityOpportunitiesTabProps {
  communityOpportunities: CommunityOpportunity[];
  t: (key: string) => string;
}

export function CommunityOpportunitiesTab({ communityOpportunities, t }: CommunityOpportunitiesTabProps) {
  return (
    <TabsContent value="opportunities" className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">Opportunities</CardTitle>
          <CardDescription>Opportunities posted in this community.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Opportunity ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {communityOpportunities.map((opp) => (
                <TableRow key={opp.id} className="border-border/50">
                  <TableCell className="font-mono text-xs">{opp.id}</TableCell>
                  <TableCell className="font-medium">{opp.title}</TableCell>
                  <TableCell><Badge variant="outline">{opp.type}</Badge></TableCell>
                  <TableCell>{opp.applicationCount ?? 0}</TableCell>
                  <TableCell>{getStatusBadge(opp.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{opp.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="text-success" aria-label="Approve opportunity"><Check className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" aria-label="Reject opportunity"><X className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label={t('common.view')}><Eye className="h-4 w-4" /></Button>
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
