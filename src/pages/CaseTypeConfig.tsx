import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { Plus, Edit, Power } from "lucide-react";
import {
  useAdminCaseTypes,
  useCreateCaseType,
  useUpdateCaseType,
  useDeactivateCaseType,
  type SupportCaseType,
  type OwnerType,
  type CasePriority,
} from "@/hooks/admin";

const OWNER_TYPES: OwnerType[] = ["COMMUNITY", "ASSOCIATION", "MARKETPLACE", "SYSTEM"];
const PRIORITIES: CasePriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const titleCase = (value?: string | null) =>
  value
    ? value
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "—";

interface CaseTypeForm {
  ownerType: OwnerType;
  ownerEntityId: string;
  code: string;
  displayName: string;
  description: string;
  defaultPriority: CasePriority | "none";
  slaHours: string;
  caseNumberPrefix: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: CaseTypeForm = {
  ownerType: "SYSTEM",
  ownerEntityId: "",
  code: "",
  displayName: "",
  description: "",
  defaultPriority: "none",
  slaHours: "",
  caseNumberPrefix: "",
  sortOrder: "",
  isActive: true,
};

export default function CaseTypeConfig() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data, loading } = useAdminCaseTypes();
  const caseTypes = data?.adminCaseTypes ?? [];

  const [createMutation, { loading: createLoading }] = useCreateCaseType();
  const [updateMutation, { loading: updateLoading }] = useUpdateCaseType();
  const [deactivateMutation] = useDeactivateCaseType();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupportCaseType | null>(null);
  const [form, setForm] = useState<CaseTypeForm>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (ct: SupportCaseType) => {
    setEditing(ct);
    setForm({
      ownerType: ct.ownerType as OwnerType,
      ownerEntityId: ct.ownerEntityId ?? "",
      code: ct.code,
      displayName: ct.displayName,
      description: ct.description ?? "",
      defaultPriority: (ct.defaultPriority as CasePriority) ?? "none",
      slaHours: ct.slaHours != null ? String(ct.slaHours) : "",
      caseNumberPrefix: ct.caseNumberPrefix ?? "",
      sortOrder: ct.sortOrder != null ? String(ct.sortOrder) : "",
      isActive: ct.isActive,
    });
    setIsDialogOpen(true);
  };

  const parseIntOrUndefined = (v: string): number | undefined => {
    if (!v.trim()) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await updateMutation({
          variables: {
            input: {
              id: editing.id,
              displayName: form.displayName.trim() || undefined,
              description: form.description.trim() || undefined,
              defaultPriority:
                form.defaultPriority !== "none" ? form.defaultPriority : undefined,
              slaHours: parseIntOrUndefined(form.slaHours),
              caseNumberPrefix: form.caseNumberPrefix.trim() || undefined,
              sortOrder: parseIntOrUndefined(form.sortOrder),
              isActive: form.isActive,
            },
          },
        });
        toast({ title: t("common.save"), description: t("caseTypes.updateSuccess") });
      } else {
        await createMutation({
          variables: {
            input: {
              ownerType: form.ownerType,
              ownerEntityId: form.ownerEntityId.trim() || undefined,
              code: form.code.trim(),
              displayName: form.displayName.trim(),
              description: form.description.trim() || undefined,
              defaultPriority:
                form.defaultPriority !== "none" ? form.defaultPriority : undefined,
              slaHours: parseIntOrUndefined(form.slaHours),
              caseNumberPrefix: form.caseNumberPrefix.trim() || undefined,
              sortOrder: parseIntOrUndefined(form.sortOrder),
            },
          },
        });
        toast({ title: t("common.save"), description: t("caseTypes.createSuccess") });
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      const fallback = editing ? t("caseTypes.updateError") : t("caseTypes.createError");
      const message = friendlyErrorMessage(err, fallback);
      toast({ title: t("common.errorTitle"), description: message, variant: "destructive" });
    }
  };

  const handleDeactivate = async (ct: SupportCaseType) => {
    if (!window.confirm(t("caseTypes.deactivateConfirm"))) return;
    try {
      await deactivateMutation({ variables: { id: ct.id } });
      toast({ title: t("common.save"), description: t("caseTypes.deactivateSuccess") });
    } catch (err: unknown) {
      const message = friendlyErrorMessage(err, t("caseTypes.deactivateError"));
      toast({ title: t("common.errorTitle"), description: message, variant: "destructive" });
    }
  };

  const submitDisabled =
    createLoading ||
    updateLoading ||
    (!editing && (!form.code.trim() || !form.displayName.trim())) ||
    (!!editing && !form.displayName.trim());

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("caseTypes.title")}</h1>
            <p className="text-muted-foreground">{t("caseTypes.subtitle")}</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("caseTypes.create")}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("caseTypes.code")}</TableHead>
                <TableHead>{t("caseTypes.displayName")}</TableHead>
                <TableHead>{t("caseTypes.ownerType")}</TableHead>
                <TableHead>{t("caseTypes.defaultPriority")}</TableHead>
                <TableHead>{t("caseTypes.slaHours")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && caseTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t("caseTypes.loading")}
                  </TableCell>
                </TableRow>
              ) : caseTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t("caseTypes.noTypes")}
                  </TableCell>
                </TableRow>
              ) : (
                caseTypes.map((ct) => (
                  <TableRow key={ct.id}>
                    <TableCell className="font-mono text-sm">{ct.code}</TableCell>
                    <TableCell className="font-medium">{ct.displayName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{titleCase(ct.ownerType)}</Badge>
                    </TableCell>
                    <TableCell>{titleCase(ct.defaultPriority)}</TableCell>
                    <TableCell>{ct.slaHours ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={ct.isActive ? "default" : "outline"}>
                        {ct.isActive ? t("caseTypes.active") : t("caseTypes.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("caseTypes.edit")}
                          onClick={() => openEdit(ct)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("caseTypes.deactivate")}
                          disabled={!ct.isActive}
                          onClick={() => handleDeactivate(ct)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create / Edit dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? t("caseTypes.edit") : t("caseTypes.create")}
              </DialogTitle>
              <DialogDescription>{t("caseTypes.subtitle")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("caseTypes.ownerType")} *</Label>
                  <Select
                    value={form.ownerType}
                    onValueChange={(v) => setForm({ ...form, ownerType: v as OwnerType })}
                    disabled={!!editing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {OWNER_TYPES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {titleCase(o)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("caseTypes.code")} *</Label>
                  <Input
                    value={form.code}
                    disabled={!!editing}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="REFUND_REQUEST"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("caseTypes.displayName")} *</Label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("caseTypes.ownerEntityId")}</Label>
                <Input
                  value={form.ownerEntityId}
                  disabled={!!editing}
                  onChange={(e) => setForm({ ...form, ownerEntityId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {t("caseTypes.ownerEntityHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("caseTypes.description")}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("caseTypes.defaultPriority")}</Label>
                  <Select
                    value={form.defaultPriority}
                    onValueChange={(v) =>
                      setForm({ ...form, defaultPriority: v as CasePriority | "none" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="none">—</SelectItem>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {titleCase(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("caseTypes.slaHours")}</Label>
                  <Input
                    type="number"
                    value={form.slaHours}
                    onChange={(e) => setForm({ ...form, slaHours: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("caseTypes.caseNumberPrefix")}</Label>
                  <Input
                    value={form.caseNumberPrefix}
                    onChange={(e) => setForm({ ...form, caseNumberPrefix: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("caseTypes.sortOrder")}</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  />
                </div>
              </div>
              {editing && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="case-type-active">{t("caseTypes.active")}</Label>
                  <Switch
                    id="case-type-active"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={submitDisabled}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
