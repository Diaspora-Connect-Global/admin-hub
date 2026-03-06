/**
 * Hooks for operations that are SUPER ADMIN ONLY (⚡).
 * Guard UI with admin role (e.g. role.name === "SUPER_ADMIN" or permissions include "*") before showing.
 */

import { useMutation } from "@apollo/client/react";
import { SET_OPPORTUNITY_PRIORITY } from "@/services/networks/graphql/opportunity/superAdmin";
import { PriorityLevel } from "@/types/opportunities";

export { PriorityLevel };

/**
 * Set opportunity priority (pin/boost). System admin only.
 * Backend returns 403 if caller is not super admin.
 * Pass variables: { opportunityId: string, priority: "HIGH" | "NORMAL" | "LOW" }.
 * ⚠️ Uses flat arguments - no input wrapper object.
 */
export function useSetOpportunityPriority() {
  return useMutation(SET_OPPORTUNITY_PRIORITY);
}
