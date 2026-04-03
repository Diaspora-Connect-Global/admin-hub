import { gql } from "@apollo/client";

/**
 * Opportunity Service — GraphQL operations for system admin.
 * Auth: Bearer JWT (same as admin client). Use with adminClient or Apollo hooks.
 *
 * Enums (reference): OpportunityTypeEnum, OpportunityCategoryEnum, DeliveryModeEnum,
 * CommitmentTypeEnum, CompensationTypeEnum, VisibilityEnum, ApplicationMethodEnum,
 * OpportunityStatusEnum, OwnerTypeEnum, PriorityLevelEnum, ApplicationStatusEnum.
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

export const OPPORTUNITY_FIELDS = gql`
  fragment OpportunityFields on OpportunityType {
    id
    ownerType
    ownerId
    type
    category
    subCategory
    title
    description
    scope
    eligibilityCriteria
    deliveryMode
    commitmentType
    location
    visibility
    externalLink
    applicationEmail
    status
    priorityLevel
    compensationMin
    compensationMax
    compensationCurrency
    compensationType
    duration
    eligibilityRegions
    benefitsSummary
    deadline
    skills
    tags
    applicationMethod
    formFields { key label type required }
    applicationCount
    createdAt
    updatedAt
    publishedAt
    closedAt
  }
`;

export const OPPORTUNITY_CARD_FIELDS = gql`
  ${OPPORTUNITY_OWNER_FIELDS}
  ${OPPORTUNITY_FIELDS}
  fragment OpportunityCardFields on OpportunityType {
    ...OpportunityFields
    owner {
      ...OpportunityOwnerFields
    }
    isSavedByCurrentUser
    hasCurrentUserApplied
  }
`;

export const OPPORTUNITY_FULL_FIELDS = gql`
  ${OPPORTUNITY_OWNER_FIELDS}
  ${OPPORTUNITY_FIELDS}
  fragment OpportunityFullFields on OpportunityType {
    ...OpportunityFields
    owner {
      ...OpportunityOwnerFields
    }
    isSavedByCurrentUser
    hasCurrentUserApplied
    currentUserApplicationId
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
  query GetOpportunity($id: ID!) {
    getOpportunity(id: $id) {
      ...OpportunityFullFields
    }
  }
`;

/** List/search opportunities. Input: limit, offset, searchTerm, type, category, status, ownerType, ownerId, sortBy, sortOrder, etc. */
export const LIST_OPPORTUNITIES = gql`
  ${OPPORTUNITY_CARD_FIELDS}
  query ListOpportunities($input: ListOpportunitiesInput) {
    listOpportunities(input: $input) {
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
  query GetApplication($id: ID!) {
    getApplication(id: $id) {
      ...ApplicationFields
      opportunity {
        id
        title
        status
        ownerType
        ownerId
      }
    }
  }
`;

// --- Mutations (system admin) ---

/** Create opportunity (system admin can create for anyone). Returns new opportunity ID. */
export const CREATE_OPPORTUNITY = gql`
  mutation CreateOpportunity($input: CreateOpportunityInput!) {
    createOpportunity(input: $input)
  }
`;

/** Update opportunity. */
export const UPDATE_OPPORTUNITY = gql`
  mutation UpdateOpportunity($id: ID!, $input: UpdateOpportunityInput!) {
    updateOpportunity(id: $id, input: $input)
  }
`;

/** Publish opportunity (DRAFT → PUBLISHED). */
export const PUBLISH_OPPORTUNITY = gql`
  mutation PublishOpportunity($id: ID!) {
    publishOpportunity(id: $id)
  }
`;

/** Move opportunity back to draft. */
export const DRAFT_OPPORTUNITY = gql`
  mutation DraftOpportunity($id: ID!) {
    draftOpportunity(id: $id)
  }
`;

/** Close opportunity. */
export const CLOSE_OPPORTUNITY = gql`
  mutation CloseOpportunity($id: ID!, $reason: String) {
    closeOpportunity(id: $id, reason: $reason)
  }
`;

/** Permanently delete opportunity. */
export const DELETE_OPPORTUNITY = gql`
  mutation DeleteOpportunity($id: ID!) {
    deleteOpportunity(id: $id)
  }
`;

/** Accept an application. */
export const ACCEPT_APPLICATION = gql`
  mutation AcceptApplication($id: ID!, $notes: String) {
    acceptApplication(id: $id, notes: $notes)
  }
`;

/** Reject an application. */
export const REJECT_APPLICATION = gql`
  mutation RejectApplication($id: ID!, $reason: String) {
    rejectApplication(id: $id, reason: $reason)
  }
`;

/** Mark application as under review (optional notes). */
export const REVIEW_APPLICATION = gql`
  mutation ReviewApplication($applicationId: ID!, $notes: String) {
    reviewApplication(applicationId: $applicationId, notes: $notes)
  }
`;

/** Set opportunity priority - flat args, no input wrapper. Priority: HIGH | NORMAL | LOW */
export const SET_OPPORTUNITY_PRIORITY = gql`
  mutation SetOpportunityPriority($opportunityId: ID!, $priority: String!) {
    setOpportunityPriority(opportunityId: $opportunityId, priority: $priority)
  }
`;

/** Save opportunity for current user. */
export const SAVE_OPPORTUNITY = gql`
  mutation SaveOpportunity($id: ID!) {
    saveOpportunity(id: $id)
  }
`;

/** Unsave opportunity for current user. */
export const UNSAVE_OPPORTUNITY = gql`
  mutation UnsaveOpportunity($id: ID!) {
    unsaveOpportunity(id: $id)
  }
`;

/** Submit application. Returns the new applicationId string. */
export const SUBMIT_APPLICATION = gql`
  mutation SubmitApplication($input: SubmitApplicationInput!) {
    submitApplication(input: $input)
  }
`;

/** Withdraw application (stub - always returns true, gRPC not wired yet). */
export const WITHDRAW_APPLICATION = gql`
  mutation WithdrawApplication($id: ID!) {
    withdrawApplication(id: $id)
  }
`;

// --- Additional Queries for User/Feed functionality ---

/** Current user's submitted applications. */
export const USER_APPLICATIONS = gql`
  ${APPLICATION_FIELDS}
  query UserApplications($limit: Int, $offset: Int, $status: String) {
    userApplications(limit: $limit, offset: $offset, status: $status) {
      total
      applications {
        ...ApplicationFields
        opportunity {
          id
          title
          status
          deadline
        }
      }
    }
  }
`;

/** Current user's saved opportunities. */
export const GET_SAVED_OPPORTUNITIES = gql`
  ${OPPORTUNITY_FULL_FIELDS}
  query GetSavedOpportunities($limit: Int, $offset: Int) {
    getSavedOpportunities(limit: $limit, offset: $offset) {
      total
      savedOpportunities {
        id
        opportunityId
        userId
        savedAt
        opportunity {
          ...OpportunityFullFields
        }
      }
    }
  }
`;

/** Get opportunity feed (always PUBLISHED status). */
export const GET_OPPORTUNITY_FEED = gql`
  ${OPPORTUNITY_FULL_FIELDS}
  query GetOpportunityFeed($input: GetOpportunityFeedInput!) {
    getOpportunityFeed(input: $input) {
      total
      opportunities {
        ...OpportunityFullFields
      }
    }
  }
`;
