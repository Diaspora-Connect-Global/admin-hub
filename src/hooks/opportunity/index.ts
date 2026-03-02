/**
 * Opportunity Service hooks for system admin. Uses shared admin client (Bearer).
 */

import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_OPPORTUNITY,
  LIST_OPPORTUNITIES,
  GET_APPLICATIONS,
  GET_APPLICATION,
  CREATE_OPPORTUNITY,
  UPDATE_OPPORTUNITY,
  PUBLISH_OPPORTUNITY,
  CLOSE_OPPORTUNITY,
  DELETE_OPPORTUNITY,
  SET_OPPORTUNITY_PRIORITY,
  ACCEPT_APPLICATION,
  REJECT_APPLICATION,
  REVIEW_APPLICATION,
} from "@/services/networks/graphql/opportunity";

/** ListOpportunitiesInput: limit, offset, searchTerm, type, category, subCategory, workMode, engagementType, location, ownerType, ownerId, status, sortBy, sortOrder */
export interface ListOpportunitiesInput {
  limit?: number;
  offset?: number;
  searchTerm?: string;
  type?: string;
  category?: string;
  subCategory?: string;
  workMode?: string;
  engagementType?: string;
  location?: string;
  ownerType?: string;
  ownerId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useGetOpportunity(id: string | null) {
  return useQuery(GET_OPPORTUNITY, {
    variables: { id: id ?? "" },
    skip: !id,
  });
}

export function useListOpportunities(input?: ListOpportunitiesInput) {
  return useQuery(LIST_OPPORTUNITIES, {
    variables: { input: input ?? {} },
  });
}

export interface GetApplicationsInput {
  opportunityId: string;
  limit?: number;
  offset?: number;
  status?: string;
}

export function useGetApplications(input: GetApplicationsInput | null) {
  return useQuery(GET_APPLICATIONS, {
    variables: { input: input ?? { opportunityId: "" } },
    skip: !input || !input.opportunityId,
  });
}

export function useGetApplication(id: string | null) {
  return useQuery(GET_APPLICATION, {
    variables: { id: id ?? "" },
    skip: !id,
  });
}

export function useCreateOpportunity() {
  return useMutation(CREATE_OPPORTUNITY);
}

export function useUpdateOpportunity() {
  return useMutation(UPDATE_OPPORTUNITY);
}

export function usePublishOpportunity() {
  return useMutation(PUBLISH_OPPORTUNITY);
}

export function useCloseOpportunity() {
  return useMutation(CLOSE_OPPORTUNITY);
}

export function useDeleteOpportunity() {
  return useMutation(DELETE_OPPORTUNITY);
}

/** System admin only: set priority HIGH | NORMAL | LOW */
export function useSetOpportunityPriority() {
  return useMutation(SET_OPPORTUNITY_PRIORITY);
}

export function useAcceptApplication() {
  return useMutation(ACCEPT_APPLICATION);
}

export function useRejectApplication() {
  return useMutation(REJECT_APPLICATION);
}

export function useReviewApplication() {
  return useMutation(REVIEW_APPLICATION);
}
