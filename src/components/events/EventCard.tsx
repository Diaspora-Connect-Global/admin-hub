import { Event } from "@/types/events";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Users, 
  ToggleLeft, 
  Trash2, 
  MapPin, 
  Video, 
  Clock,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";

interface EventCardProps {
  event: Event;
  onViewDetails: (event: Event) => void;
  onEdit: (event: Event) => void;
  onManageRegistrations: (event: Event) => void;
  onTogglePublish: (event: Event) => void;
  onDelete: (event: Event) => void;
}

const statusVariants: Record<string, "active" | "warning" | "inactive" | "error" | "pending"> = {
  published: "active",
  unpublished: "inactive",
  draft: "pending",
  ongoing: "warning",
  completed: "inactive",
  cancelled: "error",
};

export function EventCard({
  event,
  onViewDetails,
  onEdit,
  onManageRegistrations,
  onTogglePublish,
  onDelete,
}: EventCardProps) {
  const t = useT("events");
  const capacityPercentage = event.hasParticipantLimit && event.maxParticipants 
    ? (event.registeredCount / event.maxParticipants) * 100 
    : 0;

  const statusLabels: Record<string, string> = {
    published: t.published,
    unpublished: t.unpublish,
    draft: t.draft,
    ongoing: t.active,
    completed: t.inactive,
    cancelled: t.error,
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Banner */}
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        {event.bannerImage ? (
          <img 
            src={event.bannerImage} 
            alt={event.title} 
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-5xl">{event.bannerEmoji || "📅"}</span>
        )}
        <div className="absolute right-3 top-3">
          <StatusBadge variant={statusVariants[event.status]}>
            {statusLabels[event.status] || event.status}
          </StatusBadge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="mb-2 text-lg font-semibold text-foreground line-clamp-1">
          {event.title}
        </h3>

        {/* Details */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{event.startTime} - {event.endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            {event.eventType === "virtual" ? (
              <Video className="h-4 w-4 shrink-0" />
            ) : (
              <MapPin className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">
              {event.eventType === "virtual" ? event.virtualLink || t.virtualEvent : event.location}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {event.registeredCount}
              {event.hasParticipantLimit && event.maxParticipants && ` / ${event.maxParticipants}`} {t.registered}
            </span>
          </div>
        </div>

        {/* Capacity Bar (if limited) */}
        {event.hasParticipantLimit && event.maxParticipants && (
          <div className="mb-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  capacityPercentage >= 100
                    ? "bg-destructive"
                    : capacityPercentage >= 80
                    ? "bg-warning"
                    : "bg-primary"
                )}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            {event.isPaid && event.ticketPrice ? (
              <span className="text-lg font-bold text-foreground">
                {event.currency || "$"}{event.ticketPrice}
              </span>
            ) : (
              <span className="text-sm font-medium text-primary">{t.free}</span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewDetails(event)}>
                <Eye className="mr-2 h-4 w-4" />
                {t.viewDetails}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(event)}>
                <Edit className="mr-2 h-4 w-4" />
                {t.editEvent}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageRegistrations(event)}>
                <Users className="mr-2 h-4 w-4" />
                {t.manageRegistrations}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePublish(event)}>
                <ToggleLeft className="mr-2 h-4 w-4" />
                {event.status === "published" ? t.unpublish : t.publish}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(event)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.deleteEvent}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
