import { useQuery } from "@apollo/client/react";
import {
  GET_USER_POSTS,
  GET_USER_GROUPS,
  GET_USER_OPPORTUNITIES,
  GET_USER_TRANSACTIONS,
  GET_COMMUNITY_POSTS_ADMIN,
  GET_COMMUNITY_PRODUCTS_ADMIN,
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

export function useGetUserPosts(userId: string | null, limit = 20) {
  return useQuery<{ getUserPosts: UserPostListResponse }>(GET_USER_POSTS, {
    variables: { userId: userId ?? "", limit, offset: 0 },
    skip: !userId,
  });
}

export function useGetUserGroups(userId: string | null, limit = 20) {
  return useQuery<{ getUserGroups: UserGroupListResponse }>(GET_USER_GROUPS, {
    variables: { userId: userId ?? "", limit, offset: 0 },
    skip: !userId,
  });
}

export function useGetUserOpportunities(userId: string | null, limit = 20) {
  return useQuery<{ getUserOpportunities: UserOpportunityListResponse }>(GET_USER_OPPORTUNITIES, {
    variables: { userId: userId ?? "", limit, offset: 0 },
    skip: !userId,
  });
}

export function useGetUserTransactions(userId: string | null, limit = 20) {
  return useQuery<{ getUserTransactions: UserTransactionListResponse }>(GET_USER_TRANSACTIONS, {
    variables: { userId: userId ?? "", limit, offset: 0 },
    skip: !userId,
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
