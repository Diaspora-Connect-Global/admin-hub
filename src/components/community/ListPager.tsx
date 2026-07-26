import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Offset-based prev/next pager, matching the linked-associations pattern in
 * CommunityOverviewTab. `hasMore` (from the paginated GraphQL response) gates the
 * Next button so we never advance past the server's last page — the server caps
 * a member/pending page at 200 rows, so without paging large rosters truncate.
 */
export interface ListPagerProps {
  /** Zero-based offset of the first row on the current page. */
  offset: number;
  /** Number of rows actually rendered on the current page. */
  count: number;
  /** Total rows across all pages (from the response wrapper). */
  total: number;
  /** True when more rows exist past this page (from the response wrapper). */
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** i18n key for the "start–end of total" range label. */
  rangeKey: string;
}

export function ListPager({ offset, count, total, hasMore, onPrev, onNext, rangeKey }: ListPagerProps) {
  const { t } = useTranslation();
  // Only render controls once paging is actually in play (more than one page).
  if (total <= 0 || (offset === 0 && !hasMore)) return null;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 mt-2 border-t border-border/50 text-xs text-muted-foreground">
      <span>
        {t(rangeKey, {
          start: count === 0 ? 0 : offset + 1,
          end: offset + count,
          total,
        })}
      </span>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          aria-label={t("communities.previousPage")}
          disabled={offset === 0}
          onClick={onPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          aria-label={t("communities.nextPage")}
          disabled={!hasMore}
          onClick={onNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
