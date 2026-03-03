import { gql } from "@apollo/client";

/**
 * User Service — GraphQL operations (profile, list users for admin).
 * Auth: Bearer JWT. Use with admin client.
 */

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
