import { useQuery } from "@apollo/client/react";
import {
  GET_USER_POSTS,
  GET_USER_GROUPS,
  GET_USER_OPPORTUNITIES,
  GET_USER_TRANSACTIONS,
  GET_COMMUNITY_POSTS_ADMIN,
  GET_COMMUNITY_PRODUCTS_ADMIN,
  ADMIN_GET_POST_ENGAGEMENT,
  ADMIN_LIST_POST_REACTIONS,
  type AdminPostEngagementBreakdown,
  type AdminPostReaction,
  type AdminPostReactionList,
  type UserPost,
  type UserPostListResponse,
  type UserGroup,
  type UserGroupListResponse,
  type UserOpportunity,
  type UserOpportunityListResponse,
  type UserTransaction,
  type UserTransactionListResponse,
  type CommunityPost,
  type CommunityPostListResponse,
  type CommunityProduct,
  type CommunityProductListResponse,
} from "@/services/networks/graphql/admin";

export type {
  AdminPostEngagementBreakdown,
  AdminPostReaction,
  AdminPostReactionList,
  UserPost,
  UserPostListResponse,
  UserGroup,
  UserGroupListResponse,
  UserOpportunity,
  UserOpportunityListResponse,
  UserTransaction,
  UserTransactionListResponse,
  CommunityPost,
  CommunityPostListResponse,
  CommunityProduct,
  CommunityProductListResponse,
};

/*
 * All four take an `offset` so the user-detail tabs can page. They keep their
 * `skip: !userId` guard: without it, a missing user id would query the whole
 * platform's posts / groups / opportunities / transactions.
 */

export function useGetUserPosts(userId: string | null, limit = 20, offset = 0) {
  return useQuery<{ getUserPosts: UserPostListResponse }>(GET_USER_POSTS, {
    variables: { userId: userId ?? "", limit, offset },
    skip: !userId,
  });
}

export function useGetUserGroups(userId: string | null, limit = 20, offset = 0) {
  return useQuery<{ getUserGroups: UserGroupListResponse }>(GET_USER_GROUPS, {
    variables: { userId: userId ?? "", limit, offset },
    skip: !userId,
  });
}

export function useGetUserOpportunities(userId: string | null, limit = 20, offset = 0) {
  return useQuery<{ getUserOpportunities: UserOpportunityListResponse }>(GET_USER_OPPORTUNITIES, {
    variables: { userId: userId ?? "", limit, offset },
    skip: !userId,
  });
}

export function useGetUserTransactions(userId: string | null, limit = 20, offset = 0) {
  return useQuery<{ getUserTransactions: UserTransactionListResponse }>(GET_USER_TRANSACTIONS, {
    variables: { userId: userId ?? "", limit, offset },
    skip: !userId,
  });
}

/** The only reaction types post-feed-service accepts; anything else is INVALID_ARGUMENT. */
export const POST_REACTION_TYPES = ["LIKE", "SHARE", "SAVE"] as const;
export type PostReactionType = (typeof POST_REACTION_TYPES)[number];

/**
 * Aggregate reaction counts for one post (likes / shares / saves / comments).
 *
 * `skip: !postId` is not optional: `postId` is non-nullable in the schema, so a
 * call made before a post is selected would fire a guaranteed-failing query and
 * paint the detail view as broken.
 *
 * No `errorPolicy: "all"` on purpose — a failure here must surface as an error,
 * never as four zeroes, which an admin would read as "nobody engaged".
 */
export function useAdminGetPostEngagement(postId: string | null) {
  return useQuery<{ adminGetPostEngagement: AdminPostEngagementBreakdown }>(
    ADMIN_GET_POST_ENGAGEMENT,
    {
      variables: { postId: postId ?? "" },
      skip: !postId,
      fetchPolicy: "cache-and-network",
    },
  );
}

/**
 * WHO reacted to a post, paginated and optionally filtered by reaction type.
 *
 * `type` is omitted (not sent as null/"") when unfiltered — the backend rejects
 * an unknown value rather than silently returning everything, so an empty
 * string must never reach the wire.
 *
 * Again no `errorPolicy: "all"`: an empty reaction list and a failed query are
 * different facts and must not render identically.
 */
export function useAdminListPostReactions(
  postId: string | null,
  type: PostReactionType | null,
  limit = 20,
  offset = 0,
) {
  return useQuery<{ adminListPostReactions: AdminPostReactionList }>(ADMIN_LIST_POST_REACTIONS, {
    variables: { postId: postId ?? "", type: type ?? undefined, limit, offset },
    skip: !postId,
    fetchPolicy: "cache-and-network",
  });
}

/**
 * Fetch posts for a community (admin view).
 * Requires backend resolver: getCommunityPosts(communityId, limit, offset)
 * TODO: Wire up the resolver on the admin-gateway when available.
 */
export function useGetCommunityPostsAdmin(communityId: string | null, limit = 20, offset = 0) {
  return useQuery<{ getCommunityPosts: CommunityPostListResponse }>(GET_COMMUNITY_POSTS_ADMIN, {
    variables: { communityId: communityId ?? "", limit, offset },
    skip: !communityId,
    errorPolicy: "all",
  });
}

/**
 * Fetch vendor products listed under a community (admin view).
 * Requires backend resolver: getCommunityProducts(communityId, limit, offset)
 * TODO: Wire up the resolver on the admin-gateway when available.
 */
export function useGetCommunityProductsAdmin(communityId: string | null, limit = 20, offset = 0) {
  return useQuery<{ getCommunityProducts: CommunityProductListResponse }>(GET_COMMUNITY_PRODUCTS_ADMIN, {
    variables: { communityId: communityId ?? "", limit, offset },
    skip: !communityId,
    errorPolicy: "all",
  });
}
