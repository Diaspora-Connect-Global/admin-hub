import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  useAdminListPosts,
  useAdminListPostComments,
  useAdminHidePost,
  useAdminRestorePost,
  useAdminRemoveContent,
  POST_STATUSES,
  POST_VISIBILITIES,
  POST_AUTHOR_TYPES,
  type AdminPost,
  type AdminPostComment,
} from "@/hooks/admin";
import {
  Search,
  MoreHorizontal,
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
  Paperclip,
  EyeOff,
  Eye,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { userLabel } from "@/lib/userLabel";

const PAGE_SIZE = 20;
const ALL = "all";

/**
 * Visibility is the one column a moderator must never misread: this list spans
 * ONLY_ME and private community posts, so "we don't know" and "everyone can see
 * it" have to look different. Anything unrecognised falls through to the
 * neutral variant rather than the permissive one.
 */
function visibilityVariant(visibility?: string | null) {
  switch (visibility) {
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

function statusVariant(status?: string | null) {
  switch (status) {
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

function initials(name?: string | null, fallback = "?") {
  if (!name) return fallback;
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function PostManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── filters ───────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [authorType, setAuthorType] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [visibility, setVisibility] = useState<string>(ALL);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(0);

  // ── dialogs ───────────────────────────────────────────────────────────────
  const [commentsPost, setCommentsPost] = useState<AdminPost | null>(null);
  const [removeTarget, setRemoveTarget] = useState<
    { type: "POST" | "COMMENT"; id: string; preview: string } | null
  >(null);
  const [removeReason, setRemoveReason] = useState("");
  const [hideTarget, setHideTarget] = useState<AdminPost | null>(null);
  const [hideReason, setHideReason] = useState("");

  const { data, loading, error, refetch } = useAdminListPosts({
    searchTerm: searchTerm || undefined,
    authorType: authorType === ALL ? undefined : authorType,
    status: status === ALL ? undefined : status,
    visibility: visibility === ALL ? undefined : visibility,
    includeDeleted,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const [hidePost, { loading: hiding }] = useAdminHidePost();
  const [restorePost, { loading: restoring }] = useAdminRestorePost();
  const [removeContent, { loading: removing }] = useAdminRemoveContent();

  const posts = data?.adminListPosts?.items ?? [];
  const total = data?.adminListPosts?.total ?? 0;
  const maxPage = Math.max(Math.ceil(total / PAGE_SIZE) - 1, 0);

  const applySearch = () => {
    setPage(0);
    setSearchTerm(searchInput.trim());
  };

  const onFilterChange = (setter: (v: string) => void) => (value: string) => {
    setPage(0);
    setter(value);
  };

  const handleHide = async () => {
    if (!hideTarget) return;
    try {
      const res = await hidePost({
        variables: { postId: hideTarget.id, reason: hideReason || undefined },
      });
      if (!res.data?.adminHidePost?.success) {
        throw new Error(res.data?.adminHidePost?.message ?? t("posts.hideFailed"));
      }
      toast({ title: t("common.success"), description: t("posts.hidden") });
      await refetch();
    } catch (e) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(e),
        variant: "destructive",
      });
    }
    setHideTarget(null);
    setHideReason("");
  };

  const handleRestore = async (post: AdminPost) => {
    try {
      const res = await restorePost({ variables: { postId: post.id } });
      if (!res.data?.adminRestorePost?.success) {
        throw new Error(res.data?.adminRestorePost?.message ?? t("posts.restoreFailed"));
      }
      toast({ title: t("common.success"), description: t("posts.restored") });
      await refetch();
    } catch (e) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(e),
        variant: "destructive",
      });
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeContent({
        variables: {
          contentType: removeTarget.type,
          contentId: removeTarget.id,
          reason: removeReason || t("posts.defaultRemovalReason"),
        },
      });
      toast({ title: t("common.success"), description: t("posts.removed") });
      await refetch();
    } catch (e) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(e),
        variant: "destructive",
      });
    }
    setRemoveTarget(null);
    setRemoveReason("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("posts.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("posts.subtitle")}</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("posts.filters")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t("posts.searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                />
              </div>
              <Button onClick={applySearch}>{t("common.search")}</Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select value={authorType} onValueChange={onFilterChange(setAuthorType)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("posts.authorType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("posts.allAuthorTypes")}</SelectItem>
                  {POST_AUTHOR_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={onFilterChange(setStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("posts.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("posts.allStatuses")}</SelectItem>
                  {POST_STATUSES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={visibility} onValueChange={onFilterChange(setVisibility)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("posts.visibility")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("posts.allVisibilities")}</SelectItem>
                  {POST_VISIBILITIES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={includeDeleted}
                  onCheckedChange={(c) => {
                    setPage(0);
                    setIncludeDeleted(c === true);
                  }}
                />
                {t("posts.includeDeleted")}
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              {t("posts.resultCount", { count: total })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                aria-label={t("common.previous")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {maxPage + 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= maxPage || loading}
                onClick={() => setPage((p) => Math.min(p + 1, maxPage))}
                aria-label={t("common.next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* An error must not render as an empty queue — a moderator would
                read "nothing to review" and move on. */}
            {error ? (
              <div className="py-10 text-center text-sm text-destructive">
                {friendlyErrorMessage(error)}
              </div>
            ) : loading && posts.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : posts.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t("posts.empty")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("posts.author")}</TableHead>
                      <TableHead>{t("posts.content")}</TableHead>
                      <TableHead>{t("posts.visibility")}</TableHead>
                      <TableHead>{t("posts.status")}</TableHead>
                      <TableHead>{t("posts.engagement")}</TableHead>
                      <TableHead>{t("posts.created")}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={post.authorAvatarUrl ?? undefined} />
                              <AvatarFallback>{initials(post.authorName)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              {/* A GDPR-erased author still has posts that need
                                  moderating — shown as "Unknown user", never by id. */}
                              <div className="truncate text-sm font-medium">
                                {userLabel({ name: post.authorName }, t("common.unknownUser"))}
                              </div>
                              <Badge variant="outline" className="mt-0.5 text-[10px]">
                                {post.authorType}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="line-clamp-2 text-sm">
                            {post.text || <span className="italic text-muted-foreground">{t("posts.noText")}</span>}
                          </p>
                          {post.attachmentCount > 0 && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Paperclip className="h-3 w-3" />
                              {post.attachmentCount}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge variant={visibilityVariant(post.visibility)}>
                            <span className="inline-flex items-center gap-1">
                              {post.visibility === "ONLY_ME" && <Lock className="h-3 w-3" />}
                              {post.visibility ?? t("posts.unknown")}
                            </span>
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge variant={statusVariant(post.status)}>
                            {post.status ?? t("posts.unknown")}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.likeCount}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {post.commentCount}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              {post.shareCount}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Bookmark className="h-3 w-3" />
                              {post.saveCount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(post.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setCommentsPost(post)}>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                {t("posts.viewComments")}
                              </DropdownMenuItem>
                              {post.status === "HIDDEN" ? (
                                <DropdownMenuItem
                                  disabled={restoring}
                                  onClick={() => handleRestore(post)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("posts.restore")}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setHideTarget(post)}>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  {t("posts.hide")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  setRemoveTarget({
                                    type: "POST",
                                    id: post.id,
                                    preview: post.text ?? post.id,
                                  })
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("posts.remove")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CommentsDialog
        post={commentsPost}
        onClose={() => setCommentsPost(null)}
        onRemoveComment={(comment) =>
          setRemoveTarget({
            type: "COMMENT",
            id: comment.id,
            preview: comment.text ?? comment.id,
          })
        }
      />

      {/* Hide — reversible, so it asks for a reason but not for confirmation of
          consequences the way removal does. */}
      <Dialog open={!!hideTarget} onOpenChange={(o) => !o && setHideTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("posts.hideTitle")}</DialogTitle>
            <DialogDescription>{t("posts.hideDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="hide-reason">{t("posts.reason")}</Label>
            <Textarea
              id="hide-reason"
              value={hideReason}
              onChange={(e) => setHideReason(e.target.value)}
              placeholder={t("posts.reasonPlaceholder")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHideTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleHide} disabled={hiding}>
              {t("posts.hide")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {removeTarget?.type === "COMMENT"
                ? t("posts.removeCommentTitle")
                : t("posts.removePostTitle")}
            </DialogTitle>
            <DialogDescription>
              {removeTarget?.type === "COMMENT"
                ? t("posts.removeCommentDescription")
                : t("posts.removePostDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="line-clamp-3 rounded-md bg-muted p-3 text-sm">
              {removeTarget?.preview}
            </p>
            <div className="space-y-2">
              <Label htmlFor="remove-reason">{t("posts.reason")}</Label>
              <Textarea
                id="remove-reason"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                placeholder={t("posts.reasonPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing}>
              {t("posts.remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

/**
 * Comments under one post.
 *
 * Root comments and replies come back in one flat list; replies are indented by
 * `parentId` rather than re-fetched per thread. Already-deleted comments are
 * shown struck through instead of being dropped — a moderator reviewing a
 * thread needs to know something was taken down, not silently see a gap.
 */
function CommentsDialog({
  post,
  onClose,
  onRemoveComment,
}: {
  post: AdminPost | null;
  onClose: () => void;
  onRemoveComment: (comment: AdminPostComment) => void;
}) {
  const { t } = useTranslation();
  const { data, loading, error } = useAdminListPostComments(post?.id ?? null, 100, 0);

  const comments = data?.adminListPostComments?.items ?? [];
  const total = data?.adminListPostComments?.total ?? 0;

  // Roots first, each followed by its replies — the flat list arrives newest
  // first and would otherwise separate a reply from what it replies to.
  const ordered = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId);
    const repliesByParent = new Map<string, AdminPostComment[]>();
    for (const c of comments) {
      if (!c.parentId) continue;
      const list = repliesByParent.get(c.parentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentId, list);
    }
    const out: Array<{ comment: AdminPostComment; depth: number }> = [];
    for (const root of roots) {
      out.push({ comment: root, depth: 0 });
      for (const reply of repliesByParent.get(root.id) ?? []) {
        out.push({ comment: reply, depth: 1 });
      }
    }
    // A reply whose parent is outside this page still has to render, or it
    // vanishes from the moderation view entirely.
    const rendered = new Set(out.map((o) => o.comment.id));
    for (const c of comments) {
      if (!rendered.has(c.id)) out.push({ comment: c, depth: 1 });
    }
    return out;
  }, [comments]);

  return (
    <Dialog open={!!post} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("posts.commentsTitle", { count: total })}</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {post?.text || t("posts.noText")}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="py-8 text-center text-sm text-destructive">
            {friendlyErrorMessage(error)}
          </div>
        ) : loading && comments.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : ordered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("posts.noComments")}
          </div>
        ) : (
          <div className="space-y-3">
            {ordered.map(({ comment, depth }) => (
              <div
                key={comment.id}
                className="flex gap-3 rounded-md border p-3"
                style={{ marginLeft: depth * 24 }}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comment.authorAvatarUrl ?? undefined} />
                  <AvatarFallback>{initials(comment.authorName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {userLabel({ name: comment.authorName }, t("common.unknownUser"))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.isDeleted && (
                      <StatusBadge variant="error">{t("posts.deleted")}</StatusBadge>
                    )}
                  </div>
                  <p
                    className={`mt-1 whitespace-pre-wrap break-words text-sm ${
                      comment.isDeleted ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {comment.text}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {comment.likeCount}
                    </span>
                    {comment.replyCount > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {comment.replyCount}
                      </span>
                    )}
                  </div>
                </div>
                {!comment.isDeleted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive"
                    onClick={() => onRemoveComment(comment)}
                    aria-label={t("posts.removeComment")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
