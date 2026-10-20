import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { userLabel } from "@/lib/userLabel";
import { useAdminListPostComments, type AdminPostComment } from "@/hooks/admin";

function initials(name?: string | null) {
  if (!name) return "?";
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

/**
 * Comments under one post (moved out of the old comments dialog).
 *
 * Root comments and replies come back in one flat list; replies are indented by
 * `parentId`. Already-deleted comments are shown struck through instead of
 * being dropped — a moderator needs to know something was taken down, not see
 * a silent gap. A failed query shows an error, never "no comments".
 */
export function PostComments({
  postId,
  onRemoveComment,
}: {
  postId: string;
  onRemoveComment: (comment: AdminPostComment) => void;
}) {
  const { t } = useTranslation();
  const { data, loading, error } = useAdminListPostComments(postId, 100, 0);

  const comments = useMemo(() => data?.adminListPostComments?.items ?? [], [data]);
  const total = data?.adminListPostComments?.total ?? 0;

  // Roots first, each followed by its replies.
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
      for (const reply of repliesByParent.get(root.id) ?? []) out.push({ comment: reply, depth: 1 });
    }
    // A reply whose parent is outside this page must still render.
    const rendered = new Set(out.map((o) => o.comment.id));
    for (const c of comments) if (!rendered.has(c.id)) out.push({ comment: c, depth: 1 });
    return out;
  }, [comments]);

  return (
    <section className="space-y-2" aria-labelledby="pd-comments">
      <h3 id="pd-comments" className="text-sm font-medium">
        {t("posts.commentsTitle", { count: total })}
      </h3>
      {error ? (
        <div role="alert" className="py-4 text-center text-sm text-destructive">
          {friendlyErrorMessage(error)}
        </div>
      ) : loading && comments.length === 0 ? (
        <div role="status" className="py-4 text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : ordered.length === 0 ? (
        <div className="py-4 text-center text-sm text-muted-foreground">{t("posts.noComments")}</div>
      ) : (
        <ul className="space-y-3">
          {ordered.map(({ comment, depth }) => (
            <li
              key={comment.id}
              className="flex gap-3 rounded-md border p-3"
              style={{ marginLeft: depth * 16 }}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.authorAvatarUrl ?? undefined} alt="" />
                <AvatarFallback>{initials(comment.authorName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    {userLabel({ name: comment.authorName }, t("common.unknownUser"))}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                  {comment.isDeleted && <StatusBadge variant="error">{t("posts.deleted")}</StatusBadge>}
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
                    <Heart className="h-3 w-3" aria-hidden="true" />
                    {comment.likeCount}
                  </span>
                  {comment.replyCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" aria-hidden="true" />
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
