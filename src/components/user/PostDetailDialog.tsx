import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { ListPager } from "@/components/community/ListPager";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { userLabel } from "@/lib/userLabel";
import {
  useAdminGetPostEngagement,
  useAdminListPostReactions,
  POST_REACTION_TYPES,
  type PostReactionType,
  type UserPost,
} from "@/hooks/admin";
import { ContentStatusBadge, PostVisibilityBadge } from "./accountStatus";

const PAGE_SIZE = 20;

/** "All types" is a UI-only sentinel — it is never sent to the backend, which
 *  rejects any `type` outside LIKE / SHARE / SAVE rather than ignoring it. */
const ALL = "ALL";
type ReactionFilter = PostReactionType | typeof ALL;

interface PostDetailDialogProps {
  /** The post to show. `null` closes the dialog and stops both queries. */
  post: UserPost | null;
  onClose: () => void;
}

/** Initials for the reactor avatar, falling back to the id when there is no name. */
function initials(source: string): string {
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Full post content plus WHO reacted to it — the moderation detail behind a row
 * in the Posts tab.
 *
 * A modal rather than a route: this is a detail of a detail, and the surrounding
 * user-detail page (with its enforcement actions) is the context an admin needs
 * to keep. Matches how the other admin surfaces open a record.
 */
export function PostDetailDialog({ post, onClose }: PostDetailDialogProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ReactionFilter>(ALL);
  const [offset, setOffset] = useState(0);

  const postId = post?.id ?? null;

  // A new post starts at page one with no filter carried over from the last
  // one; a stale offset would show "21–40 of 3" on a post nobody reacted to.
  useEffect(() => {
    setFilter(ALL);
    setOffset(0);
  }, [postId]);

  const engagement = useAdminGetPostEngagement(postId);
  const reactions = useAdminListPostReactions(
    postId,
    filter === ALL ? null : filter,
    PAGE_SIZE,
    offset,
  );

  const breakdown = engagement.data?.adminGetPostEngagement ?? null;
  const rows = reactions.data?.adminListPostReactions?.items ?? [];
  const total = reactions.data?.adminListPostReactions?.total ?? 0;
  // Convention used across the console: the response carries `total`, not a
  // `hasMore` flag, so derive it.
  const hasMore = offset + rows.length < total;

  // `loading` alone is true on every refetch too, which would tear the table
  // down on each page turn; only show the skeleton when there is nothing yet.
  const reactionsLoading = reactions.loading && rows.length === 0;

  const counts: Array<{ key: string; label: string; value: number; hint?: string }> = breakdown
    ? [
        { key: "likes", label: t("users.detail.posts.likes"), value: breakdown.likes },
        { key: "shares", label: t("users.detail.posts.shares"), value: breakdown.shares },
        {
          key: "saves",
          label: t("users.detail.posts.savesPrivate"),
          value: breakdown.saves,
          hint: t("users.detail.posts.savesPrivateHint"),
        },
        { key: "comments", label: t("users.detail.posts.comments"), value: breakdown.comments },
      ]
    : [];

  return (
    <Dialog open={post !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("users.detail.posts.detailTitle")}</DialogTitle>
          <DialogDescription>{t("users.detail.posts.detailDescription")}</DialogDescription>
        </DialogHeader>

        {post && (
          <div className="space-y-6">
            {/* ── The post itself ───────────────────────────────────────── */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {post.status ? (
                  <ContentStatusBadge
                    status={post.status}
                    label={t(`users.detail.posts.status.${post.status}`, {
                      defaultValue: post.status,
                    })}
                  />
                ) : null}
                <PostVisibilityBadge visibility={post.visibility} />
                {post.postType ? <Badge variant="secondary">{post.postType}</Badge> : null}
                {post.communityName ? (
                  <span className="text-xs text-muted-foreground">{post.communityName}</span>
                ) : null}
                <span className="ml-auto text-xs text-muted-foreground">
                  {post.createdAt ? new Date(post.createdAt).toLocaleString() : "—"}
                </span>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                {post.content ? (
                  <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                    {post.content}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    {t("users.detail.posts.noContent")}
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {t("users.detail.posts.postId", { id: post.id })}
              </p>
            </section>

            {/* ── Engagement breakdown ──────────────────────────────────── */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                {t("users.detail.posts.engagementTitle")}
              </h3>
              {engagement.loading && !breakdown ? (
                <LoadingState rows={1} />
              ) : engagement.error ? (
                <ErrorState
                  title={t("users.detail.posts.engagementError")}
                  message={friendlyErrorMessage(engagement.error)}
                  onRetry={() => void engagement.refetch()}
                />
              ) : breakdown ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {counts.map((c) => (
                    <div
                      key={c.key}
                      className="rounded-lg border border-border/60 bg-card/50 p-3"
                      title={c.hint}
                    >
                      <p className="text-xs text-muted-foreground">{c.label}</p>
                      <p className="text-lg font-semibold text-foreground">{c.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {/* ── Who reacted ───────────────────────────────────────────── */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    {t("users.detail.posts.reactionsTitle")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("users.detail.posts.reactionsDescription")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reaction-type-filter" className="text-xs">
                    {t("users.detail.posts.reactionTypeFilter")}
                  </Label>
                  <Select
                    value={filter}
                    onValueChange={(v) => {
                      setFilter(v as ReactionFilter);
                      setOffset(0);
                    }}
                  >
                    <SelectTrigger id="reaction-type-filter" className="h-8 w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{t("users.detail.posts.reactionType.ALL")}</SelectItem>
                      {POST_REACTION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`users.detail.posts.reactionType.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filter === "SAVE" || filter === ALL ? (
                <p className="text-xs text-muted-foreground">
                  {t("users.detail.posts.savesPrivateHint")}
                </p>
              ) : null}

              {/* The backend reports whether per-reactor rows are reachable at
                  all. It is permanently true today, but if it ever flips, an
                  empty table would read as "nobody reacted" — which the counts
                  above may flatly contradict. Say why instead. */}
              {breakdown && breakdown.reactorDetailAvailable === false ? (
                <EmptyState
                  title={t("users.detail.posts.reactorDetailUnavailable")}
                  message={t("users.detail.posts.reactorDetailUnavailableHint")}
                />
              ) : reactionsLoading ? (
                <LoadingState rows={3} />
              ) : reactions.error ? (
                <ErrorState
                  title={t("users.detail.posts.reactionsError")}
                  message={friendlyErrorMessage(reactions.error)}
                  onRetry={() => void reactions.refetch()}
                />
              ) : rows.length === 0 ? (
                <EmptyState
                  title={t("users.detail.posts.reactionsEmpty")}
                  message={t("users.detail.posts.reactionsEmptyHint")}
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>{t("users.detail.posts.reactor")}</TableHead>
                          <TableHead>{t("users.detail.posts.reactionColumn")}</TableHead>
                          <TableHead>{t("users.detail.posts.reactedAt")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r) => {
                          // displayName is null for GDPR-erased or otherwise
                          // unresolvable accounts. Show "Unknown user" — a
                          // blank cell would read as "no reactor", which is
                          // never true of a row that exists — and never the id.
                          const shown = userLabel({ name: r.displayName }, "");
                          const named = shown !== "";
                          const label = shown || t("common.unknownUser");
                          const when = r.createdAt ? new Date(r.createdAt) : null;
                          const whenValid = when && !Number.isNaN(when.getTime());
                          return (
                            <TableRow key={`${r.userId}-${r.type}-${r.createdAt}`} className="border-border/50">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt="" /> : null}
                                    <AvatarFallback className="text-[10px]">
                                      {named ? initials(shown) : "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p
                                      className={
                                        named
                                          ? "truncate text-sm"
                                          : "truncate text-sm text-muted-foreground"
                                      }
                                    >
                                      {label}
                                    </p>
                                    {!named && (
                                      <p className="text-[11px] text-muted-foreground">
                                        {t("users.detail.posts.reactorUnresolved")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={r.type === "SAVE" ? "outline" : "secondary"}>
                                  {t(`users.detail.posts.reactionType.${r.type}`, {
                                    defaultValue: r.type,
                                  })}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {whenValid ? when.toLocaleString() : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <ListPager
                    offset={offset}
                    count={rows.length}
                    total={total}
                    hasMore={hasMore}
                    onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                    onNext={() => setOffset((o) => o + PAGE_SIZE)}
                    rangeKey="users.detail.paginationRange"
                  />
                </>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
