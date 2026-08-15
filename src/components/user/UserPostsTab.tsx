import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserPost } from "@/hooks/admin/useUserSubResources";
import { ContentStatusBadge, PostVisibilityBadge } from "./accountStatus";
import { PostDetailDialog } from "./PostDetailDialog";
import { UserTabShell, type UserTabPaging } from "./UserTabShell";

interface UserPostsTabProps {
  posts: UserPost[];
  total: number;
  loading: boolean;
  error?: unknown;
  paging: Omit<UserTabPaging, "count" | "total">;
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Posts authored by the user — a moderation view, so it lists every post at
 * every visibility and in every status, not just the public published ones.
 *
 * That makes the status and visibility pills load-bearing rather than
 * decorative: without them a DRAFT or an ONLY_ME post is indistinguishable at a
 * glance from something the whole platform can see. Clicking a row opens the
 * full content and the per-reactor list.
 */
export function UserPostsTab({ posts, total, loading, error, paging, t }: UserPostsTabProps) {
  const [selected, setSelected] = useState<UserPost | null>(null);

  return (
    <>
      <UserTabShell
        value="posts"
        title={t("users.detail.posts.title")}
        description={t("users.detail.posts.description")}
        loading={loading}
        error={error}
        emptyTitle={t("users.detail.posts.empty")}
        paging={{ ...paging, count: posts.length, total }}
      >
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead>{t("users.detail.posts.content")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead>{t("users.detail.community")}</TableHead>
              <TableHead>{t("users.detail.posts.likes")}</TableHead>
              <TableHead>{t("users.detail.posts.comments")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("users.detail.posts.visibilityColumn")}</TableHead>
              <TableHead>{t("users.detail.posts.postedAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id} className="border-border/50">
                <TableCell className="max-w-[220px]">
                  {/* A real button rather than a clickable <tr>: keyboard
                      reachable without inventing an ARIA role for a table row. */}
                  <button
                    type="button"
                    onClick={() => setSelected(post)}
                    className="block max-w-full truncate rounded-sm text-left text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title={t("users.detail.posts.openDetail")}
                  >
                    {post.content || t("users.detail.posts.noContent")}
                  </button>
                </TableCell>
                <TableCell>
                  {post.postType ? <Badge variant="secondary">{post.postType}</Badge> : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{post.communityName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{post.likeCount}</TableCell>
                <TableCell className="text-muted-foreground">{post.commentCount}</TableCell>
                <TableCell>
                  {post.status ? (
                    <ContentStatusBadge
                      status={post.status}
                      label={t(`users.detail.posts.status.${post.status}`, {
                        defaultValue: post.status,
                      })}
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <PostVisibilityBadge visibility={post.visibility} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </UserTabShell>

      <PostDetailDialog post={selected} onClose={() => setSelected(null)} />
    </>
  );
}
