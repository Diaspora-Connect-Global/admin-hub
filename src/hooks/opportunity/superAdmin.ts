/**
 * Hooks for elevated opportunity admin operations (⚡).
 * Guard UI with resolver-allowed admin roles before showing privileged actions.
 */

import { useMutation } from "@apollo/client/react";
import { SET_OPPORTUNITY_PRIORITY } from "@/services/networks/graphql/opportunity/superAdmin";
import { PriorityLevel } from "@/types/opportunities";

export { PriorityLevel };

/**
 * Set opportunity priority (pin/boost).
 * Pass variables: { opportunityId: string, priority: "HIGH" | "NORMAL" | "LOW" }.
 * ⚠️ Uses flat arguments - no input wrapper object.
 */
export function useSetOpportunityPriority() {
  return useMutation(SET_OPPORTUNITY_PRIORITY);
}
