/** Opportunity Service GraphQL operations (system admin). Use with adminClient. */
export * from "./operations";
/**
 * Super admin only: setOpportunityPriority with flat arguments.
 * `SET_OPPORTUNITY_PRIORITY` is also defined in ./operations with an identical
 * shape; re-export the super-admin module's remaining members explicitly to
 * avoid the duplicate-export ambiguity.
 */
export {
  PRIORITY_LEVELS,
  type PriorityLevel,
  type SetOpportunityPriorityInput,
} from "./superAdmin";
