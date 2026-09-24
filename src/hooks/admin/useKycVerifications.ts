import { useMutation, useQuery } from "@apollo/client/react";
import {
  APPROVE_VERIFICATION,
  BUSINESS_VERIFICATIONS,
  INDIVIDUAL_VERIFICATIONS,
  REJECT_VERIFICATION,
} from "@/services/networks/graphql/kyc/operations";

export interface BusinessVerificationOwner {
  individualProfileId: string;
  userId?: string | null;
  name?: string | null;
  ownershipPercentage: number;
  role?: string | null;
  /** The owner's own individual KYC status. */
  kycStatus?: string | null;
}

export interface BusinessVerification {
  id: string;
  businessName: string;
  registrationNumber: string;
  countryOfIncorporation: string;
  /** DOCUMENTS_SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | SUSPENDED */
  status: string;
  submittedByUserId?: string | null;
  submittedByName?: string | null;
  rejectionReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  owners: BusinessVerificationOwner[];
}

export interface IndividualVerification {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  docType?: string | null;
  submittedAt?: string | null;
  /** PENDING | APPROVED | REJECTED */
  status: string;
  rejectionReason?: string | null;
}

interface ListVars {
  status?: string;
  limit?: number;
  offset?: number;
}

export function useBusinessVerifications(vars: ListVars) {
  return useQuery<{ businessVerifications: { items: BusinessVerification[]; total: number } }>(
    BUSINESS_VERIFICATIONS,
    { variables: vars, fetchPolicy: "cache-and-network" },
  );
}

export function useIndividualVerifications(vars: ListVars) {
  return useQuery<{ individualVerifications: { items: IndividualVerification[]; total: number } }>(
    INDIVIDUAL_VERIFICATIONS,
    { variables: vars, fetchPolicy: "cache-and-network" },
  );
}

type OperationResult = { success: boolean; message?: string | null };

export function useApproveVerification() {
  return useMutation<{ approveVerification: OperationResult }, { verificationId: string; notes?: string }>(
    APPROVE_VERIFICATION,
  );
}

export function useRejectVerification() {
  return useMutation<{ rejectVerification: OperationResult }, { verificationId: string; reason: string }>(
    REJECT_VERIFICATION,
  );
}
