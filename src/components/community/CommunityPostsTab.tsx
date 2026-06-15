import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Trash2, Eye, FileText, Loader2 } from "lucide-react";
import { getStatusBadge } from "./statusBadge";

interface CommunityPost {
  id: string;
  authorName?: string | null;
  authorId?: string | null;
  content?: string | null;
  mediaCount?: number | null;
  likeCount?: number;
  commentCount?: number;
  createdAt?: string;
  status?: string | null;
}

interface CommunityPostsTabProps {
  communityPosts: CommunityPost[];
  communityPostsLoading: boolean;
  t: (key: string) => string;
}

export function CommunityPostsTab({
  communityPosts,
  communityPostsLoading,
  t,
}: CommunityPostsTabProps) {
  return (
    <TabsContent value="posts" className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">Posts</CardTitle>
          <CardDescription>Posts published by the community, reactions, comments, and moderation controls.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {communityPostsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading posts…</span>
            </div>
          ) : communityPosts.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No posts found for this community.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Post ID</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Likes</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communityPosts.map((post) => (
                  <TableRow key={post.id} className="border-border/50">
                    <TableCell className="font-mono text-xs">{post.id}</TableCell>
                    <TableCell>{post.authorName ?? post.authorId ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{post.content ?? "—"}</TableCell>
                    <TableCell>{post.mediaCount != null ? `${post.mediaCount} file(s)` : "—"}</TableCell>
                    <TableCell>{post.likeCount}</TableCell>
                    <TableCell>{post.commentCount}</TableCell>
                    <TableCell className="text-muted-foreground">{post.createdAt}</TableCell>
                    <TableCell>{post.status ? getStatusBadge(post.status) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="text-success" aria-label="Approve post"><Check className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" aria-label="Reject post"><X className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" aria-label={t('common.delete')}><Trash2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label={t('common.view')}><Eye className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
