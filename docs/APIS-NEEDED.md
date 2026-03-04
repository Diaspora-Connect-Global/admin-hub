# APIs needed in the app (not yet provided)

This document tracks **GraphQL (or REST) APIs that the admin hub UI is built to use but that are not yet implemented or exposed by the backend**. When an API is provided, update its status to **Provided** and add implementation details so the frontend can be wired to it.

---

## Legend

| Status | Meaning |
|--------|--------|
| **Not provided** | Backend does not expose this operation yet. UI uses mock data or is stubbed. |
| **Provided** | API is available. Add endpoint/schema reference and, when done, note when the admin hub was wired. |

**Priority:**

- **Required** — Needed for the feature to work end-to-end (list, create, get, update/delete).
- **Optional** — Improves UX (e.g. publish/unpublish, registration actions) but the page can function with mocks or without it initially.

---

## Events

**Full spec (types, query/mutation signatures, examples):** [EVENTS-GRAPHQL-API.md](./EVENTS-GRAPHQL-API.md)

**Where in the app:** `/events` page (`src/pages/Events.tsx`), event cards, Create/Edit event modal, Delete event modal, Event details modal, Registrations drawer.

**Current UI behaviour:** All data is mock. No GraphQL operations or hooks exist for events. Once APIs are provided, the next step is to add operations in `src/services/networks/graphql/`, hooks in `src/hooks/`, and replace mock data in the Events page and event components.

---

### Queries

#### 1. `listEvents`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Events page main list (grid of event cards), stats (upcoming count, total registrations, revenue, avg attendance). |
| **Variables** | `limit: Int`, `offset: Int`, `searchTerm: String`, `status: String` (e.g. `"published"`, `"draft"`, `"completed"`), optional `communityId: ID`. |
| **Returns** | `{ listEvents: { events: [Event!]!, total: Int! } }` (or equivalent; see [EVENTS-GRAPHQL-API.md](./EVENTS-GRAPHQL-API.md)). |
| **Notes** | UI filters by status and type (free/paid) and sorts (newest, oldest, date soonest/latest). Backend can support `status` and `searchTerm`; client can do extra filter/sort if needed. |

---

#### 2. `getEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Event details modal (view), Create/Edit event modal (prefill when editing). |
| **Variables** | `id: ID!`. |
| **Returns** | `{ getEvent: Event }` (single event; see Event type in spec). |
| **Notes** | Called when user opens “View details” or “Edit” on an event. |

---

#### 3. `getEventRegistrations`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required for “Manage registrations” to be real. |
| **Used in** | Registrations drawer (`RegistrationsDrawer.tsx`) when user clicks “Manage registrations” on an event. |
| **Variables** | `eventId: ID!`, `limit: Int`, `offset: Int`, optional `searchTerm: String`, `paymentStatus: String`, `checkInStatus: String`. |
| **Returns** | `{ getEventRegistrations: { registrations: [EventRegistration!]!, total: Int! } }` (or nested under `getEvent.registrations`; see spec). |
| **Notes** | UI shows table of attendees with payment status, check-in status, and actions (check-in, resend ticket, remove). |

---

### Mutations

#### 4. `createEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Create event modal (multi-step form: basic info, schedule/location, ticketing/capacity, visibility). |
| **Variables** | `input: CreateEventInput!` (title, description, date, startTime, endTime, eventType, location/virtualLink, isPaid, ticketPrice, currency, hasParticipantLimit, maxParticipants, publishNow, notifyMembers, allowComments, optional communityId). |
| **Returns** | `{ createEvent: { id, title, status, createdAt } }` or full `Event`. |
| **Notes** | See [EVENTS-GRAPHQL-API.md](./EVENTS-GRAPHQL-API.md) for full `CreateEventInput` shape. |

---

#### 5. `updateEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Edit event modal (same form as create, pre-filled from `getEvent`). |
| **Variables** | `input: UpdateEventInput!` (id required; all other fields optional). |
| **Returns** | `{ updateEvent: { id, title, status, updatedAt } }` or full `Event`. |
| **Notes** | Same field set as create; partial updates should be supported. |

---

#### 6. `deleteEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Delete event modal (confirmation after “Delete” from card menu). |
| **Variables** | `id: ID!`. |
| **Returns** | `{ deleteEvent: { success: Boolean!, message: String } }` or similar. |
| **Notes** | UI shows confirmation; on success closes modal and refreshes list. |

---

#### 7. `publishEvent` / `unpublishEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Event card dropdown (“Publish” / “Unpublish”). |
| **Variables** | `id: ID!`. |
| **Returns** | `{ publishEvent: { id, status } }` and same for `unpublishEvent`. |
| **Notes** | Can be replaced by a single mutation, e.g. `setEventStatus(id: ID!, status: String!)`, if preferred. |

---

#### 8. `markRegistrationCheckedIn`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Registrations drawer — “Mark as checked in” on a row. |
| **Variables** | `registrationId: ID!`. |
| **Returns** | `{ markRegistrationCheckedIn: { id, checkInStatus } }` or similar. |
| **Notes** | Updates check-in status for one registration. |

---

#### 9. `resendEventTicket`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Registrations drawer — “Resend ticket” on a row. |
| **Variables** | `registrationId: ID!`. |
| **Returns** | `{ resendEventTicket: { success, message } }` or similar. |
| **Notes** | Sends ticket/confirmation email again to the attendee. |

---

#### 10. `removeEventRegistration`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Registrations drawer — “Remove attendee” on a row. |
| **Variables** | `registrationId: ID!`. |
| **Returns** | `{ removeEventRegistration: { success, message } }` or similar. |
| **Notes** | Removes the registration; UI will refresh the list. |

---

### Events – summary table

| Operation | Type | Priority | Status |
|-----------|------|----------|--------|
| `listEvents` | Query | Required | **Not provided** |
| `getEvent` | Query | Required | **Not provided** |
| `getEventRegistrations` | Query | Required | **Not provided** |
| `createEvent` | Mutation | Required | **Not provided** |
| `updateEvent` | Mutation | Required | **Not provided** |
| `deleteEvent` | Mutation | Required | **Not provided** |
| `publishEvent` | Mutation | Optional | **Not provided** |
| `unpublishEvent` | Mutation | Optional | **Not provided** |
| `markRegistrationCheckedIn` | Mutation | Optional | **Not provided** |
| `resendEventTicket` | Mutation | Optional | **Not provided** |
| `removeEventRegistration` | Mutation | Optional | **Not provided** |

---

## Opportunities

**Spec reference:** [GRAPHQL-API.md](./GRAPHQL-API.md) § Opportunity Service

**Where in the app:** `/opportunities` page (`src/pages/Opportunities.tsx`), opportunity table/card view, Create/Edit opportunity modal, opportunity detail drawer, Applicants drawer, application modals (view, message, reject, etc.).

**Current UI behaviour:** All data is mock (`mockOpportunities`, mock applicants). **GraphQL operations and hooks already exist** in `src/services/networks/graphql/opportunity/` and `src/hooks/opportunity/`. When the backend provides the API, wire the page by replacing mock data with `useListOpportunities`, `useGetOpportunity`, etc.

---

### Queries

#### 1. `listOpportunities` (ListOpportunities)

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Opportunities page list/table and card view, stats (total, open, applicants, shortlisted). |
| **Variables** | `input: ListOpportunitiesInput` — `limit`, `offset`, `searchTerm`, `type`, `category`, `subCategory`, `workMode`, `engagementType`, `location`, `ownerType`, `ownerId`, `status`, `sortBy`, `sortOrder`. |
| **Returns** | List of opportunities (see OpportunityType in spec) and total count. |
| **Notes** | Hooks: `useListOpportunities(input)`. UI filters by status, type, visibility; backend can support these via input. |

---

#### 2. `getOpportunity` (GetOpportunity)

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Opportunity detail drawer/modal, Edit opportunity form (prefill). |
| **Variables** | `id: String!` (or `ID!`). |
| **Returns** | Single opportunity (full fields). |
| **Notes** | Hooks: `useGetOpportunity(id)`. |

---

#### 3. `getApplications` (GetApplications)

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Applicants drawer when user clicks “View applicants” on an opportunity. |
| **Variables** | `input: GetApplicationsInput!` — `opportunityId!`, `limit`, `offset`, `status`. |
| **Returns** | List of applications (applicant id, status, resume ref, etc.) and total. |
| **Notes** | Hooks: `useGetApplications(input)`. System admin / opportunity owner only. |

---

#### 4. `getApplication` (GetApplication)

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Single application view/modal (view details, message, reject, mark hired). |
| **Variables** | `id: String!`. |
| **Returns** | Single application with full fields. |
| **Notes** | Hooks: `useGetApplication(id)`. |

---

### Mutations

#### 5. `createOpportunity`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Create opportunity modal (multi-step form). |
| **Variables** | `input: CreateOpportunityInput!` (see opportunity schema). |
| **Returns** | Created opportunity (e.g. id, title, status). Creates as DRAFT. |
| **Notes** | Hooks: `useCreateOpportunity()`. |

---

#### 6. `updateOpportunity`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Edit opportunity modal. |
| **Variables** | `id: String!`, `input: UpdateOpportunityInput!`. |
| **Returns** | Updated opportunity. |
| **Notes** | Hooks: `useUpdateOpportunity()`. |

---

#### 7. `publishOpportunity` / `closeOpportunity` / `deleteOpportunity`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required (publish, close); Required (delete). |
| **Used in** | Card/table actions: Publish, Close applications, Delete. |
| **Variables** | `id: String!`; Close can have `reason`. |
| **Returns** | Updated opportunity or success/message. |
| **Notes** | Hooks: `usePublishOpportunity()`, `useCloseOpportunity()`, `useDeleteOpportunity()`. |

---

#### 8. `acceptApplication` / `rejectApplication` / `reviewApplication`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Required |
| **Used in** | Applicants drawer / application modal: Accept, Reject, Mark under review. |
| **Variables** | Accept/Reject: `id: String!`; Reject: `reason`; Review: `input: ReviewApplicationInput!` (applicationId, reviewNotes, status). |
| **Returns** | Updated application or success. |
| **Notes** | Hooks: `useAcceptApplication()`, `useRejectApplication()`, `useReviewApplication()`. |

---

#### 9. `setOpportunityPriority` (Super Admin only)

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Super-admin-only UI: set featuring priority (HIGH / NORMAL / LOW). |
| **Variables** | `input: SetOpportunityPriorityInput!` — `opportunityId!`, `priority`. |
| **Returns** | Updated opportunity or success. |
| **Notes** | Hooks: `useSetOpportunityPriority()` in `@/hooks/opportunity/superAdmin`. Backend should return 403 for non–super-admins. |

---

### Opportunities – summary table

| Operation | Type | Priority | Status |
|-----------|------|----------|--------|
| `listOpportunities` | Query | Required | **Not provided** |
| `getOpportunity` | Query | Required | **Not provided** |
| `getApplications` | Query | Required | **Not provided** |
| `getApplication` | Query | Optional | **Not provided** |
| `createOpportunity` | Mutation | Required | **Not provided** |
| `updateOpportunity` | Mutation | Required | **Not provided** |
| `publishOpportunity` | Mutation | Required | **Not provided** |
| `closeOpportunity` | Mutation | Required | **Not provided** |
| `deleteOpportunity` | Mutation | Required | **Not provided** |
| `acceptApplication` | Mutation | Required | **Not provided** |
| `rejectApplication` | Mutation | Required | **Not provided** |
| `reviewApplication` | Mutation | Required | **Not provided** |
| `setOpportunityPriority` | Mutation | Optional | **Not provided** |

---

## Communities

**Spec reference:** [GRAPHQL-API.md](./GRAPHQL-API.md) § Admin Service (Community operations)

**Where in the app:** `/communities` page (`src/pages/Communities.tsx`), community detail `/communities/:id` (`CommunityDetail.tsx`), Create Community modal, Link Association / Suspend modals.

**Current UI behaviour:** List and detail use real API (`listCommunities`, `getCommunity`). Create community uses `createCommunity` mutation. Link Association and Suspend modals are UI-only (no API wired). Some operations are defined but may not be implemented by the backend yet.

---

### Queries

#### 1. `listCommunities`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Communities page table (list with search, visibility filter, pagination). |
| **Variables** | `limit`, `offset`, `searchTerm`, `visibility`. |
| **Returns** | `{ listCommunities: { communities: [Community!]!, total: Float! } }`. |
| **Notes** | Wired: `useListCommunities()` in admin hub. Community Service. |

---

#### 2. `getCommunity`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Community detail page (header, overview tab basic info). |
| **Variables** | `id: ID!`. |
| **Returns** | `{ getCommunity: Community }` (full Community type). |
| **Notes** | Wired: `useGetCommunity(id)` in admin hub. Community Service. |

---

#### 3. `getCommunityStats`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Community detail or dashboards (stats card). Hook exists; not used on CommunityDetail yet. |
| **Variables** | `communityId: ID!`. |
| **Returns** | Stats object (e.g. memberCount, postCount, etc. per backend schema). |
| **Notes** | Hook: `useGetCommunityStats(communityId)`. Define as Provided when backend exposes it. |

---

### Mutations

#### 4. `createCommunity`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Create Community modal (name, description, visibility, join policy, payment type, community type, price). |
| **Variables** | `input: CreateCommunityInput!` — name, description, visibility, joinPolicy, paymentType, communityTypeId; optional priceAmount, priceCurrency. |
| **Returns** | `{ createCommunity: { id, name, createdAt } }`. |
| **Notes** | Wired: `useCreateCommunity()` in admin hub. Community Service. |

---

#### 5. `updateCommunity` / `deleteCommunity`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional (update); Optional (delete). |
| **Used in** | Edit community (no edit form wired yet), Delete community (menu item exists, no API). |
| **Variables** | Update: `id: ID!`, `input: UpdateCommunityInput!`; Delete: `id: ID!`. |
| **Returns** | Updated community or success/message. |
| **Notes** | No hooks or operations in admin hub yet. Add when backend provides. |

---

#### 6. Suspend / unsuspend community

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Community detail header “Suspend” button, Suspend modal (reason, duration). |
| **Variables** | e.g. `id: ID!`, `reason: String`, `duration` or `bannedUntil`. |
| **Returns** | Success/message or updated community status. |
| **Notes** | UI exists; no GraphQL operation or hook yet. |

---

#### 7. Link association to community

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Community detail “Link Associations” modal; Communities table row action. |
| **Variables** | e.g. `communityId: ID!`, `associationId: ID!` or `associationIds: [ID!]!`. |
| **Returns** | Success or updated community/associations. |
| **Notes** | UI exists; no GraphQL operation or hook yet. `discoverAssociations` query exists for listing candidates. |

---

### Other Community-related operations (defined, status TBD)

| Operation | Type | Status | Notes |
|-----------|------|--------|--------|
| `discoverAssociations` | Query | **Not provided** | List associations (e.g. for link-association picker). Hook: `useDiscoverAssociations()`. Mark Provided when backend supports it. |
| `requestMembership` | Mutation | **Not provided** | Join community/association (member-facing). Hook: `useRequestMembership()`. |

---

### Communities – summary table

| Operation | Type | Priority | Status |
|-----------|------|----------|--------|
| `listCommunities` | Query | Required | **Provided** |
| `getCommunity` | Query | Required | **Provided** |
| `getCommunityStats` | Query | Optional | **Not provided** |
| `createCommunity` | Mutation | Required | **Provided** |
| `updateCommunity` | Mutation | Optional | **Not provided** |
| `deleteCommunity` | Mutation | Optional | **Not provided** |
| Suspend / unsuspend community | Mutation | Optional | **Not provided** |
| Link association to community | Mutation | Optional | **Not provided** |
| `discoverAssociations` | Query | Optional | **Not provided** |
| `requestMembership` | Mutation | Optional | **Not provided** |

---

## How to update this file when an API is provided

1. Find the operation in the section above (e.g. Events → `listEvents`).
2. Change **Status** from **Not provided** to **Provided** in both the detailed block and the summary table.
3. Under **Notes** (or in the table), add:
   - Service or schema name (e.g. “Events service”),
   - Link to schema/repo or internal doc if applicable,
   - When the admin hub was wired (e.g. “Wired in admin-hub 2025-02-XX”).

**Example** — after `listEvents` is provided and wired:

In the `listEvents` block, change:

```markdown
| **Status** | **Not provided** |
...
| **Notes** | UI filters by status... |
```

to:

```markdown
| **Status** | **Provided** |
...
| **Notes** | Events service. Wired in admin-hub 2025-02-XX. UI filters by status... |
```

And in the summary table:

```markdown
| `listEvents` | Query | Required | **Provided** |
```

---

## Backend checklists

### Events

When implementing the Events API, the admin hub expects:

- **Auth:** All operations require the same admin Bearer token as the rest of the app.
- **IDs:** Use `ID!` for `id`, `eventId`, `userId`, `registrationId`.
- **Scoping:** If events belong to a community, support optional `communityId` in list/get/create/update so the UI can scope when opened from a community context.
- **Enums:** The UI sends/receives strings for `status`, `eventType`, `paymentStatus`, `checkInStatus`; you can use GraphQL enums and map them in the client if needed.

### Opportunities

- **Auth:** Same admin Bearer token. `setOpportunityPriority` must be restricted to super-admins (return 403 for others).
- **Input types:** Use the same shape as in `src/services/networks/graphql/opportunity/operations.ts` (ListOpportunitiesInput, CreateOpportunityInput, UpdateOpportunityInput, GetApplicationsInput, ReviewApplicationInput, SetOpportunityPriorityInput).
- **Status flow:** DRAFT → PUBLISHED (publish), then close/delete. Applications: pending → shortlisted / rejected / accepted / hired, etc., per your schema.

### Communities

- **Auth:** Same admin Bearer token for list/get/create. Suspend/link-association may require community-admin or system-admin scope.
- **Types:** Community, CreateCommunityInput, and list response should match `src/services/networks/graphql/admin/operations.ts` (Community, CommunityListResponse). getCommunity returns full Community; listCommunities returns communities + total.
