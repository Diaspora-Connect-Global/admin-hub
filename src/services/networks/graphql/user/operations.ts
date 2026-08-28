import { gql } from "@apollo/client";

/**
 * User Service — GraphQL operations (profile, list users for admin).
 * Auth: Bearer JWT. Use with admin client.
 */

/** Minimal profile fetch for name resolution (used in attendee lists etc.). */
export const GET_USER_DISPLAY_NAME = gql`
  query GetUserDisplayName($userId: String!) {
    getProfile(userId: $userId) {
      success
      profile {
        userId
        firstName
        middleName
        lastName
        email
      }
    }
  }
`;

/** Get a single user profile by userId. */
export const GET_PROFILE = gql`
  query GetProfile($userId: String!) {
    getProfile(userId: $userId) {
      success
      profile {
        id
        userId
        firstName
        middleName
        lastName
        email
        phone
        profilePicture
        coverPhoto
        headline
        bio
        location
        city
        residenceCountry
        countryOfOrigin
        gender
        dateOfBirth
        isVerified
        createdAt
        # Enforcement state. These fields live on the shared Profile type —
        # the same type getUsers.items returns — and getProfile now populates
        # them too (admin callers only), so the user-detail header reads the
        # real status instead of "unknown". Before that fix a ban applied
        # correctly and then read back as unknown on refetch, which is
        # indistinguishable from the ban not having worked.
        # Still nullable: a degraded auth-service leaves them null, and null is
        # never to be shown as ACTIVE.
        accountStatus
        statusReason
        suspendedUntil
      }
      connectionStatus
      connectionId
    }
  }
`;

/**
 * List users (admin). Backend must expose this query.
 * Variables: limit, offset, search (optional).
 *
 * `accountStatus` ("ACTIVE" | "SUSPENDED" | "BANNED") is nullable — a degraded
 * gateway, or one deployed before the enforcement rpcs landed, returns null.
 * Callers must render that as "unknown", never as "active".
 */
export const GET_USERS = gql`
  query GetUsers($limit: Int, $offset: Int, $search: String) {
    getUsers(limit: $limit, offset: $offset, search: $search) {
      items {
        id
        userId
        email
        firstName
        lastName
        phone
        createdAt
        accountStatus
        statusReason
        suspendedUntil
        registrationMethod
      }
      total
      hasMore
    }
  }
`;

/** SearchUsers input for admin-level user search. */
export interface SearchUsersInput {
  query?: string;
  sector?: string;
  countryOfOrigin?: string;
  residenceCountry?: string;
  skills?: string[];
  limit?: number;
  offset?: number;
}

/** Full profile returned by searchUsers. */
export interface UserProfile {
  id: string;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
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
  residenceSinceMonth?: number;
  residenceSinceYear?: number;
  dateOfBirth?: string;
  isVerified?: boolean;
  verificationStatus?: string;
  trustScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const SEARCH_USERS = gql`
  query SearchUsers($input: SearchUsersInput!) {
    searchUsers(input: $input) {
      success
      profiles {
        id
        userId
        email
        firstName
        lastName
        phone
        bio
        avatarUrl
        headline
        sector
        occupation
        city
        location
        countryOfOrigin
        residenceCountry
        isVerified
        verificationStatus
        trustScore
        createdAt
      }
      total
      hasMore
      error
    }
  }
`;

/** Admin: verify a user profile. Admin identity is taken from the JWT context server-side. */
export const VERIFY_PROFILE = gql`
  mutation VerifyProfile($userId: String!, $verificationMethod: String, $notes: String) {
    verifyProfile(input: { userId: $userId, verificationMethod: $verificationMethod, notes: $notes }) {
      success
      message
    }
  }
`;

/** Admin: reject a verification request. Admin identity is taken from the JWT context server-side. */
export const REJECT_VERIFICATION = gql`
  mutation RejectVerification($userId: String!, $reason: String) {
    rejectVerification(input: { userId: $userId, reason: $reason }) {
      success
      message
    }
  }
`;
