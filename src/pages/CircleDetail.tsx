import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import {
  CircleStatusBadge,
  CircleSubscriptionStatusBadge,
} from "@/components/circle/circleStatus";
import { EntitlementSummary } from "@/components/circle/entitlements";
import {
  CircleModerationDialog,
  type CircleModerationAction,
} from "@/components/circle/CircleModerationDialog";
import { GrantSubscriptionDialog } from "@/components/circle/GrantSubscriptionDialog";
import { ForceExpireDialog } from "@/components/circle/ForceExpireDialog";
import { formatMinorUnits } from "@/lib/money";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";
import {
  useAdminCircle,
  useAdminCircleAuditTrail,
  useAdminCirclePlans,
  useAdminCircleSubscription,
} from "@/hooks/admin";

/**
 * One circle, as platform oversight sees it: profile, subscription, and the
 * audit trail — plus the two exceptional moderation actions.
 *
 * The audit trail is the ONE place the platform looks inside a circle, and it
 * is read-only by construction. That asymmetry is the point: if a removed
 * member complains to us that they were ejected BY the platform rather than
 * voted out, this hash-chained record is what settles it. Being able to read it
 * is not the same as being able to change anything in it — and there is no rpc
 * here to add or remove a member, or to open, vote on or override a motion.
 */
export default function CircleDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const circleId = id ?? null;

  const [moderationAction, setModerationAction] =
    useState<CircleModerationAction>("SUSPEND");
  const [moderationOpen, setModerationOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [expireOpen, setExpireOpen] = useState(false);
  const [since, setSince] = useState("");
  const [auditTab, setAuditTab] = useState(false);

  const {
    data: circleData,
    loading: circleLoading,
    error: circleError,
    refetch: refetchCircle,
  } = useAdminCircle(circleId);
  const circle = circleData?.adminCircle ?? null;

  const {
    data: subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError,
  } = useAdminCircleSubscription(circleId);
  const subscription = subscriptionData?.adminCircleSubscription ?? null;

  const { data: plansData } = useAdminCirclePlans({ includeInactive: true });
  const plans = plansData?.adminCirclePlans ?? [];

  // The audit export can be large, so it is only fetched once its tab is
  // opened rather than on every visit to the page.
  const {
    data: auditData,
    loading: auditLoading,
    error: auditError,
    refetch: refetchAudit,
  } = useAdminCircleAuditTrail(circleId, {
    since: since ? new Date(since).toISOString() : undefined,
    skip: !auditTab,
  });
  const auditPage = auditData?.adminCircleAuditTrail;

  const openModeration = (action: CircleModerationAction) => {
    setModerationAction(action);
    setModerationOpen(true);
  };

  if (circleLoading && !circle) {
    return (
      <AdminLayout>
        <LoadingState rows={6} />
      </AdminLayout>
    );
  }

  if (circleError) {
    return (
      <AdminLayout>
        <ErrorState
          message={friendlyErrorMessage(circleError, t("circles.detail.loadError"))}
          onRetry={() => refetchCircle()}
        />
      </AdminLayout>
    );
  }

  if (!circle) {
    return (
      <AdminLayout>
        <EmptyState
          title={t("circles.detail.notFound")}
          message={t("circles.detail.notFoundHint")}
          action={
            <Button asChild variant="outline">
              <Link to="/circles">{t("circles.detail.backToList")}</Link>
            </Button>
          }
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link to="/circles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("circles.detail.backToList")}
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{circle.name}</h1>
              <CircleStatusBadge status={circle.status} />
              {circle.circleNumber && (
                <Badge variant="outline" className="font-mono">
                  {circle.circleNumber}
                </Badge>
              )}
            </div>
            {circle.tagline && (
              <p className="text-muted-foreground">{circle.tagline}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {circle.status === "SUSPENDED" ? (
              <Button variant="outline" onClick={() => openModeration("UNSUSPEND")}>
                {t("circles.moderation.UNSUSPEND.action")}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => openModeration("SUSPEND")}>
                {t("circles.moderation.SUSPEND.action")}
              </Button>
            )}
            <Button variant="destructive" onClick={() => openModeration("DISSOLVE")}>
              {t("circles.moderation.DISSOLVE.action")}
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue="overview"
          onValueChange={(value) => {
            if (value === "audit") setAuditTab(true);
          }}
        >
          <TabsList>
            <TabsTrigger value="overview">{t("circles.detail.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="subscription">
              {t("circles.detail.tabs.subscription")}
            </TabsTrigger>
            <TabsTrigger value="audit">{t("circles.detail.tabs.audit")}</TabsTrigger>
          </TabsList>

          {/* ── Overview ───────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("circles.detail.profile")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <DetailRow label={t("circles.detail.fields.id")} value={circle.id} mono />
                <DetailRow
                  label={t("circles.detail.fields.handle")}
                  value={circle.handle ? `@${circle.handle}` : "—"}
                />
                <DetailRow
                  label={t("circles.detail.fields.members")}
                  value={String(circle.memberCount)}
                />
                <DetailRow
                  label={t("circles.detail.fields.joinMode")}
                  value={t(`circles.joinMode.${circle.joinMode}`, {
                    defaultValue: circle.joinMode,
                  })}
                />
                <DetailRow
                  label={t("circles.detail.fields.discoverable")}
                  value={circle.discoverable ? t("common.yes") : t("common.no")}
                />
                <DetailRow
                  label={t("circles.detail.fields.founder")}
                  value={circle.founderUserId ?? "—"}
                  mono
                />
                <DetailRow
                  label={t("circles.detail.fields.created")}
                  value={
                    circle.createdAt ? new Date(circle.createdAt).toLocaleString() : "—"
                  }
                />
                <DetailRow
                  label={t("circles.detail.fields.updated")}
                  value={
                    circle.updatedAt ? new Date(circle.updatedAt).toLocaleString() : "—"
                  }
                />
                {circle.archivedAt && (
                  <DetailRow
                    label={t("circles.detail.fields.archived")}
                    value={new Date(circle.archivedAt).toLocaleString()}
                  />
                )}
              </CardContent>
            </Card>

            {circle.description && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("common.description")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {circle.description}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("circles.detail.limitsTitle")}
                </CardTitle>
                <CardDescription>{t("circles.detail.limitsHint")}</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* ── Subscription ───────────────────────────────────────────────── */}
          <TabsContent value="subscription" className="space-y-4 pt-4">
            {subscriptionLoading && !subscription ? (
              <LoadingState rows={3} />
            ) : subscriptionError ? (
              <ErrorState
                message={friendlyErrorMessage(
                  subscriptionError,
                  t("circles.detail.subscriptionError"),
                )}
              />
            ) : !subscription ? (
              <EmptyState
                title={t("circles.detail.noSubscription")}
                message={t("circles.detail.noSubscriptionHint")}
                action={
                  <Button onClick={() => setGrantOpen(true)}>
                    {t("circles.subscriptions.grant")}
                  </Button>
                }
              />
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>{subscription.planCode ?? "—"}</CardTitle>
                      <CardDescription>
                        {t("circles.subscriptions.planVersion", {
                          version: subscription.planVersion,
                        })}
                      </CardDescription>
                    </div>
                    <CircleSubscriptionStatusBadge status={subscription.status} />
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <DetailRow
                      label={t("circles.subscriptions.columns.amount")}
                      value={formatMinorUnits(
                        subscription.amountMinor,
                        subscription.currency,
                      )}
                    />
                    <DetailRow
                      label={t("circles.subscriptions.columns.interval")}
                      value={
                        subscription.interval
                          ? t(`circles.interval.${subscription.interval}`, {
                              defaultValue: subscription.interval,
                            })
                          : "—"
                      }
                    />
                    <DetailRow
                      label={t("circles.subscriptions.columns.periodStart")}
                      value={
                        subscription.currentPeriodStart
                          ? new Date(subscription.currentPeriodStart).toLocaleString()
                          : "—"
                      }
                    />
                    <DetailRow
                      label={t("circles.subscriptions.columns.periodEnd")}
                      value={
                        subscription.currentPeriodEnd
                          ? new Date(subscription.currentPeriodEnd).toLocaleString()
                          : "—"
                      }
                    />
                    <DetailRow
                      label={t("circles.subscriptions.cancelAtPeriodEndLabel")}
                      value={
                        subscription.cancelAtPeriodEnd ? t("common.yes") : t("common.no")
                      }
                    />
                    <DetailRow
                      label={t("circles.subscriptions.purchasedBy")}
                      value={subscription.purchasedByUserId ?? "—"}
                      mono
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("circles.detail.entitlementSnapshot")}
                    </CardTitle>
                    <CardDescription>
                      {t("circles.detail.entitlementSnapshotHint")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EntitlementSummary
                      entitlements={subscription.entitlements}
                      emptyLabel={t("circles.plans.noEntitlements")}
                    />
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setGrantOpen(true)}>
                    {t("circles.subscriptions.grant")}
                  </Button>
                  <Button variant="outline" onClick={() => setExpireOpen(true)}>
                    {t("circles.subscriptions.expire")}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Audit trail ────────────────────────────────────────────────── */}
          <TabsContent value="audit" className="space-y-4 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="audit-since">{t("circles.detail.auditSince")}</Label>
                <Input
                  id="audit-since"
                  type="date"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  className="sm:w-56"
                />
              </div>
              <Button variant="outline" onClick={() => refetchAudit()}>
                {t("circles.detail.auditRefresh")}
              </Button>
            </div>

            {auditPage && (
              <div
                className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
                  auditPage.chainVerified
                    ? "border-success/40 bg-success/10"
                    : "border-destructive/40 bg-destructive/10"
                }`}
              >
                {auditPage.chainVerified ? (
                  <ShieldCheck className="h-5 w-5 shrink-0 text-success" aria-hidden />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
                )}
                <p>
                  {auditPage.chainVerified
                    ? t("circles.detail.chainVerified")
                    : t("circles.detail.chainBroken")}
                </p>
              </div>
            )}

            {auditLoading && !auditPage ? (
              <LoadingState rows={5} />
            ) : auditError ? (
              <ErrorState
                message={friendlyErrorMessage(auditError, t("circles.detail.auditError"))}
                onRetry={() => refetchAudit()}
              />
            ) : !auditPage || auditPage.events.length === 0 ? (
              <EmptyState
                title={t("circles.detail.auditEmpty")}
                message={t("circles.detail.auditEmptyHint")}
              />
            ) : (
              <Card className="glass">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead>{t("circles.detail.audit.seq")}</TableHead>
                          <TableHead>{t("circles.detail.audit.event")}</TableHead>
                          <TableHead>{t("circles.detail.audit.actor")}</TableHead>
                          <TableHead>{t("circles.detail.audit.subject")}</TableHead>
                          <TableHead>{t("circles.detail.audit.occurredAt")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditPage.events.map((event) => (
                          <TableRow key={event.id} className="border-border/50">
                            <TableCell className="font-mono text-xs">{event.seq}</TableCell>
                            <TableCell className="font-medium">{event.eventType}</TableCell>
                            <TableCell
                              className="max-w-[180px] truncate font-mono text-xs text-muted-foreground"
                              title={event.actorUserId ?? undefined}
                            >
                              {/* Nulled by a GDPR erasure — the chain still verifies. */}
                              {event.actorUserId ?? t("circles.detail.audit.actorErased")}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {event.subjectType
                                ? `${event.subjectType}${event.subjectId ? `: ${event.subjectId}` : ""}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {event.occurredAt
                                ? new Date(event.occurredAt).toLocaleString()
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <CircleModerationDialog
          open={moderationOpen}
          onOpenChange={setModerationOpen}
          circle={circle}
          action={moderationAction}
        />
        <GrantSubscriptionDialog
          open={grantOpen}
          onOpenChange={setGrantOpen}
          plans={plans}
          circleId={circle.id}
          circleName={circle.name}
        />
        <ForceExpireDialog
          open={expireOpen}
          onOpenChange={setExpireOpen}
          subscription={subscription}
        />
      </div>
    </AdminLayout>
  );
}

/** Label / value pair used across the detail cards. */
function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "break-all font-mono text-sm" : "text-sm"}>{value}</p>
    </div>
  );
}
