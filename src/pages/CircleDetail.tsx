import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { downloadCsv } from "@/lib/csv";
import { formatMinorUnits } from "@/lib/money";
import {
  useAdminCircle,
  useAdminCircleSubscription,
  useAdminCircleAuditTrail,
  useAdminCirclePlans,
  useAdminGrantCircleSubscription,
  useAdminForceExpireCircleSubscription,
  describeEntitlement,
  CIRCLE_ENTITLEMENT_KEYS,
  type AdminCircle,
} from "@/hooks/admin";
import { CircleActionDialogs, type CircleAction } from "@/components/admin/CircleActionDialogs";
import {
  circleStatusVariant,
  subscriptionStatusVariant,
  formatDateTime,
  initialsOf,
} from "@/components/admin/circleDisplay";
import {
  ArrowLeft,
  Ban,
  RotateCcw,
  Trash2,
  Users,
  Globe,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Download,
  Loader2,
  Gift,
  TimerOff,
} from "lucide-react";

/** A row shown as label / value in the overview grid. */
function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

/**
 * One circle as the platform sees it: profile, live subscription with the
 * entitlements it was SOLD, the hash-chained audit trail, and the three
 * whole-circle acts.
 *
 * There is no member list and no motion control on this page because
 * `CircleAdminService` exposes neither. The audit trail is the one place
 * oversight looks inside a circle, and it is read-only — which is exactly what
 * makes it the record that settles a later complaint.
 */
export default function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [action, setAction] = useState<CircleAction | null>(null);
  const [auditSince, setAuditSince] = useState("");
  const [auditOpen, setAuditOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantPlanId, setGrantPlanId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [grantExpiresAt, setGrantExpiresAt] = useState("");
  const [expireOpen, setExpireOpen] = useState(false);
  const [expireReason, setExpireReason] = useState("");

  const { data, loading, error, refetch } = useAdminCircle(id);
  const circle = data?.adminCircle ?? null;

  const {
    data: subData,
    loading: subLoading,
    refetch: refetchSub,
  } = useAdminCircleSubscription(id);
  const subscription = subData?.adminCircleSubscription ?? null;

  const {
    data: auditData,
    loading: auditLoading,
    error: auditError,
  } = useAdminCircleAuditTrail(id, auditSince, { skip: !auditOpen });
  const auditPage = auditData?.adminCircleAuditTrail ?? null;

  // Only ACTIVE plans are grantable — putting a circle onto a plan that has
  // been retired from the catalogue is how a tier nobody maintains ends up live.
  const { data: plansData } = useAdminCirclePlans(false);
  const plans = useMemo(() => plansData?.adminCirclePlans ?? [], [plansData]);

  const [grantSubscription, { loading: granting }] = useAdminGrantCircleSubscription();
  const [forceExpire, { loading: expiring }] = useAdminForceExpireCircleSubscription();

  const entitlementLabels = {
    unlimited: t("circles.unlimited"),
    notSet: t("circles.notSet"),
    on: t("common.yes"),
    off: t("common.no"),
  };

  const onError = (e: unknown) =>
    toast({
      title: t("common.errorTitle"),
      description: friendlyErrorMessage(e),
      variant: "destructive",
    });

  const handleGrant = async () => {
    if (!id || !grantPlanId || !grantReason.trim()) return;
    try {
      await grantSubscription({
        variables: {
          input: {
            circleId: id,
            planId: grantPlanId,
            reason: grantReason.trim(),
            // Omitted entirely for an open-ended grant — an empty string is not
            // a valid ISO-8601 instant.
            expiresAt: grantExpiresAt ? new Date(grantExpiresAt).toISOString() : undefined,
          },
        },
      });
      toast({ title: t("common.success"), description: t("circles.granted") });
      setGrantOpen(false);
      setGrantPlanId("");
      setGrantReason("");
      setGrantExpiresAt("");
      await refetchSub();
    } catch (e) {
      onError(e);
    }
  };

  const handleForceExpire = async () => {
    if (!subscription || !expireReason.trim()) return;
    try {
      await forceExpire({
        variables: { subscriptionId: subscription.id, reason: expireReason.trim() },
      });
      toast({ title: t("common.success"), description: t("circles.expired") });
      setExpireOpen(false);
      setExpireReason("");
      await refetchSub();
    } catch (e) {
      onError(e);
    }
  };

  const exportAudit = () => {
    if (!auditPage?.events.length) return;
    downloadCsv(
      `circle-${circle?.circleNumber ?? id}-audit.csv`,
      auditPage.events.map((e) => ({
        seq: e.seq,
        occurredAt: e.occurredAt ?? "",
        eventType: e.eventType,
        actorUserId: e.actorUserId ?? "",
        subjectType: e.subjectType ?? "",
        subjectId: e.subjectId ?? "",
        payloadJson: e.payloadJson ?? "",
      })),
    );
  };

  if (loading && !circle) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
      </AdminLayout>
    );
  }

  if (error || !circle) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Button variant="ghost" asChild>
            <Link to="/circles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("circles.backToList")}
            </Link>
          </Button>
          <div className="py-16 text-center text-sm text-destructive">
            {error ? friendlyErrorMessage(error) : t("circles.notFound")}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Button variant="ghost" asChild className="-ml-2">
          <Link to="/circles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("circles.backToList")}
          </Link>
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={circle.avatarUrl ?? undefined} />
              <AvatarFallback>{initialsOf(circle.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{circle.name}</h1>
                <StatusBadge variant={circleStatusVariant(circle.status)}>
                  {t(`circles.statusValue.${circle.status}`, circle.status)}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground">
                {circle.handle ? `@${circle.handle}` : circle.circleNumber ?? circle.id}
                {circle.tagline ? ` · ${circle.tagline}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {circle.status === "SUSPENDED" ? (
              <Button variant="outline" onClick={() => setAction("unsuspend")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("circles.unsuspend")}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setAction("suspend")}>
                <Ban className="mr-2 h-4 w-4" />
                {t("circles.suspend")}
              </Button>
            )}
            <Button variant="destructive" onClick={() => setAction("dissolve")}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("circles.dissolve")}
            </Button>
          </div>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("circles.overview")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label={t("circles.members")}>
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                {circle.memberCount}
              </span>
            </Detail>
            <Detail label={t("circles.joinMode")}>
              {t(`circles.joinModeValue.${circle.joinMode}`, circle.joinMode)}
            </Detail>
            <Detail label={t("circles.discoverability")}>
              <span className="inline-flex items-center gap-1">
                {circle.discoverable ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {circle.discoverable ? t("circles.discoverable") : t("circles.hidden")}
              </span>
            </Detail>
            <Detail label={t("circles.circleNumber")}>{circle.circleNumber ?? "—"}</Detail>
            <Detail label={t("circles.founder")}>
              {circle.founderUserId ? (
                <Link to={`/users/${circle.founderUserId}`} className="hover:underline">
                  {circle.founderUserId}
                </Link>
              ) : (
                "—"
              )}
            </Detail>
            <Detail label={t("circles.created")}>{formatDateTime(circle.createdAt)}</Detail>
            <Detail label={t("circles.updated")}>{formatDateTime(circle.updatedAt)}</Detail>
            <Detail label={t("circles.archivedAt")}>{formatDateTime(circle.archivedAt)}</Detail>
            <Detail label={t("circles.circleId")}>
              <span className="break-all font-mono text-xs">{circle.id}</span>
            </Detail>
            {circle.description && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Detail label={t("circles.description")}>{circle.description}</Detail>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t("circles.subscription")}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setGrantOpen(true)}>
                <Gift className="mr-2 h-4 w-4" />
                {t("circles.grantPlan")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!subscription}
                onClick={() => setExpireOpen(true)}
              >
                <TimerOff className="mr-2 h-4 w-4" />
                {t("circles.forceExpire")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subLoading && !subscription ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : !subscription ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("circles.noSubscription")}
              </p>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* planCode is display only — nothing branches on a tier name. */}
                  <Detail label={t("circles.plan")}>
                    <Badge variant="outline">{subscription.planCode ?? subscription.planId}</Badge>
                  </Detail>
                  <Detail label={t("circles.subscriptionStatus")}>
                    <StatusBadge variant={subscriptionStatusVariant(subscription.status)}>
                      {t(`circles.subscriptionStatusValue.${subscription.status}`, subscription.status)}
                    </StatusBadge>
                  </Detail>
                  <Detail label={t("circles.price")}>
                    {/* The only place minor units become a decimal. */}
                    {formatMinorUnits(subscription.amountMinor, subscription.currency)}
                    {subscription.interval ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        / {t(`circlePlans.intervalValue.${subscription.interval}`, subscription.interval)}
                      </span>
                    ) : null}
                  </Detail>
                  <Detail label={t("circles.planVersion")}>{subscription.planVersion}</Detail>
                  <Detail label={t("circles.periodStart")}>
                    {formatDateTime(subscription.currentPeriodStart)}
                  </Detail>
                  <Detail label={t("circles.periodEnd")}>
                    {formatDateTime(subscription.currentPeriodEnd)}
                  </Detail>
                  <Detail label={t("circles.cancelAtPeriodEnd")}>
                    {subscription.cancelAtPeriodEnd ? t("common.yes") : t("common.no")}
                  </Detail>
                  <Detail label={t("circles.purchasedBy")}>
                    {subscription.purchasedByUserId ?? "—"}
                  </Detail>
                </div>

                <div>
                  <h3 className="text-sm font-medium">{t("circles.entitlementsSnapshot")}</h3>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {t("circles.entitlementsSnapshotHelp")}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {CIRCLE_ENTITLEMENT_KEYS.map(({ key }) => {
                      const ent = subscription.entitlements.find((e) => e.key === key);
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                        >
                          <span className="text-xs text-muted-foreground">
                            {t(`circlePlans.entitlementKey.${key}`, key)}
                          </span>
                          <span className="text-sm font-medium">
                            {describeEntitlement(ent, entitlementLabels)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit trail */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("circles.auditTrail")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">{t("circles.auditTrailHelp")}</p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="audit-since" className="text-xs">
                  {t("circles.auditSince")}
                </Label>
                <Input
                  id="audit-since"
                  type="date"
                  value={auditSince}
                  onChange={(e) => setAuditSince(e.target.value)}
                />
              </div>
              <Button onClick={() => setAuditOpen(true)} disabled={auditLoading}>
                {auditLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("circles.loadAuditTrail")}
              </Button>
              <Button
                variant="outline"
                onClick={exportAudit}
                disabled={!auditPage?.events.length}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("circles.exportCsv")}
              </Button>
            </div>

            {auditError ? (
              <div className="py-8 text-center text-sm text-destructive">
                {friendlyErrorMessage(auditError)}
              </div>
            ) : !auditOpen ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("circles.auditNotLoaded")}
              </p>
            ) : auditLoading && !auditPage ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : (
              <>
                {/* A broken hash chain is the single most important thing this
                    page can say, so it is a banner rather than a column. */}
                {auditPage && (
                  <div
                    className={
                      auditPage.chainVerified
                        ? "flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
                        : "flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    }
                  >
                    {auditPage.chainVerified ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <ShieldAlert className="h-4 w-4" />
                    )}
                    {auditPage.chainVerified
                      ? t("circles.chainVerified")
                      : t("circles.chainNotVerified")}
                  </div>
                )}

                {!auditPage?.events.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t("circles.auditEmpty")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">{t("circles.auditSeq")}</TableHead>
                          <TableHead>{t("circles.auditEvent")}</TableHead>
                          <TableHead>{t("circles.auditActor")}</TableHead>
                          <TableHead>{t("circles.auditSubject")}</TableHead>
                          <TableHead>{t("circles.auditWhen")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditPage.events.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="font-mono text-xs">{e.seq}</TableCell>
                            <TableCell className="text-sm">{e.eventType}</TableCell>
                            <TableCell className="max-w-[12rem] truncate font-mono text-xs">
                              {/* Null after a GDPR erasure; the chain still verifies. */}
                              {e.actorUserId ?? t("circles.auditActorErased")}
                            </TableCell>
                            <TableCell className="max-w-[14rem] truncate text-xs text-muted-foreground">
                              {e.subjectType ? `${e.subjectType}: ${e.subjectId ?? "—"}` : "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDateTime(e.occurredAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">{t("circles.noReachInsideNote")}</p>
      </div>

      {/* Grant a plan */}
      <Dialog open={grantOpen} onOpenChange={(o) => !o && !granting && setGrantOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("circles.grantTitle")}</DialogTitle>
            <DialogDescription>{t("circles.grantDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("circles.plan")}</Label>
              <Select value={grantPlanId} onValueChange={setGrantPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("circles.selectPlan")} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-reason">{t("circles.reasonRequired")}</Label>
              <Textarea
                id="grant-reason"
                rows={3}
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder={t("circles.grantReasonPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-expires">{t("circles.grantExpiresAt")}</Label>
              <Input
                id="grant-expires"
                type="date"
                value={grantExpiresAt}
                onChange={(e) => setGrantExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("circles.grantExpiresHelp")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)} disabled={granting}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleGrant}
              disabled={granting || !grantPlanId || !grantReason.trim()}
            >
              {granting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("circles.grantPlan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force-expire */}
      <Dialog open={expireOpen} onOpenChange={(o) => !o && !expiring && setExpireOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("circles.forceExpireTitle")}</DialogTitle>
            <DialogDescription>{t("circles.forceExpireDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="expire-reason">{t("circles.reasonRequired")}</Label>
            <Textarea
              id="expire-reason"
              rows={3}
              value={expireReason}
              onChange={(e) => setExpireReason(e.target.value)}
              placeholder={t("circles.reasonPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpireOpen(false)} disabled={expiring}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleForceExpire}
              disabled={expiring || !expireReason.trim()}
            >
              {expiring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("circles.forceExpire")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CircleActionDialogs
        action={action}
        circle={circle as AdminCircle}
        onClose={() => setAction(null)}
        onSuccess={async (message) => {
          toast({ title: t("common.success"), description: message });
          await refetch();
        }}
        onError={onError}
      />
    </AdminLayout>
  );
}
