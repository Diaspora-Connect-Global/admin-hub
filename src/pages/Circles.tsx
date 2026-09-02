import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleStatusBadge } from "@/components/circle/circleStatus";
import {
  CircleModerationDialog,
  type CircleModerationAction,
} from "@/components/circle/CircleModerationDialog";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react";
import { useAdminCircles, type Circle, type CircleStatus } from "@/hooks/admin";

/**
 * Circle oversight — the searchable list of every circle on the platform.
 *
 * This screen is deliberately thin on verbs. A platform admin can look, and can
 * take the two exceptional moderation actions (suspend / dissolve, reserved for
 * illegality) from the row menu. They cannot manage a circle: there is no rpc
 * to add or remove a member, or to open, vote on or override a motion.
 *
 * PAGINATION: `adminCircles` returns a bare array with no total, so "there is a
 * next page" is inferred from having received a full page. That is honest about
 * what the API tells us — a total would have to be invented.
 *
 * KNOWN BACKEND BUG (fix in flight, not deployed): the gateway forwards the
 * GraphQL enum value to a service comparing against unprefixed domain values,
 * so a status-filtered list can come back empty. Send the schema value anyway —
 * compensating client-side would break the moment the fix lands.
 */

const PAGE_LIMIT = 25;

const STATUS_FILTERS: CircleStatus[] = [
  "ACTIVE",
  "DORMANT",
  "SUSPENDED",
  "ARCHIVED",
  "DISSOLVED",
];

export default function Circles() {
  const { t } = useTranslation();

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CircleStatus | "all">("all");
  const [offset, setOffset] = useState(0);

  const [moderationTarget, setModerationTarget] = useState<Circle | null>(null);
  const [moderationAction, setModerationAction] =
    useState<CircleModerationAction>("SUSPEND");
  const [moderationOpen, setModerationOpen] = useState(false);

  const { data, loading, error, refetch } = useAdminCircles({
    status: status === "all" ? undefined : status,
    query: query || undefined,
    limit: PAGE_LIMIT,
    offset,
  });

  const circles = data?.adminCircles ?? [];
  // No total from the API — a full page is the only signal that more exist.
  const hasMore = circles.length === PAGE_LIMIT;

  const applySearch = () => {
    setQuery(searchInput.trim());
    setOffset(0);
  };

  const changeStatus = (value: string) => {
    setStatus(value as CircleStatus | "all");
    setOffset(0);
  };

  const openModeration = (circle: Circle, action: CircleModerationAction) => {
    setModerationTarget(circle);
    setModerationAction(action);
    setModerationOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {t("circles.list.title")}
            </h1>
            <p className="text-muted-foreground">{t("circles.list.subtitle")}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder={t("circles.list.searchPlaceholder")}
              className="pl-9"
              aria-label={t("common.search")}
            />
          </div>
          <Select value={status} onValueChange={changeStatus}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">{t("circles.list.allStatuses")}</SelectItem>
              {STATUS_FILTERS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`circles.status.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={applySearch}>
            {t("common.search")}
          </Button>
        </div>

        {/* Table */}
        <Card className="glass">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>{t("circles.list.columns.circle")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("circles.list.columns.members")}</TableHead>
                    <TableHead>{t("circles.list.columns.joinMode")}</TableHead>
                    <TableHead>{t("circles.list.columns.discoverable")}</TableHead>
                    <TableHead>{t("circles.list.columns.created")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && circles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        {t("circles.list.loading")}
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-destructive">
                        {friendlyErrorMessage(error, t("circles.list.loadError"))}
                        <div className="pt-3">
                          <Button variant="outline" size="sm" onClick={() => refetch()}>
                            {t("common.retry")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : circles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        {t("circles.list.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    circles.map((circle) => (
                      <TableRow key={circle.id} className="border-border/50">
                        <TableCell>
                          <Link
                            to={`/circles/${circle.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {circle.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {circle.handle ? `@${circle.handle}` : circle.circleNumber ?? circle.id}
                          </p>
                        </TableCell>
                        <TableCell>
                          <CircleStatusBadge status={circle.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {circle.memberCount}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t(`circles.joinMode.${circle.joinMode}`, {
                            defaultValue: circle.joinMode,
                          })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {circle.discoverable ? t("common.yes") : t("common.no")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {circle.createdAt
                            ? new Date(circle.createdAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t("common.actions")}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem asChild>
                                <Link to={`/circles/${circle.id}`}>{t("common.view")}</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                {t("circles.moderation.menuLabel")}
                              </DropdownMenuLabel>
                              {circle.status === "SUSPENDED" ? (
                                <DropdownMenuItem
                                  onClick={() => openModeration(circle, "UNSUSPEND")}
                                >
                                  {t("circles.moderation.UNSUSPEND.action")}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => openModeration(circle, "SUSPEND")}
                                >
                                  {t("circles.moderation.SUSPEND.action")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => openModeration(circle, "DISSOLVE")}
                              >
                                {t("circles.moderation.DISSOLVE.action")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pager — offset only; the API reports no total. */}
            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {t("circles.list.showing", {
                  from: circles.length ? offset + 1 : 0,
                  to: offset + circles.length,
                })}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  aria-label={t("circles.list.previousPage")}
                  disabled={offset === 0 || loading}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_LIMIT))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  aria-label={t("circles.list.nextPage")}
                  disabled={!hasMore || loading}
                  onClick={() => setOffset(offset + PAGE_LIMIT)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <CircleModerationDialog
          open={moderationOpen}
          onOpenChange={setModerationOpen}
          circle={moderationTarget}
          action={moderationAction}
        />
      </div>
    </AdminLayout>
  );
}
