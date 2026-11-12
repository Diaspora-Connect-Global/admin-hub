import { useEffect, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { format } from "date-fns";
import { Event, EventRegistration } from "@/types/events";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventNetworkingTabs } from "@/components/events/networking/EventNetworkingTabs";
import { RegistrationStatusBadge } from "@/components/events/networking/RegistrationStatusBadge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Download, MoreHorizontal, CheckCircle, UserX, Users, ClipboardList, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { GET_EVENT_REGISTRATIONS, GET_EVENT_TICKETS } from "@/services/networks/graphql/events";
import { answerText, buildCsv, downloadCsv, parseFormResponses, registrantEmail } from "@/lib/eventRegistrationCsv";
import { BUILTIN_IDS } from "@/lib/eventRegistrationForm";
import { registrationStatusLabel } from "@/lib/eventNetworking";
import { useT } from "@/hooks/useT";
import {
  useGetEventRegistrations,
  useMarkRegistrationCheckedIn,
  useRemoveEventRegistration,
} from "@/hooks/events";

function getAttendeeFullName(p: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!p) return "";
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return fullName;
}

function displayNameFromProfile(p: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!p) return "";
  return getAttendeeFullName(p) || p.email?.trim() || "";
}

function resolveAttendeeName(
  registration: EventRegistration,
  fallbackNameByUserId?: Record<string, string>,
): string {
  const fullName = getAttendeeFullName(registration.user);
  return fullName || registrantEmail(registration.user?.email, registration.formResponsesJson) || fallbackNameByUserId?.[registration.userId] || "Unknown attendee";
}

function formatRegistrationAmount(totalAmount: string, currency?: string | null): string {
  const amount = Number(totalAmount);
  if (!Number.isFinite(amount)) {
    return `${totalAmount} ${currency ?? ""}`.trim();
  }
  if (!currency) {
    return amount.toLocaleString();
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

type AnswerField = { id: string; label: string; type: string; builtin?: string | null };

/** A question's name: default fields translated (older payloads carry no `builtin`, the reserved id still marks them). */
function questionLabel(f: AnswerField, tr: (key: string, opts?: Record<string, unknown>) => string): string {
  const builtin = f.builtin ?? (BUILTIN_IDS.includes(f.id) ? f.id : null);
  return builtin ? tr(`events.registration.default_${builtin}`, { defaultValue: f.label }) : f.label;
}

interface RegistrationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onRefetch?: () => void;
}

interface GetRegistrationsData {
  getEventRegistrations?: { total?: number; registrations?: EventRegistration[] } | null;
}

/** Question → answer for one registrant (blank answers left out, never ids). */
function AnswersList({
  registration,
  fields,
  tr,
}: {
  registration: EventRegistration | null;
  fields: AnswerField[];
  tr: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const words = { yes: tr("events.registration.yes"), no: tr("events.registration.no") };
  const answers = parseFormResponses(registration?.formResponsesJson);
  const answered = fields
    .map((f) => ({ f, text: answerText(answers[f.id], f, words) }))
    .filter(({ text }) => text !== "");
  if (answered.length === 0) {
    return <p className="text-sm text-muted-foreground">{tr("events.registration.noAnswers")}</p>;
  }
  return (
    <dl className="space-y-3">
      {answered.map(({ f, text }) => (
        <div key={f.id}>
          <dt className="text-xs text-muted-foreground break-words">{questionLabel(f, tr)}</dt>
          <dd className="text-sm text-foreground whitespace-pre-wrap break-words">{text}</dd>
        </div>
      ))}
    </dl>
  );
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
  const [fallbackNameByUserId, setFallbackNameByUserId] = useState<Record<string, string>>({});
  const t = useT("events");
  const { t: tr } = useTranslation();
  const [answersFor, setAnswersFor] = useState<EventRegistration | null>(null);
  const [exporting, setExporting] = useState(false);
  const formFields: AnswerField[] = (event?.registrationFormFields ?? []) as AnswerField[];

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

  const registrations: EventRegistration[] = data?.getEventRegistrations?.registrations ?? [];
  const total = data?.getEventRegistrations?.total ?? 0;

  const unresolvedUserIdsKey = useMemo(
    () =>
      [
        ...new Set(
          registrations
            .filter((reg) => !displayNameFromProfile(reg.user))
            .map((reg) => reg.userId)
            .filter(Boolean),
        ),
      ]
        .sort()
        .join(","),
    [registrations],
  );

  useEffect(() => {
    if (!open || !unresolvedUserIdsKey) {
      setFallbackNameByUserId({});
      return;
    }

    const unresolvedIds = unresolvedUserIdsKey.split(",").filter(Boolean);
    let cancelled = false;

    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        unresolvedIds.map(async (userId) => {
          try {
            const { data: profileData } = await client.query<{
              getProfile?: {
                profile?: {
                  firstName?: string | null;
                  lastName?: string | null;
                  email?: string | null;
                } | null;
              } | null;
            }>({
              query: GET_USER_DISPLAY_NAME,
              variables: { userId },
              fetchPolicy: "cache-first",
            });
            const name = displayNameFromProfile(profileData?.getProfile?.profile);
            if (name) {
              next[userId] = name;
            }
          } catch {
            // ignore fallback failures
          }
        }),
      );
      if (!cancelled) {
        setFallbackNameByUserId(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, unresolvedUserIdsKey, client]);

  const filteredRegistrations = registrations.filter((reg) => {
    const q = searchQuery.toLowerCase();
    const display = resolveAttendeeName(reg, fallbackNameByUserId).toLowerCase();
    const matchesSearch =
      display.includes(q) ||
      registrantEmail(reg.user?.email, reg.formResponsesJson).toLowerCase().includes(q) ||
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

  /** Every registration of the event (paged, bounded) as a spreadsheet; question columns follow the current form. */
  const handleExport = async () => {
    if (!event) return;
    setExporting(true);
    try {
      const pageSize = 100;
      const rows: EventRegistration[] = [];
      for (let page = 0; page < 50; page += 1) {
        const { data: pageData } = await client.query<GetRegistrationsData>({
          query: GET_EVENT_REGISTRATIONS,
          variables: { eventId: event.id, limit: pageSize, offset: page * pageSize, status: statusFilter === "all" ? "" : statusFilter },
          fetchPolicy: "network-only",
        });
        const got = pageData?.getEventRegistrations?.registrations ?? [];
        rows.push(...got);
        if (got.length < pageSize || rows.length >= (pageData?.getEventRegistrations?.total ?? Infinity)) break;
      }
      if (rows.length === 0) {
        toast({ title: tr("events.registration.nothingToExport") });
        return;
      }
      const ticketNames = new Map<string, string>();
      try {
        const { data: tk } = await client.query<{ getEventTickets?: { tickets?: { id: string; name: string }[] | null } | null }>({
          query: GET_EVENT_TICKETS,
          variables: { eventId: event.id },
          fetchPolicy: "network-only",
        });
        for (const x of tk?.getEventTickets?.tickets ?? []) ticketNames.set(x.id, x.name);
      } catch {
        // ticket names are a nicety; the export still works without them
      }
      const words = { yes: tr("events.registration.yes"), no: tr("events.registration.no") };
      const headers = [
        tr("events.registration.colName"),
        tr("events.registration.colEmail"),
        tr("events.registration.colRegistered"),
        tr("events.registration.colTicket"),
        tr("events.registration.csvQuantity"),
        tr("events.registration.colRegistration"),
        ...(event.isPaid ? [tr("events.registration.colPayment")] : []),
        ...formFields.map((f) => questionLabel(f, tr)),
      ];
      const body = rows.map((reg) => {
        const answers = parseFormResponses(reg.formResponsesJson);
        return [
          resolveAttendeeName(reg, fallbackNameByUserId),
          registrantEmail(reg.user?.email, reg.formResponsesJson),
          reg.registeredAt ? format(new Date(reg.registeredAt), "yyyy-MM-dd HH:mm") : "",
          (reg.ticketId && ticketNames.get(reg.ticketId)) || "",
          String(reg.quantity ?? ""),
          registrationStatusLabel(reg.registrationStatus || reg.status),
          ...(event.isPaid
            ? [reg.totalAmount ? formatRegistrationAmount(reg.totalAmount, reg.currency ?? event.currency) : "Free"]
            : []),
          ...formFields.map((f) => answerText(answers[f.id], f, words)),
        ];
      });
      const slug = event.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "event";
      downloadCsv(buildCsv(headers, body), `${slug}-registrations.csv`);
    } catch {
      toast({ title: "Error", description: tr("events.registration.exportFailed"), variant: "destructive" });
    } finally {
      setExporting(false);
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

        <Tabs defaultValue="registrations" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="manage">Approvals &amp; staff</TabsTrigger>
          </TabsList>
          <TabsContent value="registrations">
            <div className="mt-4 space-y-4">
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
                    <SelectItem value="PENDING_APPROVAL">Awaiting approval</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                    <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                    <SelectItem value="REJECTED">Declined</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={exporting}
                  aria-label={tr("events.registration.exportCsv")}
                  title={tr("events.registration.exportCsv")}
                  onClick={() => void handleExport()}
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden="true" />
                  )}
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
                            title={resolveAttendeeName(registration, fallbackNameByUserId)}
                          >
                            {resolveAttendeeName(registration, fallbackNameByUserId)}
                          </TableCell>
                          <TableCell>{registration.quantity}</TableCell>
                          {event.isPaid && (
                            <TableCell>
                              {registration.totalAmount
                                ? formatRegistrationAmount(
                                    registration.totalAmount,
                                    registration.currency ?? event.currency,
                                  )
                                : "Free"}
                            </TableCell>
                          )}
                          <TableCell>
                            <RegistrationStatusBadge status={registration.registrationStatus || registration.status} />
                            {registration.waitlistPosition != null && (
                              <span className="ml-1 text-xs text-muted-foreground">#{registration.waitlistPosition}</span>
                            )}
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
                                <DropdownMenuItem onClick={() => setAnswersFor(registration)}>
                                  <ClipboardList className="mr-2 h-4 w-4" />
                                  {tr("events.registration.viewAnswers")}
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
          </TabsContent>
          <TabsContent value="manage" className="mt-4">
            <EventNetworkingTabs eventId={event.id} onChanged={() => { refetch(); onRefetch?.(); }} />
          </TabsContent>
        </Tabs>
      </SheetContent>

      <Dialog open={!!answersFor} onOpenChange={(v) => !v && setAnswersFor(null)}>
        <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr("events.registration.answersTitle")}</DialogTitle>
            <DialogDescription>
              {tr("events.registration.answersFor", {
                name: answersFor ? resolveAttendeeName(answersFor, fallbackNameByUserId) : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <AnswersList registration={answersFor} fields={formFields} tr={tr} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnswersFor(null)}>
              {tr("events.registration.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
