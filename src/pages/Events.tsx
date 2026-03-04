import { useState, useEffect } from "react";
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
import { EventCard } from "@/components/events/EventCard";
import { CreateEditEventModal } from "@/components/events/CreateEditEventModal";
import { EventDetailsModal } from "@/components/events/EventDetailsModal";
import { RegistrationsDrawer } from "@/components/events/RegistrationsDrawer";
import { DeleteEventModal } from "@/components/events/DeleteEventModal";
import { EventAnalyticsWidget } from "@/components/events/EventAnalyticsWidget";
import { toast } from "@/hooks/use-toast";

// Mock data
const mockEvents: Event[] = [
  {
    id: "1",
    title: "Annual General Meeting 2024",
    description: "Join us for our yearly gathering to discuss association matters and elect new leaders. This is an important event for all members.",
    bannerEmoji: "🎤",
    date: "Dec 15, 2024",
    startTime: "2:00 PM",
    endTime: "5:00 PM",
    eventType: "virtual",
    virtualLink: "https://zoom.us/meeting",
    isPaid: false,
    hasParticipantLimit: true,
    maxParticipants: 500,
    registeredCount: 342,
    status: "published",
    publishNow: true,
    notifyMembers: true,
    allowComments: true,
    views: 1250,
    ticketsSold: 0,
    revenue: 0,
    createdAt: "2024-11-01",
    updatedAt: "2024-11-15",
  },
  {
    id: "2",
    title: "Tech Career Workshop",
    description: "Learn about career opportunities in the tech industry from industry experts. Network with professionals and get career advice.",
    bannerEmoji: "💼",
    date: "Dec 20, 2024",
    startTime: "10:00 AM",
    endTime: "1:00 PM",
    eventType: "in-person",
    location: "Accra Innovation Hub, Ghana",
    isPaid: true,
    ticketPrice: 25,
    currency: "$",
    hasParticipantLimit: true,
    maxParticipants: 100,
    registeredCount: 87,
    status: "published",
    publishNow: true,
    notifyMembers: true,
    allowComments: true,
    views: 890,
    ticketsSold: 87,
    revenue: 2175,
    createdAt: "2024-11-10",
    updatedAt: "2024-11-20",
  },
  {
    id: "3",
    title: "Networking Dinner",
    description: "An evening of networking and celebration with fellow diaspora members. Enjoy great food and make new connections.",
    bannerEmoji: "🍽️",
    date: "Dec 28, 2024",
    startTime: "6:00 PM",
    endTime: "10:00 PM",
    eventType: "in-person",
    location: "Marriott Hotel, Accra",
    isPaid: true,
    ticketPrice: 75,
    currency: "$",
    hasParticipantLimit: true,
    maxParticipants: 150,
    registeredCount: 150,
    status: "published",
    publishNow: true,
    notifyMembers: true,
    allowComments: true,
    views: 2100,
    ticketsSold: 150,
    revenue: 11250,
    createdAt: "2024-11-05",
    updatedAt: "2024-11-25",
  },
  {
    id: "4",
    title: "Webinar: Investment in Ghana",
    description: "Explore investment opportunities in Ghana's growing economy. Learn from experts about real estate, agriculture, and tech investments.",
    bannerEmoji: "📈",
    date: "Nov 30, 2024",
    startTime: "3:00 PM",
    endTime: "5:00 PM",
    eventType: "virtual",
    virtualLink: "https://meet.google.com/abc-defg",
    isPaid: false,
    hasParticipantLimit: true,
    maxParticipants: 300,
    registeredCount: 256,
    status: "completed",
    publishNow: true,
    notifyMembers: true,
    allowComments: true,
    views: 3200,
    ticketsSold: 0,
    revenue: 0,
    createdAt: "2024-10-15",
    updatedAt: "2024-11-30",
  },
  {
    id: "5",
    title: "Community Health Fair",
    description: "Free health screenings and wellness education for all community members.",
    bannerEmoji: "🏥",
    date: "Jan 15, 2025",
    startTime: "9:00 AM",
    endTime: "4:00 PM",
    eventType: "in-person",
    location: "Community Center, Tema",
    isPaid: false,
    hasParticipantLimit: false,
    registeredCount: 45,
    status: "draft",
    publishNow: false,
    notifyMembers: true,
    allowComments: true,
    views: 0,
    ticketsSold: 0,
    revenue: 0,
    createdAt: "2024-12-01",
    updatedAt: "2024-12-01",
  },
];

export default function Events() {
  const location = useLocation();
  const t = useT("events");
  const [events] = useState<Event[]>(mockEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [registrationsDrawerOpen, setRegistrationsDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  // Handle quick action navigation
  useEffect(() => {
    if (location.state?.openCreate) {
      setCreateModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Filter and sort events
  const filteredEvents = events
    .filter((event) => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      const matchesType = 
        typeFilter === "all" || 
        (typeFilter === "free" && !event.isPaid) ||
        (typeFilter === "paid" && event.isPaid);
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "date-soonest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-latest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Stats
  const upcomingCount = events.filter(e => e.status === "published" || e.status === "draft").length;
  const totalRegistrations = events.reduce((sum, e) => sum + e.registeredCount, 0);
  const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
  const avgAttendance = events.length > 0 
    ? Math.round((events.filter(e => e.hasParticipantLimit && e.maxParticipants)
        .reduce((sum, e) => sum + (e.registeredCount / (e.maxParticipants || 1)) * 100, 0) / 
        events.filter(e => e.hasParticipantLimit).length) || 0)
    : 0;

  // Handlers
  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setDetailsDrawerOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setCreateModalOpen(true);
  };

  const handleManageRegistrations = (event: Event) => {
    setSelectedEvent(event);
    setRegistrationsDrawerOpen(true);
  };

  const handleTogglePublish = (event: Event) => {
    toast({
      title: event.status === "published" ? "Event Unpublished" : "Event Published",
      description: event.status === "published" 
        ? "Event is now hidden from members." 
        : "Your event is now live!",
    });
  };

  const handleDelete = (event: Event) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    toast({
      title: "Event Deleted",
      description: "The event has been permanently deleted.",
    });
    setDeleteModalOpen(false);
    setEventToDelete(null);
  };

  const handleCreateSubmit = (data: EventFormData) => {
    toast({
      title: editingEvent ? "Event Updated" : "Event Created",
      description: editingEvent 
        ? "Your changes have been saved."
        : data.publishNow 
          ? "Your event is now live!" 
          : "Event saved as draft.",
    });
    setEditingEvent(null);
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
              <SelectItem value="all">{t.allStatus}</SelectItem>
              <SelectItem value="published">{t.published}</SelectItem>
              <SelectItem value="unpublished">{t.unpublished}</SelectItem>
              <SelectItem value="draft">{t.draft}</SelectItem>
              <SelectItem value="ongoing">{t.ongoing}</SelectItem>
              <SelectItem value="completed">{t.completed}</SelectItem>
              <SelectItem value="cancelled">{t.cancelled}</SelectItem>
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
          {filteredEvents.length > 0 ? (
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
          <EventAnalyticsWidget />
        </TabsContent>
      </Tabs>

      {/* Modals & Drawers */}
      <CreateEditEventModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setEditingEvent(null);
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
