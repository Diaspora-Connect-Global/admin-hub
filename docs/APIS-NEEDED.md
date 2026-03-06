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

## At a glance

| Area | Provided | Wired in admin hub | What’s left |
|------|----------|--------------------|-------------|
| **Events** | All except `unpublishEvent`, `resendEventTicket` | Yes — list, get, create, update, delete, publish, registrations, check-in, remove | Backend: optional unpublish/resend. Hub: use real `ownerId` for create. |
| **Opportunities** | All | Partially — list + applicants only | Hub: wire Create/Edit, Publish/Close/Delete, Accept/Reject, set priority. |
| **Communities** | list, get, create | Yes — list, get, create | Backend: getCommunityStats, update, delete, suspend, link association, discoverAssociations. |

See each section’s **“What’s left to do”** subsection for details.

---

## Events

**Full spec (types, query/mutation signatures, examples):** [EVENTS-GRAPHQL-API.md](./EVENTS-GRAPHQL-API.md)

**Where in the app:** `/events` page (`src/pages/Events.tsx`), event cards, Create/Edit event modal, Delete event modal, Event details modal, Registrations drawer.

**Current UI behaviour:** **Wired to real API.** Events page uses `useListEvents`, `useGetEvent`, `useCreateEvent`, `useUpdateEvent`, `useDeleteEvent`, `usePublishEvent`; Registrations drawer uses `useGetEventRegistrations`, `useMarkRegistrationCheckedIn`, `useRemoveEventRegistration`. Operations live in `src/services/networks/graphql/events/` and `src/hooks/events/`.

---

### Queries

#### 1. `listEvents`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Events page main list (grid of event cards), stats. |
| **Variables** | `input: ListEventsInput` — limit, offset, searchTerm, status, communityId, ownerType, ownerId. |
| **Returns** | `{ listEvents: { events: [Event!]!, total: Int! } }` (EventListResponse). |
| **Notes** | Backend provided. **Wired:** `useListEvents()` in Events page. |

---

#### 2. `getEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Event details modal, Edit event modal (prefill). |
| **Variables** | `id: ID!`. |
| **Returns** | `{ getEvent: Event }` (full Event with locationDetails, tickets, etc.). |
| **Notes** | Replaces old `event(id)`. **Wired:** `useGetEvent(id)` for edit modal prefill. |

---

#### 3. `getEventRegistrations`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Registrations drawer. |
| **Variables** | `eventId: ID!`, `limit`, `offset`, `status`. |
| **Returns** | `{ getEventRegistrations: { registrations: [EventRegistration!]!, total: Int! } }` (EventRegistrationListResponse). |
| **Notes** | **Wired:** `useGetEventRegistrations()` in RegistrationsDrawer. |

---

### Mutations

#### 4. `createEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Create event modal. |
| **Variables** | `input: CreateEventInput!` — ownerType!, ownerId!, title!, description!, eventCategory!, locationType!, locationDetails, startAt!, endAt!, isPaid. |
| **Returns** | Full `Event` (id, title, status, startAt, endAt). |
| **Notes** | Now returns Event instead of ID. **Wired:** `useCreateEvent()` in CreateEditEventModal submit. |

---

#### 5. `updateEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Edit event modal. |
| **Variables** | `id: ID!`, `input: UpdateEventInput!` (title, description, eventCategory, locationType, locationDetails, startAt, endAt, timezone, coverImageUrl, tags, capacity, visibility). |
| **Returns** | Updated Event (id, title, status, startAt, endAt, coverImageUrl, tags). |
| **Notes** | **Wired:** `useUpdateEvent()` in CreateEditEventModal submit. |

---

#### 6. `deleteEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Delete event modal. “Delete” from card menu). |
| **Variables** | `id: ID!`. |
| **Returns** | `{ deleteEvent: DeleteEventResult }` — success, message. |
| **Notes** | **Wired:** `useDeleteEvent()` in DeleteEventModal confirm. |

---

#### 7. `publishEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Optional |
| **Used in** | Event card dropdown Publish. |
| **Variables** | `id: ID!`. |
| **Returns** | `{ publishEvent: { id, status, title } }`. |
| **Notes** | **Wired:** `usePublishEvent()` on card dropdown Publish. |

---

#### 8. `unpublishEvent`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Event card dropdown Unpublish. |
| **Variables** | `id: ID!`. |
| **Returns** | Event with status. |
| **Notes** | Not in provided schema; use updateEvent to set status if backend supports. |

---

#### 9. `markRegistrationCheckedIn`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Optional |
| **Used in** | Registrations drawer — “Mark as checked in” on a row. |
| **Variables** | `registrationId: ID!`. |
| **Returns** | `{ markRegistrationCheckedIn: { id, status } }`. |
| **Notes** | **Wired:** `useMarkRegistrationCheckedIn()` in RegistrationsDrawer. |

---

#### 10. `resendEventTicket`

| Field | Detail |
|-------|--------|
| **Status** | **Not provided** |
| **Priority** | Optional |
| **Used in** | Registrations drawer Resend ticket. |
| **Variables** | `registrationId: ID!`. |
| **Returns** | success/message. |
| **Notes** | Not in provided schema. |

---

#### 11. `removeEventRegistration`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Optional |
| **Used in** | Registrations drawer. |
| **Variables** | `registrationId: ID!`. |
| **Returns** | `{ removeEventRegistration: { success, message } }`. |
| **Notes** | **Wired:** `useRemoveEventRegistration()` in RegistrationsDrawer. |

---

### Events – what’s left to do

| Item | Status | Action |
|------|--------|--------|
| **Backend** | | |
| `unpublishEvent` | Not provided | Optional. Use `updateEvent` to set status to draft if backend supports. |
| `resendEventTicket` | Not provided | Optional. Add when backend supports resending ticket/email. |
| **Admin hub** | | |
| Create event `ownerId` | Placeholder | Replace `"current-user-id"` in createEvent input with real admin/user id from session when available. |

---

### Events – summary table

| Operation | Type | Priority | Status |
|-----------|------|----------|--------|
| `listEvents` | Query | Required | **Provided** |
| `getEvent` | Query | Required | **Provided** |
| `getEventRegistrations` | Query | Required | **Provided** |
| `createEvent` | Mutation | Required | **Provided** |
| `updateEvent` | Mutation | Required | **Provided** |
| `deleteEvent` | Mutation | Required | **Provided** |
| `publishEvent` | Mutation | Optional | **Provided** |
| `unpublishEvent` | Mutation | Optional | **Not provided** |
| `markRegistrationCheckedIn` | Mutation | Optional | **Provided** |
| `resendEventTicket` | Mutation | Optional | **Not provided** |
| `removeEventRegistration` | Mutation | Optional | **Provided** |

---

## Opportunities

**Spec reference:** [GRAPHQL-API.md](./GRAPHQL-API.md) § Opportunity Service

**Where in the app:** `/opportunities` page (`src/pages/Opportunities.tsx`), opportunity table/card view, Create/Edit opportunity modal, opportunity detail drawer, Applicants drawer, application modals (view, message, reject, etc.).

**Current UI behaviour:** **Partially wired.** List and applicants use real API: `useListOpportunities()` and `useGetApplications()` on the Opportunities page; data comes from backend. Create/Edit modal, Publish/Close/Delete actions, and Applicants drawer actions (Accept, Reject, etc.) still show toasts only — hooks exist but are not yet called from the UI.

---

### Queries

#### 1. `listOpportunities` (ListOpportunities)

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Opportunities page list/table and card view, stats (total, open, applicants, shortlisted). |
| **Variables** | `input: ListOpportunitiesInput` — `limit`, `offset`, `searchTerm`, `type`, `category`, `subCategory`, `workMode`, `engagementType`, `location`, `ownerType`, `ownerId`, `status`, `sortBy`, `sortOrder`. |
| **Returns** | List of opportunities (see OpportunityType in spec) and total count. |
| **Notes** | **Wired:** `useListOpportunities(input)` on Opportunities page. UI filters by status, type, visibility. |

---

#### 2. `getOpportunity` (GetOpportunity)

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Opportunity detail drawer/modal, Edit opportunity form (prefill). |
| **Variables** | `id: String!` (or `ID!`). |
| **Returns** | Single opportunity (full fields). |
| **Notes** | Hook: `useGetOpportunity(id)`. **Not yet wired** in detail drawer / edit prefill. |

---

#### 3. `getApplications` (GetApplications)

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Applicants drawer when user clicks “View applicants” on an opportunity. |
| **Variables** | `input: GetApplicationsInput!` — `opportunityId!`, `limit`, `offset`, `status`. |
| **Returns** | List of applications (applicant id, status, resume ref, etc.) and total. |
| **Notes** | **Wired:** `useGetApplications(input)` in Applicants drawer. |

---

#### 4. `getApplication` (GetApplication)

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Optional |
| **Used in** | Single application view/modal (view details, message, reject, mark hired). |
| **Variables** | `id: String!`. |
| **Returns** | Single application with full fields. |
| **Notes** | Hook: `useGetApplication(id)`. **Not yet wired** in application detail modal. |

---

### Mutations

#### 5. `createOpportunity`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Create opportunity modal (multi-step form). |
| **Variables** | `input: CreateOpportunityInput!` (see opportunity schema). |
| **Returns** | Created opportunity (e.g. id, title, status). Creates as DRAFT. |
| **Notes** | Hooks: `useCreateOpportunity()`. |

---

#### 6. `updateOpportunity`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Edit opportunity modal. |
| **Variables** | `id: String!`, `input: UpdateOpportunityInput!`. |
| **Returns** | Updated opportunity. |
| **Notes** | Hook: `useUpdateOpportunity()`. **Not yet wired** — Edit modal still toasts. |

---

#### 7. `publishOpportunity` / `closeOpportunity` / `deleteOpportunity`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required (publish, close); Required (delete). |
| **Used in** | Card/table actions: Publish, Close applications, Delete. |
| **Variables** | `id: String!`; Close can have `reason`. |
| **Returns** | Updated opportunity or success/message. |
| **Notes** | Hooks exist. **Not yet wired** — Publish/Close/Delete on table/card still toasts. |

---

#### 8. `acceptApplication` / `rejectApplication` / `reviewApplication`

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Required |
| **Used in** | Applicants drawer / application modal: Accept, Reject, Mark under review. |
| **Variables** | Accept/Reject: `id: String!`; Reject: `reason`; Review: `input: ReviewApplicationInput!` (applicationId, reviewNotes, status). |
| **Returns** | Updated application or success. |
| **Notes** | Hooks exist. **Not yet wired** — Accept/Reject in Applicants drawer still toasts. Review uses `applicationId` + `notes`. |

---

#### 9. `setOpportunityPriority` (Super Admin only)

| Field | Detail |
|-------|--------|
| **Status** | **Provided** |
| **Priority** | Optional |
| **Used in** | Super-admin-only UI: set featuring priority (HIGH / NORMAL / LOW). |
| **Variables** | `input: SetOpportunityPriorityInput!` — `opportunityId!`, `priority`. |
| **Returns** | Updated opportunity or success. |
| **Notes** | Hook: `useSetOpportunityPriority()`. **Not yet wired** in UI. Backend should return 403 for non–super-admins. |

---

### Opportunities – what’s left to do

| Item | Status | Action |
|------|--------|--------|
| **Admin hub (wire UI to existing hooks)** | | |
| Edit opportunity / detail drawer | Hooks ready | Call `useGetOpportunity(id)` when opening drawer or edit modal; prefill form from response. |
| Create opportunity | Hooks ready | In CreateEditOpportunityModal, on submit call `useCreateOpportunity()` with form input; refetch list on success. |
| Update opportunity | Hooks ready | In CreateEditOpportunityModal (edit mode), on submit call `useUpdateOpportunity(id, input)`; refetch list. |
| Publish / Close / Delete | Hooks ready | In table and card actions, call `usePublishOpportunity()`, `useCloseOpportunity()`, `useDeleteOpportunity()`; refetch list. |
| Accept / Reject application | Hooks ready | In ApplicantsDrawer and ApplicationModal, call `useAcceptApplication()` / `useRejectApplication()`; refetch applications. |
| Set priority (super admin) | Hooks ready | Add UI for `useSetOpportunityPriority(opportunityId, priority)` if super-admin role. |
| **Backend** | All listed operations Provided | Ensure schema type names match (e.g. `OpportunityType` vs `Opportunity` in fragments if you see validation errors). |

---

### Opportunities – summary table

| Operation | Type | Priority | Status |
|-----------|------|----------|--------|
| `listOpportunities` | Query | Required | **Provided** |
| `getOpportunity` | Query | Required | **Provided** |
| `getApplications` | Query | Required | **Provided** |
| `getApplication` | Query | Optional | **Provided** |
| `createOpportunity` | Mutation | Required | **Provided** |
| `updateOpportunity` | Mutation | Required | **Provided** |
| `publishOpportunity` | Mutation | Required | **Provided** |
| `closeOpportunity` | Mutation | Required | **Provided** |
| `deleteOpportunity` | Mutation | Required | **Provided** |
| `acceptApplication` | Mutation | Required | **Provided** |
| `rejectApplication` | Mutation | Required | **Provided** |
| `reviewApplication` | Mutation | Required | **Provided** |
| `setOpportunityPriority` | Mutation | Optional | **Provided** |

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

### Communities – what’s left to do

| Item | Status | Action |
|------|--------|--------|
| **Already wired** | | |
| `listCommunities` | Provided + Wired | Communities page table. |
| `getCommunity` | Provided + Wired | Community detail page. |
| `createCommunity` | Provided + Wired | Create Community modal. |
| **Backend not provided yet** | | |
| `getCommunityStats` | Not provided | Optional. Hook exists; wire CommunityDetail stats when backend exposes it. |
| `updateCommunity` | Not provided | Add operation + hook when backend provides; wire Edit community form. |
| `deleteCommunity` | Not provided | Add operation + hook when backend provides; wire Delete action. |
| Suspend / unsuspend | Not provided | Add operation + hook when backend provides; wire Suspend modal. |
| Link association | Not provided | Add operation when backend provides; wire Link Associations modal. |
| `discoverAssociations` | Not provided | For link-association picker. Hook exists. |
| `requestMembership` | Not provided | Member-facing; lower priority for admin hub. |

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
