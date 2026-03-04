# Events — GraphQL API Requirements

This document describes the **GraphQL API the admin hub Events feature expects**, so you can implement or expose the backend operations. The Events UI currently uses mock data; wiring it to real APIs will need the following.

---

## 1. Types (schema)

### Event

Used for list, get-by-id, and create/update responses.

```graphql
type Event {
  id: ID!
  title: String!
  description: String
  bannerImage: String
  bannerEmoji: String
  date: String!           # e.g. "Dec 15, 2024"
  startTime: String!     # e.g. "2:00 PM"
  endTime: String!       # e.g. "5:00 PM"
  eventType: String!     # "in-person" | "virtual"
  location: String
  virtualLink: String
  isPaid: Boolean!
  ticketPrice: Float
  currency: String       # e.g. "USD", "$"
  hasParticipantLimit: Boolean!
  maxParticipants: Int
  registeredCount: Int!
  status: String!        # "published" | "unpublished" | "draft" | "ongoing" | "completed" | "cancelled"
  publishNow: Boolean
  notifyMembers: Boolean
  allowComments: Boolean
  views: Int
  ticketsSold: Int
  revenue: Float
  createdAt: String!
  updatedAt: String
  communityId: String    # optional, if events are scoped to community
}
```

### EventRegistration

Used for the “Manage registrations” drawer (list per event).

```graphql
type EventRegistration {
  id: ID!
  eventId: ID!
  userId: ID!
  userName: String
  userEmail: String!
  userPhone: String
  paymentStatus: String!   # "paid" | "pending" | "refunded"
  checkInStatus: String!  # "checked-in" | "not-checked-in"
  registeredAt: String!
}
```

### Create/Update input

Used for create and update mutations.

```graphql
input CreateEventInput {
  title: String!
  description: String
  bannerImage: String
  date: String!
  startTime: String!
  endTime: String!
  eventType: String!      # "in-person" | "virtual"
  location: String
  virtualLink: String
  isPaid: Boolean!
  ticketPrice: Float
  currency: String
  hasParticipantLimit: Boolean!
  maxParticipants: Int
  publishNow: Boolean!
  notifyMembers: Boolean!
  allowComments: Boolean!
  communityId: String
}

# Same shape for update; all fields optional except id
input UpdateEventInput {
  id: ID!
  title: String
  description: String
  bannerImage: String
  date: String
  startTime: String
  endTime: String
  eventType: String
  location: String
  virtualLink: String
  isPaid: Boolean
  ticketPrice: Float
  currency: String
  hasParticipantLimit: Boolean
  maxParticipants: Int
  publishNow: Boolean
  notifyMembers: Boolean
  allowComments: Boolean
}
```

---

## 2. Queries

### List events (for Events page list + filters)

Used for the main Events list with search, status, type (free/paid), and sort.

```graphql
query ListEvents(
  $limit: Int
  $offset: Int
  $searchTerm: String
  $status: String        # "published" | "draft" | "completed" | "cancelled" | etc.
  $communityId: ID
) {
  listEvents(
    limit: $limit
    offset: $offset
    searchTerm: $searchTerm
    status: $status
    communityId: $communityId
  ) {
    events { ... EventFields ... }
    total: Int!   # or Float! depending on your schema
  }
}
```

**Suggested default:** `limit: 20`, `offset: 0`.

---

### Get event by ID (for detail view / edit prefill)

Used when opening event details or the edit modal.

```graphql
query GetEvent($id: ID!) {
  getEvent(id: $id) {
    ... EventFields
  }
}
```

---

### List registrations for an event (for “Manage registrations” drawer)

Used in the registrations drawer: list, search, filter by payment/check-in.

```graphql
query GetEventRegistrations(
  $eventId: ID!
  $limit: Int
  $offset: Int
  $searchTerm: String
  $paymentStatus: String   # "all" | "paid" | "pending" | "refunded"
  $checkInStatus: String   # "all" | "checked-in" | "not-checked-in"
) {
  getEventRegistrations(
    eventId: $eventId
    limit: $limit
    offset: $offset
    searchTerm: $searchTerm
    paymentStatus: $paymentStatus
    checkInStatus: $checkInStatus
  ) {
    registrations { ... EventRegistrationFields ... }
    total: Int!
  }
}
```

If you prefer a single “get event with registrations” query, the UI can use that instead, e.g.:

```graphql
query GetEvent($id: ID!) {
  getEvent(id: $id) {
    ... EventFields
    registrations(limit: 100, offset: 0) {
      items { ... EventRegistrationFields ... }
      total
    }
  }
}
```

---

## 3. Mutations

### Create event

Used when submitting the “Create event” form.

```graphql
mutation CreateEvent($input: CreateEventInput!) {
  createEvent(input: $input) {
    id
    title
    status
    createdAt
  }
}
```

---

### Update event

Used when saving changes in the edit modal.

```graphql
mutation UpdateEvent($input: UpdateEventInput!) {
  updateEvent(input: $input) {
    id
    title
    status
    updatedAt
  }
}
```

---

### Delete event

Used when confirming delete in the delete modal.

```graphql
mutation DeleteEvent($id: ID!) {
  deleteEvent(id: $id) {
    success: Boolean!
    message: String
  }
}
```

---

### Publish / unpublish event

Used by the “Publish” / “Unpublish” action on a card.

```graphql
mutation PublishEvent($id: ID!) {
  publishEvent(id: $id) {
    id
    status
  }
}

mutation UnpublishEvent($id: ID!) {
  unpublishEvent(id: $id) {
    id
    status
  }
}
```

If you prefer a single mutation, e.g. `setEventStatus(id: ID!, status: String!)`, the UI can call that instead.

---

### Registration actions (optional but useful for the drawer)

Used for “Mark as checked in”, “Resend ticket”, “Remove attendee” in the registrations drawer.

```graphql
mutation MarkRegistrationCheckedIn($registrationId: ID!) {
  markRegistrationCheckedIn(registrationId: $registrationId) {
    id
    checkInStatus
  }
}

mutation ResendEventTicket($registrationId: ID!) {
  resendEventTicket(registrationId: $registrationId) {
    success
    message
  }
}

mutation RemoveEventRegistration($registrationId: ID!) {
  removeEventRegistration(registrationId: $registrationId) {
    success
    message
  }
}
```

---

## 4. Summary table

| Operation              | Type   | Purpose                                      |
|------------------------|--------|----------------------------------------------|
| `listEvents`           | Query  | Events list with filters, search, pagination |
| `getEvent`             | Query  | Single event (detail / edit)                 |
| `getEventRegistrations`| Query  | Registrations for one event (drawer)         |
| `createEvent`          | Mutation | Create event (form submit)                 |
| `updateEvent`          | Mutation | Update event (edit form submit)            |
| `deleteEvent`          | Mutation | Delete event (confirm in modal)            |
| `publishEvent`         | Mutation | Publish event (card action)                |
| `unpublishEvent`       | Mutation | Unpublish event (card action)              |
| `markRegistrationCheckedIn` | Mutation | Check-in in drawer                    |
| `resendEventTicket`    | Mutation | Resend ticket (drawer)                    |
| `removeEventRegistration` | Mutation | Remove attendee (drawer)                 |

---

## 5. Notes for backend

- **Auth:** All of the above should be protected (e.g. admin or community admin only) and use the same Bearer token as the rest of the admin hub.
- **Scoping:** If events belong to a community, include `communityId` in list/get/create/update where needed; the UI can pass it from the current context (e.g. when opened from a community detail page).
- **IDs:** Use `ID!` for `id`, `eventId`, `userId`, `registrationId` consistently.
- **Enums:** You can replace `String` for `status`, `eventType`, `paymentStatus`, `checkInStatus` with enums if your schema uses them; the UI currently sends/receives strings.

Once you have these (or equivalent) operations and types, we can wire the Events page and components to them (replace mock data with `listEvents` / `getEvent` / `getEventRegistrations`, and hook up create/update/delete/publish and registration actions).
