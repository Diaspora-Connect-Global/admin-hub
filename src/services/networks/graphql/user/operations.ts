import { gql } from "@apollo/client";

/**
 * User Service — GraphQL operations (profile, list users for admin).
 * Auth: Bearer JWT. Use with admin client.
 */

/** Minimal profile fetch for name resolution (used in attendee lists etc.). */
export const GET_USER_DISPLAY_NAME = gql`
  query GetUserDisplayName($userId: String!) {
    getProfile(userId: $userId) {
      userId
      firstName
      middleName
      lastName
      email
    }
  }
`;

/** Get a single user profile by userId. */
export const GET_PROFILE = gql`
  query GetProfile($userId: String!) {
    getProfile(userId: $userId) {
      id
      userId
      email
      firstName
      lastName
      middleName
      phone
      bio
      avatarUrl
      sector
      occupation
      city
      country
      location
      dateOfBirth
      countryOfOrigin
      residenceSinceMonth
      residenceSinceYear
      createdAt
      updatedAt
    }
  }
`;

/**
 * List users (admin). Backend must expose this query.
 * Variables: limit, offset, search (optional).
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
      }
      total
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

/** Admin: verify a user profile. */
export const VERIFY_PROFILE = gql`
  mutation VerifyProfile($userId: String!, $adminId: String!, $verificationMethod: String, $notes: String) {
    verifyProfile(input: { userId: $userId, adminId: $adminId, verificationMethod: $verificationMethod, notes: $notes }) {
      success
      message
      error
    }
  }
`;

/** Admin: reject a verification request. */
export const REJECT_VERIFICATION = gql`
  mutation RejectVerification($userId: String!, $adminId: String!, $reason: String) {
    rejectVerification(input: { userId: $userId, adminId: $adminId, reason: $reason }) {
      success
      message
      error
    }
  }
`;
