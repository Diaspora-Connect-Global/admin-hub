import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  useAdminCircles,
  useAdminCircleSubscriptions,
  CIRCLE_STATUSES,
  type AdminCircle,
} from "@/hooks/admin";
import { CircleActionDialogs, type CircleAction } from "@/components/admin/CircleActionDialogs";
import { circleStatusVariant, formatDateTime, initialsOf } from "@/components/admin/circleDisplay";
import {
  Search,
  MoreHorizontal,
  Users,
  Ban,
  RotateCcw,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
} from "lucide-react";

const PAGE_SIZE = 20;
const ALL = "all";

/**
 * How many subscriptions to pull for the plan column. The backend clamps this
 * to 200; asking for exactly the cap lets us detect that we hit it.
 */
const SUBSCRIPTION_INDEX_LIMIT = 200;

/**
 * Platform oversight for circles.
 *
 * ── WHY THIS LIST USES `adminCircles` AND NOTHING ELSE ──────────────────────
 * `adminCircles` is the only read that sees suspended and non-discoverable
 * circles. The user-facing `searchCircles` runs against partial indexes
 * restricted to `status='ACTIVE'` and `discoverable=true` — pointing an
 * oversight console at it would silently return nothing for exactly the circles
 * this page exists to find, with no error to notice.
 *
 * ── WHAT IS DELIBERATELY ABSENT ─────────────────────────────────────────────
 * No member list, no "remove member", no motion controls. `CircleAdminService`
 * has no rpc for any of it: a circle governs itself, and the platform's
 * neutrality holds only for as long as it genuinely cannot decide who belongs.
 * The three acts below — suspend, unsuspend, dissolve — apply to the whole
 * circle and are reserved for illegality, never for settling a circle's own
 * internal disputes.
 */
export default function CircleManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(0);
  const [action, setAction] = useState<{ kind: CircleAction; circle: AdminCircle } | null>(null);

  const { data, loading, error, refetch } = useAdminCircles({
    status: status === ALL ? undefined : status,
    query: searchTerm || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  /**
   * Plan-per-circle for the list column. There is no batch "subscriptions for
   * these circle ids" rpc, and one query per row would be an N+1 on every
   * keystroke, so the column is fed from a single capped listing indexed by
   * `ownerId` (the circle id).
   *
   * `indexComplete` is the honest part: if the listing came back at the cap we
   * cannot tell "no subscription" from "not in the index", so an unknown plan
   * renders as an explicit unknown instead of an em dash that reads as "none".
   */
  const { data: subsData } = useAdminCircleSubscriptions({ limit: SUBSCRIPTION_INDEX_LIMIT });
  const subscriptions = useMemo(
    () => subsData?.adminCircleSubscriptions ?? [],
    [subsData],
  );
  const planByCircleId = useMemo(() => {
    const map = new Map<string, string>();
    for (const sub of subscriptions) {
      // Only the live row is meaningful here; a circle always has exactly one
      // ACTIVE subscription, and historical rows would overwrite it.
      if (sub.status === "ACTIVE" && sub.ownerId) {
        map.set(sub.ownerId, sub.planCode || sub.planId);
      }
    }
    return map;
  }, [subscriptions]);
  const indexComplete = subscriptions.length < SUBSCRIPTION_INDEX_LIMIT;

  const circles = data?.adminCircles ?? [];
  // `adminCircles` returns a bare list with no total, so there is no last page
  // to compute — a full page means "there may be more".
  const hasNextPage = circles.length === PAGE_SIZE;

  const applySearch = () => {
    setPage(0);
    setSearchTerm(searchInput.trim());
  };

  const onActionDone = async (message: string) => {
    toast({ title: t("common.success"), description: message });
    await refetch();
  };

  const onActionError = (e: unknown) => {
    toast({
      title: t("common.errorTitle"),
      description: friendlyErrorMessage(e),
      variant: "destructive",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("circles.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("circles.subtitle")}</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("circles.filters")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t("circles.searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                />
              </div>
              <Button onClick={applySearch}>{t("common.search")}</Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                value={status}
                onValueChange={(v) => {
                  setPage(0);
                  setStatus(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("circles.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("circles.allStatuses")}</SelectItem>
                  {CIRCLE_STATUSES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`circles.statusValue.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">{t("circles.scopeNote")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              {t("circles.resultCount", { count: circles.length })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                aria-label={t("common.previous")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page + 1}</span>
              <Button
                variant="outline"
                size="icon"
                disabled={!hasNextPage || loading}
                onClick={() => setPage((p) => p + 1)}
                aria-label={t("common.next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* A failed query must never render as an empty list: an admin would
                read "no circles match" and stop looking. */}
            {error ? (
              <div className="py-10 text-center text-sm text-destructive">
                {friendlyErrorMessage(error)}
              </div>
            ) : loading && circles.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : circles.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t("circles.empty")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("circles.circle")}</TableHead>
                      <TableHead>{t("circles.members")}</TableHead>
                      <TableHead>{t("circles.plan")}</TableHead>
                      <TableHead>{t("circles.status")}</TableHead>
                      <TableHead>{t("circles.access")}</TableHead>
                      <TableHead>{t("circles.created")}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {circles.map((circle) => {
                      const plan = planByCircleId.get(circle.id);
                      return (
                        <TableRow key={circle.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={circle.avatarUrl ?? undefined} />
                                <AvatarFallback>{initialsOf(circle.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <Link
                                  to={`/circles/${circle.id}`}
                                  className="truncate text-sm font-medium hover:underline"
                                >
                                  {circle.name}
                                </Link>
                                <div className="truncate text-xs text-muted-foreground">
                                  {circle.handle ? `@${circle.handle}` : circle.circleNumber ?? circle.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-sm">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              {circle.memberCount}
                            </span>
                          </TableCell>
                          <TableCell>
                            {plan ? (
                              <Badge variant="outline">{plan}</Badge>
                            ) : (
                              <span
                                className="text-xs text-muted-foreground"
                                title={
                                  indexComplete
                                    ? t("circles.noPlan")
                                    : t("circles.planIndexTruncated")
                                }
                              >
                                {indexComplete ? "—" : t("circles.unknown")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge variant={circleStatusVariant(circle.status)}>
                              {t(`circles.statusValue.${circle.status}`, circle.status)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                {circle.discoverable ? (
                                  <Globe className="h-3 w-3" />
                                ) : (
                                  <Lock className="h-3 w-3" />
                                )}
                                {circle.discoverable
                                  ? t("circles.discoverable")
                                  : t("circles.hidden")}
                              </span>
                              <Badge variant="outline" className="w-fit text-[10px]">
                                {t(`circles.joinModeValue.${circle.joinMode}`, circle.joinMode)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatDateTime(circle.createdAt)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/circles/${circle.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("circles.viewDetail")}
                                  </Link>
                                </DropdownMenuItem>
                                {circle.status === "SUSPENDED" ? (
                                  <DropdownMenuItem
                                    onClick={() => setAction({ kind: "unsuspend", circle })}
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    {t("circles.unsuspend")}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => setAction({ kind: "suspend", circle })}
                                  >
                                    <Ban className="mr-2 h-4 w-4" />
                                    {t("circles.suspend")}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setAction({ kind: "dissolve", circle })}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("circles.dissolve")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CircleActionDialogs
        action={action?.kind ?? null}
        circle={action?.circle ?? null}
        onClose={() => setAction(null)}
        onSuccess={onActionDone}
        onError={onActionError}
      />
    </AdminLayout>
  );
}
