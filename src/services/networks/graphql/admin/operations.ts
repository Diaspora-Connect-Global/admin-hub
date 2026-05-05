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
    $actorId: String
    $action: String
    $resourceType: String
    $resourceId: String
    $fromDate: String
    $toDate: String
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
        action
        resourceType
        resourceId
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

// ============================================================================
// Notification Listing Operations
// ============================================================================

export const LIST_PUSH_NOTIFICATIONS = gql`
  query ListPushNotifications($filters: ListPushNotificationsFilters) {
    listPushNotifications(filters: $filters) {
      items {
        id
        title
        type
        recipientCount
        status
        sentAt
        openRate
      }
      total
    }
  }
`;

export const LIST_IN_APP_NOTIFICATIONS = gql`
  query ListInAppNotifications($filters: ListInAppNotificationsFilters) {
    listInAppNotifications(filters: $filters) {
      items {
        id
        title
        type
        priority
        targetAudience
        active
        viewCount
        createdAt
      }
      total
    }
  }
`;

export const LIST_NOTIFICATION_TEMPLATES = gql`
  query ListNotificationTemplates($filters: ListNotificationTemplatesFilters) {
    listNotificationTemplates(filters: $filters) {
      items {
        id
        name
        type
        category
        usageCount
        status
        lastUpdatedAt
      }
      total
    }
  }
`;

export const GET_NOTIFICATION_ANALYTICS = gql`
  query GetNotificationAnalytics($period: String!) {
    getNotificationAnalytics(period: $period) {
      volumeByDay {
        date
        pushCount
        inAppCount
        emailCount
      }
      deliveryRateByHour {
        hour
        deliveredPct
        failedPct
      }
      typeDistribution {
        type
        count
      }
    }
  }
`;

// --- TypeScript interfaces for the notification listing responses ---

export interface AdminPushNotificationItem {
  id: string;
  title: string;
  type: string;
  recipientCount: number;
  status: string;
  sentAt?: string;
  openRate?: number;
}

export interface AdminPushNotificationListResponse {
  items: AdminPushNotificationItem[];
  total: number;
}

export interface AdminInAppNotificationItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  targetAudience: string;
  active: boolean;
  viewCount: number;
  createdAt: string;
}

export interface AdminInAppNotificationListResponse {
  items: AdminInAppNotificationItem[];
  total: number;
}

export interface AdminNotificationTemplateItem {
  id: string;
  name: string;
  type: string;
  category: string;
  usageCount: number;
  status: string;
  lastUpdatedAt?: string;
}

export interface AdminNotificationTemplateListResponse {
  items: AdminNotificationTemplateItem[];
  total: number;
}

export interface NotificationVolumeByDay {
  date: string;
  pushCount: number;
  inAppCount: number;
  emailCount: number;
}

export interface NotificationDeliveryRateByHour {
  hour: number;
  deliveredPct: number;
  failedPct: number;
}

export interface NotificationTypeDistribution {
  type: string;
  count: number;
}

export interface NotificationAnalyticsData {
  volumeByDay: NotificationVolumeByDay[];
  deliveryRateByHour: NotificationDeliveryRateByHour[];
  typeDistribution: NotificationTypeDistribution[];
}

/** CommunityType (list communities response). */
export interface CommunityType {
  id: string;
  name: string;
  description?: string;
  isEmbassy?: boolean;
}

/** Community (listCommunities / getCommunity(id) response). */
export interface Community {
  id: string;
  name: string;
  description?: string;
  visibility: string;
  joinPolicy: string;
  paymentType?: string;
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

/** listCommunities(limit, offset, searchTerm, visibility, communityTypeId). */
export const LIST_COMMUNITIES = gql`
  query ListCommunities($limit: Int, $offset: Int, $searchTerm: String, $visibility: String, $communityTypeId: String) {
    listCommunities(limit: $limit, offset: $offset, searchTerm: $searchTerm, visibility: $visibility, communityTypeId: $communityTypeId) {
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
  visibility: "PUBLIC" | "PRIVATE" | "HIDDEN";
  joinPolicy: "OPEN" | "APPROVAL" | "INVITE_ONLY" | "PAID";
  paymentType: "NONE" | "ONE_TIME" | "SUBSCRIPTION";
  communityTypeId: string;
  priceAmount?: number;
  priceCurrency?: string;
  assignedAdminIds?: string[];
  whoCanPost?: "ADMIN_ONLY" | "ALL_MEMBERS";
  groupCreationPermission?: string;
  countriesServed?: string[];
  communityRules?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  embassyCountry?: string | null;
  locationCountry?: string | null;
  communityAdmins?: Array<{
    email: string;
    password: string;
  }>;
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
      paymentType
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
  createCommunity: {
    id: string;
    name: string;
    description?: string;
    visibility: string;
    joinPolicy: string;
    paymentType?: string;
    priceAmount?: number | null;
    priceCurrency?: string | null;
    communityTypeId: string;
    whoCanPost?: string;
    groupCreationPermission?: string;
    countriesServed?: string[];
    communityRules?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    address?: string;
    embassyCountry?: string | null;
    locationCountry?: string | null;
    createdAt: string;
  };
}

/** createCommunity(input: CreateCommunityInput!): Community! */
export const CREATE_COMMUNITY = gql`
  mutation CreateCommunity($input: CreateCommunityInput!) {
    createCommunity(input: $input) {
      id
      name
      description
      visibility
      joinPolicy
      paymentType
      priceAmount
      priceCurrency
      communityTypeId
      whoCanPost
      groupCreationPermission
      countriesServed
      communityRules
      contactEmail
      contactPhone
      website
      address
      embassyCountry
      locationCountry
      createdAt
    }
  }
`;

/** Nested group on association detail query. */
export interface AssociationDefaultGroup {
  id: string;
  name: string;
  description?: string | null;
  privacy?: string | null;
  memberCount?: number | null;
}

/** Current user's membership on association (from getAssociation). */
export interface AssociationMyMembership {
  isMember?: boolean | null;
  role?: string | null;
  status?: string | null;
  joinedAt?: string | null;
}

/** Association (Community Service). */
export interface Association {
  id: string;
  name: string;
  description?: string;
  visibility: "PUBLIC" | "PRIVATE";
  joinPolicy: "OPEN" | "REQUEST" | "APPROVAL" | "INVITE_ONLY" | "PAID";
  paymentType?: "NONE" | "ONE_TIME" | "SUBSCRIPTION";
  priceAmount?: number;
  priceCurrency?: string;
  whoCanPost?: string;
  associationTypeId?: string;
  associationType?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  defaultGroupId?: string;
  defaultGroup?: AssociationDefaultGroup | null;
  memberCount?: number;
  membershipStatus?: string;
  myMembership?: AssociationMyMembership | null;
  avatarUrl?: string;
  coverImageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  countriesServed?: string[];
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
  joinPolicy: "OPEN" | "REQUEST" | "APPROVAL" | "INVITE_ONLY" | "PAID";
  visibility: "PUBLIC" | "PRIVATE";
  paymentType?: "NONE" | "ONE_TIME" | "SUBSCRIPTION";
  priceAmount?: number;
  priceCurrency?: string;
  whoCanPost?: string;
  countriesServed?: string[];
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  communityIds?: string[];
  adminEmail?: string;
  adminPassword?: string;
  associationAdmins?: { email: string; password: string }[];
}

export interface UpdateAssociationInput {
  id?: string;
  associationId?: string;
  name?: string;
  description?: string;
  joinPolicy?: "OPEN" | "REQUEST" | "APPROVAL" | "INVITE_ONLY" | "PAID";
  visibility?: "PUBLIC" | "PRIVATE";
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  countriesServed?: string[];
  avatarKey?: string;
  coverKey?: string;
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
      visibility
      joinPolicy
      avatarUrl
      coverImageUrl
      createdAt
      updatedAt
      memberCount
      associationTypeId
      contactEmail
      contactPhone
      website
      address
      countriesServed
      defaultGroupId
      associationType {
        id
        name
        description
      }
      myMembership {
        isMember
        role
        status
        joinedAt
      }
      membershipStatus
      defaultGroup {
        id
        name
        description
        privacy
        memberCount
      }
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
        associationTypeId
        contactEmail
        contactPhone
        website
        address
        countriesServed
        membershipStatus
        avatarUrl
        coverImageUrl
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

/** Banner / cover image; mirrors avatar upload shape (`uploadUrl` + `fileKey`). */
export const GET_ASSOCIATION_COVER_UPLOAD_URL = gql`
  mutation GetAssociationCoverUploadUrl($associationId: ID!) {
    getAssociationCoverUploadUrl(associationId: $associationId) {
      uploadUrl
      fileKey
    }
  }
`;

// ─── Enforcement (Admin Module — Cross-Service) ──────────────────────────────

/** Platform-level user ban (cross-service). Different from community-scoped BanUser. */
export const ADMIN_BAN_USER = gql`
  mutation AdminBanUser($userId: String!, $reason: String!, $permanent: Boolean) {
    adminBanUser(userId: $userId, reason: $reason, permanent: $permanent) {
      success
      error
    }
  }
`;

export const ADMIN_BAN_VENDOR = gql`
  mutation AdminBanVendor($vendorId: String!, $reason: String!, $permanent: Boolean) {
    adminBanVendor(vendorId: $vendorId, reason: $reason, permanent: $permanent) {
      success
      error
    }
  }
`;

/** contentType: USER | POST | COMMENT | COMMUNITY | ASSOCIATION | MESSAGE | VENDOR */
export const ADMIN_REMOVE_CONTENT = gql`
  mutation AdminRemoveContent($contentType: String!, $contentId: String!, $reason: String!) {
    adminRemoveContent(contentType: $contentType, contentId: $contentId, reason: $reason) {
      success
      error
    }
  }
`;

export const ADMIN_FORCE_RELEASE_ESCROW = gql`
  mutation AdminForceReleaseEscrow($escrowId: String!, $reason: String!) {
    adminForceReleaseEscrow(escrowId: $escrowId, reason: $reason) {
      success
      error
    }
  }
`;

export const ADMIN_RESOLVE_DISPUTE = gql`
  mutation AdminResolveDispute($disputeId: String!, $outcome: String!, $notes: String) {
    adminResolveDispute(disputeId: $disputeId, outcome: $outcome, notes: $notes) {
      success
      error
    }
  }
`;

export const BULK_BAN_USERS = gql`
  mutation BulkBanUsers($userIds: [String]!, $reason: String!) {
    bulkBanUsers(userIds: $userIds, reason: $reason) {
      successCount
      failureCount
      failures
    }
  }
`;

export const BULK_REMOVE_CONTENT = gql`
  mutation BulkRemoveContent($postIds: [String]!, $reason: String) {
    bulkRemoveContent(postIds: $postIds, reason: $reason) {
      successCount
      failureCount
      failures
    }
  }
`;

// ─── Role Definitions ────────────────────────────────────────────────────────

export interface RoleDefinition {
  id: string;
  name: string;
  description?: string;
  scopeType: string;
  scopeId: string;
  permissions: string[];
  isSystem: boolean;
}

export interface CreateRoleDefinitionInput {
  name: string;
  description?: string;
  scopeType: string;
  scopeId: string;
  permissions: string[];
}

export const GET_ROLE_DEFINITIONS = gql`
  query GetRoleDefinitions($scopeType: String, $scopeId: String, $createdBy: String) {
    getRoleDefinitions(scopeType: $scopeType, scopeId: $scopeId, createdBy: $createdBy) {
      success
      message
      roles {
        id
        name
        description
        scopeType
        scopeId
        permissions
        isSystem
      }
    }
  }
`;

export const CREATE_ROLE_DEFINITION = gql`
  mutation CreateRoleDefinition($input: CreateRoleDefinitionInput!) {
    createRoleDefinition(input: $input) {
      success
      message
    }
  }
`;

export interface UpdateRoleDefinitionInput {
  roleId: string;
  name: string;
  description?: string;
  permissions: string[];
}

export const UPDATE_ROLE_DEFINITION = gql`
  mutation UpdateRoleDefinition($input: UpdateRoleDefinitionInput!) {
    updateRoleDefinition(input: $input)
  }
`;

export const DELETE_ROLE_DEFINITION = gql`
  mutation DeleteRoleDefinition($roleId: String!) {
    deleteRoleDefinition(roleId: $roleId)
  }
`;

// ─── Extended Community Operations ───────────────────────────────────────────

export interface UpdateCommunityInput {
  name?: string;
  description?: string;
  whoCanPost?: string;
  groupCreationPermission?: string;
  countriesServed?: string[];
  communityRules?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  embassyCountry?: string;
  locationCountry?: string;
  communityTypeId?: string;
}



export interface CommunityMutationPayload {
  success: boolean;
  community?: {
    id: string;
    name: string;
    description?: string;
    communityTypeId?: string;
    whoCanPost?: string;
    groupCreationPermission?: string;
    countriesServed?: string[];
    communityRules?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    address?: string;
    embassyCountry?: string | null;
    locationCountry?: string | null;
  } | null;
  errors: string[];
}

export const UPDATE_COMMUNITY = gql`
  mutation UpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {
    updateCommunity(id: $id, input: $input) {
      success
      community {
        id
        name
        description
        communityTypeId
        whoCanPost
        groupCreationPermission
        countriesServed
        communityRules
        contactEmail
        contactPhone
        website
        address
        embassyCountry
        locationCountry
      }
      errors
    }
  }
`;

export interface UpdateCommunityVisibilityInput {
  communityId: string;
  visibility: string;
}

export interface UpdateCommunityJoinPolicyInput {
  communityId: string;
  joinPolicy: string;
  priceAmount?: number | null;
  priceCurrency?: string | null;
}

export const UPDATE_COMMUNITY_VISIBILITY = gql`
  mutation UpdateCommunityVisibility($input: UpdateCommunityVisibilityInput!) {
    updateCommunityVisibility(input: $input) {
      id
      visibility
    }
  }
`;

export const UPDATE_COMMUNITY_JOIN_POLICY = gql`
  mutation UpdateCommunityJoinPolicy($input: UpdateCommunityJoinPolicyInput!) {
    updateCommunityJoinPolicy(input: $input) {
      id
      joinPolicy
      priceAmount
      priceCurrency
    }
  }
`;

/** assignCommunityAdmin / assignAssociationAdmin (entity-scoped admin provisioning). */
export interface AssignAdminInput {
  entityId: string;
  email: string;
  password: string;
}

export interface AssignAdminPayload {
  success: boolean;
  adminId?: string;
  email?: string;
  message?: string;
}

export const ASSIGN_COMMUNITY_ADMIN = gql`
  mutation AssignCommunityAdmin($input: AssignAdminInput!) {
    assignCommunityAdmin(input: $input) {
      success
      adminId
      email
      message
    }
  }
`;

export const ASSIGN_ASSOCIATION_ADMIN = gql`
  mutation AssignAssociationAdmin($input: AssignAdminInput!) {
    assignAssociationAdmin(input: $input) {
      success
      adminId
      email
      message
    }
  }
`;

export const SOFT_DELETE_COMMUNITY = gql`
  mutation SoftDeleteCommunity($communityId: ID!) {
    softDeleteCommunity(communityId: $communityId) {
      success
      message
      deletedAt
    }
  }
`;

export const RESTORE_COMMUNITY = gql`
  mutation RestoreCommunity($communityId: ID!) {
    restoreCommunity(communityId: $communityId) {
      success
      message
      restoredAt
    }
  }
`;

export const SEARCH_COMMUNITIES_ADVANCED = gql`
  query SearchCommunitiesAdvanced(
    $searchTerm: String
    $communityTypeId: String
    $visibility: String
    $country: String
    $limit: Int
    $offset: Int
  ) {
    searchCommunitiesAdvanced(
      searchTerm: $searchTerm
      communityTypeId: $communityTypeId
      visibility: $visibility
      country: $country
      limit: $limit
      offset: $offset
    ) {
      communities {
        id
        name
        description
        visibility
        joinPolicy
        communityTypeId
        communityType { id name isEmbassy }
        memberCount
        createdAt
        avatarUrl
      }
      total
    }
  }
`;

// ─── Community Moderation ─────────────────────────────────────────────────────

/** Community-scoped ban (different from platform-level ADMIN_BAN_USER). */
export const COMMUNITY_BAN_USER = gql`
  mutation CommunityBanUser($userId: String!, $entityId: String!, $entityType: String!, $reason: String) {
    banUser(input: { userId: $userId, entityId: $entityId, entityType: $entityType, reason: $reason }) {
      success
      message
      bannedAt
    }
  }
`;

export const COMMUNITY_UNBAN_USER = gql`
  mutation CommunityUnbanUser($userId: String!, $entityId: String!, $entityType: String!) {
    unbanUser(input: { userId: $userId, entityId: $entityId, entityType: $entityType }) {
      success
      message
      unbannedAt
    }
  }
`;

export const SUSPEND_MEMBER = gql`
  mutation SuspendMember($userId: String!, $entityId: String!, $entityType: String!, $reason: String) {
    suspendMember(input: { userId: $userId, entityId: $entityId, entityType: $entityType, reason: $reason }) {
      success
      message
      suspendedAt
    }
  }
`;

export const UNSUSPEND_MEMBER = gql`
  mutation UnsuspendMember($userId: String!, $entityId: String!, $entityType: String!) {
    unsuspendMember(input: { userId: $userId, entityId: $entityId, entityType: $entityType }) {
      success
      message
      unsuspendedAt
    }
  }
`;

export const TRANSFER_OWNERSHIP = gql`
  mutation TransferOwnership(
    $currentOwnerId: String!
    $newOwnerId: String!
    $entityId: String!
    $entityType: String!
  ) {
    transferOwnership(input: {
      currentOwnerId: $currentOwnerId
      newOwnerId: $newOwnerId
      entityId: $entityId
      entityType: $entityType
    }) {
      success
      message
      timestamp
    }
  }
`;

export const GET_MODERATION_LOGS = gql`
  query GetModerationLogs($entityId: ID!, $entityType: String!, $limit: Int, $offset: Int) {
    getModerationLogs(entityId: $entityId, entityType: $entityType, limit: $limit, offset: $offset) {
      id
      entityId
      entityType
      action
      performedBy
      targetUser
      details
      createdAt
    }
  }
`;

export const GET_BANNED_USERS_LIST = gql`
  query GetBannedUsers($entityId: ID!, $entityType: String!) {
    getBannedUsers(entityId: $entityId, entityType: $entityType) {
      userId
      bannedBy
      reason
      bannedAt
    }
  }
`;

export const GET_SUSPENDED_USERS_LIST = gql`
  query GetSuspendedUsers($entityId: ID!, $entityType: String!) {
    getSuspendedUsers(entityId: $entityId, entityType: $entityType) {
      userId
      suspendedBy
      reason
      suspendedAt
    }
  }
`;

export const LIST_COMMUNITY_MEMBERS = gql`
  query ListCommunityMembers($communityId: ID!, $limit: Int, $offset: Int) {
    listCommunityMembers(communityId: $communityId, limit: $limit, offset: $offset) {
      members {
        userId
        role
        status
        joinedAt
      }
      total
    }
  }
`;

export const LIST_COMMUNITY_ADMINS = gql`
  query ListCommunityAdmins($communityId: ID!, $limit: Int, $offset: Int) {
    listCommunityAdmins(communityId: $communityId, limit: $limit, offset: $offset) {
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
      }
    }
  }
`;

export const LIST_COMMUNITY_ASSOCIATIONS = gql`
  query ListCommunityAssociations($communityId: ID!, $limit: Int, $offset: Int) {
    listCommunityAssociations(communityId: $communityId, limit: $limit, offset: $offset) {
      associations {
        id
        name
        description
      }
      total
    }
  }
`;

export const LIST_ASSOCIATION_MEMBERS = gql`
  query ListAssociationMembers($associationId: ID!, $limit: Int, $offset: Int) {
    listAssociationMembers(associationId: $associationId, limit: $limit, offset: $offset) {
      members {
        userId
        role
        status
        joinedAt
      }
      total
    }
  }
`;

export const SEARCH_MEMBERS = gql`
  query SearchMembers($entityId: ID!, $entityType: String!, $searchTerm: String!, $limit: Int) {
    searchMembers(entityId: $entityId, entityType: $entityType, searchTerm: $searchTerm, limit: $limit) {
      userId
      role
      status
      joinedAt
    }
  }
`;

// ─── Community / Association Upload URLs ─────────────────────────────────────

export const GET_COMMUNITY_AVATAR_UPLOAD_URL = gql`
  mutation GetCommunityAvatarUploadUrl($communityId: ID!, $filename: String!, $contentType: String!) {
    getCommunityAvatarUploadUrl(communityId: $communityId, filename: $filename, contentType: $contentType) {
      uploadUrl
      fileUrl
    }
  }
`;

export const GET_COMMUNITY_COVER_UPLOAD_URL = gql`
  mutation GetCommunityCoverUploadUrl($communityId: ID!, $filename: String!, $contentType: String!) {
    getCommunityCoverUploadUrl(communityId: $communityId, filename: $filename, contentType: $contentType) {
      uploadUrl
      fileUrl
    }
  }
`;

export const DELETE_ENTITY_IMAGE = gql`
  mutation DeleteEntityImage($entityId: ID!, $entityType: String!, $imageType: String!) {
    deleteEntityImage(entityId: $entityId, entityType: $entityType, imageType: $imageType) {
      success
      message
      timestamp
    }
  }
`;

// ─── Dispute & Escrow Management ──────────────────────────────────────────────

export interface AdminDispute {
  id: string;
  paymentIntentId?: string;
  escrowId?: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED" | "ESCALATED";
  reason?: string;
  description?: string;
  resolution?: string;
  raisedBy?: string;
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
  // Extended display fields used in the UI table / detail sheet
  type?: string;
  title_summary?: string;
  priority?: string;
  raised_by?: string;
  assigned_admin?: string;
  related_entity?: string;
  created_at?: string;
}

export interface AdminEscrow {
  id: string;
  paymentIntentId?: string;
  status:
    | "PENDING"
    | "HELD"
    | "RELEASED"
    | "REFUNDED"
    | "FROZEN"
    | "DISPUTED";
  totalAmount: number;
  releasedAmount?: number;
  remainingAmount?: number;
  currency?: string;
  releaseMode?: string;
  disputeId?: string;
  frozenAt?: string;
  createdAt: string;
}

export const ADMIN_LIST_DISPUTES = gql`
  query AdminListDisputes($status: String, $page: Int, $limit: Int) {
    adminListDisputes(status: $status, page: $page, limit: $limit) {
      disputes {
        id
        paymentIntentId
        escrowId
        status
        reason
        description
        resolution
        raisedBy
        resolvedBy
        createdAt
        resolvedAt
      }
      total
    }
  }
`;

export const ADMIN_LIST_ESCROWS = gql`
  query AdminListEscrows($status: String, $page: Int, $limit: Int) {
    adminListEscrows(status: $status, page: $page, limit: $limit) {
      escrows {
        id
        paymentIntentId
        status
        totalAmount
        releasedAmount
        remainingAmount
        currency
        releaseMode
        disputeId
        frozenAt
        createdAt
      }
      total
    }
  }
`;

// ── Escrow Attachments ────────────────────────────────────────────────────────

export interface EscrowAttachment {
  id: string;
  escrowId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  uploadedByName: string;
  url: string;
  createdAt: string;
}

export interface EscrowAttachmentListResponse {
  items: EscrowAttachment[];
  total: number;
}

export const GET_ESCROW_ATTACHMENTS = gql`
  query GetEscrowAttachments($escrowId: String!, $limit: Int, $offset: Int) {
    getEscrowAttachments(escrowId: $escrowId, limit: $limit, offset: $offset) {
      items {
        id
        escrowId
        fileName
        fileType
        fileSize
        uploadedById
        uploadedByName
        url
        createdAt
      }
      total
    }
  }
`;

export const ADMIN_FREEZE_ESCROW = gql`
  mutation AdminFreezeEscrow($escrowId: ID!, $disputeId: ID!, $reason: String!) {
    adminFreezeEscrow(escrowId: $escrowId, disputeId: $disputeId, reason: $reason) {
      success
      message
    }
  }
`;

export const ADMIN_UNFREEZE_ESCROW = gql`
  mutation AdminUnfreezeEscrow($escrowId: ID!, $disputeId: ID!) {
    adminUnfreezeEscrow(escrowId: $escrowId, disputeId: $disputeId) {
      success
      message
    }
  }
`;

export const ADMIN_UNBAN_USER = gql`
  mutation AdminUnbanUser($userId: ID!, $reason: String) {
    adminUnbanUser(userId: $userId, reason: $reason) {
      success
      message
    }
  }
`;

// ─── System Alerts & Performance Metrics ─────────────────────────────────────

export interface SystemAlert {
  id: string;
  type: string;
  component: string;
  severity: string;
  timestamp: string;
  status: string;
  message?: string;
}

export const GET_SYSTEM_ALERTS = gql`
  query GetSystemAlerts {
    getSystemAlerts {
      id
      type
      component
      severity
      timestamp
      status
      message
    }
  }
`;

export const ACKNOWLEDGE_ALERT = gql`
  mutation AcknowledgeAlert($id: ID!, $note: String!) {
    acknowledgeAlert(id: $id, note: $note) {
      success
      message
    }
  }
`;

export interface PerformanceMetricPoint {
  label: string;
  value: number;
  unit?: string;
  timestamp?: string;
}

export const GET_PERFORMANCE_METRICS = gql`
  query GetPerformanceMetrics {
    getPerformanceMetrics {
      label
      value
      unit
      timestamp
    }
  }
`;

// ─── Community Engagement Stats (time-series + top communities) ──────────────

export interface EngagementDataPoint {
  date: string;
  posts: number;
  reactions: number;
  comments: number;
}

export interface CommunityEngagementStatFull {
  communityId: string;
  communityName: string;
  posts: number;
  reactions: number;
  comments: number;
  activeMembers: number;
}

export interface CommunityEngagementStatsData {
  byDay: EngagementDataPoint[];
  topCommunities: CommunityEngagementStatFull[];
}

export const GET_COMMUNITY_ENGAGEMENT_STATS = gql`
  query GetCommunityEngagementStats($period: String) {
    getCommunityEngagementStatsFull(period: $period) {
      byDay {
        date
        posts
        reactions
        comments
      }
      topCommunities {
        communityId
        communityName
        posts
        reactions
        comments
        activeMembers
      }
    }
  }
`;

// ─── Association Ranking ──────────────────────────────────────────────────────

export interface AssociationRankingItem {
  associationId: string;
  associationName: string;
  communityName: string;
  posts: number;
  opportunities: number;
  vendors: number;
  reactions: number;
}

export interface AssociationRankingData {
  items: AssociationRankingItem[];
}

export const GET_TOP_ASSOCIATIONS = gql`
  query GetTopAssociations($limit: Int) {
    getTopAssociations(limit: $limit) {
      items {
        associationId
        associationName
        communityName
        posts
        opportunities
        vendors
        reactions
      }
    }
  }
`;

// ─── Dashboard Stats & System Health ─────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalVendors: number;
  activeVendors: number;
  totalOrders: number;
  pendingOrders: number;
  openDisputes: number;
  pendingEscrows: number;
  totalCommunities: number;
  activeModerationCases: number;
  pendingBanAppeals: number;
  generatedAt: string;
}

export interface SystemHealthService {
  service: string;
  status: "healthy" | "down";
  latencyMs?: number;
  error?: string;
}

export interface SystemHealth {
  overallStatus: "healthy" | "degraded";
  services: SystemHealthService[];
  checkedAt: string;
}

export interface AnalyticsDayPoint {
  date: string;
  value: number;
}

export interface PlatformAnalytics {
  period: string;
  contentRemovedCount: number;
  usersBanned: number;
  registrationsByDay: AnalyticsDayPoint[];
  ordersByDay: AnalyticsDayPoint[];
  generatedAt: string;
}

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getDashboardStats {
      totalUsers
      activeUsers
      totalVendors
      activeVendors
      totalOrders
      pendingOrders
      openDisputes
      pendingEscrows
      totalCommunities
      activeModerationCases
      pendingBanAppeals
      generatedAt
    }
  }
`;

export const GET_SYSTEM_HEALTH = gql`
  query GetSystemHealth {
    getSystemHealth {
      overallStatus
      services {
        service
        status
        latencyMs
        error
      }
      checkedAt
    }
  }
`;

export const GET_PLATFORM_ANALYTICS = gql`
  query GetPlatformAnalytics($period: String!) {
    getPlatformAnalytics(period: $period) {
      period
      contentRemovedCount
      usersBanned
      registrationsByDay {
        date
        value
      }
      ordersByDay {
        date
        value
      }
      generatedAt
    }
  }
`;

// ─── Platform Settings ────────────────────────────────────────────────────────

export interface PlatformSetting {
  key: string;
  value: string;
  category: string;
  description?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface SetPlatformSettingInput {
  key: string;
  value: string;
}

export const GET_PLATFORM_SETTINGS = gql`
  query GetPlatformSettings($category: String) {
    getPlatformSettings(category: $category) {
      key
      value
      category
      description
      updatedBy
      updatedAt
    }
  }
`;

export const SET_PLATFORM_SETTING = gql`
  mutation SetPlatformSetting($input: SetPlatformSettingInput!) {
    setPlatformSetting(input: $input) {
      key
      value
      category
      updatedBy
      updatedAt
    }
  }
`;

export const GET_PLATFORM_SETTING = gql`
  query GetPlatformSetting($key: String!) {
    getPlatformSetting(key: $key) {
      key
      value
      category
      description
      updatedBy
      updatedAt
    }
  }
`;

export interface SetBatchPlatformSettingsInput {
  settings: SetPlatformSettingInput[];
}

export const SET_BATCH_PLATFORM_SETTINGS = gql`
  mutation SetBatchPlatformSettings($input: SetBatchPlatformSettingsInput!) {
    setBatchPlatformSettings(input: $input) {
      key
      value
      category
      updatedBy
      updatedAt
    }
  }
`;

// ─── Broadcast / Campaign Notifications ──────────────────────────────────────

export interface BroadcastCampaign {
  id: string;
  title: string;
  body: string;
  targetAudience: "ALL_USERS" | "VENDORS" | "SPECIFIC_USERS";
  status: "DRAFT" | "SENT" | "FAILED";
  sentBy?: string;
  recipientCount?: number;
  createdAt: string;
  sentAt?: string;
}

export interface SendBroadcastInput {
  title: string;
  body: string;
  targetAudience: "ALL_USERS" | "VENDORS" | "SPECIFIC_USERS";
  targetUserIds?: string[];
}

export const GET_BROADCAST_CAMPAIGNS = gql`
  query GetBroadcastCampaigns($page: Int, $limit: Int) {
    getBroadcastCampaigns(page: $page, limit: $limit) {
      campaigns {
        id
        title
        body
        targetAudience
        status
        sentBy
        recipientCount
        createdAt
        sentAt
      }
      total
    }
  }
`;

export const SEND_BROADCAST = gql`
  mutation SendBroadcast($input: SendBroadcastInput!) {
    sendBroadcast(input: $input) {
      id
      title
      body
      targetAudience
      status
      sentBy
      recipientCount
      createdAt
    }
  }
`;

// ─── Support Ticketing ────────────────────────────────────────────────────────

export interface TicketMessage {
  id: string;
  ticketId?: string;
  senderId: string;
  senderType: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description?: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: "GENERAL" | "PAYMENT" | "ACCOUNT" | "VENDOR" | "CONTENT" | "OTHER";
  submittedBy?: string;
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  messages?: TicketMessage[];
}

export interface CreateSupportTicketInput {
  subject: string;
  description: string;
  category?: string;
  priority?: string;
}

export interface UpdateSupportTicketInput {
  ticketId: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
}

export const GET_SUPPORT_TICKETS = gql`
  query GetSupportTickets($status: String, $page: Int, $limit: Int) {
    getSupportTickets(status: $status, page: $page, limit: $limit) {
      tickets {
        id
        subject
        description
        status
        priority
        category
        submittedBy
        assignedTo
        createdAt
        resolvedAt
        messages { id ticketId senderId senderType message createdAt }
      }
      total
    }
  }
`;

export const GET_SUPPORT_TICKET = gql`
  query GetSupportTicket($ticketId: ID!) {
    getSupportTicket(ticketId: $ticketId) {
      id
      subject
      description
      status
      priority
      category
      submittedBy
      assignedTo
      createdAt
      resolvedAt
      messages { id senderId senderType message createdAt }
    }
  }
`;

export const CREATE_SUPPORT_TICKET = gql`
  mutation CreateSupportTicket($input: CreateSupportTicketInput!) {
    createSupportTicket(input: $input) {
      id
      subject
      status
      priority
      category
      createdAt
    }
  }
`;

export const UPDATE_SUPPORT_TICKET = gql`
  mutation UpdateSupportTicket($input: UpdateSupportTicketInput!) {
    updateSupportTicket(input: $input) {
      success
      message
    }
  }
`;

export const REPLY_TO_SUPPORT_TICKET = gql`
  mutation ReplyToSupportTicket($ticketId: ID!, $message: String!) {
    replyToSupportTicket(ticketId: $ticketId, message: $message) {
      id
      ticketId
      senderId
      senderType
      message
      createdAt
    }
  }
`;

export const DELETE_SUPPORT_TICKET = gql`
  mutation DeleteSupportTicket($ticketId: String!) {
    deleteSupportTicket(ticketId: $ticketId)
  }
`;

export const BULK_UPDATE_TICKET_STATUS = gql`
  mutation BulkUpdateTicketStatus($ticketIds: [String!]!, $status: String!) {
    bulkUpdateTicketStatus(ticketIds: $ticketIds, status: $status)
  }
`;

export const BULK_ASSIGN_TICKETS = gql`
  mutation BulkAssignTickets($ticketIds: [String!]!, $assigneeId: String!) {
    bulkAssignTickets(ticketIds: $ticketIds, assigneeId: $assigneeId)
  }
`;

export interface BulkUpdateTicketStatusInput {
  ticketIds: string[];
  status: string;
}

export interface BulkAssignTicketsInput {
  ticketIds: string[];
  assigneeId: string;
}

// ─── Chat Management ──────────────────────────────────────────────────────────

export interface FlaggedConversation {
  id: string;
  conversationId: string;
  status: "FLAGGED" | "REVIEWED" | "SUSPENDED" | "ACTIVE";
  flaggedBy?: string;
  flagReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ChatSetting {
  key: string;
  value: string;
  description?: string;
  updatedBy?: string;
}

export const GET_FLAGGED_CONVERSATIONS = gql`
  query GetFlaggedConversations($status: String, $page: Int, $limit: Int) {
    getFlaggedConversations(status: $status, page: $page, limit: $limit) {
      conversations {
        id
        conversationId
        status
        flaggedBy
        flagReason
        reviewedBy
        reviewedAt
        createdAt
      }
      total
    }
  }
`;

export const GET_CHAT_SETTINGS = gql`
  query GetChatSettings {
    getChatSettings {
      key
      value
      description
      updatedBy
    }
  }
`;

export const FLAG_CONVERSATION = gql`
  mutation FlagConversation($conversationId: ID!, $reason: String!) {
    flagConversation(conversationId: $conversationId, reason: $reason) {
      success
      message
    }
  }
`;

export const REVIEW_CONVERSATION = gql`
  mutation ReviewConversation($id: ID!, $newStatus: String!) {
    reviewConversation(id: $id, newStatus: $newStatus) {
      success
      message
    }
  }
`;

export const UPDATE_CHAT_SETTING = gql`
  mutation UpdateChatSetting($input: UpdateChatSettingAdminInput!) {
    updateChatSetting(input: $input) {
      key
      value
      description
      updatedBy
    }
  }
`;

// ─── Admin Conversation Listing ───────────────────────────────────────────

export interface AdminDMConversationItem {
  id: string;
  participant1Id: string;
  participant1Name?: string;
  participant2Id: string;
  participant2Name?: string;
  messageCount: number;
  lastMessageAt?: string;
  flagged: boolean;
  createdAt?: string;
}

export interface AdminDMConversationsData {
  items: AdminDMConversationItem[];
  total: number;
}

export interface AdminGroupConversationItem {
  id: string;
  name: string;
  groupId?: string;
  communityId?: string;
  memberCount: number;
  messageCount: number;
  createdBy?: string;
  lastMessageAt?: string;
  flagged: boolean;
  createdAt?: string;
}

export interface AdminGroupConversationsData {
  items: AdminGroupConversationItem[];
  total: number;
}

export interface ConversationMemberItem {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt?: string;
  role: string;
}

export const LIST_DM_CONVERSATIONS = gql`
  query ListDMConversations($filters: AdminDMConversationsFilters) {
    listDMConversations(filters: $filters) {
      items {
        id
        participant1Id
        participant1Name
        participant2Id
        participant2Name
        messageCount
        lastMessageAt
        flagged
        createdAt
      }
      total
    }
  }
`;

export const LIST_GROUP_CONVERSATIONS = gql`
  query ListGroupConversations($filters: AdminGroupConversationsFilters) {
    listGroupConversations(filters: $filters) {
      items {
        id
        name
        groupId
        communityId
        memberCount
        messageCount
        createdBy
        lastMessageAt
        flagged
        createdAt
      }
      total
    }
  }
`;

export const GET_CONVERSATION_MEMBERS = gql`
  query GetConversationMembers($conversationId: ID!) {
    getConversationMembers(conversationId: $conversationId) {
      userId
      displayName
      avatarUrl
      joinedAt
      role
    }
  }
`;

export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($messageId: String!, $conversationId: String!) {
    deleteMessage(messageId: $messageId, conversationId: $conversationId)
  }
`;

export const BAN_USER_FROM_CONVERSATION = gql`
  mutation BanUserFromConversation($conversationId: String!, $userId: String!, $reason: String) {
    banUserFromConversation(conversationId: $conversationId, userId: $userId, reason: $reason)
  }
`;

// ─── Chat Volume Analytics ─────────────────────────────────────────────────

export interface ChatVolumeDataPoint {
  date: string;
  dm: number;
  group: number;
}

export interface ActiveChatStat {
  chatId: string;
  chatName: string;
  /** "DM" | "GROUP" */
  chatType: string;
  memberCount: number;
  messageCount: number;
  lastActiveAt: string;
}

export interface ChatVolumeAnalyticsData {
  byDay: ChatVolumeDataPoint[];
  dmCount: number;
  groupCount: number;
  totalMessages: number;
  topActiveChats: ActiveChatStat[];
}

export const GET_CHAT_VOLUME_ANALYTICS = gql`
  query GetChatVolumeAnalytics($period: String) {
    getChatVolumeAnalytics(period: $period) {
      byDay {
        date
        dm
        group
      }
      dmCount
      groupCount
      totalMessages
      topActiveChats {
        chatId
        chatName
        chatType
        memberCount
        messageCount
        lastActiveAt
      }
    }
  }
`;

// ─── User Sub-Resources ───────────────────────────────────────────────────────

export const GET_USER_POSTS = gql`
  query GetUserPosts($userId: String!, $limit: Int, $offset: Int) {
    getUserPosts(userId: $userId, limit: $limit, offset: $offset) {
      items {
        id
        content
        postType
        communityId
        communityName
        likeCount
        commentCount
        createdAt
        status
      }
      total
    }
  }
`;

export const GET_USER_GROUPS = gql`
  query GetUserGroups($userId: String!, $limit: Int, $offset: Int) {
    getUserGroups(userId: $userId, limit: $limit, offset: $offset) {
      items {
        id
        name
        communityId
        communityName
        memberCount
        role
        joinedAt
      }
      total
    }
  }
`;

export const GET_USER_OPPORTUNITIES = gql`
  query GetUserOpportunities($userId: String!, $limit: Int, $offset: Int) {
    getUserOpportunities(userId: $userId, limit: $limit, offset: $offset) {
      items {
        id
        title
        type
        communityId
        communityName
        status
        applicants
        postedAt
      }
      total
    }
  }
`;

export const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions($userId: String!, $limit: Int, $offset: Int) {
    getUserTransactions(userId: $userId, limit: $limit, offset: $offset) {
      items {
        id
        type
        amount
        currency
        status
        description
        createdAt
      }
      total
    }
  }
`;

// TypeScript interfaces for user sub-resource responses

export interface UserPost {
  id: string;
  content?: string;
  postType?: string;
  communityId?: string;
  communityName?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  status?: string;
}

export interface UserPostListResponse {
  items: UserPost[];
  total: number;
}

export interface UserGroup {
  id: string;
  name: string;
  communityId?: string;
  communityName?: string;
  memberCount: number;
  role?: string;
  joinedAt?: string;
}

export interface UserGroupListResponse {
  items: UserGroup[];
  total: number;
}

export interface UserOpportunity {
  id: string;
  title: string;
  type?: string;
  communityId?: string;
  communityName?: string;
  status?: string;
  applicants: number;
  postedAt?: string;
}

export interface UserOpportunityListResponse {
  items: UserOpportunity[];
  total: number;
}

export interface UserTransaction {
  id: string;
  type?: string;
  amount: number;
  currency?: string;
  status?: string;
  description?: string;
  createdAt: string;
}

export interface UserTransactionListResponse {
  items: UserTransaction[];
  total: number;
}

// ─── Vendor Sales Analytics ───────────────────────────────────────────────────

export interface SalesDataPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface VendorSalesStat {
  vendorId: string;
  vendorName: string;
  productsSold: number;
  revenue: number;
  currency: string;
  rating?: number;
}

export interface VendorSalesAnalyticsResponse {
  byDay: SalesDataPoint[];
  topVendors: VendorSalesStat[];
  totalRevenue: number;
  totalOrders: number;
}

export const GET_VENDOR_SALES_ANALYTICS = gql`
  query GetVendorSalesAnalytics($period: String) {
    getVendorSalesAnalytics(period: $period) {
      byDay {
        date
        sales
        orders
      }
      topVendors {
        vendorId
        vendorName
        productsSold
        revenue
        currency
        rating
      }
      totalRevenue
      totalOrders
    }
  }
`;

// ─── Community Sub-Resources (admin view) ────────────────────────────────────

/**
 * Fetch posts belonging to a specific community (admin view).
 * TODO: Backend resolver `getCommunityPosts(communityId, limit, offset)` must be
 * exposed on the admin-gateway before this query will resolve. The expected response
 * shape mirrors the existing `getUserPosts` sub-resource pattern.
 */
export interface CommunityPost {
  id: string;
  authorId?: string;
  authorName?: string;
  content?: string;
  postType?: string;
  mediaCount?: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  status?: string;
}

export interface CommunityPostListResponse {
  items: CommunityPost[];
  total: number;
}

export const GET_COMMUNITY_POSTS_ADMIN = gql`
  query GetCommunityPostsAdmin($communityId: String!, $limit: Int, $offset: Int) {
    getCommunityPosts(communityId: $communityId, limit: $limit, offset: $offset) {
      items {
        id
        authorId
        authorName
        content
        postType
        mediaCount
        likeCount
        commentCount
        createdAt
        status
      }
      total
    }
  }
`;

/**
 * Fetch vendor products listed under a specific community (admin view).
 * TODO: Backend resolver `getCommunityProducts(communityId, limit, offset)` must be
 * exposed on the admin-gateway. Shape matches `listVendorProducts` in the vendor service.
 */
export interface CommunityProduct {
  id: string;
  vendorId?: string;
  vendorName?: string;
  name?: string;
  title?: string;
  price?: number;
  currency?: string;
  inventoryCount?: number;
  productType?: string;
  status?: string;
  createdAt?: string;
}

export interface CommunityProductListResponse {
  items: CommunityProduct[];
  total: number;
}

export const GET_COMMUNITY_PRODUCTS_ADMIN = gql`
  query GetCommunityProductsAdmin($communityId: String!, $limit: Int, $offset: Int) {
    getCommunityProducts(communityId: $communityId, limit: $limit, offset: $offset) {
      items {
        id
        vendorId
        vendorName
        name
        title
        price
        currency
        inventoryCount
        productType
        status
        createdAt
      }
      total
    }
  }
`;
