import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { Opportunity } from "@/types/opportunities";

interface DeleteOpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: Opportunity | null;
  onConfirm: () => void;
}

export function DeleteOpportunityModal({
  open,
  onOpenChange,
  opportunity,
  onConfirm,
}: DeleteOpportunityModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText === "DELETE";

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
      setConfirmText("");
      onOpenChange(false);
    }
  };

  if (!opportunity) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Are you sure you want to delete <strong>"{opportunity.title}"</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          <p>• This will permanently delete the opportunity</p>
          <p>• All {opportunity.applicantsCount} applicant records will be archived</p>
          <p>• Associated drafts will be removed</p>
        </div>

        <div className="space-y-2 py-2">
          <Label htmlFor="confirm">Type DELETE to confirm</Label>
          <Input
            id="confirm"
            placeholder="DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Opportunity
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
