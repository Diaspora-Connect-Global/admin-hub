/**
 * Escrow wallet / ledger hooks — backed by api-gateway's EscrowAdminResolver
 * (WalletService surface). All operations are server-side gated to
 * SUPER_ADMIN / SYSTEM_ADMIN.
 *
 * UNITS: balances and ledger amounts are decimal currency (Float), e.g.
 * 12.34 == $12.34. Format them directly; do NOT divide by 100.
 */

import { useQuery } from "@apollo/client/react";
import {
  ADMIN_GET_WALLET_BALANCE,
  ADMIN_GET_TRANSACTION_HISTORY,
  type WalletBalance,
  type LedgerHistoryResponse,
} from "@/services/networks/graphql/admin";

export type { WalletBalance, LedgerHistoryResponse };

export function useGetWalletBalance(
  ownerId: string | null,
  ownerType: string | null,
) {
  return useQuery<{ adminGetWalletBalance: WalletBalance }>(
    ADMIN_GET_WALLET_BALANCE,
    {
      variables: {
        ownerId: ownerId ?? "",
        ownerType: ownerType ?? "",
      },
      // Skip until the admin has supplied both lookup args.
      skip: !ownerId || !ownerType,
      fetchPolicy: "cache-and-network",
    },
  );
}

export function useGetTransactionHistory(
  ownerId: string | null,
  ownerType: string | null,
  limit: number = 20,
  offset: number = 0,
) {
  return useQuery<{ adminGetTransactionHistory: LedgerHistoryResponse }>(
    ADMIN_GET_TRANSACTION_HISTORY,
    {
      variables: {
        ownerId: ownerId ?? "",
        ownerType: ownerType ?? "",
        limit,
        offset,
      },
      // Skip until the admin has supplied both lookup args.
      skip: !ownerId || !ownerType,
      fetchPolicy: "cache-and-network",
    },
  );
}
