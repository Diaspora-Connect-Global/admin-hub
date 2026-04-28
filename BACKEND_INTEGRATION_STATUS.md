# Admin Hub — Backend Integration Status

GraphQL endpoint: `VITE_ADMIN_GRAPHQL_URL` (default: `https://api.diaspoplug.net/graphql`)

---

## ✅ INTEGRATED — Real backend data

| Page | Route | Hooks Used |
|------|-------|------------|
| Dashboard | `/` | `useGetDashboardStats`, `useGetSystemHealth`, `useGetPlatformAnalytics`, `useAdminListDisputes`, `useAdminListEscrows` |
| Login | `/login` | `useLoginMutation` (ADMIN_LOGIN) |
| User Management | `/users` | `useGetUsers`, `useDiscoverAssociations`, `useListCommunities` |
| Communities | `/communities` | `useListCommunities`, `useListCommunityTypes`, `useCreateCommunity`, `useUpdateCommunity`, `useUpdateCommunityVisibility`, `useUpdateCommunityJoinPolicy`, `useSoftDeleteCommunity`, `useRestoreCommunity` |
| Community Detail | `/communities/:id` | `useGetCommunity`, `useGetCommunityStats`, `useListCommunityMembers`, `useListCommunityAdmins`, `useAssignCommunityAdmin`, `useCommunityBanUser`, `useCommunityUnbanUser`, `useSuspendMember`, `useUnsuspendMember`, `useTransferOwnership`, `useGetCommunityAvatarUploadUrl`, `useGetCommunityCoverUploadUrl` |
| Events | `/events` | `useSearchEvents` (events service), `useGetEvent`, `useGetEventRegistrations`, `usePublishEventAdmin`, `useUnpublishEventAdmin`, `useDeleteEventAdmin`, `useCancelEvent`, `useCompleteEvent` |
| Opportunities | `/opportunities` | `useListOpportunities`, `useGetApplications`, `useCreateOpportunity`, `useUpdateOpportunity`, `usePublishOpportunity`, `useCloseOpportunity`, `useDeleteOpportunity`, `useAcceptApplication`, `useRejectApplication` |
| Associations | `/associations` | `useSearchAssociations`, `useCreateAssociation`, `useUpdateAssociation`, `useListAssociationTypes`, `useCreateAssociationType`, `useDeleteAssociationType` |
| Association Detail | `/associations/:id` | `useGetAssociation`, `useListAssociationMembers`, `useApproveMembership`, `useRejectMembership`, `useRemoveMember`, `useInviteMember`, `useGetAssociationAvatarUploadUrl`, `useGetAssociationCoverUploadUrl`, `useLinkAssociation`, `useUnlinkAssociation` |
| Disputes | `/disputes` | `useAdminListDisputes`, `useAdminResolveDispute` |
| Escrow Management | `/escrow` | `useAdminListEscrows`, `useAdminFreezeEscrow`, `useAdminUnfreezeEscrow`, `useAdminForceReleaseEscrow` |
| Chat Management | `/chats` | `useGetFlaggedConversations`, `useGetChatSettings`, `useReviewConversation`, `useUpdateChatSetting` |
| Notifications/Broadcasts | `/notifications` | `useGetBroadcastCampaigns`, `useSendBroadcast` |
| Support Ticketing | `/support` | `useGetSupportTickets`, `useGetSupportTicket`, `useUpdateSupportTicket`, `useReplyToSupportTicket` |
| System Settings | `/settings` | `useGetPlatformSettings`, `useSetPlatformSetting`, `useListCommunityTypes`, `useDeleteCommunityType`, `useListAssociationTypes`, `useDeleteAssociationType` |
| Vendor Management | `/vendors` | `useListVendors`, `useGetVendorDashboard`, `useListVendorProducts`, `useListVendorOrders`, `useSuspendVendor`, `useReinstateVendor` |
| Roles & Permissions | `/roles` | `useListAdmins`, `useRevokeAdminRole`, `useUpdateAdminStatus`, **`useGetRoleDefinitions`** (now wired — was hardcoded) |
| Audit Logs | `/audit` | **`useGetAuditLogs`** (now wired — was hardcoded) |
| Content Moderation | `/moderation` | **`useGetReports`, `useUpdateReportStatus`, `useAdminRemoveContent`** (now wired — was mockContent) |
| System Health | `/health` | **`useGetSystemHealth`** (now wired — was mock serviceStatuses) |

---

## ⚠️ PARTIAL — Real data + some mock/static UI

| Page | Real Data | Mock/Static Remaining | Why Still Mock |
|------|-----------|----------------------|----------------|
| Disputes | Dispute list/actions real | `mockConversation`, `mockHistory` (detail panel timeline) | No dispute conversation history API |
| Escrow Management | Escrow list/actions real | `mockHistory`, `mockAttachments` (detail drawer) | No escrow timeline/attachment API |
| Notifications/Broadcasts | Broadcasts list/send real | `dashboardStats` (totalSent, deliveryRate, openRate), `notificationVolumeData`, `deliveryTrendData`, `pushNotifications`, `inAppNotifications`, `templates` | No notification analytics API |
| System Health | Live `services[]` from backend | `criticalAlerts`, `recentEvents`, `performanceData` (CPU/memory charts) | Backend `GET_SYSTEM_HEALTH` doesn't return alerts or metrics history |
| Roles & Permissions | Admin list + role definitions real | `systemAdminPermissions`, `communityAdminPermissions` (permissions matrix) | `GET_ROLE_DEFINITIONS` returns `permissions: string[]` — not the nested resource+action map the UI matrix uses |

---

## ❌ TODO — Backend APIs needed

### 1. Reports Page (`/reports`) — Full Analytics Dashboard
**Current state**: Entire page uses static mock data.
**Needs**:
- `getPlatformReports(period)` — user growth, registrations, active users timeseries
- `getCommunityEngagementStats()` — posts, reactions per community
- `getVendorSalesAnalytics(period)` — sales revenue timeseries
- `getEscrowStatusBreakdown()` — count by status (funded/released/pending/disputed)
- `getDisputeTypeBreakdown()` — count by dispute type
- `getChatAnalytics(period)` — DM vs group message volume timeseries
- `getTopActiveUsers()` — user activity leaderboard
- `getTopAssociations()` — association engagement stats
- `getTopVendors()` — vendor revenue rankings
- `getRecentEscrowTransactions()` — latest escrow entries
- **Partial**: `getPlatformAnalytics(period)` already exists and returns `registrationsByDay`, `ordersByDay`, `contentRemovedCount`, `usersBanned` — wire these in

### 2. Notification Analytics (part of `/notifications`)
**Needs**:
- `getNotificationStats()` — totalSent, deliveryRate, openRate, clickRate
- `getNotificationVolume(period)` — push/in-app/email by day
- `getDeliveryTrend()` — delivered vs failed by hour
- `listPushNotifications()` — recent individual push notifications with status
- `listInAppNotifications()` — active in-app notification rules
- `listNotificationTemplates()` — saved templates

### 3. System Health Alerts & Metrics (`/health`)
**Needs**:
- `getSystemAlerts()` — active/acknowledged alerts with id, type, component, severity, timestamp, status
- `acknowledgeAlert(alertId, note)` — mutation to acknowledge an alert
- `getPerformanceMetrics(period)` — CPU, memory, request rate timeseries

### 4. Dispute Conversation History (`/disputes`)
**Needs**:
- `getDisputeMessages(disputeId)` — conversation thread on a dispute
- `getDisputeHistory(disputeId)` — status change timeline

### 5. Escrow Transaction History (`/escrow`)
**Needs**:
- `getEscrowHistory(escrowId)` — freeze/unfreeze/release timeline events
- `getEscrowAttachments(escrowId)` — evidence files attached to escrow

### 6. Roles Permissions Matrix (`/roles`)
**Needs**:
- The backend `permissions` field on `RoleDefinition` is `string[]` but the UI expects a nested `{ resource: { action: boolean } }` map
- Either: change the UI to display the flat permissions array, OR
- Add `getPermissionMatrix(roleId)` that returns the nested structure
- Also needs: `getAssignedUsersCount(roleId)` to show how many admins have each role

### 7. Content Moderation — Content Author Details
**Current**: ContentModeration shows `reporterId` (who filed the report) not the content author
**Needs**:
- `getContentAuthor(targetType, targetId)` — lookup content creator by type+id, or include author info in the Report response

### 8. Audit Logs — Rich Metadata
**Current**: `GET_AUDIT_LOGS` returns `{ id, actorId, action, resourceType, resourceId, createdAt, ipAddress }`
**Needs**: Additional fields to restore full audit log richness:
- `actorEmail` or `actorName` — human-readable actor identity
- `actorRole` — role at time of action
- `description` — human-readable summary of what happened
- `oldValue` / `newValue` — before/after for setting changes
- `device` / `browser` / `location` — request metadata
- `serverNotes` — system-generated context

---

## Backend Service Map

| Service | GraphQL Port | gRPC Port | Status |
|---------|-------------|-----------|--------|
| API Gateway | 3000 | — | Routes all GraphQL |
| admin-service | 3006 | 50061 | Active |
| auth-service | 3001 | 50051 | Active |
| user-service | 3002 | 50052 | Active |
| community-service | 3003 | 50053 | Active |
| event-service | 3009 | 50059 | Active |
| opportunity-service | 3010 | 50060 | Active |
| vendor-service | 3007 | 50057 | Active |
| marketplace-service | 3011 | 50062 | Active |
| payment-service | 3004 | 50054 | Active |
| post-feed-service | 3008 | 50058 | Active |
| message-service | 3005 | 50055 | Active |
| notification-service | 3012 | 50063 | Active |
| group-service | 3013 | 50064 | Active |
| kyc-service | 3014 | 50065 | Active |
