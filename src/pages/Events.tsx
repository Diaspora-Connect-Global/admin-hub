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
import { resolveEventCapacity } from "@/lib/eventCapacityPayload";
import { throwIfGraphQLErrors } from "@/lib/graphqlErrors";
import {
  logEventFormSnapshot,
  logEventMutation,
} from "@/lib/debugEventsGraphQL";
import { DEFAULT_EVENT_VISIBILITY, resolveEventTimezone } from "@/lib/eventSchedulePayload";
import { EventCard } from "@/components/events/EventCard";
import { CreateEditEventModal } from "@/components/events/CreateEditEventModal";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { RegistrationsDrawer } from "@/components/events/RegistrationsDrawer";
import { DeleteEventModal } from "@/components/events/DeleteEventModal";
import { EventAnalyticsWidget } from "@/components/events/EventAnalyticsWidget";
import { toast } from "@/hooks/use-toast";
import {
  useSearchEvents,
  useGetEvent,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEventAdmin,
  usePublishEventAdmin,
  useUnpublishEventAdmin,
  useCancelEvent,
  useGetUploadUrl,
} from "@/hooks/events";
import { uploadEventBannerToStorage } from "@/lib/eventBannerUpload";
import { getUserId } from "@/stores/session";
import { useSessionStore } from "@/stores/sessionStore";

export default function Events() {
  const location = useLocation();
  const t = useT("events");

  const [searchInput, setSearchInput] = useState<{ status?: string; ownerType?: string; isPaid?: boolean; page?: number; limit?: number }>({ limit: 20, page: 1 });
  const { data: searchData, loading: listLoading, error: listError, refetch: refetchList } = useSearchEvents(searchInput);
  const events: Event[] = Array.isArray(searchData?.searchEvents?.items) ? searchData.searchEvents.items : [];
  const totalEvents = searchData?.searchEvents?.total ?? 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
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
  const [deleteEventAdmin] = useDeleteEventAdmin();
  const [publishEventAdmin] = usePublishEventAdmin();
  const [unpublishEventAdmin] = useUnpublishEventAdmin();
  const [cancelEvent] = useCancelEvent();

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
    setSearchInput((prev) => ({
      ...prev,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      isPaid: typeFilter === "all" ? undefined : (typeFilter === "paid" ? true : typeFilter === "free" ? false : undefined),
    }));
  }, [searchQuery, statusFilter, typeFilter]);

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

  const upcomingCount = events.filter((e) => e.status === "PUBLISHED").length;
  const totalRegistrations = events.reduce((sum, e) => sum + e.registrationCount, 0);
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
      try {
        await unpublishEventAdmin({ variables: { eventId: event.id } });
        toast({ title: "Event Unpublished", description: "Event reverted to draft." });
        refetch();
      } catch (e) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
      }
      return;
    }
    try {
      await publishEventAdmin({ variables: { eventId: event.id } });
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
      await deleteEventAdmin({ variables: { eventId: eventToDelete.id } });
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

    const localDateStr = data.date
      ? `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, "0")}-${String(data.date.getDate()).padStart(2, "0")}`
      : null;
    const startAt = localDateStr && data.startTime
      ? new Date(`${localDateStr}T${data.startTime}`).toISOString()
      : new Date().toISOString();
    const endAt = localDateStr && data.endTime
      ? new Date(`${localDateStr}T${data.endTime}`).toISOString()
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
    const capacityValue = resolveEventCapacity(data);
    const timezone = resolveEventTimezone(data.eventType);
    const ownerType = data.ownerType === "COMMUNITY" ? "COMMUNITY" : "USER";

    logEventFormSnapshot(data);

    try {
      if (editingEventId) {
        let coverImageUrl: string | undefined;
        if (data.bannerImage) {
          coverImageUrl = await uploadEventBannerToStorage(data.bannerImage, (opts) =>
            fetchUploadUrl(opts),
          );
        }
        const updateVariables = {
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
            ...(data.isPaid && data.ticketPrice > 0 ? { ticketPrice: Math.round(data.ticketPrice * 100) } : {}),
            ...(data.isPaid && data.currency ? { currency: data.currency } : {}),
            ...(capacityValue != null ? { capacity: capacityValue } : {}),
            ...(coverImageUrl != null ? { coverImageUrl } : {}),
          },
        };
        logEventMutation("UpdateEvent (edit)", updateVariables);
        const updateRes = await updateEvent({
          variables: updateVariables,
        });
        throwIfGraphQLErrors(updateRes, "UpdateEvent");
        toast({ title: "Event Updated", description: "Your changes have been saved." });
      } else {
        let coverImageUrl: string | undefined;
        if (data.bannerImage) {
          coverImageUrl = await uploadEventBannerToStorage(data.bannerImage, (opts) =>
            fetchUploadUrl(opts),
          );
        }

        const createVariables = {
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
            ...(data.isPaid && data.ticketPrice > 0 ? { ticketPrice: Math.round(data.ticketPrice * 100) } : {}),
            ...(data.isPaid && data.currency ? { currency: data.currency } : {}),
            ...(capacityValue != null ? { capacity: capacityValue } : {}),
            visibility: DEFAULT_EVENT_VISIBILITY,
            timezone,
            tags: [],
            ...(coverImageUrl != null ? { coverImageUrl } : {}),
          },
        };
        logEventMutation("CreateEvent", createVariables);
        logEventMutation("CreateEvent — derived fields", {
          capacityValue,
          timezone,
          locationType,
          ownerType,
          ownerId,
          isPaid: data.isPaid,
          ticketPriceInCents: data.isPaid ? Math.round(data.ticketPrice * 100) : 0,
          currency: data.currency,
        });

        const createResult = await createEvent({
          variables: createVariables,
        });
        throwIfGraphQLErrors(createResult, "CreateEvent");

        const createdId = createResult.data?.createEvent?.id as string | undefined;

        // capacity is not accepted on create — patch it separately via UpdateEventInput.
        if (createdId && capacityValue != null) {
          const patchVariables = { id: createdId, input: { capacity: capacityValue } };
          logEventMutation("UpdateEvent (post-create capacity patch)", patchVariables);
          const patchRes = await updateEvent({
            variables: patchVariables,
          });
          throwIfGraphQLErrors(patchRes, "UpdateEvent");
        }

        if (data.publishNow && createdId) {
          const publishVariables = { id: createdId };
          logEventMutation("PublishEvent", publishVariables);
          const pubRes = await publishEvent({ variables: publishVariables });
          throwIfGraphQLErrors(pubRes, "PublishEvent");
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
              <SelectItem value="ALL">All Statuses</SelectItem>
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
        <Button onClick={() => { setEditingEventId(null); setCreateModalOpen(true); }}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          {t.createEvent}
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.upcomingEvents}</p>
          <p className="text-2xl font-bold text-foreground">{upcomingCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground/80">{t.totalRegistrations}</p>
          <p className="text-2xl font-bold text-foreground">{totalRegistrations.toLocaleString()}</p>
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
              <Button onClick={() => { setEditingEventId(null); setCreateModalOpen(true); }}>
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
        isCreatingNew={!editingEventId}
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
