import { gql } from "@apollo/client";

/**
 * Opportunity Service — elevated admin operations (⚡).
 * Gateway currently allows admin roles for setOpportunityPriority.
 * Use for: featuring/pinning opportunities (set priority).
 */

/** Priority levels for setOpportunityPriority. Backend: PriorityLevelEnum. */
export const PRIORITY_LEVELS = ["HIGH", "NORMAL", "LOW"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/** Input for setOpportunityPriority. */
export interface SetOpportunityPriorityInput {
  opportunityId: string;
  priority: PriorityLevel;
}

/**
 * Set opportunity priority (pin/boost).
 */
export const SET_OPPORTUNITY_PRIORITY = gql`
  mutation SetOpportunityPriority($opportunityId: String!, $priority: String!) {
    setOpportunityPriority(opportunityId: $opportunityId, priority: $priority)
  }
`;
