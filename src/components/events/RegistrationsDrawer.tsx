import { useState } from "react";
import { format } from "date-fns";
import { Event, EventRegistration } from "@/types/events";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Download, MoreHorizontal, CheckCircle, UserX, Users } from "lucide-react";
import { useT } from "@/hooks/useT";
import {
  useGetEventRegistrations,
  useMarkRegistrationCheckedIn,
  useRemoveEventRegistration,
} from "@/hooks/events";

interface RegistrationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onRefetch?: () => void;
}

export function RegistrationsDrawer({
  open,
  onOpenChange,
  event,
  onRefetch,
}: RegistrationsDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const t = useT("events");

  const { data, loading, refetch } = useGetEventRegistrations(
    event?.id ? { eventId: event.id, limit: 100, offset: 0, status: statusFilter === "all" ? undefined : statusFilter } : null
  );
  const [markCheckedIn] = useMarkRegistrationCheckedIn();
  const [removeRegistration] = useRemoveEventRegistration();

  const registrations: EventRegistration[] = data?.getEventRegistrations?.registrations ?? [];
  const total = data?.getEventRegistrations?.total ?? 0;

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.totalAmount ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleMarkCheckedIn = async (reg: EventRegistration) => {
    try {
      await markCheckedIn({ variables: { registrationId: reg.id } });
      refetch();
      onRefetch?.();
    } catch (_e) {
      // toast on error if desired
    }
  };

  const handleRemove = async (reg: EventRegistration) => {
    try {
      await removeRegistration({ variables: { registrationId: reg.id } });
      refetch();
      onRefetch?.();
    } catch (_e) {
      // toast on error if desired
    }
  };

  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t.registrations}</SheetTitle>
          <p className="text-sm text-muted-foreground">{t.forEvent}: {event.title}</p>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchAttendees}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatus}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading…</div>
          ) : filteredRegistrations.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>User ID</TableHead>
                    <TableHead>Quantity</TableHead>
                    {event.isPaid && <TableHead>{t.payment}</TableHead>}
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.registeredAt}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.userId}</TableCell>
                      <TableCell>{registration.quantity}</TableCell>
                      {event.isPaid && (
                        <TableCell>{registration.totalAmount ?? "—"}</TableCell>
                      )}
                      <TableCell>
                        <StatusBadge
                          variant={
                            registration.status === "confirmed" ? "active" : registration.status === "pending" ? "warning" : "inactive"
                          }
                        >
                          {registration.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {registration.registeredAt
                          ? format(new Date(registration.registeredAt), "MMM d, yyyy HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleMarkCheckedIn(registration)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {t.markAsCheckedIn}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(registration)}>
                              <UserX className="mr-2 h-4 w-4" />
                              {t.removeAttendee}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-1">{t.noRegistrationsYet}</h3>
              <p className="text-sm text-muted-foreground">
                {t.shareEventToAttract}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
