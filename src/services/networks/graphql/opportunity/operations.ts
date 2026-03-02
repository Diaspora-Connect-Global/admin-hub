import { gql } from "@apollo/client";

/**
 * Opportunity Service — GraphQL operations for system admin.
 * Auth: Bearer JWT (same as admin client). Use with adminClient or Apollo hooks.
 *
 * Enums (reference): OpportunityTypeEnum, OpportunityCategoryEnum, WorkModeEnum,
 * EngagementTypeEnum, VisibilityEnum, ApplicationMethodEnum, OpportunityStatusEnum,
 * OwnerTypeEnum, PriorityLevelEnum, ApplicationStatusEnum.
 */

// --- Fragments ---

export const OPPORTUNITY_OWNER_FIELDS = gql`
  fragment OpportunityOwnerFields on OpportunityOwnerType {
    id
    name
    avatarUrl
    type
  }
`;

export const OPPORTUNITY_CARD_FIELDS = gql`
  ${OPPORTUNITY_OWNER_FIELDS}
  fragment OpportunityCardFields on OpportunityType {
    id
    title
    type
    category
    status
    priorityLevel
    location
    workMode
    engagementType
    deadline
    applicationCount
    owner {
      ...OpportunityOwnerFields
    }
    isSavedByCurrentUser
    hasCurrentUserApplied
    createdAt
    publishedAt
  }
`;

export const OPPORTUNITY_FULL_FIELDS = gql`
  ${OPPORTUNITY_OWNER_FIELDS}
  fragment OpportunityFullFields on OpportunityType {
    id
    ownerType
    ownerId
    owner {
      ...OpportunityOwnerFields
    }
    type
    category
    subCategory
    title
    description
    responsibilities
    requirements
    workMode
    engagementType
    location
    visibility
    applicationMethod
    externalLink
    applicationEmail
    status
    priorityLevel
    salaryMin
    salaryMax
    salaryCurrency
    deadline
    applicationCount
    skills
    tags
    isSavedByCurrentUser
    hasCurrentUserApplied
    currentUserApplicationId
    createdAt
    updatedAt
    publishedAt
    closedAt
  }
`;

export const APPLICATION_FIELDS = gql`
  fragment ApplicationFields on ApplicationType {
    id
    opportunityId
    applicantId
    status
    resumeFileRef {
      path
      filename
      mimeType
      sizeBytes
    }
    coverLetter
    customAnswers
    reviewNotes
    reviewedBy
    reviewedAt
    createdAt
    updatedAt
  }
`;

// --- Queries (system admin) ---

/** Get a single opportunity. */
export const GET_OPPORTUNITY = gql`
  ${OPPORTUNITY_FULL_FIELDS}
  query GetOpportunity($id: String!) {
    opportunity(id: $id) {
      ...OpportunityFullFields
    }
  }
`;

/** List/search opportunities. Input: limit, offset, searchTerm, type, category, status, ownerType, ownerId, sortBy, sortOrder, etc. */
export const LIST_OPPORTUNITIES = gql`
  ${OPPORTUNITY_CARD_FIELDS}
  query ListOpportunities($input: ListOpportunitiesInput) {
    opportunities(input: $input) {
      total
      opportunities {
        ...OpportunityCardFields
      }
    }
  }
`;

/** Applications for an opportunity — system admin / opportunity owner only. */
export const GET_APPLICATIONS = gql`
  ${APPLICATION_FIELDS}
  query GetApplications($input: GetApplicationsInput!) {
    getApplications(input: $input) {
      total
      applications {
        ...ApplicationFields
      }
    }
  }
`;

/** Get a single application. */
export const GET_APPLICATION = gql`
  ${APPLICATION_FIELDS}
  query GetApplication($id: String!) {
    application(id: $id) {
      ...ApplicationFields
    }
  }
`;

// --- Mutations (system admin) ---

/** Create opportunity (system admin can create for anyone). */
export const CREATE_OPPORTUNITY = gql`
  mutation CreateOpportunity($input: CreateOpportunityInput!) {
    createOpportunity(input: $input) {
      id
      title
      status
      createdAt
    }
  }
`;

/** Update opportunity. */
export const UPDATE_OPPORTUNITY = gql`
  mutation UpdateOpportunity($id: String!, $input: UpdateOpportunityInput!) {
    updateOpportunity(id: $id, input: $input)
  }
`;

/** Publish opportunity (DRAFT → PUBLISHED). */
export const PUBLISH_OPPORTUNITY = gql`
  mutation PublishOpportunity($id: String!) {
    publishOpportunity(id: $id)
  }
`;

/** Close opportunity. */
export const CLOSE_OPPORTUNITY = gql`
  mutation CloseOpportunity($id: String!, $reason: String) {
    closeOpportunity(id: $id, reason: $reason)
  }
`;

/** Permanently delete opportunity. */
export const DELETE_OPPORTUNITY = gql`
  mutation DeleteOpportunity($id: String!) {
    deleteOpportunity(id: $id)
  }
`;

/** Set priority (system admin only). priority: HIGH | NORMAL | LOW */
export const SET_OPPORTUNITY_PRIORITY = gql`
  mutation SetOpportunityPriority($input: SetOpportunityPriorityInput!) {
    setOpportunityPriority(input: $input)
  }
`;

/** Accept an application. */
export const ACCEPT_APPLICATION = gql`
  mutation AcceptApplication($id: String!) {
    acceptApplication(id: $id)
  }
`;

/** Reject an application. */
export const REJECT_APPLICATION = gql`
  mutation RejectApplication($id: String!, $reason: String) {
    rejectApplication(id: $id, reason: $reason)
  }
`;

/** Mark application as under review (optional notes). */
export const REVIEW_APPLICATION = gql`
  mutation ReviewApplication($input: ReviewApplicationInput!) {
    reviewApplication(input: $input)
  }
`;
