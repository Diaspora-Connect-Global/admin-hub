import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useT } from "@/hooks/useT";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarPlus, Search, Calendar, BarChart3 } from "lucide-react";
import { Event, EventFormData } from "@/types/events";
import { buildEventLocationPayload, requiresPhysicalLocation } from "@/lib/eventLocationPayload";
import { buildEventCapacityPayload } from "@/lib/eventCapacityPayload";
import { DEFAULT_EVENT_VISIBILITY, resolveEventTimezone } from "@/lib/eventSchedulePayload";
import { EventCard } from "@/components/events/EventCard";
import { CreateEditEventModal } from "@/components/events/CreateEditEventModal";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { RegistrationsDrawer } from "@/components/events/RegistrationsDrawer";
import { DeleteEventModal } from "@/components/events/DeleteEventModal";
import { EventAnalyticsWidget } from "@/components/events/EventAnalyticsWidget";
import { toast } from "@/hooks/use-toast";
import {
  useListEvents,
  useGetEvent,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  usePublishEvent,
  useUnpublishEvent,
  useGetUploadUrl,
} from "@/hooks/events";
import { uploadEventBannerToStorage } from "@/lib/eventBannerUpload";
import { getUserId } from "@/stores/session";
import { useSessionStore } from "@/stores/sessionStore";

export default function Events() {
  const location = useLocation();
  const t = useT("events");

  const [listInput, setListInput] = useState<{ limit?: number; offset?: number; searchTerm?: string; status?: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED" }>({ limit: 20, offset: 0, status: "PUBLISHED" });
  const { data: listData, loading: listLoading, error: listError, refetch: refetchList } = useListEvents(listInput);
  const events: Event[] = Array.isArray(listData?.listEvents?.events) ? listData.listEvents.events : [];
  const totalEvents = listData?.listEvents?.total ?? 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PUBLISHED");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [registrationsDrawerOpen, setRegistrationsDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const { data: editingEventData } = useGetEvent(editingEventId);
  const editingEvent = editingEventData?.getEvent ?? null;

  const [createEvent] = useCreateEvent();
  const [updateEvent] = useUpdateEvent();
  const [fetchUploadUrl] = useGetUploadUrl();
  const [deleteEvent] = useDeleteEvent();
  const [publishEvent] = usePublishEvent();
  const [unpublishEvent] = useUnpublishEvent();

  const adminProfile = useSessionStore((state) => state.adminProfile);
  const adminRoleName = adminProfile?.role?.name ?? "UNKNOWN_ROLE";
  const isSystemAdmin = adminRoleName === "SYSTEM_ADMIN";

  const ensureSystemAdmin = (actionLabel: string) => {
    if (isSystemAdmin) return true;
    toast({
      title: "Permission denied",
      description: `${actionLabel} requires SYSTEM_ADMIN. Current role: ${adminRoleName}.`,
      variant: "destructive",
    });
    return false;
  };

  useEffect(() => {
    setListInput((prev) => ({
      ...prev,
      searchTerm: searchQuery.trim() || undefined,
      status: statusFilter === "ALL" ? undefined : (statusFilter as "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED"),
    }));
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredEvents = events
    .filter((event) => {
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "free" && !event.isPaid) ||
        (typeFilter === "paid" && event.isPaid);
      return matchesType;
    })
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.startAt).getTime();
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.startAt).getTime();
      switch (sortBy) {
        case "oldest":
          return aTime - bTime;
        case "date-soonest":
          return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
        case "date-latest":
          return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
        default:
          return bTime - aTime;
      }
    });

  const upcomingCount = events.filter((e) => e.status === "PUBLISHED" || e.status === "DRAFT").length;
  const totalRegistrations = events.reduce((sum, e) => sum + e.registrationCount, 0);
  const totalRevenue = 0;
  const avgAttendance =
    events.length > 0 && events.some((e) => e.availableSpots != null && e.availableSpots > 0)
      ? Math.round(
          events
            .filter((e) => e.availableSpots != null && e.availableSpots > 0)
            .reduce((sum, e) => sum + (e.registrationCount / (e.availableSpots ?? 1)) * 100, 0) /
            events.filter((e) => e.availableSpots != null && e.availableSpots > 0).length
        ) || 0
      : 0;

  const refetch = useCallback(() => {
    refetchList();
  }, [refetchList]);

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setDetailsDrawerOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEventId(event.id);
    setCreateModalOpen(true);
  };

  const handleManageRegistrations = (event: Event) => {
    setSelectedEvent(event);
    setRegistrationsDrawerOpen(true);
  };

  const handleTogglePublish = async (event: Event) => {
    if (!ensureSystemAdmin("Publishing events")) return;

    if (event.status === "PUBLISHED") {
      toast({ title: "Unpublish", description: "Use edit to change status to draft." });
      return;
    }
    try {
      await publishEvent({ variables: { id: event.id } });
      toast({ title: "Event Published", description: "Your event is now live!" });
      refetch();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = (event: Event) => {
    if (!ensureSystemAdmin("Deleting events")) return;
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ensureSystemAdmin("Deleting events")) return;
    if (!eventToDelete) return;
    try {
      await deleteEvent({ variables: { id: eventToDelete.id } });
      toast({ title: "Event Deleted", description: "The event has been permanently deleted." });
      setDeleteModalOpen(false);
      setEventToDelete(null);
      refetch();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleCreateSubmit = async (data: EventFormData) => {
    if (!ensureSystemAdmin(editingEventId ? "Updating events" : "Creating events")) return;

    const ownerId = getUserId();
    if (!ownerId) {
      toast({
        title: "Session error",
        description: "Your user ID is missing. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    const startAt = data.date && data.startTime
      ? new Date(`${data.date.toISOString().slice(0, 10)}T${data.startTime}`).toISOString()
      : new Date().toISOString();
    const endAt = data.date && data.endTime
      ? new Date(`${data.date.toISOString().slice(0, 10)}T${data.endTime}`).toISOString()
      : new Date().toISOString();

    if (requiresPhysicalLocation(data.eventType)) {
      const missing =
        !data.venue.trim() || !data.address.trim() || !data.city.trim() || !data.country.trim();
      if (missing) {
        toast({
          title: "Location required",
          description: "Physical events require venue, address, city, and country.",
          variant: "destructive",
        });
        return;
      }
    }

    const locationType =
      data.eventType === "in-person" ? "physical" : data.eventType === "virtual" ? "virtual" : "hybrid";
    const locationDetails = buildEventLocationPayload(data);
    const capacityPayload = buildEventCapacityPayload(data);
    const timezone = resolveEventTimezone(data.eventType);
    const ownerType = data.ownerType === "COMMUNITY" ? "COMMUNITY" : "USER";

    try {
      if (editingEventId) {
        let coverImageUrl: string | undefined;
        if (data.bannerImage) {
          coverImageUrl = await uploadEventBannerToStorage(data.bannerImage, (opts) =>
            fetchUploadUrl(opts),
          );
        }
        await updateEvent({
          variables: {
            id: editingEventId,
            input: {
              title: data.title,
              description: data.description,
              locationType,
              ...(locationDetails != null ? { locationDetails } : {}),
              startAt,
              endAt,
              tags: [],
              isPaid: data.isPaid,
              ...capacityPayload,
              ...(coverImageUrl != null ? { coverImageUrl } : {}),
            },
          },
        });
        toast({ title: "Event Updated", description: "Your changes have been saved." });
      } else {
        let coverImageUrl: string | undefined;
        if (data.bannerImage) {
          coverImageUrl = await uploadEventBannerToStorage(data.bannerImage, (opts) =>
            fetchUploadUrl(opts),
          );
        }

        const createResult = await createEvent({
          variables: {
            input: {
              ownerType,
              ownerId,
              title: data.title,
              description: data.description,
              eventCategory: data.eventCategory ?? "OTHER",
              locationType,
              ...(locationDetails != null ? { locationDetails } : {}),
              startAt,
              endAt,
              isPaid: data.isPaid,
              ...capacityPayload,
              visibility: DEFAULT_EVENT_VISIBILITY,
              timezone,
              tags: [],
              ...(coverImageUrl != null ? { coverImageUrl } : {}),
            },
          },
        });

        const createdId = createResult?.data?.createEvent?.id as string | undefined;
        if (data.publishNow && createdId) {
          await publishEvent({ variables: { id: createdId } });
        }

        toast({ title: "Event Created", description: data.publishNow ? "Your event is now live!" : "Event saved as draft." });
      }
      setEditingEventId(null);
      setCreateModalOpen(false);
      refetch();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      throw e;
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.eventsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.eventsSubtitle}</p>
      </div>
      {/* Top Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchEvents}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t.statusPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t.typePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTypes}</SelectItem>
              <SelectItem value="free">{t.free}</SelectItem>
              <SelectItem value="paid">{t.paid}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t.sortPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t.newestFirst}</SelectItem>
              <SelectItem value="oldest">{t.oldestFirst}</SelectItem>
              <SelectItem value="date-soonest">{t.dateSoonest}</SelectItem>
              <SelectItem value="date-latest">{t.dateLatest}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          {t.createEvent}
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.upcomingEvents}</p>
          <p className="text-2xl font-bold text-foreground">{upcomingCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.totalRegistrations}</p>
          <p className="text-2xl font-bold text-foreground">{totalRegistrations.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.ticketRevenue}</p>
          <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.avgAttendance}</p>
          <p className="text-2xl font-bold text-foreground">{avgAttendance}%</p>
        </div>
      </div>

      {/* Tabs for Events & Analytics */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            {t.events}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {t.analytics}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          {/* Events Grid */}
          {listLoading ? (
            <div className="text-center py-16 text-muted-foreground">Loading events…</div>
          ) : listError ? (
            <div className="text-center py-16 text-destructive">Failed to load events. Try again.</div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <EventCard
                    event={event}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onManageRegistrations={handleManageRegistrations}
                    onTogglePublish={handleTogglePublish}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border rounded-lg">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Events Created</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first event for your association.
              </p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <EventAnalyticsWidget
            events={filteredEvents}
            loading={listLoading}
            error={listError ?? undefined}
          />
        </TabsContent>
      </Tabs>

      {/* Modals & Drawers */}
      <CreateEditEventModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setEditingEventId(null);
        }}
        event={editingEvent}
        onSubmit={handleCreateSubmit}
      />

      <EventDetailsModal
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        event={selectedEvent}
        onEdit={handleEdit}
        onTogglePublish={handleTogglePublish}
        onManageRegistrations={handleManageRegistrations}
        onDelete={handleDelete}
      />

      <RegistrationsDrawer
        open={registrationsDrawerOpen}
        onOpenChange={setRegistrationsDrawerOpen}
        event={selectedEvent}
        onRefetch={refetch}
      />

      <DeleteEventModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        event={eventToDelete}
        onConfirm={handleConfirmDelete}
      />
    </AdminLayout>
  );
}
