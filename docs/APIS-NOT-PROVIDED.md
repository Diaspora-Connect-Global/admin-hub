# APIs not yet provided by the backend

This file lists **only** the operations that the admin hub expects but the backend does **not** yet expose.  
Full tracking (including Provided and Wired status) is in [APIS-NEEDED.md](./APIS-NEEDED.md).

---

## Events

| Operation | Type | Priority | Notes |
|-----------|------|----------|--------|
| `resendEventTicket` | Mutation | Optional | Registrations drawer “Resend ticket”. Variables: `registrationId: ID!`. |

---

## Communities

| Operation | Type | Priority | Notes |
|-----------|------|----------|--------|
| `getCommunityStats` | Query | Optional | Community detail/dashboards stats. Variables: `communityId: ID!`. |
| `updateCommunity` | Mutation | Optional | Edit community. Variables: `id: ID!`, `input: UpdateCommunityInput!`. |
| `deleteCommunity` | Mutation | Optional | Delete community. Variables: `id: ID!`. |
| Suspend / unsuspend community | Mutation | Optional | Community detail “Suspend” button, Suspend modal. e.g. `id`, `reason`, `duration`/`bannedUntil`. |
| Link association to community | Mutation | Optional | “Link Associations” modal. e.g. `communityId`, `associationId` or `associationIds`. |
| `discoverAssociations` | Query | Optional | List associations (e.g. for link-association picker). |
| `requestMembership` | Mutation | Optional | Join community/association (member-facing). |

---

## Opportunities

All listed Opportunity operations are **Provided**. There are no “not provided” APIs in this area.

---

## Summary count

| Area | Not provided |
|------|----------------|
| Events | 2 (optional) |
| Communities | 7 (all optional) |
| Opportunities | 0 |
