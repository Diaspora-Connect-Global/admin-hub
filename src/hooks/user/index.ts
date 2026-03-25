/**
 * User Service hooks. Uses shared admin client (Bearer).
 */

import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PROFILE, GET_USERS, SEARCH_USERS, VERIFY_PROFILE, REJECT_VERIFICATION } from "@/services/networks/graphql/user";

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

export interface SearchUsersOptions {
  query?: string;
  sector?: string;
  countryOfOrigin?: string;
  residenceCountry?: string;
  skills?: string[];
  limit?: number;
  offset?: number;
}

export interface UserProfileItem {
  id?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  headline?: string;
  sector?: string;
  occupation?: string;
  city?: string;
  location?: string;
  countryOfOrigin?: string;
  residenceCountry?: string;
  isVerified?: boolean;
  verificationStatus?: string;
  trustScore?: number;
  createdAt?: string;
}

export function useSearchUsers(input: SearchUsersOptions, skip = false) {
  return useQuery<{
    searchUsers: {
      success: boolean;
      profiles: UserProfileItem[];
      total: number;
      hasMore: boolean;
      error?: string;
    };
  }>(SEARCH_USERS, { variables: { input }, skip });
}

export function useVerifyProfile() {
  return useMutation<
    { verifyProfile: { success: boolean; message: string; error?: string } },
    { userId: string; adminId: string; verificationMethod?: string; notes?: string }
  >(VERIFY_PROFILE);
}

export function useRejectVerification() {
  return useMutation<
    { rejectVerification: { success: boolean; message: string; error?: string } },
    { userId: string; adminId: string; reason?: string }
  >(REJECT_VERIFICATION);
}
