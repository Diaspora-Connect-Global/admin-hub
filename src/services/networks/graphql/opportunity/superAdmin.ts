import { gql } from "@apollo/client";

/**
 * Opportunity Service — operations that are SUPER ADMIN ONLY (⚡).
 * Only users with SYSTEM_ADMIN role can call these.
 * Use for: featuring/pinning opportunities (set priority).
 */

/** Priority levels for setOpportunityPriority. Backend: PriorityLevelEnum. */
export const PRIORITY_LEVELS = ["HIGH", "NORMAL", "LOW"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/** Input for setOpportunityPriority. Super admin only. */
export interface SetOpportunityPriorityInput {
  opportunityId: string;
  priority: PriorityLevel;
}

/**
 * Set opportunity priority (pin/boost). System admin only.
 * Backend returns 403 "Only system admins can set opportunity priority" if not super admin.
 */
export const SET_OPPORTUNITY_PRIORITY = gql`
  mutation SetOpportunityPriority($opportunityId: String!, $priority: String!) {
    setOpportunityPriority(opportunityId: $opportunityId, priority: $priority)
  }
`;
