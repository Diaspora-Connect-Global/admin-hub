import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit } from "lucide-react";
import { getStatusBadge } from "./statusBadge";

interface CommunityEvent {
  id: string;
  title?: string;
  locationDetails?: { city?: string; venueName?: string; platform?: string } | null;
  startAt?: string;
  registrationCount?: number;
  status?: string;
}

interface CommunityEventsTabProps {
  communityEvents: CommunityEvent[];
  t: (key: string) => string;
}

export function CommunityEventsTab({ communityEvents, t }: CommunityEventsTabProps) {
  return (
    <TabsContent value="events" className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">Events</CardTitle>
          <CardDescription>Community events and meetups.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Event ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {communityEvents.map((evt) => (
                <TableRow key={evt.id} className="border-border/50">
                  <TableCell className="font-mono text-xs">{evt.id}</TableCell>
                  <TableCell className="font-medium">{evt.title}</TableCell>
                  <TableCell>{evt.locationDetails?.city || evt.locationDetails?.venueName || evt.locationDetails?.platform || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{evt.startAt || "—"}</TableCell>
                  <TableCell>{evt.registrationCount ?? 0}</TableCell>
                  <TableCell>{getStatusBadge(evt.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" aria-label={t('common.view')}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label={t('common.edit')}><Edit className="h-4 w-4" /></Button>
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
