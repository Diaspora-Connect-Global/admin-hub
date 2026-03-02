import { gql } from "@apollo/client";

/**
 * Fragment and operation definitions for the Admin Service.
 * Use these with useQuery / useMutation from @apollo/client, or adminClient.query/mutate.
 */

// --- Fragments (reusable field sets) ---

export const ADMIN_ROLE_FIELDS = gql`
  fragment AdminRoleFields on AdminRole {
    id
    userId
    roleType
    scopeType
    scopeId
    grantedBy
    grantedAt
    revokedAt
    revokedBy
    revocationReason
  }
`;

export const REPORT_FIELDS = gql`
  fragment ReportFields on Report {
    id
    reporterId
    targetType
    targetId
    reason
    description
    status
    createdAt
    reviewedBy
    reviewedAt
    resolutionNotes
  }
`;

export const MODERATION_ACTION_FIELDS = gql`
  fragment ModerationActionFields on ModerationAction {
    id
    adminId
    adminRole
    actionType
    targetType
    targetId
    reason
    metadata
    createdAt
    scopeType
    scopeId
    relatedReportId
  }
`;

// --- Queries ---

export const GET_MY_ROLES = gql`
  ${ADMIN_ROLE_FIELDS}
  query GetMyRoles {
    getMyRoles {
      ...AdminRoleFields
    }
  }
`;

export const GET_ADMIN_ROLES = gql`
  ${ADMIN_ROLE_FIELDS}
  query GetAdminRoles($userId: ID, $scopeType: ScopeType, $scopeId: ID) {
    getAdminRoles(userId: $userId, scopeType: $scopeType, scopeId: $scopeId) {
      ...AdminRoleFields
    }
  }
`;

export const CHECK_PERMISSION = gql`
  query CheckPermission(
    $requiredRole: AdminRoleType!
    $targetScopeType: ScopeType
    $targetScopeId: ID
    $action: ModerationActionType
  ) {
    checkPermission(
      requiredRole: $requiredRole
      targetScopeType: $targetScopeType
      targetScopeId: $targetScopeId
      action: $action
    ) {
      allowed
      reason
      effectiveRole
    }
  }
`;

export const GET_REPORTS = gql`
  ${REPORT_FIELDS}
  query GetReports(
    $status: ReportStatus
    $targetType: TargetType
    $limit: Int
    $offset: Int
  ) {
    getReports(
      status: $status
      targetType: $targetType
      limit: $limit
      offset: $offset
    ) {
      items {
        ...ReportFields
      }
      total
      limit
      offset
    }
  }
`;

export const GET_REPORT = gql`
  ${REPORT_FIELDS}
  query GetReport($reportId: ID!) {
    getReport(reportId: $reportId) {
      ...ReportFields
    }
  }
`;

export const GET_MODERATION_ACTIONS = gql`
  ${MODERATION_ACTION_FIELDS}
  query GetModerationActions(
    $adminId: ID
    $actionType: ModerationActionType
    $targetType: TargetType
    $targetId: ID
    $limit: Int
    $offset: Int
  ) {
    getModerationActions(
      adminId: $adminId
      actionType: $actionType
      targetType: $targetType
      targetId: $targetId
      limit: $limit
      offset: $offset
    ) {
      items {
        ...ModerationActionFields
      }
      total
      limit
      offset
    }
  }
`;

export const GET_CONTENT_PRIORITIES = gql`
  query GetContentPriorities(
    $priorityLevel: PriorityLevel
    $scopeType: ScopeType
    $scopeId: ID
  ) {
    getContentPriorities(
      priorityLevel: $priorityLevel
      scopeType: $scopeType
      scopeId: $scopeId
    ) {
      id
      postId
      priorityLevel
      expiresAt
      createdBy
      createdAt
      reason
    }
  }
`;

export const GET_COMMUNITY_STATS = gql`
  query GetCommunityStats($communityId: ID!) {
    getCommunityStats(communityId: $communityId) {
      memberCount
      activeMembers
      pendingRequests
      postCount
    }
  }
`;

export const GET_ASSOCIATION_STATS = gql`
  query GetAssociationStats($associationId: ID!) {
    getAssociationStats(associationId: $associationId) {
      memberCount
      activeMembers
      pendingRequests
      postCount
    }
  }
`;

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs(
    $actorId: ID
    $action: String
    $resourceType: String
    $resourceId: ID
    $fromDate: DateTime
    $toDate: DateTime
    $limit: Int
    $offset: Int
  ) {
    getAuditLogs(
      actorId: $actorId
      action: $action
      resourceType: $resourceType
      resourceId: $resourceId
      fromDate: $fromDate
      toDate: $toDate
      limit: $limit
      offset: $offset
    ) {
      items {
        id
        actorId
        actorRole
        action
        resourceType
        resourceId
        metadata
        createdAt
        ipAddress
      }
      total
      limit
      offset
    }
  }
`;

// --- Mutations ---

/** Admin login. No auth header required; returns accessToken (Bearer) and refreshToken. */
export const ADMIN_LOGIN = gql`
  mutation AdminLogin($input: AdminLoginInput!) {
    adminLogin(input: $input) {
      success
      message
      error
      accessToken
      refreshToken
      admin {
        id
        userId
        scopeType
        scopeId
        isActive
        role {
          id
          name
          scopeType
          permissions
          description
        }
      }
    }
  }
`;

export const ASSIGN_ADMIN_ROLE = gql`
  mutation AssignAdminRole($input: AssignAdminRoleInput!) {
    assignAdminRole(input: $input) {
      success
      message
    }
  }
`;

export const REVOKE_ADMIN_ROLE = gql`
  mutation RevokeAdminRole($roleId: ID!, $reason: String!) {
    revokeAdminRole(roleId: $roleId, reason: $reason) {
      success
      message
    }
  }
`;

export const CREATE_REPORT = gql`
  mutation CreateReport($input: CreateReportInput!) {
    createReport(input: $input) {
      success
      message
      id
    }
  }
`;

export const UPDATE_REPORT_STATUS = gql`
  mutation UpdateReportStatus($input: UpdateReportStatusInput!) {
    updateReportStatus(input: $input) {
      success
      message
    }
  }
`;

export const BAN_USER = gql`
  mutation BanUser($input: BanUserInput!) {
    banUser(input: $input) {
      success
      message
    }
  }
`;

export const UNBAN_USER = gql`
  mutation UnbanUser($userId: ID!, $reason: String) {
    unbanUser(userId: $userId, reason: $reason) {
      success
      message
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost(
    $postId: ID!
    $reason: String!
    $relatedReportId: ID
  ) {
    deletePost(
      postId: $postId
      reason: $reason
      relatedReportId: $relatedReportId
    ) {
      success
      message
    }
  }
`;

export const BOOST_CONTENT = gql`
  mutation BoostContent(
    $postId: ID!
    $priorityLevel: PriorityLevel!
    $expiresAt: DateTime
    $reason: String
    $scopeType: ScopeType
    $scopeId: ID
  ) {
    boostContent(
      postId: $postId
      priorityLevel: $priorityLevel
      expiresAt: $expiresAt
      reason: $reason
      scopeType: $scopeType
      scopeId: $scopeId
    ) {
      success
      message
    }
  }
`;

export const UNBOOST_CONTENT = gql`
  mutation UnboostContent($priorityId: ID!) {
    unboostContent(priorityId: $priorityId)
  }
`;

export const CREATE_COMMUNITY = gql`
  mutation CreateCommunity(
    $name: String!
    $description: String!
    $visibility: String!
    $joinPolicy: String!
    $ownerId: ID
  ) {
    createCommunity(
      name: $name
      description: $description
      visibility: $visibility
      joinPolicy: $joinPolicy
      ownerId: $ownerId
    ) {
      id
    }
  }
`;

export const CREATE_ASSOCIATION = gql`
  mutation CreateAssociation(
    $name: String!
    $description: String!
    $visibility: String!
    $creatorId: ID
  ) {
    createAssociation(
      name: $name
      description: $description
      visibility: $visibility
      creatorId: $creatorId
    ) {
      id
    }
  }
`;

export const ASSIGN_MEMBER_ROLE = gql`
  mutation AssignMemberRole(
    $userId: ID!
    $entityId: ID!
    $entityType: String!
    $role: String!
  ) {
    assignMemberRole(
      userId: $userId
      entityId: $entityId
      entityType: $entityType
      role: $role
    ) {
      success
      message
    }
  }
`;
