import type { ReactNode } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { ListPager } from "@/components/community/ListPager";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";

/**
 * Common frame for the user-detail list tabs: card chrome plus the three async
 * states every one of them needs (loading / failed / empty) and the offset
 * pager. Each tab supplies only its own table, so a tab can never accidentally
 * render an empty table when its query actually failed.
 */
export interface UserTabPaging {
  offset: number;
  /** Rows rendered on the current page. */
  count: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export interface UserTabShellProps {
  /** Tab id — must match the matching <TabsTrigger value>. */
  value: string;
  title: string;
  description: string;
  loading: boolean;
  /** Apollo error, if the query failed. */
  error?: unknown;
  emptyTitle: string;
  emptyMessage?: string;
  paging: UserTabPaging;
  /** Extra controls rendered in the card header (e.g. an export button). */
  headerAction?: ReactNode;
  children: ReactNode;
}

export function UserTabShell({
  value,
  title,
  description,
  loading,
  error,
  emptyTitle,
  emptyMessage,
  paging,
  headerAction,
  children,
}: UserTabShellProps) {
  // `hasMore` is derived rather than read off the response: the GET_USER_*
  // documents return `total` but no `hasMore` flag.
  const hasMore = paging.offset + paging.count < paging.total;

  return (
    <TabsContent value={value} className="space-y-4">
      <Card className="glass">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {headerAction}
          </div>
        </CardHeader>
        <CardContent className={loading || error || paging.count === 0 ? "" : "p-0"}>
          {loading ? (
            <LoadingState rows={4} />
          ) : error ? (
            <ErrorState message={friendlyErrorMessage(error)} />
          ) : paging.count === 0 ? (
            <EmptyState title={emptyTitle} message={emptyMessage} />
          ) : (
            <>
              <div className="overflow-x-auto">{children}</div>
              <div className="px-4">
                <ListPager
                  offset={paging.offset}
                  count={paging.count}
                  total={paging.total}
                  hasMore={hasMore}
                  onPrev={paging.onPrev}
                  onNext={paging.onNext}
                  rangeKey="users.detail.paginationRange"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
