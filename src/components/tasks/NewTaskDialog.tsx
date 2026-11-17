import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminTaskActions, useAdminTaskTeam } from "@/hooks/admin/useAdminTasks";
import {
  endOfLocalDayIso,
  isWithinDueWindow,
  TASK_LIMITS,
  TASK_PRIORITIES,
  taskErrorMessage,
  type AdminTaskDetail,
  type AdminTaskPriority,
} from "@/lib/adminTasks";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (detail: AdminTaskDetail) => void;
}

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function NewTaskDialog({ open, onOpenChange, onCreated }: NewTaskDialogProps) {
  const { t } = useTranslation();
  const { team } = useAdminTaskTeam();
  const actions = useAdminTaskActions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<AdminTaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canAssignOthers = team?.viewerCanAssignOthers === true;

  // A fresh form every time it opens: nothing typed for one task leaks into the next.
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setPriority("MEDIUM");
    setDueDate("");
    setItems([]);
    setProblems([]);
    setSubmitError(null);
  }, [open]);

  const validate = (cleanItems: string[], dueIso: string | null): string[] => {
    const out: string[] = [];
    const trimmed = title.trim();
    if (!trimmed) out.push(t("tasks.validation.titleRequired"));
    else if (trimmed.length > TASK_LIMITS.title) out.push(t("tasks.validation.titleTooLong", { max: TASK_LIMITS.title }));
    if (description.length > TASK_LIMITS.description) {
      out.push(t("tasks.validation.descriptionTooLong", { max: TASK_LIMITS.description }));
    }
    if (cleanItems.length > TASK_LIMITS.checklistItems) {
      out.push(t("tasks.validation.tooManyItems", { max: TASK_LIMITS.checklistItems }));
    }
    if (cleanItems.some((i) => i.length > TASK_LIMITS.checklistItem)) {
      out.push(t("tasks.validation.itemTooLong", { max: TASK_LIMITS.checklistItem }));
    }
    if (dueDate && (!dueIso || !isWithinDueWindow(dueIso))) out.push(t("tasks.validation.dueInvalid"));
    return out;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const cleanItems = items.map((i) => i.trim()).filter(Boolean);
    const dueIso = dueDate ? endOfLocalDayIso(dueDate) : null;
    const found = validate(cleanItems, dueIso);
    setProblems(found);
    setSubmitError(null);
    if (found.length > 0) return;

    const input: Record<string, unknown> = { title: title.trim(), priority };
    if (description.trim()) input.description = description.trim();
    if (canAssignOthers && assigneeId) input.assigneeId = assigneeId;
    if (dueIso) input.dueAt = dueIso;
    if (cleanItems.length > 0) input.checklist = cleanItems;

    setBusy(true);
    try {
      const detail = await actions.create(input);
      onCreated(detail);
      onOpenChange(false);
    } catch (err) {
      setSubmitError(taskErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("tasks.new.title")}</DialogTitle>
          <DialogDescription>{t("tasks.new.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="new-task-title">{t("tasks.field.title")}</Label>
            <Input id="new-task-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-task-description">{t("tasks.field.description")}</Label>
            <Textarea
              id="new-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {canAssignOthers ? (
            <div className="space-y-1">
              <Label htmlFor="new-task-assignee">{t("tasks.field.assignee")}</Label>
              <select
                id="new-task-assignee"
                className={selectClass}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">{t("tasks.new.myself")}</option>
                {team?.members
                  .filter((m) => !m.isViewer)
                  .map((m) => (
                    <option key={m.admin.id} value={m.admin.id}>
                      {m.admin.email}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("tasks.new.selfNote")}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="new-task-priority">{t("tasks.field.priority")}</Label>
              <select
                id="new-task-priority"
                className={selectClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value as AdminTaskPriority)}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(`tasks.priority.${p}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-task-due">{t("tasks.field.dueDate")}</Label>
              <Input id="new-task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("tasks.field.checklist")}</legend>
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  aria-label={t("tasks.new.itemN", { n: index + 1 })}
                  value={item}
                  onChange={(e) => setItems((prev) => prev.map((v, i) => (i === index ? e.target.value : v)))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("tasks.new.removeItemN", { n: index + 1 })}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={items.length >= TASK_LIMITS.checklistItems}
              onClick={() => setItems((prev) => [...prev, ""])}
            >
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              {t("tasks.new.addItem")}
            </Button>
          </fieldset>

          {(problems.length > 0 || submitError) && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {problems.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {submitError && <p>{submitError}</p>}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("tasks.cancelDialog")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("tasks.new.creating") : t("tasks.new.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
