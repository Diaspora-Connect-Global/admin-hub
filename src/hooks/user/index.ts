/**
 * User Service hooks. Uses shared admin client (Bearer).
 */

import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PROFILE, GET_USERS, SEARCH_USERS, VERIFY_PROFILE, REJECT_VERIFICATION } from "@/services/networks/graphql/user";

/**
 * Profile as selected by GET_PROFILE. Everything except the identifiers is
 * optional — the profile service returns sparse records for users who never
 * filled anything in, so the UI must render "—" rather than assume a value.
 */
export interface AdminUserProfile {
  id?: string;
  userId?: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  profilePicture?: string | null;
  coverPhoto?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  city?: string | null;
  residenceCountry?: string | null;
  countryOfOrigin?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  isVerified?: boolean | null;
  createdAt?: string | null;
  /**
   * Enforcement state. Populated only by the admin `getUsers` query today —
   * `getProfile` returns null. Null means UNKNOWN, never ACTIVE.
   */
  accountStatus?: string | null;
  statusReason?: string | null;
  suspendedUntil?: string | null;
}

export interface GetProfileData {
  getProfile?: {
    success: boolean;
    profile?: AdminUserProfile | null;
    connectionStatus?: string | null;
    connectionId?: string | null;
  };
}

export function useGetProfile(userId: string | null) {
  return useQuery<GetProfileData>(GET_PROFILE, {
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
  /**
   * "ACTIVE" | "SUSPENDED" | "BANNED", or null/undefined when the gateway did
   * not report one. Null means UNKNOWN — do not collapse it to "ACTIVE".
   */
  accountStatus?: string | null;
  statusReason?: string | null;
  /** ISO date the suspension lapses; null for an indefinite suspension. */
  suspendedUntil?: string | null;
  /**
   * "PASSWORD" | "GOOGLE" | "FACEBOOK" | "TWITTER" — how the account was
   * created. Null/undefined means UNKNOWN (non-admin caller, or auth-service
   * unreachable); do not collapse it to "PASSWORD".
   */
  registrationMethod?: string | null;
}

export interface GetUsersData {
  getUsers?: {
    items: GetUsersItem[];
    total: number;
    hasMore: boolean;
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
    { verifyProfile: { success: boolean; message?: string } },
    { userId: string; verificationMethod?: string; notes?: string }
  >(VERIFY_PROFILE);
}

export function useRejectVerification() {
  return useMutation<
    { rejectVerification: { success: boolean; message?: string } },
    { userId: string; reason?: string }
  >(REJECT_VERIFICATION);
}
