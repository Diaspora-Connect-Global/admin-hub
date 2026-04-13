# Community Backend Handoff: GraphQL Contract (Full Integration)

Date: 2026-04-13  
Scope: Community list + detail + all actions/tabs/modals

## 0) Contract Policy (Immediate)

### Finalize `updateCommunity` now
Use one stable signature:

```graphql
updateCommunity(id: ID!, input: UpdateCommunityInput!): CommunityMutationPayload!
```

- Do not require `communityId` inside `input`.
- If legacy clients send `input.communityId`, support temporarily via deprecated legacy mutation.

---

## 1) Core Schema Foundations

```graphql
scalar DateTime
scalar JSON
scalar Upload

type ErrorInfo {
  code: String!
  message: String!
  field: String
  details: JSON
}

type PageInfoOffset {
  total: Int!
  limit: Int!
  offset: Int!
  hasNext: Boolean!
}

enum SortOrder {
  ASC
  DESC
}
```

---

## 2) Enums (Standardized)

```graphql
enum CommunityVisibility { PUBLIC PRIVATE RESTRICTED }
enum CommunityJoinPolicy { OPEN APPROVAL_REQUIRED INVITE_ONLY }
enum CommunityPaymentType { FREE PAID }
enum MembershipStatus { NOT_MEMBER PENDING MEMBER BANNED SUSPENDED }
enum CommunityWhoCanPost { ADMINS_ONLY MEMBERS ANYONE }
enum GroupCreationPermission { ADMINS_ONLY MEMBERS }
enum CommunityStatus { ACTIVE SUSPENDED ARCHIVED DELETED }
enum EntityType { COMMUNITY ASSOCIATION GROUP }
enum ExportFormat { CSV JSON }
```

---

## 3) Core Types

```graphql
type Community {
  id: ID!
  name: String!
  description: String
  visibility: CommunityVisibility!
  joinPolicy: CommunityJoinPolicy!
  paymentType: CommunityPaymentType!
  priceAmount: Float
  priceCurrency: String
  communityTypeId: ID!
  countriesServed: [String!]!
  embassyCountry: String
  locationCountry: String
  memberCount: Int!
  membershipStatus: MembershipStatus!
  assignedAdminIds: [ID!]!
  whoCanPost: CommunityWhoCanPost!
  groupCreationPermission: GroupCreationPermission!
  communityRules: String
  contactEmail: String
  contactPhone: String
  website: String
  address: String
  avatarUrl: String
  coverUrl: String
  status: CommunityStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

---

## 4) Required Query Surface

- `listCommunities(input)`
- `getCommunity(id)`
- `listCommunityTypes(input)`
- `discoverAssociations(limit, offset, searchTerm)`
- `listCommunityAssociations(communityId, limit, offset)`
- `getUsers(limit, offset, search)`
- `listCommunityAdmins(communityId, limit, offset)`
- `listCommunityMembers(communityId, limit, offset, status, role, search)`
- `getPendingMembershipRequests(entityId, entityType, limit, offset)`
- `listCommunityPosts(communityId, limit, offset, status)`
- `listEvents(input with ownerType=COMMUNITY, ownerId=communityId)`
- `listOpportunities(input with ownerType=COMMUNITY, ownerId=communityId)`
- `getCommunityVendorSettings(communityId)`
- `getAuditLogs(resourceType, resourceId, limit, offset)`
- `getCommunityStats(communityId)`
- `getCommunityAnalytics(communityId, from, to, granularity)`

---

## 5) Required Mutation Surface

- `createCommunity(input)`
- `updateCommunity(id, input)`
- `deleteCommunity(id, reason)`
- `restoreCommunity(id, reason)`
- `suspendCommunity(input)`
- `unsuspendCommunity(input)`
- `updateCommunityVisibility(communityId, visibility)`
- `updateCommunityJoinPolicy(communityId, joinPolicy)`
- `linkAssociation(input)` / `unlinkAssociation(input)` / `bulkLinkAssociations(...)`
- `assignAdminRole(input)` / `revokeAdminRole(roleAssignmentId, reason)`
- `inviteMember(input)` / `removeMember(input)` / `assignMemberRole(...)`
- `approveMembership(requestId, reason)` / `rejectMembership(requestId, reason)`
- `approvePost(postId, reason)` / `rejectPost(postId, reason)` / `deletePost(postId, reason, relatedReportId)`
- Community-scoped events/opportunities lifecycle mutations
- `updateCommunityVendorSettings(communityId, enabled, rules)`
- `getCommunityAvatarUploadUrl(communityId, filename, contentType)`
- `getCommunityCoverUploadUrl(communityId, filename, contentType)`
- `deleteEntityImage(entityId, entityType, imageType)`
- `exportCommunityData(communityId, format)`
- `bulkSuspendCommunities(ids, reason, durationHours)`
- `bulkExportCommunities(ids, filters, format)`

---

## 6) Validation Rules (Server-Enforced)

1. `paymentType = PAID` requires `priceAmount > 0` and ISO-4217 `priceCurrency`.
2. `paymentType = FREE` requires `priceAmount = null`, `priceCurrency = null`.
3. `countriesServed` must be ISO-3166-1 alpha-2 uppercase.
4. Embassy community type requires both `embassyCountry` and `locationCountry`.
5. `assignedAdminIds` must be valid assignable users.
6. Unknown enum values are rejected.
7. Pagination defaults + max limit (recommended: 100).

---

## 7) Error Model

All domain mutations should return payloads containing:
- `success: Boolean!`
- object (if applicable)
- `errors: [ErrorInfo!]!`

Standard error codes:
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `FORBIDDEN`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

---

## 8) RBAC Minimum

- Read: system admin + scoped community admin (policy-gated)
- Core writes: system admin; scoped admin if explicitly allowed
- Role assignment/revocation: system admin or delegated permission
- Member moderation: community admin with moderation permission
- Ownership transfer: system admin or recovery permission
- Audit/analytics/export: admin read/export permissions
- Upload URL generation: write permission on target community

---

## 9) Definition of Done

1. No mock/static arrays for Community tabs/actions.
2. All modals call live APIs.
3. List counters are server-backed.
4. Deterministic payloads for success/error.
5. Finalized/versioned `updateCommunity` signature.
6. Legacy compatibility has deprecation date.
7. API docs include enums, validation, RBAC, examples.
