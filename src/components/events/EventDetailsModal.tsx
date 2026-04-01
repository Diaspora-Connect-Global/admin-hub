import { format } from "date-fns";
import { Event } from "@/types/events";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Edit, 
  ToggleLeft, 
  Users, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  Video,
  Eye,
  TrendingUp,
  MessageSquare,
  DollarSign
} from "lucide-react";

interface EventDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onEdit: (event: Event) => void;
  onTogglePublish: (event: Event) => void;
  onCancel: (event: Event) => void;
  onManageRegistrations: (event: Event) => void;
  onDelete: (event: Event) => void;
}

const statusVariants: Record<string, "active" | "warning" | "inactive" | "error" | "pending"> = {
  PUBLISHED: "active",
  DRAFT: "pending",
  COMPLETED: "inactive",
  CANCELLED: "error",
};

export function EventDetailsModal({
  open,
  onOpenChange,
  event,
  onEdit,
  onTogglePublish,
  onCancel,
  onManageRegistrations,
  onDelete,
}: EventDetailsModalProps) {
  if (!event) return null;

  const normalizedStatus = (event.status ?? "").toUpperCase();
  const isVirtual = (event.locationType ?? "").toUpperCase() === "VIRTUAL";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="mt-4 space-y-6">
            {/* Banner */}
            <div className="relative h-40 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              {event.coverImageUrl ? (
                <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">📅</span>
              )}
            </div>

            {/* Header Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold text-foreground">{event.title}</h2>
                <StatusBadge variant={statusVariants[normalizedStatus] ?? "inactive"}>
                  {event.status}
                </StatusBadge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{event.startAt ? format(new Date(event.startAt), "MMM d, yyyy") : ""}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                    {event.startAt ? format(new Date(event.startAt), "h:mm a") : ""} -{" "}
                    {event.endAt ? format(new Date(event.endAt), "h:mm a") : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {isVirtual ? (
                  <>
                    <Video className="h-4 w-4" />
                    <span>{event.locationDetails?.virtualLink || "Virtual Event"}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>
                      {event.locationDetails?.address ||
                        event.locationDetails?.venueName ||
                        [event.locationDetails?.city, event.locationDetails?.country].filter(Boolean).join(", ") ||
                        "—"}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {event.isPaid && event.tickets?.[0]?.priceInCents != null ? (
                  <span className="text-lg font-bold text-foreground">
                    ${(event.tickets[0].priceInCents / 100).toFixed(0)}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-primary">Free Event</span>
                )}
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {event.registrationCount}
                  {event.availableSpots != null && ` / ${event.availableSpots}`} registered
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => onTogglePublish(event)}>
                <ToggleLeft className="h-4 w-4 mr-1.5" />
                {normalizedStatus === "PUBLISHED" ? "Unpublish" : "Publish"}
              </Button>
              {normalizedStatus !== "CANCELLED" && (
                <Button variant="outline" size="sm" onClick={() => onCancel(event)}>
                  <ToggleLeft className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => onManageRegistrations(event)}>
                <Users className="h-4 w-4 mr-1.5" />
                Registrations
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(event)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="registrations">Registrations</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Insights */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Event Insights</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-xs">Registrations</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">{event.registrationCount}</p>
                    </div>
                    {event.availableSpots != null && (
                      <div className="p-3 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Eye className="h-4 w-4" />
                          <span className="text-xs">Available Spots</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">{event.availableSpots}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="registrations" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Click "Registrations" button above to manage attendees</p>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No comments yet</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}