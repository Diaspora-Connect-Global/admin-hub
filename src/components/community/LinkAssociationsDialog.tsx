import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { useLinkAssociation, useSearchAssociationOptions } from "@/hooks/admin";
import type { AssociationOption } from "@/services/networks/graphql/admin";
import { displayErrorMessage, throwIfGraphQLErrors } from "@/lib/graphqlErrors";
import { runBulk } from "@/lib/bulkRun";
import { BulkActionStatus, type BulkFailure } from "./BulkActionStatus";

export interface LinkTargetCommunity {
  id: string;
  name: string;
}

interface LinkAssociationsDialogProps {
  /** One community (row action) or several (bulk action). */
  communities: LinkTargetCommunity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Re-read the list after at least one link was made. */
  onChanged: () => unknown;
  /** After a run: the ids that could NOT be linked (empty when all succeeded). */
  onCompleted?: (failedIds: string[]) => void;
}

const SEARCH_DEBOUNCE_MS = 300;
const LINK_CONCURRENCY = 4;

/**
 * Links one association to one or more communities.
 *
 * The association is picked by name from a server-side search
 * (`searchAssociations`, which a platform admin runs as super admin, so private
 * associations are included) — an admin never types or sees an id. A platform
 * admin is the approving side, so community-service activates each link at
 * once rather than filing a request.
 *
 * Each community is its own `linkAssociation` call (bounded concurrency), and
 * each result is checked: `errorPolicy: "all"` resolves a refusal instead of
 * rejecting, and the payload carries `success`. A partial run keeps the dialog
 * open and names every community that was not linked, with the reason.
 */
export function LinkAssociationsDialog({
  communities,
  open,
  onOpenChange,
  onChanged,
  onCompleted,
}: LinkAssociationsDialogProps) {
  const { t } = useTranslation();
  const searchId = useId();
  const resultsLabelId = useId();

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<AssociationOption | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failures, setFailures] = useState<BulkFailure[]>([]);
  /** Outcome counts of the last run, for the partial-failure summary. */
  const [lastRun, setLastRun] = useState({ succeeded: 0, total: 0 });

  // Latch the targets when the dialog opens: the list refetches after a run, and
  // the dialog must keep describing the communities it was opened for. Typed
  // search and a previous run's report never carry over to the next opening.
  const [targets, setTargets] = useState<LinkTargetCommunity[]>([]);
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTargets(communities);
      setSearchInput("");
      setSearchTerm("");
      setSelected(null);
      setProgress(null);
      setFailures([]);
      setLastRun({ succeeded: 0, total: 0 });
    }
  }

  useEffect(() => {
    const handle = setTimeout(() => setSearchTerm(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const { data, previousData, loading, error } = useSearchAssociationOptions(searchTerm, { skip: !open });
  // Keep the previous results on screen while a new search term loads.
  const options = (data ?? previousData)?.searchAssociations?.associations ?? [];

  const [linkAssociation] = useLinkAssociation();
  const busy = progress !== null;
  const single = targets.length === 1;

  const handleConfirm = async () => {
    if (!selected || targets.length === 0) return;
    const association = selected;
    setFailures([]);
    setProgress({ done: 0, total: targets.length });

    const outcomes = await runBulk(
      targets,
      async (community) => {
        const result = await linkAssociation({
          variables: { input: { communityId: community.id, associationId: association.id } },
        });
        throwIfGraphQLErrors(result, "LinkAssociation");
        const payload = result.data?.linkAssociation;
        if (!payload?.success) throw new Error(payload?.message || t("communities.link.failed"));
      },
      { concurrency: LINK_CONCURRENCY, onProgress: (done, total) => setProgress({ done, total }) },
    );
    setProgress(null);

    const failed = outcomes.filter((o) => !o.ok);
    const okCount = outcomes.length - failed.length;
    if (okCount > 0) await onChanged();
    onCompleted?.(failed.map((o) => o.item.id));

    if (failed.length === 0) {
      toast({
        title: t("communities.link.linked"),
        description: single
          ? t("communities.link.linkedDescOne", { association: association.name, name: targets[0].name })
          : t("communities.link.linkedDescMany", { association: association.name, count: okCount }),
      });
      onOpenChange(false);
      return;
    }

    // Keep only the communities that were not linked: a retry must not re-link
    // the ones that already succeeded.
    setTargets(failed.map((o) => o.item));
    setLastRun({ succeeded: okCount, total: outcomes.length });
    setFailures(
      failed.map((o) => ({
        name: o.item.name,
        message: displayErrorMessage(o.error, t("communities.link.failed")),
      })),
    );
    toast({
      title: single ? t("communities.link.failed") : t("communities.link.partialToast"),
      description: single
        ? displayErrorMessage(failed[0].error, t("communities.link.failed"))
        : t("communities.link.partial", { succeeded: okCount, total: outcomes.length }),
      variant: "destructive",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("communities.link.title")}</DialogTitle>
          <DialogDescription>
            {single
              ? t("communities.link.descriptionOne", { name: targets[0]?.name ?? "" })
              : t("communities.link.descriptionMany", { count: targets.length })}
          </DialogDescription>
        </DialogHeader>

        {!single && targets.length > 0 && (
          <ul
            aria-label={t("communities.link.targetsLabel")}
            className="max-h-24 list-disc space-y-0.5 overflow-y-auto pl-5 text-sm text-muted-foreground"
          >
            {targets.map((community) => (
              <li key={community.id}>{community.name}</li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <Label htmlFor={searchId}>{t("communities.link.searchLabel")}</Label>
          <Input
            id={searchId}
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("communities.link.searchPlaceholder")}
            autoComplete="off"
            maxLength={100}
            disabled={busy}
          />
        </div>

        <div className="space-y-2">
          <p id={resultsLabelId} className="text-sm font-medium">
            {t("communities.link.resultsLabel")}
          </p>
          <div className="max-h-56 overflow-y-auto rounded-md border border-border p-2">
            {loading && options.length === 0 ? (
              <p className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t("common.loading")}
              </p>
            ) : error && options.length === 0 ? (
              <p role="alert" className="p-2 text-sm text-destructive">
                {displayErrorMessage(error, t("communities.link.loadFailed"))}
              </p>
            ) : options.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">{t("communities.link.noResults")}</p>
            ) : (
              <RadioGroup
                aria-labelledby={resultsLabelId}
                value={selected?.id ?? ""}
                onValueChange={(value) => setSelected(options.find((o) => o.id === value) ?? null)}
                disabled={busy}
                className="gap-1"
              >
                {options.map((option, index) => {
                  const itemId = `${resultsLabelId}-option-${index}`;
                  return (
                    <div key={option.id} className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-muted/50">
                      <RadioGroupItem id={itemId} value={option.id} />
                      <Label htmlFor={itemId} className="flex-1 cursor-pointer font-normal">
                        {option.name}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            )}
          </div>
          {selected && (
            <p className="text-sm text-muted-foreground">
              {t("communities.link.selected", { name: selected.name })}
            </p>
          )}
        </div>

        <BulkActionStatus
          progress={progress}
          progressLabel={t("communities.link.progress", {
            done: progress?.done ?? 0,
            total: progress?.total ?? 0,
          })}
          failures={failures}
          failureSummary={t("communities.link.partial", lastRun)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {failures.length > 0 ? t("common.close") : t("common.cancel")}
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={busy || !selected || targets.length === 0}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {failures.length > 0 ? t("communities.retryFailed") : t("communities.link.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
