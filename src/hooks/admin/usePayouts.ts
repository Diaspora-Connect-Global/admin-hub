/**
 * Payout request hook — backed by api-gateway's EscrowAdminResolver
 * (PayoutService surface). Server-side gated to SUPER_ADMIN / SYSTEM_ADMIN.
 *
 * UNITS: AdminRequestPayoutInput.amount and the returned AdminPayout.amount are
 * MINOR units (Int), e.g. 1234 == $12.34. The caller is responsible for
 * converting a user-entered major-unit amount to minor units before invoking
 * this mutation, and for dividing the returned amount by 100 to display it.
 */

import { useMutation } from "@apollo/client/react";
import {
  ADMIN_REQUEST_PAYOUT,
  type Payout,
  type AdminRequestPayoutInput,
} from "@/services/networks/graphql/admin";

export type { Payout, AdminRequestPayoutInput };

export function useRequestPayout() {
  return useMutation<
    { adminRequestPayout: Payout },
    { input: AdminRequestPayoutInput }
  >(ADMIN_REQUEST_PAYOUT);
}
