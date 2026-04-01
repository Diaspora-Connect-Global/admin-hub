import { useState, useEffect, useMemo } from "react";
import { useApolloClient } from "@apollo/client/react";
import { format } from "date-fns";
import { Event, EventRegistration } from "@/types/events";
import { GET_USER_DISPLAY_NAME } from "@/services/networks/graphql/user";
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

function displayNameFromProfile(p: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!p) return "";
  const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ").trim();
  return fullName || p.email?.trim() || "";
}

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
  const client = useApolloClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
  const [namesResolving, setNamesResolving] = useState(false);
  const t = useT("events");

  const { data, loading, refetch } = useGetEventRegistrations(
    event?.id
      ? {
          eventId: event.id,
          limit: 100,
          offset: 0,
          status: statusFilter === "all" ? "" : statusFilter,
        }
      : null
  );
  const [markCheckedIn] = useMarkRegistrationCheckedIn();
  const [removeRegistration] = useRemoveEventRegistration();

  const registrations: EventRegistration[] = data?.adminGetEventRegistrations?.registrations ?? [];
  const total = data?.adminGetEventRegistrations?.total ?? 0;

  const uniqueUserIdsKey = useMemo(
    () => [...new Set(registrations.map((r) => r.userId))].sort().join(","),
    [registrations],
  );

  useEffect(() => {
    if (!open || !uniqueUserIdsKey) {
      setNameByUserId({});
      setNamesResolving(false);
      return;
    }
    const ids = uniqueUserIdsKey.split(",").filter(Boolean);
    let cancelled = false;
    setNamesResolving(true);
    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        ids.map(async (userId) => {
          try {
            const { data: profileData } = await client.query({
              query: GET_USER_DISPLAY_NAME,
              variables: { userId },
              fetchPolicy: "cache-first",
            });
            const name = displayNameFromProfile(profileData?.getProfile);
            next[userId] = name || userId;
          } catch (err) {
            if (import.meta.env.DEV) {
              console.warn("[RegistrationsDrawer] getProfile failed for userId:", userId, err);
            }
            next[userId] = userId;
          }
        }),
      );
      if (!cancelled) {
        setNameByUserId(next);
        setNamesResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, client, uniqueUserIdsKey]);

  const filteredRegistrations = registrations.filter((reg) => {
    const q = searchQuery.toLowerCase();
    const display = (nameByUserId[reg.userId] ?? reg.userId).toLowerCase();
    const matchesSearch =
      display.includes(q) ||
      reg.userId.toLowerCase().includes(q) ||
      (reg.totalAmount ?? "").toLowerCase().includes(q);
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
                <SelectItem value="PENDING">{t.pending}</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                    <TableHead>{t.attendee}</TableHead>
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
                      <TableCell
                        className="font-medium max-w-[220px] truncate"
                        title={
                          nameByUserId[registration.userId]
                            ? `${nameByUserId[registration.userId]} (${registration.userId})`
                            : registration.userId
                        }
                      >
                        {namesResolving && !nameByUserId[registration.userId]
                          ? "…"
                          : nameByUserId[registration.userId] ?? registration.userId}
                      </TableCell>
                      <TableCell>{registration.quantity}</TableCell>
                      {event.isPaid && (
                        <TableCell>
                          {registration.totalAmount
                            ? `${(parseInt(registration.totalAmount, 10) / 100).toFixed(2)} ${registration.currency ?? event.currency ?? ""}`
                            : "Free"}
                        </TableCell>
                      )}
                      <TableCell>
                        <StatusBadge
                          variant={
                            registration.status?.toLowerCase() === "confirmed" ? "active"
                            : registration.status?.toLowerCase() === "pending" ? "warning"
                            : "inactive"
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
