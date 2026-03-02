/**
 * Hooks for operations that are SUPER ADMIN ONLY (⚡).
 * Guard UI with admin role (e.g. role.name === "SUPER_ADMIN" or permissions include "*") before showing.
 */

import { useMutation } from "@apollo/client/react";
import {
  SET_OPPORTUNITY_PRIORITY,
  PRIORITY_LEVELS,
  type PriorityLevel,
  type SetOpportunityPriorityInput,
} from "@/services/networks/graphql/opportunity";

export { PRIORITY_LEVELS, type PriorityLevel, type SetOpportunityPriorityInput };

/**
 * Set opportunity priority (pin/boost). System admin only.
 * Backend returns 403 if caller is not super admin.
 */
export function useSetOpportunityPriority() {
  return useMutation(SET_OPPORTUNITY_PRIORITY);
}
