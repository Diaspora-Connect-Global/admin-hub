# Admin Hub — GraphQL API Reference

This document lists all **queries** and **mutations** implemented in the admin hub and where they live in the codebase.

**Auth:** All operations (except admin login) use `Authorization: Bearer <accessToken>` from the session store. Login is done via `adminLogin`; the returned `accessToken` is stored and sent on subsequent requests.

---

## Table of Contents

1. [Admin Service](#1-admin-service)
2. [Opportunity Service](#2-opportunity-service)
3. [Hooks Reference](#3-hooks-reference)

---

## 1. Admin Service

**Endpoint:** `VITE_ADMIN_GRAPHQL_URL` (default `http://localhost:3006/graphql`)  
**Definitions:** `src/services/networks/graphql/admin/operations.ts`  
**Auth:** Bearer JWT (no auth for `adminLogin` only)

### Queries

| Operation | Variables | Description |
|-----------|-----------|-------------|
| **GetMyRoles** | — | Current admin's roles. |
| **GetAdminRoles** | `userId`, `scopeType`, `scopeId` | List admin roles (optional filters). |
| **CheckPermission** | `requiredRole!`, `targetScopeType`, `targetScopeId`, `action` | Check if current user has permission. |
| **GetReports** | `status`, `targetType`, `limit`, `offset` | List reports (moderation). |
| **GetReport** | `reportId!` | Single report by ID. |
| **GetModerationActions** | `adminId`, `actionType`, `targetType`, `targetId`, `limit`, `offset` | List moderation actions. |
| **GetContentPriorities** | `priorityLevel`, `scopeType`, `scopeId` | Content priority/boost list. |
| **GetCommunity** | `id: String!` | Community by ID (Community Service). Returns `id`, `name`, `description`, `visibility`, `memberCount`, `isJoined`. |
| **ListCommunities** | `limit`, `offset`, `searchTerm`, `visibility` | List communities. Returns `communities`, `total` (CommunityListResponse). |
| **GetCommunityStats** | `communityId!` | Stats for a community. |
| **GetAssociationStats** | `associationId!` | Stats for an association. |
| **DiscoverAssociations** | `limit`, `offset`, `searchTerm` | Find associations (Community Service). Returns `associations`, `total`. |
| **GetAuditLogs** | `actorId`, `action`, `resourceType`, `resourceId`, `fromDate`, `toDate`, `limit`, `offset` | Audit log entries. |

### Mutations

| Operation | Variables | Description |
|-----------|-----------|-------------|
| **AdminLogin** | `input: AdminLoginInput!` (`email`, `password`) | Admin login. Returns `success`, `accessToken`, `refreshToken`, `admin`. No Bearer required. |
| **AssignAdminRole** | `input: AssignAdminRoleInput!` | Grant an admin role. |
| **RevokeAdminRole** | `roleId!`, `reason!` | Revoke an admin role. |
| **CreateReport** | `input: CreateReportInput!` | Create a report. |
| **UpdateReportStatus** | `input: UpdateReportStatusInput!` | Update report status. |
| **BanUser** | `input: BanUserInput!` | Ban a user. |
| **UnbanUser** | `userId!`, `reason` | Unban a user. |
| **DeletePost** | `postId!`, `reason!`, `relatedReportId` | Delete a post (moderation). |
| **BoostContent** | `postId!`, `priorityLevel!`, `expiresAt`, `reason`, `scopeType`, `scopeId` | Boost/pin content. |
| **UnboostContent** | `priorityId!` | Remove content boost. |
| **CreateCommunity** | `input: CreateCommunityInput!` | Create a community (Community Service). Input: `name`, `description`, `visibility` (PUBLIC \| PRIVATE), `joinPolicy` (FREE \| PAID), `paymentType` (NONE \| ONE_TIME \| SUBSCRIPTION), `communityTypeId`; optional: `priceAmount`, `priceCurrency`. |
| **CreateAssociation** | `name!`, `description!`, `visibility!`, `creatorId` | Create an association. |
| **RequestMembership** | `input: RequestMembershipInput!` | Join entity. Input: `entityId`, `entityType` (COMMUNITY \| ASSOCIATION). Returns `isMember`, `status`. |
| **AssignMemberRole** | `userId!`, `entityId!`, `entityType!`, `role!` | Assign member role in community/association. |

---

## 2. Opportunity Service

**Endpoint:** Same as Admin (gateway) or `http://localhost:3008/graphql` if using a dedicated opportunity client.  
**Definitions:** `src/services/networks/graphql/opportunity/operations.ts` and `superAdmin.ts`  
**Auth:** Bearer JWT (same admin token)

### Queries

| Operation | Variables | Description |
|-----------|-----------|-------------|
| **GetOpportunity** | `id: String!` | Single opportunity by ID. |
| **ListOpportunities** | `input: ListOpportunitiesInput` | List/search opportunities. Input: `limit`, `offset`, `searchTerm`, `type`, `category`, `subCategory`, `workMode`, `engagementType`, `location`, `ownerType`, `ownerId`, `status`, `sortBy`, `sortOrder`. |
| **GetApplications** | `input: GetApplicationsInput!` | Applications for an opportunity. Input: `opportunityId!`, `limit`, `offset`, `status`. (System admin / opportunity owner only.) |
| **GetApplication** | `id: String!` | Single application by ID. |

### Mutations (shared: system admin / opportunity owner / community or association admin)

| Operation | Variables | Description |
|-----------|-----------|-------------|
| **CreateOpportunity** | `input: CreateOpportunityInput!` | Create opportunity (DRAFT). System admin can create for any owner. |
| **UpdateOpportunity** | `id: String!`, `input: UpdateOpportunityInput!` | Update opportunity fields. |
| **PublishOpportunity** | `id: String!` | Publish (DRAFT → PUBLISHED). |
| **CloseOpportunity** | `id: String!`, `reason` | Close opportunity. |
| **DeleteOpportunity** | `id: String!` | Permanently delete. |
| **AcceptApplication** | `id: String!` | Accept an application. |
| **RejectApplication** | `id: String!`, `reason` | Reject an application. |
| **ReviewApplication** | `input: ReviewApplicationInput!` | Mark application as under review. Input: `applicationId!`, `reviewNotes`, `status`. |

### Mutations — Super Admin only (⚡)

| Operation | Variables | Description |
|-----------|-----------|-------------|
| **SetOpportunityPriority** | `input: SetOpportunityPriorityInput!` | Set priority for featuring. Input: `opportunityId!`, `priority` (`HIGH` \| `NORMAL` \| `LOW`). **Only system admins.** Backend returns 403 otherwise. |

**Definitions (super admin only):** `src/services/networks/graphql/opportunity/superAdmin.ts`

---

## 3. Hooks Reference

Hooks use the shared admin Apollo client (Bearer from session). Import from `@/hooks/admin`, `@/hooks/opportunity`, or `@/hooks/opportunity/superAdmin` as below.

### Admin hooks — `@/hooks/admin` or `@/hooks/useAdminGraphql`

| Hook | Operation | Notes |
|------|-----------|--------|
| `useLoginMutation()` | AdminLogin | Use for login form. |
| `useGetMyRoles()` | GetMyRoles | |
| `useGetAdminRoles(variables)` | GetAdminRoles | |
| `useCheckPermission(variables)` | CheckPermission | |
| `useGetReports(options)` | GetReports | |
| `useGetReport(reportId)` | GetReport | |
| `useUpdateReportStatus()` | UpdateReportStatus | |
| `useGetModerationActions(options)` | GetModerationActions | |
| `useGetContentPriorities(variables)` | GetContentPriorities | |
| `useGetCommunity(id)` | GetCommunity | Skip when `id` is null. |
| `useListCommunities(options)` | ListCommunities | `limit`, `offset`, `searchTerm`, `visibility`. Used on Communities page. |
| `useDiscoverAssociations(options)` | DiscoverAssociations | `limit`, `offset`, `searchTerm`. |
| `useGetCommunityStats(communityId)` | GetCommunityStats | |
| `useGetAssociationStats(associationId)` | GetAssociationStats | |
| `useGetAuditLogs(options)` | GetAuditLogs | |
| `useAssignAdminRole()` | AssignAdminRole | |
| `useRevokeAdminRole()` | RevokeAdminRole | |
| `useCreateReport()` | CreateReport | |
| `useBanUser()` | BanUser | |
| `useUnbanUser()` | UnbanUser | |
| `useDeletePost()` | DeletePost | |
| `useBoostContent()` | BoostContent | |
| `useUnboostContent()` | UnboostContent | |
| `useCreateCommunity()` | CreateCommunity | Typed with `CreateCommunityInput`. |
| `useCreateAssociation()` | CreateAssociation | |
| `useRequestMembership()` | RequestMembership | |
| `useAssignMemberRole()` | AssignMemberRole | |
| `useAdminClient()` | — | Apollo client for one-off calls. |

**Stub hooks (query not wired yet):** `useForgotPassword()`, `useGetUsers(options)`.

### Opportunity hooks — `@/hooks/opportunity`

| Hook | Operation | Notes |
|------|-----------|--------|
| `useGetOpportunity(id)` | GetOpportunity | Skip when `id` is null. |
| `useListOpportunities(input?)` | ListOpportunities | |
| `useGetApplications(input)` | GetApplications | Skip when `input.opportunityId` missing. |
| `useGetApplication(id)` | GetApplication | |
| `useCreateOpportunity()` | CreateOpportunity | |
| `useUpdateOpportunity()` | UpdateOpportunity | |
| `usePublishOpportunity()` | PublishOpportunity | |
| `useCloseOpportunity()` | CloseOpportunity | |
| `useDeleteOpportunity()` | DeleteOpportunity | |
| `useAcceptApplication()` | AcceptApplication | |
| `useRejectApplication()` | RejectApplication | |
| `useReviewApplication()` | ReviewApplication | |

### Super Admin only — `@/hooks/opportunity/superAdmin`

| Hook / Export | Operation | Notes |
|---------------|-----------|--------|
| `useSetOpportunityPriority()` | SetOpportunityPriority | Guard UI: only show for super admin. |
| `PRIORITY_LEVELS` | — | `["HIGH", "NORMAL", "LOW"]` for dropdowns. |
| `PriorityLevel`, `SetOpportunityPriorityInput` | — | Types for the mutation input. |

---

## Quick import reference

```ts
// Auth
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";

// Admin operations
import {
  useGetMyRoles,
  useGetReports,
  useGetAuditLogs,
  useLoginMutation,
} from "@/hooks/admin";

// Opportunity operations
import {
  useListOpportunities,
  useGetApplications,
  usePublishOpportunity,
} from "@/hooks/opportunity";

// Super admin only (set priority)
import {
  useSetOpportunityPriority,
  PRIORITY_LEVELS,
  type SetOpportunityPriorityInput,
} from "@/hooks/opportunity/superAdmin";
```

---

*Generated from the current admin hub codebase. Update this doc when adding or changing GraphQL operations.*
