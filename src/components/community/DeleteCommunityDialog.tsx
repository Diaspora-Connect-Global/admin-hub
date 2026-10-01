import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useSoftDeleteCommunity } from "@/hooks/admin";
import { displayErrorMessage, throwIfGraphQLErrors } from "@/lib/graphqlErrors";

export interface DeletableCommunity {
  id: string;
  name: string;
  membersCount: number;
}

interface DeleteCommunityDialogProps {
  community: DeletableCommunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the server confirmed the deletion, to re-read the list. */
  onDeleted: () => unknown;
}

/**
 * Deletes a community, behind a confirmation that says what actually happens.
 *
 * `softDeleteCommunity` sets `deleted_at` (the community leaves every list and
 * search), cancels every live membership, and deletes the community's default
 * group. Only the first is reversible server-side — a restore would bring back
 * an empty community with no group — and the console has no restore, so the
 * copy says it cannot be undone here. Typing the community's name is required
 * because a single misplaced click would otherwise end every membership.
 */
export function DeleteCommunityDialog({ community, open, onOpenChange, onDeleted }: DeleteCommunityDialogProps) {
  const { t } = useTranslation();
  const confirmId = useId();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [softDeleteCommunity, { loading: deleting }] = useSoftDeleteCommunity();

  // Latch the target when the dialog opens; the refetch after a deletion must
  // not swap the name in a closing dialog, and typed text never carries over.
  const [target, setTarget] = useState<DeletableCommunity | null>(null);
  const openKey = open && community ? community.id : null;
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (openKey !== openedFor) {
    setOpenedFor(openKey);
    if (openKey) {
      setTarget(community);
      setTyped("");
      setError(null);
    }
  }

  if (!target) return null;

  const nameMatches = typed.trim() === target.name.trim();

  const handleDelete = async () => {
    if (!nameMatches) return;
    setError(null);
    try {
      const result = await softDeleteCommunity({ variables: { communityId: target.id } });
      // errorPolicy "all" resolves a refusal instead of rejecting — check it.
      throwIfGraphQLErrors(result, "SoftDeleteCommunity");
      if (!result.data?.softDeleteCommunity?.success) {
        throw new Error(result.data?.softDeleteCommunity?.message || t("communities.delete.failed"));
      }
    } catch (err) {
      const message = displayErrorMessage(err, t("communities.delete.failed"));
      setError(message);
      toast({ title: t("communities.delete.failed"), description: message, variant: "destructive" });
      return;
    }
    toast({
      title: t("communities.delete.deleted"),
      description: t("communities.delete.deletedDesc", { name: target.name }),
    });
    onOpenChange(false);
    await onDeleted();
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !deleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("communities.delete.title", { name: target.name })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("communities.delete.effect", { count: target.membersCount })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="text-sm font-medium text-destructive">{t("communities.delete.irreversible")}</p>

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleDelete();
          }}
        >
          <Label htmlFor={confirmId}>{t("communities.delete.confirmLabel", { name: target.name })}</Label>
          <Input
            id={confirmId}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            disabled={deleting}
          />
        </form>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting || !nameMatches}>
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {t("communities.delete.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
