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
import { useGetCommunityStats } from "@/hooks/admin";
import { displayErrorMessage } from "@/lib/graphqlErrors";

interface CommunityStatsDialogProps {
  community: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Live membership counts for one community, read when the dialog opens.
 *
 * Only what the backend actually counts is shown. `getCommunityStats.postCount`
 * is a hard-coded 0 (community-service does not own posts) and
 * `getCommunityAnalytics` synthesises a straight-line "trend" from today's
 * totals, so neither is displayed — a stats view must not state invented facts.
 */
export function CommunityStatsDialog({ community, open, onOpenChange }: CommunityStatsDialogProps) {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useGetCommunityStats(open && community ? community.id : null);
  const stats = data?.getCommunityStats ?? null;

  if (!community) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("communities.stats.title", { name: community.name })}</DialogTitle>
          <DialogDescription>{t("communities.stats.description")}</DialogDescription>
        </DialogHeader>

        {loading && !stats ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("common.loading")}
          </p>
        ) : error || !stats ? (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {displayErrorMessage(error, t("communities.stats.loadFailed"))}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">{t("communities.stats.activeMembers")}</dt>
              <dd className="text-2xl font-semibold tabular-nums">{stats.memberCount.toLocaleString()}</dd>
            </div>
            <div className="rounded-md border border-border p-3">
              <dt className="text-xs text-muted-foreground">{t("communities.stats.pendingRequests")}</dt>
              <dd className="text-2xl font-semibold tabular-nums">{stats.pendingRequestCount.toLocaleString()}</dd>
            </div>
          </dl>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
