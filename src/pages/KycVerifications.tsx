import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { userLabel } from "@/lib/userLabel";
import {
  useApproveVerification,
  useBusinessVerifications,
  useIndividualVerifications,
  useRejectVerification,
  type BusinessVerification,
  type IndividualVerification,
} from "@/hooks/admin/useKycVerifications";

const PAGE_LIMIT = 20;
const FILTERS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
type Filter = (typeof FILTERS)[number];

/** Business statuses awaiting a decision (approve/reject are only valid here). */
const BUSINESS_PENDING = new Set(["DOCUMENTS_SUBMITTED", "UNDER_REVIEW"]);

function statusVariant(status: string): "pending" | "active" | "error" | "warning" | "inactive" {
  if (status === "APPROVED") return "active";
  if (status === "REJECTED") return "error";
  if (status === "SUSPENDED") return "warning";
  if (status === "PENDING" || BUSINESS_PENDING.has(status)) return "pending";
  return "inactive";
}

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");

/** The row a decision dialog is open for. */
type Target = { id: string; label: string; action: "approve" | "reject" };

export default function KycVerifications() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [tab, setTab] = useState<"businesses" | "individuals">("businesses");
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [offset, setOffset] = useState(0);
  const [target, setTarget] = useState<Target | null>(null);
  const [reason, setReason] = useState("");

  const vars = { status: filter === "ALL" ? undefined : filter, limit: PAGE_LIMIT, offset };
  const businesses = useBusinessVerifications(vars);
  const individuals = useIndividualVerifications(vars);
  const [approve, { loading: approving }] = useApproveVerification();
  const [reject, { loading: rejecting }] = useRejectVerification();

  const active = tab === "businesses" ? businesses : individuals;
  const total =
    tab === "businesses"
      ? businesses.data?.businessVerifications.total ?? 0
      : individuals.data?.individualVerifications.total ?? 0;
  const count =
    tab === "businesses"
      ? businesses.data?.businessVerifications.items.length ?? 0
      : individuals.data?.individualVerifications.items.length ?? 0;

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setOffset(0);
  };

  const closeDialog = () => {
    setTarget(null);
    setReason("");
  };

  const decide = async () => {
    if (!target) return;
    try {
      // The operation reports refusals (wrong status, not found) as
      // success:false rather than an error — check it, don't assume.
      const result =
        target.action === "approve"
          ? (await approve({ variables: { verificationId: target.id } })).data?.approveVerification
          : (await reject({ variables: { verificationId: target.id, reason: reason.trim() } })).data
              ?.rejectVerification;
      if (!result?.success) {
        throw new Error(result?.message || t("kycVerifications.actionFailed"));
      }
      toast({
        title: t(target.action === "approve" ? "kycVerifications.approved" : "kycVerifications.rejected"),
        description: target.label,
      });
      closeDialog();
      await Promise.all([businesses.refetch(), individuals.refetch()]);
    } catch (error) {
      toast({
        title: t("kycVerifications.actionFailed"),
        description: friendlyErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const actions = (id: string, label: string) => (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" onClick={() => setTarget({ id, label, action: "approve" })}>
        <Check className="mr-1 h-4 w-4" />
        {t("kycVerifications.approve")}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setTarget({ id, label, action: "reject" })}>
        <X className="mr-1 h-4 w-4" />
        {t("kycVerifications.reject")}
      </Button>
    </div>
  );

  const stateRow = (cols: number) => {
    if (active.loading && count === 0) {
      return (
        <TableRow>
          <TableCell colSpan={cols} className="py-8 text-center text-muted-foreground">
            {t("kycVerifications.loading")}
          </TableCell>
        </TableRow>
      );
    }
    if (active.error) {
      return (
        <TableRow>
          <TableCell colSpan={cols} className="py-8 text-center text-destructive">
            {t("kycVerifications.error")}
          </TableCell>
        </TableRow>
      );
    }
    if (count === 0) {
      return (
        <TableRow>
          <TableCell colSpan={cols} className="py-8 text-center text-muted-foreground">
            {t("kycVerifications.empty")}
          </TableCell>
        </TableRow>
      );
    }
    return null;
  };

  const businessRow = (b: BusinessVerification) => (
    <TableRow key={b.id} className="border-border/50 align-top">
      <TableCell>
        <div className="font-medium text-foreground">{b.businessName}</div>
        <div className="text-xs text-muted-foreground">
          {b.registrationNumber} · {b.countryOfIncorporation}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{userLabel({ name: b.submittedByName }, t("common.unknownUser"))}</TableCell>
      <TableCell>
        <ul className="space-y-1 text-sm">
          {b.owners.map((o) => (
            <li key={o.individualProfileId} className="flex items-center gap-2">
              <span className="text-foreground">{userLabel({ name: o.name }, t("common.unknownUser"))}</span>
              <span className="text-muted-foreground">{o.ownershipPercentage}%</span>
              {o.kycStatus && (
                <StatusBadge variant={statusVariant(o.kycStatus)}>
                  {t(`kycVerifications.ownerKyc.${o.kycStatus}`, { defaultValue: o.kycStatus })}
                </StatusBadge>
              )}
            </li>
          ))}
        </ul>
      </TableCell>
      <TableCell className="text-muted-foreground">{fmtDate(b.updatedAt)}</TableCell>
      <TableCell>
        <StatusBadge variant={statusVariant(b.status)} title={b.rejectionReason ?? undefined}>
          {t(`kycVerifications.businessStatus.${b.status}`, { defaultValue: b.status })}
        </StatusBadge>
      </TableCell>
      <TableCell className="text-right">
        {BUSINESS_PENDING.has(b.status) ? actions(b.id, b.businessName) : null}
      </TableCell>
    </TableRow>
  );

  const individualRow = (i: IndividualVerification) => (
    <TableRow key={i.id} className="border-border/50">
      <TableCell>
        <div className="font-medium text-foreground">{userLabel({ name: i.userName, email: i.userEmail }, t("common.unknownUser"))}</div>
        {i.userEmail && <div className="text-xs text-muted-foreground">{i.userEmail}</div>}
      </TableCell>
      <TableCell className="text-muted-foreground">{i.docType || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{fmtDate(i.submittedAt)}</TableCell>
      <TableCell>
        <StatusBadge variant={statusVariant(i.status)} title={i.rejectionReason ?? undefined}>
          {t(`kycVerifications.individualStatus.${i.status}`, { defaultValue: i.status })}
        </StatusBadge>
      </TableCell>
      <TableCell className="text-right">
        {i.status === "PENDING" ? actions(i.id, userLabel({ name: i.userName, email: i.userEmail }, t("common.unknownUser"))) : null}
      </TableCell>
    </TableRow>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t("kycVerifications.title")}</h1>
            <p className="text-muted-foreground">{t("kycVerifications.subtitle")}</p>
          </div>
          <Select value={filter} onValueChange={(v) => changeFilter(v as Filter)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((f) => (
                <SelectItem key={f} value={f}>
                  {t(`kycVerifications.filter.${f}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as typeof tab);
            setOffset(0);
          }}
        >
          <TabsList>
            <TabsTrigger value="businesses">{t("kycVerifications.tabs.businesses")}</TabsTrigger>
            <TabsTrigger value="individuals">{t("kycVerifications.tabs.individuals")}</TabsTrigger>
          </TabsList>

          <Card className="glass mt-4">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <TabsContent value="businesses" className="m-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead>{t("kycVerifications.columns.business")}</TableHead>
                        <TableHead>{t("kycVerifications.columns.submittedBy")}</TableHead>
                        <TableHead>{t("kycVerifications.columns.owners")}</TableHead>
                        <TableHead>{t("kycVerifications.columns.updated")}</TableHead>
                        <TableHead>{t("kycVerifications.columns.status")}</TableHead>
                        <TableHead className="text-right">{t("kycVerifications.columns.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stateRow(6) ?? businesses.data?.businessVerifications.items.map(businessRow)}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="individuals" className="m-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead>{t("kycVerifications.columns.user")}</TableHead>
                        <TableHead>{t("kycVerifications.columns.document")}</TableHead>
                        <TableHead>{t("kycVerifications.columns.submitted")}</TableHead>
                        <TableHead>{t("kycVerifications.columns.status")}</TableHead>
                        <TableHead className="text-right">{t("kycVerifications.columns.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stateRow(5) ?? individuals.data?.individualVerifications.items.map(individualRow)}
                    </TableBody>
                  </Table>
                </TabsContent>
              </div>
              <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {t("kycVerifications.showing", {
                    from: count ? offset + 1 : 0,
                    to: offset + count,
                    total,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset === 0 || active.loading}
                    onClick={() => setOffset((o) => Math.max(0, o - PAGE_LIMIT))}
                  >
                    {t("kycVerifications.previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset + count >= total || active.loading}
                    onClick={() => setOffset((o) => o + PAGE_LIMIT)}
                  >
                    {t("kycVerifications.next")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      <Dialog open={!!target} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(target?.action === "reject" ? "kycVerifications.rejectTitle" : "kycVerifications.approveTitle")}
            </DialogTitle>
            <DialogDescription>
              {t(
                target?.action === "reject"
                  ? "kycVerifications.rejectDescription"
                  : "kycVerifications.approveDescription",
                { name: target?.label ?? "" },
              )}
            </DialogDescription>
          </DialogHeader>
          {target?.action === "reject" && (
            <div className="space-y-2">
              <Label htmlFor="kyc-reject-reason">{t("kycVerifications.reasonLabel")}</Label>
              <Textarea
                id="kyc-reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("kycVerifications.reasonPlaceholder")}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {t("kycVerifications.cancel")}
            </Button>
            <Button
              variant={target?.action === "reject" ? "destructive" : "default"}
              disabled={approving || rejecting || (target?.action === "reject" && !reason.trim())}
              onClick={() => void decide()}
            >
              {t(target?.action === "reject" ? "kycVerifications.reject" : "kycVerifications.approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
