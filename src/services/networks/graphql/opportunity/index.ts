/** Opportunity Service GraphQL operations (system admin). Use with adminClient. */
export * from "./operations";
/** Super admin only: setOpportunityPriority. */
export {
  SET_OPPORTUNITY_PRIORITY,
  PRIORITY_LEVELS,
  type PriorityLevel,
  type SetOpportunityPriorityInput,
} from "./superAdmin";
