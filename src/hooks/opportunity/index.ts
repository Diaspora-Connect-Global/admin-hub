/**
 * Opportunity Service hooks for system admin. Uses shared admin client (Bearer).
 * For super-admin-only hooks (e.g. set priority), use @/hooks/opportunity/superAdmin.
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
  ACCEPT_APPLICATION,
  REJECT_APPLICATION,
  REVIEW_APPLICATION,
  SAVE_OPPORTUNITY,
  UNSAVE_OPPORTUNITY,
  SUBMIT_APPLICATION,
  WITHDRAW_APPLICATION,
  USER_APPLICATIONS,
  GET_SAVED_OPPORTUNITIES,
  GET_OPPORTUNITY_FEED,
} from "@/services/networks/graphql/opportunity";

import type {
  ListOpportunitiesInput,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  GetApplicationsInput,
  SubmitApplicationInput,
  GetOpportunityFeedInput,
} from "@/types/opportunities";
import type {
  Opportunity,
  Application,
  GetApplicationsInput as GetApplicationsInputType,
} from "@/types/opportunities";

/**
 * GraphQL Response Types — typed responses from Apollo queries/mutations
 */
export interface ListOpportunitiesResponse {
  listOpportunities: {
    total: number;
    opportunities: Opportunity[];
  };
}

export interface GetOpportunityResponse {
  getOpportunity: Opportunity;
}

export interface GetApplicationsResponse {
  getApplications: {
    total: number;
    applications: Application[];
  };
}

export interface GetApplicationResponse {
  getApplication: Application;
}

export interface CreateOpportunityResponse {
  createOpportunity: Opportunity;
}

export interface UpdateOpportunityResponse {
  updateOpportunity: Opportunity;
}

export interface PublishOpportunityResponse {
  publishOpportunity: Opportunity;
}

export interface CloseOpportunityResponse {
  closeOpportunity: Opportunity;
}

export interface DeleteOpportunityResponse {
  deleteOpportunity: boolean;
}

// Export the original name for backward compatibility
export interface GetApplicationsInput extends GetApplicationsInputType {}

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

/** Re-export super-admin-only hook; prefer importing from @/hooks/opportunity/superAdmin for clarity. */
export { useSetOpportunityPriority } from "./superAdmin";

export function useAcceptApplication() {
  return useMutation(ACCEPT_APPLICATION);
}

export function useRejectApplication() {
  return useMutation(REJECT_APPLICATION);
}

export function useReviewApplication() {
  return useMutation(REVIEW_APPLICATION);
}

// --- User/Public Functionality ---

export function useSaveOpportunity() {
  return useMutation(SAVE_OPPORTUNITY);
}

export function useUnsaveOpportunity() {
  return useMutation(UNSAVE_OPPORTUNITY);
}

export function useSubmitApplication() {
  return useMutation(SUBMIT_APPLICATION);
}

export function useWithdrawApplication() {
  return useMutation(WITHDRAW_APPLICATION);
}

export function useUserApplications(limit?: number, offset?: number, status?: string) {
  return useQuery(USER_APPLICATIONS, {
    variables: { limit, offset, status },
  });
}

export function useGetSavedOpportunities(limit?: number, offset?: number) {
  return useQuery(GET_SAVED_OPPORTUNITIES, {
    variables: { limit, offset },
  });
}

export function useGetOpportunityFeed(input: GetOpportunityFeedInput) {
  return useQuery(GET_OPPORTUNITY_FEED, {
    variables: { input },
  });
}
