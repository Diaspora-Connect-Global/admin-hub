import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Eye,
  EyeOff,
  FileText,
  Lock,
  MessageCircle,
  Share2,
  Bookmark,
  Heart,
  Trash2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/StateViews";
import { PostComments } from "./PostComments";
import { ListPager } from "@/components/community/ListPager";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { userLabel } from "@/lib/userLabel";
import {
  useAdminGetPostEngagement,
  useAdminListPostReactions,
  type AdminPost,
  type AdminPostAttachment,
  type AdminPostComment,
} from "@/hooks/admin";

const PAGE_SIZE = 20;

/** "All" is a UI-only sentinel; it is never sent to the backend. */
const ALL = "ALL";
const TABS = [ALL, "HAPPY", "HOPEFUL", "SAD"] as const;
type ReactionTab = (typeof TABS)[number];

export interface PostDetailSheetProps {
  /** The post to show. `null` closes the drawer and stops both queries. */
  post: AdminPost | null;
  onClose: () => void;
  /** Remove one comment shown inside the drawer (the page owns the confirm dialog). */
  onRemoveComment: (comment: AdminPostComment) => void;
  onHide: (post: AdminPost) => void;
  onRestore: (post: AdminPost) => void;
  onRemove: (post: AdminPost) => void;
  /** Disables the action buttons while a hide/restore/remove is in flight. */
  busy?: boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

/**
 * Only http(s) media is ever put into an `src`/`href`. The url comes from the
 * backend, but a moderation screen opens attacker-authored posts, so a
 * `javascript:` or `data:` value must not be able to reach the DOM.
 */
export function safeMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export type AttachmentKind = "image" | "video" | "document";

/** Prefer the stored type, fall back to the MIME prefix; anything else is a document. */
export function attachmentKind(a: Pick<AdminPostAttachment, "type" | "mimeType">): AttachmentKind {
  const type = (a.type ?? "").toUpperCase();
  const mime = (a.mimeType ?? "").toLowerCase();
  if (type === "IMAGE" || mime.startsWith("image/")) return "image";
  if (type === "VIDEO" || mime.startsWith("video/")) return "video";
  return "document";
}

/** "application/pdf" -> "PDF"; unknown shapes -> "". */
function mimeLabel(mime?: string | null): string {
  const sub = (mime ?? "").split("/")[1] ?? "";
  const clean = sub.split(/[;+.]/).filter(Boolean).pop() ?? "";
  return clean ? clean.toUpperCase().slice(0, 8) : "";
}

const TOKEN_RE = /([#@][\p{L}\p{N}_]+)/gu;

/** Post text with #hashtags and @mentions picked out; plain React text nodes only. */
function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-medium text-primary">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function visibilityVariant(v?: string | null) {
  switch (v) {
    case "EVERYONE":
      return "info" as const;
    case "ONLY_ME":
      return "error" as const;
    case "FRIENDS":
      return "warning" as const;
    case "COMMUNITY":
    case "ASSOCIATION":
      return "pending" as const;
    default:
      return "inactive" as const;
  }
}

function statusVariant(s?: string | null) {
  switch (s) {
    case "PUBLISHED":
      return "active" as const;
    case "HIDDEN":
      return "warning" as const;
    case "REMOVED":
      return "error" as const;
    case "DRAFT":
      return "pending" as const;
    default:
      return "inactive" as const;
  }
}

/**
 * The full moderation view of one post: text, every attachment, every reaction
 * (with who), the counts, and the Hide / Restore / Remove actions.
 *
 * A right-hand drawer (Radix dialog under the hood: focus trap, Esc, labelled)
 * so the queue stays visible behind it. Full width below the `sm` breakpoint.
 *
 * NEVER renders an id — author and reactors fall back to "Unknown user".
 */
function PostDetailContent({
  post,
  onRemoveComment,
  onHide,
  onRestore,
  onRemove,
  busy = false,
}: Omit<PostDetailSheetProps, "post" | "onClose"> & { post: AdminPost }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ReactionTab>(ALL);
  const [offset, setOffset] = useState(0);
  const [preview, setPreview] = useState<AdminPostAttachment | null>(null);

  const postId = post.id;

  const engagement = useAdminGetPostEngagement(postId);
  // `type: "LIKE"` = reactions only. SAVE is a private bookmark and SHARE is
  // not a reaction; neither belongs under "who reacted".
  const reactions = useAdminListPostReactions(
    postId,
    "LIKE",
    PAGE_SIZE,
    offset,
    tab === ALL ? null : tab,
  );

  const breakdown = engagement.data?.adminGetPostEngagement ?? null;
  const rows = reactions.data?.adminListPostReactions?.items ?? [];
  const total = reactions.data?.adminListPostReactions?.total ?? 0;
  const hasMore = offset + rows.length < total;
  const reactionsLoading = reactions.loading && rows.length === 0;

  // `likes` is the TOTAL including untyped legacy likes, which the app shows as
  // Happy but which are not stored as Happy — so the Happy tile is the rest.
  const happyShown = breakdown ? Math.max(breakdown.likes - breakdown.hopeful - breakdown.sad, 0) : 0;
  const legacyLikes = breakdown
    ? Math.max(breakdown.likes - breakdown.happy - breakdown.hopeful - breakdown.sad, 0)
    : 0;

  const attachments = post?.attachments ?? [];
  const authorName = post ? userLabel({ name: post.authorName }, t("common.unknownUser")) : "";

  const tabCount = (k: ReactionTab): number | null => {
    if (!breakdown) return null;
    if (k === ALL) return breakdown.likes;
    if (k === "HAPPY") return happyShown;
    return k === "HOPEFUL" ? breakdown.hopeful : breakdown.sad;
  };

  return (
    <>
            <div className="mt-4 space-y-6 pb-6">
              {/* ── Content ─────────────────────────────────────────────── */}
              <section className="space-y-3" aria-labelledby="pd-content">
                <h3 id="pd-content" className="sr-only">
                  {t("posts.detail.content")}
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {post.authorAvatarUrl ? (
                      <AvatarImage src={post.authorAvatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback>{initials(authorName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{authorName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {post.authorType}
                  </Badge>
                  <StatusBadge variant={visibilityVariant(post.visibility)}>
                    <span className="inline-flex items-center gap-1">
                      {post.visibility === "ONLY_ME" && <Lock className="h-3 w-3" />}
                      {post.visibility ?? t("posts.unknown")}
                    </span>
                  </StatusBadge>
                  <StatusBadge variant={statusVariant(post.status)}>
                    {post.status ?? t("posts.unknown")}
                  </StatusBadge>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  {post.text ? (
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                      <RichText text={post.text} />
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">{t("posts.noText")}</p>
                  )}
                </div>
              </section>

              {/* ── Attachments ─────────────────────────────────────────── */}
              <section className="space-y-2" aria-labelledby="pd-attachments">
                <h3 id="pd-attachments" className="text-sm font-medium">
                  {t("posts.detail.attachments", { count: attachments.length })}
                </h3>
                {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("posts.detail.noAttachments")}</p>
                ) : (
                  <ul className="grid grid-cols-2 gap-3">
                    {attachments.map((a, i) => {
                      const kind = attachmentKind(a);
                      const url = safeMediaUrl(a.url);
                      const n = i + 1;
                      return (
                        <li
                          key={a.id || `${i}`}
                          className={kind === "image" ? "" : "col-span-2"}
                          data-testid={`attachment-${kind}`}
                        >
                          {!url ? (
                            <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                              {t("posts.detail.attachmentUnavailable")}
                            </p>
                          ) : kind === "image" ? (
                            <button
                              type="button"
                              onClick={() => setPreview(a)}
                              aria-label={t("posts.detail.enlargeImage", {
                                n,
                                total: attachments.length,
                              })}
                              className="block w-full overflow-hidden rounded-md border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <img
                                src={url}
                                alt={t("posts.detail.imageAlt", { n, total: attachments.length })}
                                loading="lazy"
                                className="aspect-square w-full object-cover"
                              />
                            </button>
                          ) : kind === "video" ? (
                            <video
                              src={url}
                              controls
                              preload="metadata"
                              aria-label={t("posts.detail.videoLabel", {
                                n,
                                total: attachments.length,
                              })}
                              className="max-h-80 w-full rounded-md border bg-black"
                            />
                          ) : (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 rounded-md border p-3 text-sm hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                              <span className="min-w-0 flex-1 truncate">
                                {t("posts.detail.document", { n })}
                                {mimeLabel(a.mimeType) ? ` (${mimeLabel(a.mimeType)})` : ""}
                              </span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {t("posts.detail.openDocument")}
                              </span>
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* ── Counts ──────────────────────────────────────────────── */}
              <section className="space-y-2" aria-labelledby="pd-counts">
                <h3 id="pd-counts" className="text-sm font-medium">
                  {t("posts.detail.counts")}
                </h3>
                {engagement.loading && !breakdown ? (
                  <LoadingState rows={1} />
                ) : engagement.error ? (
                  <ErrorState
                    title={t("posts.detail.countsError")}
                    message={friendlyErrorMessage(engagement.error)}
                    onRetry={() => void engagement.refetch()}
                  />
                ) : breakdown ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { k: "likes", icon: Heart, label: t("posts.detail.reactions"), v: breakdown.likes },
                      { k: "comments", icon: MessageCircle, label: t("posts.detail.comments"), v: breakdown.comments },
                      { k: "shares", icon: Share2, label: t("posts.detail.shares"), v: breakdown.shares },
                      { k: "saves", icon: Bookmark, label: t("posts.detail.saves"), v: breakdown.saves },
                    ].map(({ k, icon: Icon, label, v }) => (
                      <div key={k} className="rounded-lg border border-border/60 p-3">
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Icon className="h-3 w-3" aria-hidden="true" />
                          {label}
                        </p>
                        <p className="text-lg font-semibold">{v}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">{t("posts.detail.savesPrivate")}</p>
              </section>

              {/* ── Comments ────────────────────────────────────────────── */}
              <PostComments postId={post.id} onRemoveComment={onRemoveComment} />

              {/* ── Reactions ───────────────────────────────────────────── */}
              <section className="space-y-3" aria-labelledby="pd-reactions">
                <h3 id="pd-reactions" className="text-sm font-medium">
                  {t("posts.detail.whoReacted")}
                </h3>
                <div role="group" aria-label={t("posts.detail.reactionFilter")} className="flex flex-wrap gap-2">
                  {TABS.map((k) => {
                    const c = tabCount(k);
                    return (
                      <Button
                        key={k}
                        type="button"
                        size="sm"
                        variant={tab === k ? "default" : "outline"}
                        aria-pressed={tab === k}
                        onClick={() => {
                          setTab(k);
                          setOffset(0);
                        }}
                      >
                        {t(`posts.detail.tab.${k}`)}
                        {c !== null ? ` (${c})` : ""}
                      </Button>
                    );
                  })}
                </div>
                {tab === ALL && legacyLikes > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("posts.detail.legacyHint", { count: legacyLikes })}
                  </p>
                ) : null}
                {tab === "HAPPY" && legacyLikes > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("posts.detail.legacyHappyHint", { count: legacyLikes })}
                  </p>
                ) : null}

                {reactionsLoading ? (
                  <LoadingState rows={3} />
                ) : reactions.error ? (
                  <ErrorState
                    title={t("posts.detail.reactionsError")}
                    message={friendlyErrorMessage(reactions.error)}
                    onRetry={() => void reactions.refetch()}
                  />
                ) : rows.length === 0 ? (
                  <EmptyState title={t("posts.detail.noReactions")} />
                ) : (
                  <>
                    <ul className="divide-y rounded-md border">
                      {rows.map((r) => {
                        const shown = userLabel({ name: r.displayName }, "");
                        const named = shown !== "";
                        const reaction = (r.reactionType ?? "HAPPY").toUpperCase();
                        return (
                          <li
                            key={`${r.userId}-${r.type}-${r.createdAt}`}
                            className="flex items-center gap-3 p-3"
                          >
                            <Avatar className="h-8 w-8">
                              {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt="" /> : null}
                              <AvatarFallback className="text-[10px]">
                                {named ? initials(shown) : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className={named ? "truncate text-sm" : "truncate text-sm text-muted-foreground"}>
                                {named ? shown : t("common.unknownUser")}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                            </div>
                            <Badge variant="secondary">
                              {t(`posts.detail.tab.${reaction}`, { defaultValue: reaction })}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
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

              {/* ── Actions ─────────────────────────────────────────────── */}
              <section
                className="flex flex-wrap gap-2 border-t pt-4"
                aria-label={t("posts.detail.actions")}
              >
                {post.status === "HIDDEN" ? (
                  <Button type="button" variant="outline" disabled={busy} onClick={() => onRestore(post)} className="gap-2">
                    <Eye className="h-4 w-4" />
                    {t("posts.restore")}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" disabled={busy} onClick={() => onHide(post)} className="gap-2">
                    <EyeOff className="h-4 w-4" />
                    {t("posts.hide")}
                  </Button>
                )}
                <Button type="button" variant="destructive" disabled={busy} onClick={() => onRemove(post)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t("posts.remove")}
                </Button>
              </section>
            </div>

      {/* Click-to-enlarge. A second Radix dialog stacked on the drawer: Esc
          closes only this one, and focus returns to the thumbnail. */}
      <Dialog open={preview !== null} onOpenChange={(next) => !next && setPreview(null)}>
        <DialogContent className="max-h-[92vh] max-w-[95vw] overflow-auto p-2 sm:max-w-4xl">
          <DialogTitle className="sr-only">{t("posts.detail.previewTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("posts.detail.previewHint")}</DialogDescription>
          {preview && safeMediaUrl(preview.url) ? (
            <img
              src={safeMediaUrl(preview.url) as string}
              alt={t("posts.detail.previewAlt")}
              className="mx-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * The drawer shell. The content (and every query it runs) is mounted only while
 * a post is open, so a closed drawer costs nothing, and `key` gives each post a
 * fresh tab / page / lightbox state.
 */
export function PostDetailSheet({ post, onClose, ...actions }: PostDetailSheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet open={post !== null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("posts.detail.title")}</SheetTitle>
          <SheetDescription>{t("posts.detail.description")}</SheetDescription>
        </SheetHeader>
        {post && <PostDetailContent key={post.id} post={post} {...actions} />}
      </SheetContent>
    </Sheet>
  );
}
