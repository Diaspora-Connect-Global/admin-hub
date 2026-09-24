import { gql } from "@apollo/client";

/**
 * KYC review — API Gateway GraphQL operations (kyc.resolver.ts).
 * All are @Roles('SYSTEM_ADMIN','SUPER_ADMIN').
 */

export const BUSINESS_VERIFICATIONS = gql`
  query BusinessVerifications($status: String, $limit: Int, $offset: Int) {
    businessVerifications(status: $status, limit: $limit, offset: $offset) {
      total
      items {
        id
        businessName
        registrationNumber
        countryOfIncorporation
        status
        submittedByUserId
        submittedByName
        rejectionReason
        createdAt
        updatedAt
        owners {
          individualProfileId
          userId
          name
          ownershipPercentage
          role
          kycStatus
        }
      }
    }
  }
`;

export const INDIVIDUAL_VERIFICATIONS = gql`
  query IndividualVerifications($status: String, $limit: Int, $offset: Int) {
    individualVerifications(status: $status, limit: $limit, offset: $offset) {
      total
      items {
        id
        userId
        userName
        userEmail
        docType
        submittedAt
        status
        rejectionReason
      }
    }
  }
`;

/** Approves an individual profile OR a business KYB by its id. */
export const APPROVE_VERIFICATION = gql`
  mutation ApproveVerification($verificationId: ID!, $notes: String) {
    approveVerification(verificationId: $verificationId, notes: $notes) {
      success
      message
    }
  }
`;

/** Rejects an individual profile OR a business KYB by its id. */
export const REJECT_VERIFICATION = gql`
  mutation RejectVerification($verificationId: ID!, $reason: String!) {
    rejectVerification(verificationId: $verificationId, reason: $reason) {
      success
      message
    }
  }
`;
