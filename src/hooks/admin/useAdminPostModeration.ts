import { useMutation, useQuery } from "@apollo/client/react";
import {
  ADMIN_LIST_POSTS,
  ADMIN_LIST_POST_COMMENTS,
  ADMIN_HIDE_POST,
  ADMIN_RESTORE_POST,
  type AdminPost,
  type AdminPostFilterInput,
  type AdminPostListResponse,
  type AdminPostComment,
  type AdminPostCommentListResponse,
} from "@/services/networks/graphql/admin";

export type {
  AdminPost,
  AdminPostFilterInput,
  AdminPostListResponse,
  AdminPostComment,
  AdminPostCommentListResponse,
};

/** The values post-feed-service actually stores; anything else matches nothing. */
export const POST_STATUSES = ["DRAFT", "PUBLISHED", "HIDDEN", "REMOVED", "ARCHIVED"] as const;
export const POST_VISIBILITIES = [
  "EVERYONE",
  "FRIENDS",
  "ONLY_ME",
  "COMMUNITY",
  "ASSOCIATION",
] as const;
export const POST_AUTHOR_TYPES = ["USER", "COMMUNITY", "ASSOCIATION", "SYSTEM_ADMIN"] as const;

/**
 * The platform-wide post moderation index.
 *
 * Empty filter fields are stripped rather than sent as "": the backend treats a
 * present-but-empty filter as unfiltered anyway, but sending `null` for every
 * unused key makes the cache key churn on each keystroke for no reason.
 *
 * No `errorPolicy: "all"` on purpose — an empty result and a failed query are
 * different facts, and a moderation queue that renders a backend outage as
 * "no content to review" is worse than one that shows an error.
 */
export function useAdminListPosts(filter: AdminPostFilterInput) {
  const cleaned: AdminPostFilterInput = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  return useQuery<{ adminListPosts: AdminPostListResponse }>(ADMIN_LIST_POSTS, {
    variables: { filter: cleaned },
    fetchPolicy: "cache-and-network",
  });
}

/**
 * Comments under one post, including already-deleted ones.
 *
 * `skip: !postId` is load-bearing — `postId` is non-nullable in the schema, so
 * firing before a post is selected is a guaranteed error that paints the panel
 * as broken.
 */
export function useAdminListPostComments(postId: string | null, limit = 50, offset = 0) {
  return useQuery<{ adminListPostComments: AdminPostCommentListResponse }>(
    ADMIN_LIST_POST_COMMENTS,
    {
      variables: { postId: postId ?? "", limit, offset },
      skip: !postId,
      fetchPolicy: "cache-and-network",
    },
  );
}

/** PUBLISHED -> HIDDEN. Reversible; see `useAdminRestorePost`. */
export function useAdminHidePost() {
  return useMutation<{ adminHidePost: { success: boolean; message?: string | null } }>(
    ADMIN_HIDE_POST,
  );
}

/** HIDDEN -> PUBLISHED. */
export function useAdminRestorePost() {
  return useMutation<{ adminRestorePost: { success: boolean; message?: string | null } }>(
    ADMIN_RESTORE_POST,
  );
}

/*
 * Permanent removal (post OR comment) is NOT re-declared here: `useAdminRemoveContent`
 * already exists in ./index.ts and routes through admin-service, which is what
 * writes the `moderation_action` + `audit_log` rows. Import that one. It
 * soft-deletes the target and, for a POST, cascades to its comments,
 * engagement and feed rows — there is no console undo, so prefer
 * `useAdminHidePost` when reversibility matters.
 */
