import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

interface AuditLogRow {
  timestamp?: string;
  action?: string;
  performedBy: string;
  notes: string;
}

interface CommunityAuditTabProps {
  auditLogs: AuditLogRow[];
}

export function CommunityAuditTab({ auditLogs }: CommunityAuditTabProps) {
  return (
    <TabsContent value="audit" className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Audit Log</CardTitle>
              <CardDescription>Immutable log of admin actions on this community.</CardDescription>
            </div>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log, idx) => (
                <TableRow key={idx} className="border-border/50">
                  <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                  <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                  <TableCell>{log.performedBy}</TableCell>
                  <TableCell className="text-muted-foreground">{log.notes}</TableCell>
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
