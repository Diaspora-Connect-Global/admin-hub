# SYSTEM_ADMIN Frontend Integration Guide

Date: 2026-03-10

This guide documents the frontend contract for `SYSTEM_ADMIN` flows, with special focus on opportunity management and the elevated actions available to Super Admin users.

## Endpoint

- `POST https://api.diaspoplug.net/graphql`
- `Content-Type: application/json`

All authenticated requests must include:

```http
Authorization: Bearer <accessToken>
```

## 1. Authentication

### Login

```graphql
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
```

Variables:

```json
{ "input": { "email": "admin@example.com", "password": "yourpassword" } }
```

### Response fields

| Field | Description |
|------|-------------|
| `accessToken` | JWT. Include in every subsequent request as `Authorization: Bearer <token>` |
| `refreshToken` | Use to obtain a new access token when it expires |
| `admin.role.permissions` | `[*]` for `SYSTEM_ADMIN` (wildcard — all permissions) |
| `admin.scopeType` | `GLOBAL` for `SYSTEM_ADMIN` |

Store securely:

- `accessToken`
- `refreshToken`
- `admin.id`

## 2. Admin Account Management

### Create an admin account

```graphql
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
```

| `adminType` | `scopeType` | `scopeId` required? |
|------------|-------------|---------------------|
| `SUPER` | `GLOBAL` | No |
| `COMMUNITY` | `COMMUNITY` | Yes — community UUID |
| `ASSOCIATION` | `ASSOCIATION` | Yes — association UUID |
| `MODERATOR` | `COMMUNITY` or `ASSOCIATION` | Yes |

Examples:

```json
{ "input": { "email": "ops@example.com", "password": "...", "adminType": "SUPER", "scopeType": "GLOBAL" } }
```

```json
{ "input": { "email": "mod@example.com", "password": "...", "adminType": "COMMUNITY", "scopeType": "COMMUNITY", "scopeId": "<communityId>" } }
```

### Get an admin by ID

```graphql
query GetAdminById($adminId: ID!) {
  getAdminById(adminId: $adminId) {
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
```

### Suspend / Reactivate / Revoke an admin account

```graphql
mutation UpdateAdminStatus($input: UpdateAdminStatusInput!) {
  updateAdminStatus(input: $input) {
    success
    message
  }
}
```

Suspend:

```json
{ "input": { "adminId": "<adminId>", "status": "SUSPENDED", "reason": "Policy violation" } }
```

Reactivate:

```json
{ "input": { "adminId": "<adminId>", "status": "ACTIVE" } }
```

Permanently revoke:

```json
{ "input": { "adminId": "<adminId>", "status": "REVOKED", "reason": "Terminated" } }
```

| Status | Reversible? |
|--------|-------------|
| `ACTIVE` | — |
| `SUSPENDED` | Yes → back to `ACTIVE` |
| `REVOKED` | No — permanent |

## 3. Role Management

### Assign a role to an admin

```graphql
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
```

```json
{ "input": { "adminId": "<adminId>", "roleType": "COMMUNITY_ADMIN", "scopeType": "COMMUNITY", "scopeId": "<communityId>" } }
```

| `roleType` | Valid `scopeType` |
|-----------|-------------------|
| `SYSTEM_ADMIN` | `GLOBAL` |
| `COMMUNITY_ADMIN` | `COMMUNITY` |
| `ASSOCIATION_ADMIN` | `ASSOCIATION` |
| `MODERATOR` | `COMMUNITY` or `ASSOCIATION` |

### Revoke a role

```graphql
mutation RevokeAdminRole($roleAssignmentId: ID!, $reason: String) {
  revokeAdminRole(roleAssignmentId: $roleAssignmentId, reason: $reason) {
    success
    message
  }
}
```

### Create a custom role definition

```graphql
mutation CreateRoleDefinition($input: CreateRoleDefinitionInput!) {
  createRoleDefinition(input: $input) {
    success
    message
  }
}
```

```json
{
  "input": {
    "name": "Content Reviewer",
    "description": "Can review and moderate content",
    "scopeType": "GLOBAL",
    "scopeId": "",
    "permissions": ["reports:read", "reports:resolve", "moderation:delete_post"]
  }
}
```

### Available permission strings

- `*` — `SYSTEM_ADMIN` wildcard
- `community:read`
- `community:write`
- `community:manage_members`
- `community:moderate_content`
- `community:manage_roles`
- `association:read`
- `association:write`
- `association:manage_members`
- `association:moderate_content`
- `association:manage_roles`
- `reports:read`
- `reports:resolve`
- `moderation:ban_user`
- `moderation:delete_post`
- `moderation:delete_comment`
- `moderation:warn_user`

### List role definitions

```graphql
query GetRoleDefinitions($scopeType: String, $scopeId: String) {
  getRoleDefinitions(scopeType: $scopeType, scopeId: $scopeId) {
    success
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
```

Notes:

- Pass no args to get all role definitions.
- Filter by `scopeType: "GLOBAL"` for system-level roles.

## 4. Opportunity Management (`SYSTEM_ADMIN` powers)

### List opportunities — including `DRAFT` / `CLOSED` / `ARCHIVED`

```graphql
query ListOpportunities($input: ListOpportunitiesInput) {
  listOpportunities(input: $input) {
    opportunities {
      id
      title
      status
      priorityLevel
      ownerType
      ownerId
      type
      category
      applicationCount
      createdAt
    }
    total
  }
}
```

Examples:

```json
{ "input": { "status": "DRAFT", "limit": 20, "offset": 0 } }
```

```json
{ "input": { "status": "ARCHIVED" } }
```

Notes:

- Non-admin callers should only receive `PUBLISHED` opportunities.
- This elevated filtering is expected to work only with a `SYSTEM_ADMIN` token.

### Get a deleted opportunity

```graphql
query GetOpportunity($id: ID!) {
  getOpportunity(id: $id) {
    id
    title
    status
    priorityLevel
    createdAt
    closedAt
  }
}
```

Notes:

- `SYSTEM_ADMIN` should receive deleted records.
- Other callers should receive `null` for deleted opportunities.

### Set opportunity priority

```graphql
mutation SetOpportunityPriority($opportunityId: ID!, $priority: String!) {
  setOpportunityPriority(opportunityId: $opportunityId, priority: $priority)
}
```

```json
{ "opportunityId": "<id>", "priority": "HIGH" }
```

Priority values:

- `HIGH`
- `NORMAL`
- `LOW`

Notes:

- Only `SYSTEM_ADMIN` can call this.
- Other roles should receive `403 Forbidden`.

### Publish / Close / Delete any opportunity

```graphql
mutation PublishOpportunity($id: ID!) {
  publishOpportunity(id: $id)
}
```

```graphql
mutation CloseOpportunity($id: ID!, $reason: String) {
  closeOpportunity(id: $id, reason: $reason)
}
```

```graphql
mutation DeleteOpportunity($id: ID!) {
  deleteOpportunity(id: $id)
}
```

Notes:

- `SYSTEM_ADMIN` bypasses ownership.
- These operations must work on any opportunity regardless of owner.

### View all applications for any opportunity

```graphql
query GetApplications($input: GetApplicationsInput!) {
  getApplications(input: $input) {
    applications {
      id
      status
      applicantId
      createdAt
      opportunity {
        id
        title
      }
    }
    total
  }
}
```

Examples:

```json
{ "input": { "opportunityId": "<id>", "limit": 50, "offset": 0 } }
```

```json
{ "input": { "opportunityId": "<id>", "status": "PENDING" } }
```

Application status values:

- `PENDING`
- `REVIEWING`
- `ACCEPTED`
- `REJECTED`
- `WITHDRAWN`

### Accept / Reject any application

```graphql
mutation AcceptApplication($id: ID!, $notes: String) {
  acceptApplication(id: $id, notes: $notes)
}
```

```graphql
mutation RejectApplication($id: ID!, $reason: String) {
  rejectApplication(id: $id, reason: $reason)
}
```

## 5. Error Handling

| HTTP / GraphQL error | Meaning |
|----------------------|---------|
| `errors[].message: "Forbidden"` or `403` | Token is valid but role is insufficient, for example non-admin calling `setOpportunityPriority` |
| `errors[].message` contains `Unauthenticated` | Missing or expired token |
| `success: false` with `message` in response | Logical error such as duplicate email or invalid status transition |
| `REVOKED` status transition | Permanent. UI must not allow transition back to `ACTIVE` |

## 6. Token Lifecycle

```text
adminLogin -> store accessToken + refreshToken
          -> all requests use Authorization: Bearer <accessToken>
          -> on 401 / Unauthenticated:
             - call refreshToken mutation (if available)
             - or redirect to admin login
```

Notes:

- `accessToken` is a short-lived JWT.
- `GqlAuthGuard` validates the token on every request.
- There is no server session for admin tokens; validation is JWT-only.

## 7. Frontend implementation notes

- Treat `SYSTEM_ADMIN` as `GLOBAL` scope.
- Use `admin.role.permissions` and wildcard `*` to gate privileged UI actions.
- For opportunities, expose draft/closed/archived filters only when caller is elevated.
- For deleted opportunities, the admin detail view should handle object presence for `SYSTEM_ADMIN` and `null` for lower scopes.
- Do not allow the UI to reactivate an admin once status becomes `REVOKED`.

## 8. QA checklist

- [ ] Login returns `accessToken`, `refreshToken`, and admin role metadata.
- [ ] `SYSTEM_ADMIN` can list non-public opportunity statuses.
- [ ] `SYSTEM_ADMIN` can set priority using `HIGH | NORMAL | LOW`.
- [ ] `SYSTEM_ADMIN` can publish, close, and delete any opportunity.
- [ ] `SYSTEM_ADMIN` can retrieve applications for any opportunity.
- [ ] Non-authorized users get `Forbidden` on privileged mutations.
- [ ] Expired tokens trigger refresh flow or redirect to login.
