import { useQuery } from "@apollo/client/react";
import { ADMIN_LIST_DELETION_REQUESTS } from "@/services/networks/graphql/admin";

/** A single user who has requested account deletion (GDPR "delete my account"). */
export interface DeletionRequestItem {
  userId: string;
  email: string;
  /** Deletion lifecycle stage. */
  deletionStatus: "PENDING_DELETION" | "PURGING";
  /** ISO timestamp of when deletion was scheduled (grace window start). */
  deletionScheduledAt: string;
  /** ISO timestamp of when the hard purge becomes due. */
  purgeAfter: string;
  /** Days left in the reversible grace window. */
  daysRemaining: number;
  deletionReason?: string | null;
  /** Whether a legal hold is currently deferring the purge. */
  legalHold: boolean;
  legalHoldReason?: string | null;
}

export interface AdminListDeletionRequestsData {
  adminListDeletionRequests: {
    items: DeletionRequestItem[];
    total: number;
    hasMore: boolean;
  };
}

/**
 * Lists users who have requested account deletion. Offset-paginated; optionally
 * filtered by `status` (PENDING_DELETION | PURGING).
 */
export function useAdminListDeletionRequests(options: {
  limit?: number;
  offset?: number;
  status?: string;
} = {}) {
  return useQuery<AdminListDeletionRequestsData>(ADMIN_LIST_DELETION_REQUESTS, {
    variables: {
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
      status: options.status ?? undefined,
    },
  });
}
