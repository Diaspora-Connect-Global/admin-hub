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

export const GET_NOTIFICATIONS_WITH_META = gql`
  query GetNotificationsWithMeta($limit: Int, $offset: Int) {
    getNotificationsWithMeta(limit: $limit, offset: $offset) {
      notifications {
        id
        userId
        recipientId
        type
        title
        message
        body
        data
        read
        isRead
        actionUrl
        link
        imageUrl
        createdAt
        readAt
      }
      total
      limit
      offset
      unreadCount
    }
  }
`;

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount {
    getUnreadNotificationCount {
      count
    }
  }
`;

export const GET_UNREAD_NOTIFICATIONS = gql`
  query GetUnreadNotifications {
    getUnreadNotifications {
      id
      type
      title
      message
      link
      actionUrl
      createdAt
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

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      accessToken
      refreshToken
      sessionToken
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout($sessionId: String, $logoutAll: Boolean) {
    logout(sessionId: $sessionId, logoutAllSessions: $logoutAll) {
      success
      message
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

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationId: String!) {
    markNotificationAsRead(notificationId: $notificationId) {
      success
      message
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead {
      success
      message
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($notificationId: String!) {
    deleteNotification(notificationId: $notificationId) {
      success
      message
    }
  }
`;

export const DELETE_ALL_NOTIFICATIONS = gql`
  mutation DeleteAllNotifications {
    deleteAllNotifications {
      success
      message
    }
  }
`;

/** CommunityType (list communities response). */
export interface CommunityType {
  id: string;
  name: string;
  description?: string;
  isEmbassy: boolean;
}

/** Community (listCommunities / getCommunity(id) response). */
export interface Community {
  id: string;
  name: string;
  description?: string;
  visibility: string;
  joinPolicy: string;
  address?: string;
  assignedAdminIds?: string[];
  avatarUrl?: string;
  communityRules?: string;
  communityType?: CommunityType;
  communityTypeId?: string;
  contactEmail?: string;
  contactPhone?: string;
  countriesServed?: string[];
  createdAt: string;
  defaultGroupId?: string;
  embassyCountry?: string;
  groupCreationPermission?: string;
  locationCountry?: string;
  memberCount?: number;
  membershipStatus?: string;
  priceAmount?: number;
  priceCurrency?: string;
  updatedAt?: string;
  website?: string;
  whoCanPost?: string;
}

/** CommunityListResponse (listCommunities). */
export interface CommunityListResponse {
  communities: Community[];
  total: number;
}

/** Result of listCommunities query. */
export interface ListCommunitiesQueryResult {
  listCommunities: CommunityListResponse;
}

/** listCommunities(limit, offset, searchTerm, visibility). */
export const LIST_COMMUNITIES = gql`
  query ListCommunities($limit: Int, $offset: Int, $searchTerm: String, $visibility: String) {
    listCommunities(limit: $limit, offset: $offset, searchTerm: $searchTerm, visibility: $visibility) {
      communities {
        id
        name
        description
        visibility
        joinPolicy
        communityTypeId
        communityType {
          id
          name
          isEmbassy
        }
        countriesServed
        embassyCountry
        locationCountry
        memberCount
        membershipStatus
        createdAt
      }
      total
    }
  }
`;

/** createCommunity input (Community Service API). */
export interface CreateCommunityInput {
  name: string;
  description: string;
  visibility: "PUBLIC" | "PRIVATE";
  joinPolicy: "FREE" | "PAID";
  paymentType: "NONE" | "ONE_TIME" | "SUBSCRIPTION";
  communityTypeId: string;
  priceAmount?: number;
  priceCurrency?: string;
}

/** getCommunity(id: ID!): Community! */
export interface GetCommunityQueryResult {
  getCommunity: Community;
}

export const GET_COMMUNITY = gql`
  query GetCommunity($id: ID!) {
    getCommunity(id: $id) {
      id
      name
      description
      visibility
      joinPolicy
      communityTypeId
      communityType {
        id
        name
        description
        isEmbassy
      }
      address
      assignedAdminIds
      avatarUrl
      communityRules
      contactEmail
      contactPhone
      countriesServed
      createdAt
      defaultGroupId
      embassyCountry
      groupCreationPermission
      locationCountry
      memberCount
      membershipStatus
      priceAmount
      priceCurrency
      updatedAt
      website
      whoCanPost
    }
  }
`;

/** createCommunity mutation result. */
export interface CreateCommunityMutationResult {
  createCommunity: { id: string; name: string; createdAt: string };
}

/** createCommunity(input: CreateCommunityInput!): Community! */
export const CREATE_COMMUNITY = gql`
  mutation CreateCommunity($input: CreateCommunityInput!) {
    createCommunity(input: $input) {
      id
      name
      createdAt
    }
  }
`;

/** Association (Community Service). */
export interface Association {
  id: string;
  name: string;
  description?: string;
  visibility: "PUBLIC" | "PRIVATE";
  joinPolicy: "OPEN" | "REQUEST" | "INVITE_ONLY";
  associationTypeId?: string;
  defaultGroupId?: string;
  memberCount?: number;
  avatarUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** discoverAssociations(limit, offset, searchTerm). */
export const DISCOVER_ASSOCIATIONS = gql`
  query DiscoverAssociations($limit: Int, $offset: Int, $searchTerm: String) {
    discoverAssociations(limit: $limit, offset: $offset, searchTerm: $searchTerm) {
      associations {
        id
        name
        description
        avatarUrl
      }
      total
    }
  }
`;

/** RequestMembershipInput (entityId, entityType per EntityType enum). */
export interface RequestMembershipInput {
  entityId: string;
  entityType: "COMMUNITY" | "ASSOCIATION";
}

/** requestMembership(input: RequestMembershipInput!). */
export const REQUEST_MEMBERSHIP = gql`
  mutation RequestMembership($input: RequestMembershipInput!) {
    requestMembership(input: $input) {
      isMember
      status
    }
  }
`;

export interface CreateAssociationInput {
  name: string;
  description?: string;
  associationTypeId: string;
  joinPolicy: "OPEN" | "REQUEST" | "INVITE_ONLY";
  visibility: "PUBLIC" | "PRIVATE";
  communityIds?: string[];
  associationAdmins?: { email: string; password: string }[];
}

export interface UpdateAssociationInput {
  id: string;
  name?: string;
  description?: string;
  joinPolicy?: "OPEN" | "REQUEST" | "INVITE_ONLY";
  visibility?: "PUBLIC" | "PRIVATE";
  avatarKey?: string;
}

export interface AssociationMember {
  userId: string;
  role?: string;
  status: string;
  joinedAt?: string;
}

export interface MembershipActionInput {
  entityId: string;
  entityType: "COMMUNITY" | "ASSOCIATION";
  userId: string;
  reason?: string;
}

export const CREATE_ASSOCIATION = gql`
  mutation CreateAssociation($input: CreateAssociationInput!) {
    createAssociation(input: $input) {
      id
      name
      defaultGroupId
      joinPolicy
      visibility
      createdAt
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

// ─── Admin Account Management ────────────────────────────────────────────

export interface AdminAccount {
  id: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  adminType: "SYSTEM_ADMIN" | "COMMUNITY_ADMIN" | "ASSOCIATION_ADMIN" | "MODERATOR";
  roles: Array<{
    id: string;
    roleType: string;
    scopeType: "GLOBAL" | "COMMUNITY" | "ASSOCIATION";
    scopeId?: string;
  }>;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminInput {
  email: string;
  password: string;
  adminType: "SYSTEM_ADMIN" | "COMMUNITY_ADMIN" | "ASSOCIATION_ADMIN" | "MODERATOR";
  scopeType: "GLOBAL" | "COMMUNITY" | "ASSOCIATION";
  scopeId?: string;
}

export interface UpdateAdminStatusInput {
  adminId: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  reason?: string;
}

export interface AssignAdminRoleInput {
  adminId: string;
  roleType: string;
  scopeType: "GLOBAL" | "COMMUNITY" | "ASSOCIATION";
  scopeId?: string;
}

export const CREATE_ADMIN = gql`
  mutation CreateAdmin($input: CreateAdminInput!) {
    createAdmin(input: $input) {
      success
      message
      admin {
        id
        email
        status
        adminType
        roles {
          id
          roleType
          scopeType
          scopeId
        }
        permissions
      }
    }
  }
`;

export const GET_ADMIN_BY_ID = gql`
  query GetAdminById($adminId: String!) {
    getAdminById(adminId: $adminId) {
      success
      admin {
        id
        email
        status
        adminType
        roles {
          id
          roleType
          scopeType
          scopeId
        }
        permissions
        createdAt
        updatedAt
      }
    }
  }
`;

export const LIST_ADMINS = gql`
  query ListAdmins($limit: Int, $offset: Int, $status: String, $adminType: String) {
    listAdmins(limit: $limit, offset: $offset, status: $status, adminType: $adminType) {
      admins {
        id
        email
        status
        adminType
        roles {
          id
          roleType
          scopeType
          scopeId
        }
        createdAt
      }
      total
    }
  }
`;

export const UPDATE_ADMIN_STATUS = gql`
  mutation UpdateAdminStatus($input: UpdateAdminStatusInput!) {
    updateAdminStatus(input: $input) {
      success
      message
    }
  }
`;

export const ASSIGN_ADMIN_ROLE_MUTATION = gql`
  mutation AssignAdminRole($input: AssignAdminRoleInput!) {
    assignAdminRole(input: $input) {
      success
      message
      assignment {
        id
        roleType
        scopeType
        scopeId
      }
    }
  }
`;

export const REVOKE_ADMIN_ROLE_MUTATION = gql`
  mutation RevokeAdminRole($roleAssignmentId: String!, $reason: String) {
    revokeAdminRole(roleAssignmentId: $roleAssignmentId, reason: $reason) {
      success
      message
    }
  }
`;

// ─── Community Type Management ────────────────────────────────────────────

export interface CommunityType {
  id: string;
  name: string;
  description?: string;
  isEmbassy?: boolean;
  createdAt?: string;
}

export interface CreateCommunityTypeInput {
  name: string;
  description?: string;
  isEmbassy?: boolean;
}

export const CREATE_COMMUNITY_TYPE = gql`
  mutation CreateCommunityType($input: CreateCommunityTypeInput!) {
    createCommunityType(input: $input) {
      id
      name
      description
      isEmbassy
    }
  }
`;

export const LIST_COMMUNITY_TYPES = gql`
  query ListCommunityTypes {
    listCommunityTypes {
      id
      name
      description
      isEmbassy
    }
  }
`;

export const DELETE_COMMUNITY_TYPE = gql`
  mutation DeleteCommunityType($id: String!) {
    deleteCommunityType(id: $id) {
      success
      message
    }
  }
`;

// ─── Association Type Management ────────────────────────────────────────────

export interface AssociationType {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface CreateAssociationTypeInput {
  name: string;
  description?: string;
}

export const CREATE_ASSOCIATION_TYPE = gql`
  mutation CreateAssociationType($input: CreateAssociationTypeInput!) {
    createAssociationType(input: $input) {
      id
      name
      description
    }
  }
`;

export const LIST_ASSOCIATION_TYPES = gql`
  query ListAssociationTypes {
    listAssociationTypes {
      id
      name
      description
    }
  }
`;

export const DELETE_ASSOCIATION_TYPE = gql`
  mutation DeleteAssociationType($id: String!) {
    deleteAssociationType(id: $id) {
      success
      message
    }
  }
`;

// ─── Association Management ──────────────────────────────────────────────────

export const GET_ASSOCIATION = gql`
  query GetAssociation($id: ID!) {
    getAssociation(id: $id) {
      id
      name
      description
      joinPolicy
      visibility
      defaultGroupId
      memberCount
      avatarUrl
      createdAt
      updatedAt
    }
  }
`;

export const SEARCH_ASSOCIATIONS = gql`
  query SearchAssociations($input: SearchAssociationsInput) {
    searchAssociations(input: $input) {
      associations {
        id
        name
        description
        memberCount
        joinPolicy
        visibility
        avatarUrl
        createdAt
      }
      total
      page
      limit
    }
  }
`;

export const UPDATE_ASSOCIATION = gql`
  mutation UpdateAssociation($input: UpdateAssociationInput!) {
    updateAssociation(input: $input) {
      id
      name
      joinPolicy
      visibility
      updatedAt
    }
  }
`;

export const LINK_ASSOCIATION = gql`
  mutation LinkAssociation($input: LinkAssociationInput!) {
    linkAssociation(input: $input) {
      success
      message
    }
  }
`;

export const UNLINK_ASSOCIATION = gql`
  mutation UnlinkAssociation($input: UnlinkAssociationInput!) {
    unlinkAssociation(input: $input) {
      success
      message
    }
  }
`;

export const APPROVE_MEMBERSHIP = gql`
  mutation ApproveMembership($input: ApproveMembershipInput!) {
    approveMembership(input: $input) {
      success
      message
    }
  }
`;

export const REJECT_MEMBERSHIP = gql`
  mutation RejectMembership($input: RejectMembershipInput!) {
    rejectMembership(input: $input) {
      success
      message
    }
  }
`;

export const REMOVE_MEMBER = gql`
  mutation RemoveMember($input: RemoveMemberInput!) {
    removeMember(input: $input) {
      success
      message
    }
  }
`;

export const INVITE_MEMBER = gql`
  mutation InviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input) {
      success
      message
    }
  }
`;

export const GET_ASSOCIATION_MEMBERS = gql`
  query GetAssociationMembers(
    $associationId: ID!
    $page: Int
    $limit: Int
    $status: String
  ) {
    getAssociationMembers(
      associationId: $associationId
      page: $page
      limit: $limit
      status: $status
    ) {
      members {
        userId
        role
        status
        joinedAt
      }
      total
      page
    }
  }
`;

export const GET_PENDING_MEMBERSHIP_REQUESTS = gql`
  query GetPendingMembershipRequests($entityId: ID!, $entityType: String!) {
    getPendingMembershipRequests(entityId: $entityId, entityType: $entityType) {
      requests {
        userId
        requestedAt
        message
      }
      total
    }
  }
`;

export const GET_ASSOCIATION_AVATAR_UPLOAD_URL = gql`
  mutation GetAssociationAvatarUploadUrl($associationId: ID!) {
    getAssociationAvatarUploadUrl(associationId: $associationId) {
      uploadUrl
      fileKey
    }
  }
`;
