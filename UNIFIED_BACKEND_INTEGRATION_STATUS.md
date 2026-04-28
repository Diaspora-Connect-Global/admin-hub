# Unified Backend Integration Status — All Three Admin Hubs

> Use this document to plan backend additions. Each section documents what needs to be added to the backend before the frontend can be fully wired up.

**Projects covered:**
- `admin-hub` — `/Users/natty/diaspoplug_sadmin/admin-hub` — Super-admin portal
- `community-hub-admin` — `/Users/natty/diaspoplug_community/community-hub-admin` — Community admin portal
- `association-hub` — `/Users/natty/diaspoplug_assoc/association-hub` — Association admin portal

---

## 🟢 Summary: What's Already Working

| Project | Pages Integrated | Pages Partial | Pages TODO |
|---------|-----------------|---------------|------------|
| admin-hub | 20 | 5 | Reports page (full analytics) |
| community-hub-admin | 12 | 1 | Reports, Registry/KYC, Admin Profile |
| association-hub | 11 | 5 | Events, Posts, Vendor Escrow Settings, Admin Profile, full Analytics |

---

## ❌ Backend APIs Needed — Grouped by Service

### post-feed-service (port 3008)

**Needed by:**
- `association-hub` → Posts page (`/posts`)
- `admin-hub` → Reports page (post stats)

**Queries to add:**
```graphql
# List posts scoped to an entity (association, community)
query GetEntityPosts($ownerType: String!, $ownerId: ID!, $status: String, $limit: Int, $offset: Int) {
  getEntityPosts(ownerType: $ownerType, ownerId: $ownerId, status: $status, limit: $limit, offset: $offset) {
    items {
      id
      title
      excerpt
      body
      authorId
      media           # image | video | none
      comments
      reactions
      saves
      impressions
      status          # published | draft | unpublished
      visibility      # members | public
      pinned
      allowComments
      allowReactions
      publishedAt
      createdAt
      updatedAt
      tags
    }
    total
  }
}
```

**Mutations to add:**
```graphql
mutation CreatePost($input: CreatePostInput!) { createPost(input: $input) { id } }
mutation UpdatePost($input: UpdatePostInput!) { updatePost(input: $input) { id } }
mutation PublishPost($postId: ID!) { publishPost(postId: $postId) }
mutation UnpublishPost($postId: ID!) { unpublishPost(postId: $postId) }
mutation DeletePost($postId: ID!) { deletePost(postId: $postId) }
mutation PinPost($postId: ID!) { pinPost(postId: $postId) }
mutation UnpinPost($postId: ID!) { unpinPost(postId: $postId) }
```

---

### event-service (port 3009)

**Needed by:**
- `association-hub` → Events page (`/events`)

**Queries to add:**
```graphql
query EventsByOwner($ownerType: String!, $ownerId: ID!, $status: String, $page: Int, $limit: Int) {
  eventsByOwner(ownerType: $ownerType, ownerId: $ownerId, status: $status, page: $page, limit: $limit) {
    events {
      id
      title
      description
      date
      startTime
      endTime
      eventType         # in-person | virtual
      virtualLink
      location
      isPaid
      ticketPrice
      currency
      hasParticipantLimit
      maxParticipants
      registeredCount
      status            # published | unpublished | draft | ongoing | completed | cancelled
      views
      ticketsSold
      revenue
      createdAt
      updatedAt
    }
    total
  }
}

query GetEventRegistrations($eventId: ID!, $page: Int, $limit: Int) {
  getEventRegistrations(eventId: $eventId, page: $page, limit: $limit) {
    registrations {
      id
      userId
      userName
      userEmail
      registeredAt
      ticketType
      checkInStatus   # checked-in | not-checked-in
      paymentStatus   # paid | pending | refunded
    }
    total
  }
}

query GetEventStats($eventId: ID!) {
  getEventStats(eventId: $eventId) {
    totalRegistrations
    checkedIn
    ticketsSold
    revenue
    views
  }
}
```

**Mutations to add:**
```graphql
mutation CreateEvent($input: CreateEventInput!) { createEvent(input: $input) { id } }
mutation UpdateEvent($input: UpdateEventInput!) { updateEvent(input: $input) { id } }
mutation PublishEvent($eventId: ID!) { publishEvent(eventId: $eventId) }
mutation CancelEvent($eventId: ID!, $reason: String) { cancelEvent(eventId: $eventId, reason: $reason) }
mutation DeleteEvent($eventId: ID!) { deleteEvent(eventId: $eventId) }
mutation MarkRegistrationCheckedIn($registrationId: ID!) { markRegistrationCheckedIn(registrationId: $registrationId) }
```

---

### admin-service (port 3006)

**Needed by:**
- `admin-hub` → System Health (`/health`) — alerts + metrics history
- `admin-hub` → Reports page (`/reports`) — all analytics
- `admin-hub` → Roles & Permissions (`/roles`) — nested permission matrix
- `admin-hub` → Notifications (`/notifications`) — stats
- `association-hub` → Analytics page — full dashboard
- `community-hub-admin` → (partial) — community analytics
- All three hubs → Audit Logs — richer metadata

#### System Health Alerts & Metrics
```graphql
query GetSystemAlerts {
  getSystemAlerts {
    id
    type          # CPU | MEMORY | DISK | ERROR_RATE | LATENCY
    component     # service name
    severity      # critical | warning | info
    message
    timestamp
    status        # active | acknowledged
  }
}

mutation AcknowledgeAlert($alertId: ID!, $note: String) {
  acknowledgeAlert(alertId: $alertId, note: $note) { success }
}

query GetPerformanceMetrics($period: String) {
  getPerformanceMetrics(period: $period) {
    timestamp
    cpuUsage
    memoryUsage
    requestRate
    errorRate
    p95Latency
  }
}
```

#### Platform / Association / Community Analytics
```graphql
query GetPlatformReports($period: String) {
  getPlatformReports(period: $period) {
    userGrowth        { date count }
    registrationsByDay { date count }
    activeUsersByDay  { date count }
    contentRemovedCount
    usersBanned
  }
}

query GetAssociationAnalytics($associationId: ID!, $period: String) {
  getAssociationAnalytics(associationId: $associationId, period: $period) {
    totalMembers
    activeMembers
    totalPosts
    totalEvents
    totalOrders
    totalGroups
    openTickets
    memberGrowth        { date count }
    postsByCategory     { category count }
    eventsParticipation { month participants }
    ordersByStatus      { status count }
    revenue             { month amount }
  }
}
```

#### Roles — Nested Permission Matrix
```graphql
query GetPermissionMatrix($roleId: ID!) {
  getPermissionMatrix(roleId: $roleId) {
    resource
    actions {
      name
      allowed
    }
  }
}
# Currently getRoleDefinitions returns permissions: String[] (flat)
# Need either this new query OR change the existing return type to nested
```

#### Notification Analytics
```graphql
query GetNotificationStats {
  getNotificationStats {
    totalSent
    deliveryRate
    openRate
    clickRate
  }
}
query GetNotificationVolume($period: String) {
  getNotificationVolume(period: $period) { date push inApp email }
}
query ListPushNotifications($limit: Int, $offset: Int) {
  listPushNotifications(limit: $limit, offset: $offset) {
    items { id title body status sentAt deliveredAt }
    total
  }
}
```

#### Audit Logs — Rich Metadata (all hubs)
**Current `getAuditLogs` returns:** `id, actorId, action, resourceType, resourceId, createdAt, ipAddress`
**Add these fields:**
```graphql
# Extend the existing AuditLogItem type:
actorEmail: String       # human-readable actor identity
actorName: String        # display name
actorRole: String        # role at time of action
description: String      # human-readable summary e.g. "Banned user john@example.com"
previousValue: String    # before-state for setting changes
newValue: String         # after-state for setting changes
device: String           # e.g. "MacBook Pro"
browser: String          # e.g. "Chrome 120.0"
location: String         # e.g. "Accra, GH"
```

---

### community-service (port 3003)

**Needed by:**
- `community-hub-admin` → Reports page (`/reports`) — content reports for community
- `community-hub-admin` → Registry/KYC page (`/registry`) — identity verification

#### Community Content Reports
```graphql
query GetCommunityReports($communityId: ID!, $status: String, $type: String, $limit: Int, $offset: Int) {
  getCommunityReports(communityId: $communityId, status: $status, type: $type, limit: $limit, offset: $offset) {
    items {
      id
      item              # reported content title/summary
      description
      type              # POST | LISTING | OPPORTUNITY | GROUP | EVENT
      reportedBy        # userId
      status            # OPEN | INVESTIGATING | RESOLVED | ESCALATED
      createdAt
    }
    total
  }
}

mutation UpdateCommunityReport($reportId: ID!, $status: String!, $resolutionNotes: String) {
  updateCommunityReport(reportId: $reportId, status: $status, resolutionNotes: $resolutionNotes) { success }
}
```

---

### kyc-service (port 3014)

**Needed by:**
- `community-hub-admin` → Registry/KYC page (`/registry`) — member identity verification

```graphql
query GetCommunityVerifications($communityId: ID!, $status: String, $limit: Int, $offset: Int) {
  getCommunityVerifications(communityId: $communityId, status: $status, limit: $limit, offset: $offset) {
    items {
      id
      userId
      userName
      docType           # ID_DOCUMENT | PROOF_OF_ADDRESS | BUSINESS_REGISTRATION
      documentDetails
      submittedAt
      status            # PENDING | APPROVED | REJECTED
    }
    total
  }
}

mutation ApproveVerification($verificationId: ID!, $notes: String) {
  approveVerification(verificationId: $verificationId, notes: $notes) { success }
}

mutation RejectVerification($verificationId: ID!, $reason: String!) {
  rejectVerification(verificationId: $verificationId, reason: $reason) { success }
}
```

---

### vendor-service / marketplace-service

**Needed by:**
- `association-hub` → Vendor Escrow Settings (`/vendor-escrow-settings`)

```graphql
query GetVendorEscrowSettings($vendorId: ID!) {
  getVendorEscrowSettings(vendorId: $vendorId) {
    vendorId
    escrowEnabled
    autoReleaseAfterDays
    requireBuyerConfirmation
    currency
    milestoneTemplates {
      id
      name
      milestones { title percentageOfTotal estimatedDays description }
    }
  }
}

mutation UpdateVendorEscrowSettings($vendorId: ID!, $input: UpdateVendorEscrowSettingsInput!) {
  updateVendorEscrowSettings(vendorId: $vendorId, input: $input) { success }
}
```

---

### user-service / auth-service (port 3002 / 3001)

**Needed by:**
- `community-hub-admin` → Admin Profile (`/profile`) — load + save admin account
- `association-hub` → Admin Profile (`/admin-profile`) — load + save admin account

```graphql
query GetAdminProfile {
  getAdminProfile {
    id
    firstName
    lastName
    email
    phone
    avatarUrl
    twoFactorEnabled
    notificationPreferences {
      emailEnabled
      pushEnabled
      inAppEnabled
    }
  }
}

mutation UpdateAdminProfile($input: UpdateAdminProfileInput!) {
  updateAdminProfile(input: $input) { success }
}

mutation UpdateAdminPassword($currentPassword: String!, $newPassword: String!) {
  updateAdminPassword(currentPassword: $currentPassword, newPassword: $newPassword) { success }
}
```

---

### association-service (port 3003)

**Needed by:**
- `association-hub` → Association Profile (`/profile`) — Contact/Communities/Admins tabs
- `admin-hub` → Audit Logs — content author details

```graphql
# Extend UpdateAssociationInput and AssociationType with:
contactEmail: String
contactPhone: String
website: String
address: String
countriesServed: [String!]

# New queries:
query ListLinkedCommunities($associationId: ID!, $limit: Int, $offset: Int) {
  listLinkedCommunities(associationId: $associationId, limit: $limit, offset: $offset) {
    items { id name type countriesServed status }
    total
  }
}

query ListAssociationAdmins($associationId: ID!) {
  listAssociationAdmins(associationId: $associationId) {
    id
    name
    email
    role          # PRIMARY_ADMIN | ADMIN
    status        # ACTIVE | INACTIVE
  }
}

mutation AssignAssociationAdmin($associationId: ID!, $userId: ID!, $role: String!) {
  assignAssociationAdmin(associationId: $associationId, userId: $userId, role: $role) { success }
}

mutation RemoveAssociationAdmin($associationId: ID!, $adminId: ID!) {
  removeAssociationAdmin(associationId: $associationId, adminId: $adminId) { success }
}
```

---

## Quick Reference — Which Pages Are Affected

| Missing API | admin-hub page | community-hub page | association-hub page |
|-------------|---------------|--------------------|---------------------|
| `getEntityPosts` | — | Posts (partial data) | `/posts` (full page) |
| `eventsByOwner` | — | — | `/events` (full page) |
| `getSystemAlerts` + `getPerformanceMetrics` | `/health` | — | — |
| `getAssociationAnalytics` | — | — | `/analytics` |
| `getPlatformReports` + analytics | `/reports` | — | — |
| `getNotificationStats` + volume | `/notifications` | — | — |
| `getPermissionMatrix` | `/roles` | — | — |
| Audit log rich fields | `/audit` | `/audit` | `/audit-logs` |
| `getCommunityReports` | — | `/reports` | — |
| `getCommunityVerifications` | — | `/registry` | — |
| `getVendorEscrowSettings` + mutation | — | — | `/vendor-escrow-settings` |
| `getAdminProfile` + mutations | — | `/profile` | `/admin-profile` |
| Association extended fields | — | — | `/profile` (tabs) |
| Dispute conversation history | `/disputes` | — | — |
| Escrow transaction history | `/escrow` | — | — |
