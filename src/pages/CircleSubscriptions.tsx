import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { CircleSubscriptionStatusBadge } from "@/components/circle/circleStatus";
import { GrantSubscriptionDialog } from "@/components/circle/GrantSubscriptionDialog";
import { ForceExpireDialog } from "@/components/circle/ForceExpireDialog";
import { formatMinorUnits } from "@/lib/money";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  useAdminCirclePlans,
  useAdminCircleSubscriptions,
  type CircleSubscription,
  type CircleSubscriptionStatus,
} from "@/hooks/admin";

/**
 * Which circles are on which plan, and in what subscription state.
 *
 * Every circle always has exactly one ACTIVE subscription — the free one is
 * created in the same transaction as the circle — so "a circle with no
 * subscription" is unreachable and nothing here branches on it.
 *
 * `planCode` is shown for DISPLAY only. It is never a capability: what a circle
 * may do is its entitlement snapshot, taken at purchase so that editing a tier
 * cannot retroactively reduce it.
 *
 * KNOWN BACKEND BUG (fix in flight, not deployed): the gateway forwards
 * `SUBSCRIPTION_ACTIVE` to a service comparing against a bare `ACTIVE`, so a
 * status-filtered list can come back empty. The schema value is what the schema
 * declares, so it is what we send.
 */

const PAGE_LIMIT = 25;

const STATUS_FILTERS: CircleSubscriptionStatus[] = [
  "SUBSCRIPTION_ACTIVE",
  "SUBSCRIPTION_PAST_DUE",
  "SUBSCRIPTION_CANCELLED",
  "SUBSCRIPTION_EXPIRED",
];

export default function CircleSubscriptions() {
  const { t } = useTranslation();

  const [status, setStatus] = useState<CircleSubscriptionStatus | "all">("all");
  const [planId, setPlanId] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [grantOpen, setGrantOpen] = useState(false);
  const [expireTarget, setExpireTarget] = useState<CircleSubscription | null>(null);
  const [expireOpen, setExpireOpen] = useState(false);

  const { data: plansData } = useAdminCirclePlans({ includeInactive: true });
  const plans = plansData?.adminCirclePlans ?? [];

  const { data, loading, error, refetch } = useAdminCircleSubscriptions({
    status: status === "all" ? undefined : status,
    planId: planId === "all" ? undefined : planId,
    limit: PAGE_LIMIT,
    offset,
  });

  const subscriptions = data?.adminCircleSubscriptions ?? [];
  // No total from the API — a full page is the only signal that more exist.
  const hasMore = subscriptions.length === PAGE_LIMIT;

  const openExpire = (subscription: CircleSubscription) => {
    setExpireTarget(subscription);
    setExpireOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {t("circles.subscriptions.title")}
            </h1>
            <p className="text-muted-foreground">{t("circles.subscriptions.subtitle")}</p>
          </div>
          <Button onClick={() => setGrantOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("circles.subscriptions.grant")}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as CircleSubscriptionStatus | "all");
              setOffset(0);
            }}
          >
            <SelectTrigger className="sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">
                {t("circles.subscriptions.allStatuses")}
              </SelectItem>
              {STATUS_FILTERS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`circles.subscriptionStatus.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={planId}
            onValueChange={(v) => {
              setPlanId(v);
              setOffset(0);
            }}
          >
            <SelectTrigger className="sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">{t("circles.subscriptions.allPlans")}</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="glass">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>{t("circles.subscriptions.columns.circle")}</TableHead>
                    <TableHead>{t("circles.subscriptions.columns.plan")}</TableHead>
                    <TableHead>{t("circles.subscriptions.columns.amount")}</TableHead>
                    <TableHead>{t("circles.subscriptions.columns.interval")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("circles.subscriptions.columns.periodEnd")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        {t("circles.subscriptions.loading")}
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-destructive">
                        {friendlyErrorMessage(error, t("circles.subscriptions.loadError"))}
                        <div className="pt-3">
                          <Button variant="outline" size="sm" onClick={() => refetch()}>
                            {t("common.retry")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        {t("circles.subscriptions.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((subscription) => (
                      <TableRow key={subscription.id} className="border-border/50">
                        <TableCell>
                          {/* The API returns only the owner id — no circle name
                              travels on a subscription — so this links out to
                              the circle rather than pretending to know it. */}
                          <Link
                            to={`/circles/${subscription.ownerId}`}
                            className="font-mono text-xs text-foreground hover:underline"
                          >
                            {subscription.ownerId}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{subscription.planCode ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("circles.subscriptions.planVersion", {
                              version: subscription.planVersion,
                            })}
                          </p>
                        </TableCell>
                        <TableCell>
                          {formatMinorUnits(subscription.amountMinor, subscription.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {subscription.interval
                            ? t(`circles.interval.${subscription.interval}`, {
                                defaultValue: subscription.interval,
                              })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <CircleSubscriptionStatusBadge status={subscription.status} />
                          {subscription.cancelAtPeriodEnd && (
                            <p className="pt-1 text-xs text-muted-foreground">
                              {t("circles.subscriptions.cancelAtPeriodEnd")}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {subscription.currentPeriodEnd
                            ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openExpire(subscription)}
                          >
                            {t("circles.subscriptions.expire")}
                          </Button>
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
                {t("circles.subscriptions.showing", {
                  from: subscriptions.length ? offset + 1 : 0,
                  to: offset + subscriptions.length,
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

        <GrantSubscriptionDialog
          open={grantOpen}
          onOpenChange={setGrantOpen}
          plans={plans}
        />
        <ForceExpireDialog
          open={expireOpen}
          onOpenChange={setExpireOpen}
          subscription={expireTarget}
        />
      </div>
    </AdminLayout>
  );
}
