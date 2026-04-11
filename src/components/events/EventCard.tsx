import { format } from "date-fns";
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
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";

interface EventCardProps {
  event: Event;
  onViewDetails: (event: Event) => void;
  onEdit: (event: Event) => void;
  onManageRegistrations: (event: Event) => void;
  onTogglePublish: (event: Event) => void;
  onCancel: (event: Event) => void;
  onDelete: (event: Event) => void;
}

const statusVariants: Record<string, "active" | "warning" | "inactive" | "error" | "pending"> = {
  PUBLISHED: "active",
  DRAFT: "pending",
  COMPLETED: "inactive",
  CANCELLED: "error",
};

export function EventCard({
  event,
  onViewDetails,
  onEdit,
  onManageRegistrations,
  onTogglePublish,
  onCancel,
  onDelete,
}: EventCardProps) {
  const t = useT("events");
  const normalizedStatus = (event.status ?? "").toUpperCase();
  const isVirtual = (event.locationType ?? "").toUpperCase() === "VIRTUAL";
  const locationLabel =
    event.locationDetails?.virtualLink ||
    event.locationDetails?.address ||
    [event.locationDetails?.city, event.locationDetails?.country].filter(Boolean).join(", ") ||
    "";
  const hasCapacity = event.availableSpots != null && event.availableSpots > 0;
  const capacityPercentage = hasCapacity ? (event.registrationCount / event.availableSpots) * 100 : 0;
  const firstTicketPrice = event.tickets?.[0]?.priceInCents;
  const isPaidEvent = Boolean(event.isPaid);

  const statusLabels: Record<string, string> = {
    PUBLISHED: t.published,
    DRAFT: t.draft,
    COMPLETED: t.completed,
    CANCELLED: t.cancelled,
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Banner */}
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-5xl">📅</span>
        )}
        <div className="absolute right-3 top-3">
          <StatusBadge variant={statusVariants[normalizedStatus] ?? "inactive"}>
            {statusLabels[normalizedStatus] || event.status}
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
            <span>{event.startAt ? format(new Date(event.startAt), "MMM d, yyyy") : ""}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {event.startAt ? format(new Date(event.startAt), "h:mm a") : ""} -{" "}
              {event.endAt ? format(new Date(event.endAt), "h:mm a") : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            {isVirtual ? (
              <Video className="h-4 w-4 shrink-0" />
            ) : (
              <MapPin className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">{isVirtual ? locationLabel || t.virtualEvent : locationLabel || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/80">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {event.registrationCount}
              {hasCapacity && ` / ${event.availableSpots}`} {t.registered}
            </span>
          </div>
        </div>

        {/* Capacity Bar (if limited) */}
        {hasCapacity && event.availableSpots != null && (
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
            {isPaidEvent ? (
              firstTicketPrice != null ? (
                <span className="text-lg font-bold text-foreground">
                  ${(firstTicketPrice / 100).toFixed(0)}
                </span>
              ) : (
                <span className="text-sm font-medium text-foreground">{t.paid}</span>
              )
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
                {normalizedStatus === "PUBLISHED" ? t.unpublish : t.publish}
              </DropdownMenuItem>
              {normalizedStatus !== "CANCELLED" && (
                <DropdownMenuItem onClick={() => onCancel(event)}>
                  <ToggleLeft className="mr-2 h-4 w-4" />
                  Cancel event
                </DropdownMenuItem>
              )}
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
