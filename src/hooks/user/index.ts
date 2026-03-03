/**
 * User Service hooks. Uses shared admin client (Bearer).
 */

import { useQuery } from "@apollo/client/react";
import { GET_PROFILE, GET_USERS } from "@/services/networks/graphql/user";

export function useGetProfile(userId: string | null) {
  return useQuery(GET_PROFILE, {
    variables: { userId: userId ?? "" },
    skip: !userId,
  });
}

export interface GetUsersOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface GetUsersItem {
  id?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
}

export interface GetUsersData {
  getUsers?: {
    items: GetUsersItem[];
    total: number;
  };
}

export function useGetUsers(options: GetUsersOptions = {}) {
  return useQuery<GetUsersData>(GET_USERS, {
    variables: {
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
      search: options.search ?? undefined,
    },
  });
}
