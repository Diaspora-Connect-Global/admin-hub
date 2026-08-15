import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserPost } from "@/hooks/admin/useUserSubResources";
import { ContentStatusBadge } from "./accountStatus";
import { UserTabShell, type UserTabPaging } from "./UserTabShell";

interface UserPostsTabProps {
  posts: UserPost[];
  total: number;
  loading: boolean;
  error?: unknown;
  paging: Omit<UserTabPaging, "count" | "total">;
  t: (key: string) => string;
}

/** Posts authored by the user, with the like/comment counts as the reactions figures. */
export function UserPostsTab({ posts, total, loading, error, paging, t }: UserPostsTabProps) {
  return (
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
            <TableHead>{t("users.detail.posts.postedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id} className="border-border/50">
              <TableCell className="max-w-[220px] truncate text-sm">{post.content ?? "—"}</TableCell>
              <TableCell>
                {post.postType ? <Badge variant="secondary">{post.postType}</Badge> : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{post.communityName ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{post.likeCount}</TableCell>
              <TableCell className="text-muted-foreground">{post.commentCount}</TableCell>
              <TableCell>{post.status ? <ContentStatusBadge status={post.status} /> : "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </UserTabShell>
  );
}
