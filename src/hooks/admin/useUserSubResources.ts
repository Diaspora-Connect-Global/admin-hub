import { useQuery } from "@apollo/client/react";
import {
  GET_USER_POSTS,
  GET_USER_GROUPS,
  GET_USER_OPPORTUNITIES,
  GET_USER_TRANSACTIONS,
  type UserPost,
  type UserPostListResponse,
  type UserGroup,
  type UserGroupListResponse,
  type UserOpportunity,
  type UserOpportunityListResponse,
  type UserTransaction,
  type UserTransactionListResponse,
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
