/**
 * Payout account hooks — backed by api-gateway's EscrowAdminResolver
 * (PayoutAccountService surface). All operations are server-side gated to
 * SUPER_ADMIN / SYSTEM_ADMIN.
 *
 * Accounts expose only `accountIdentifierMasked` (last-4); there is no raw
 * account number on this surface. Mutations refetch the user's account list.
 */

import { useQuery, useMutation } from "@apollo/client/react";
import {
  ADMIN_LIST_PAYOUT_ACCOUNTS,
  ADMIN_VERIFY_PAYOUT_ACCOUNT,
  ADMIN_SET_PRIMARY_PAYOUT_ACCOUNT,
  ADMIN_DELETE_PAYOUT_ACCOUNT,
  type PayoutAccount,
  type PayoutAccountListResponse,
} from "@/services/networks/graphql/admin";

export type { PayoutAccount, PayoutAccountListResponse };

export function useListPayoutAccounts(userId: string | null) {
  return useQuery<{ adminListPayoutAccounts: PayoutAccountListResponse }>(
    ADMIN_LIST_PAYOUT_ACCOUNTS,
    {
      variables: { userId: userId ?? "" },
      // Skip until the admin has supplied a userId to look up.
      skip: !userId,
      fetchPolicy: "cache-and-network",
    },
  );
}

/**
 * Refetch the account list for `userId` after a mutation so the table reflects
 * the new verified / primary / deleted state.
 */
function refetchListFor(userId: string | null) {
  return userId
    ? [{ query: ADMIN_LIST_PAYOUT_ACCOUNTS, variables: { userId } }]
    : [];
}

export function useAdminVerifyPayoutAccount(userId: string | null) {
  return useMutation<
    { adminVerifyPayoutAccount: PayoutAccount },
    { payoutAccountId: string; verificationCode: string }
  >(ADMIN_VERIFY_PAYOUT_ACCOUNT, {
    refetchQueries: refetchListFor(userId),
    awaitRefetchQueries: true,
  });
}

export function useAdminSetPrimaryPayoutAccount(userId: string | null) {
  return useMutation<
    { adminSetPrimaryPayoutAccount: PayoutAccount },
    { payoutAccountId: string }
  >(ADMIN_SET_PRIMARY_PAYOUT_ACCOUNT, {
    refetchQueries: refetchListFor(userId),
    awaitRefetchQueries: true,
  });
}

export function useAdminDeletePayoutAccount(userId: string | null) {
  return useMutation<
    { adminDeletePayoutAccount: boolean },
    { payoutAccountId: string }
  >(ADMIN_DELETE_PAYOUT_ACCOUNT, {
    refetchQueries: refetchListFor(userId),
    awaitRefetchQueries: true,
  });
}
