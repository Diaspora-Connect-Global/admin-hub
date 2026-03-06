# Events — GraphQL API (Provided Schema)

This document describes the **Events GraphQL API** as provided by the backend. Use it to wire the admin hub Events page and components.

---

## 1. Enums

```graphql
enum EventStatus {
  draft
  published
  cancelled
  completed
}

enum EventLocationType {
  physical
  virtual
  hybrid
}
```

---

## 2. Types

### EventLocation

```graphql
type EventLocation {
  type: EventLocationType!
  venueName: String
  address: String
  city: String
  country: String
  virtualLink: String
  platform: String
}
```

### EventTicket

```graphql
type EventTicket {
  id: ID!
  name: String!
  priceInCents: Int!
  description: String
  availableQuantity: Int
}
```

### Event

```graphql
type Event {
  id: ID!
  title: String!
  description: String!
  status: EventStatus!
  startAt: String!        # ISO 8601
  endAt: String!         # ISO 8601
  eventCategory: String!
  locationType: EventLocationType!
  locationDetails: EventLocation
  isPaid: Boolean!
  registrationCount: Int!
  availableSpots: Int
  isRegistered: Boolean!
  canRegister: Boolean!
  tickets: [EventTicket]
  coverImageUrl: String
  tags: [String]
  timezone: String
  createdAt: String
  updatedAt: String
}
```

### EventListResponse

```graphql
type EventListResponse {
  events: [Event!]!
  total: Int!
}
```

### EventRegistration

```graphql
type EventRegistration {
  id: ID!
  eventId: ID!
  userId: ID!
  ticketId: String
  quantity: Int!
  status: String!         # pending | confirmed | cancelled
  totalAmount: String
  registeredAt: String
  confirmedAt: String
  cancelledAt: String
  createdAt: String
}
```

### EventRegistrationListResponse

```graphql
type EventRegistrationListResponse {
  registrations: [EventRegistration!]!
  total: Int!
}
```

### DeleteEventResult

```graphql
type DeleteEventResult {
  success: Boolean!
  message: String
}
```

---

## 3. Inputs

### ListEventsInput

```graphql
input ListEventsInput {
  limit: Int       # default 20
  offset: Int      # default 0
  searchTerm: String
  status: String   # draft | published | cancelled | completed
  communityId: ID
  ownerType: String
  ownerId: ID
}
```

### CreateEventInput

```graphql
input CreateEventInput {
  ownerType: String!      # USER | COMMUNITY | ASSOCIATION
  ownerId: ID!
  title: String!
  description: String!
  eventCategory: String!
  locationType: String!   # physical | virtual | hybrid
  locationDetails: CreateEventLocationInput
  startAt: String!        # ISO 8601
  endAt: String!         # ISO 8601
  isPaid: Boolean
}
```

### CreateEventLocationInput

```graphql
input CreateEventLocationInput {
  type: String!
  venue: String
  address: String
  city: String
  country: String
  virtualLink: String
  platform: String
}
```

### UpdateEventInput

```graphql
input UpdateEventInput {
  title: String
  description: String
  eventCategory: String
  locationType: String
  locationDetails: CreateEventLocationInput
  startAt: String
  endAt: String
  timezone: String
  coverImageUrl: String
  tags: [String]
  capacity: Int
  visibility: String
}
```

---

## 4. Queries

### listEvents (paginated list with filters)

```graphql
query ListEvents($input: ListEventsInput) {
  listEvents(input: $input) {
    events {
      id
      title
      status
      startAt
      endAt
      eventCategory
      locationType
      locationDetails { type city country virtualLink }
      isPaid
      registrationCount
      availableSpots
      coverImageUrl
    }
    total
  }
}
```

### getEvent (single event by ID; replaces legacy `event`)

```graphql
query GetEvent($id: ID!) {
  getEvent(id: $id) {
    id
    title
    description
    status
    startAt
    endAt
    eventCategory
    locationType
    locationDetails {
      type
      venueName
      address
      city
      country
      virtualLink
      platform
    }
    isPaid
    registrationCount
    availableSpots
    isRegistered
    canRegister
    tickets {
      id
      name
      priceInCents
      availableQuantity
    }
    coverImageUrl
    tags
    timezone
    createdAt
    updatedAt
  }
}
```

### getEventRegistrations (registrations for an event)

```graphql
query GetEventRegistrations(
  $eventId: ID!
  $limit: Int
  $offset: Int
  $status: String
) {
  getEventRegistrations(
    eventId: $eventId
    limit: $limit
    offset: $offset
    status: $status
  ) {
    registrations {
      id
      eventId
      userId
      ticketId
      quantity
      status
      totalAmount
      registeredAt
      confirmedAt
      cancelledAt
      createdAt
    }
    total
  }
}
```

---

## 5. Mutations

### createEvent (returns full Event, not ID)

```graphql
mutation CreateEvent($input: CreateEventInput!) {
  createEvent(input: $input) {
    id
    title
    status
    startAt
    endAt
  }
}
```

### updateEvent

```graphql
mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
  updateEvent(id: $id, input: $input) {
    id
    title
    status
    startAt
    endAt
    coverImageUrl
    tags
  }
}
```

### deleteEvent

```graphql
mutation DeleteEvent($id: ID!) {
  deleteEvent(id: $id) {
    success
    message
  }
}
```

### publishEvent

```graphql
mutation PublishEvent($id: ID!) {
  publishEvent(id: $id) {
    id
    status
    title
  }
}
```

### markRegistrationCheckedIn

```graphql
mutation MarkRegistrationCheckedIn($registrationId: ID!) {
  markRegistrationCheckedIn(registrationId: $registrationId) {
    id
    status
  }
}
```

### removeEventRegistration

```graphql
mutation RemoveEventRegistration($registrationId: ID!) {
  removeEventRegistration(registrationId: $registrationId) {
    success
    message
  }
}
```

---

## 6. Existing operations (unchanged)

These remain as in the existing schema; not redefined above.

| Operation | Type | Notes |
|-----------|------|--------|
| `events(limit, offset)` | Query | Returns `[Event]`. |
| `userEvents` | Query | Returns `{ attending: [Event], saved: [Event] }`. |
| `registerForEvent(input)` | Mutation | Returns `{ registrationId, paymentIntentClientSecret? }`. |
| `saveEvent(eventId)` | Mutation | Returns `{ id, savedAt }`. |
| `unsaveEvent(eventId)` | Mutation | Returns `Boolean`. |
| `checkIn(input)` | Mutation | Returns `{ id, checkedInAt, checkInMethod }`. |

---

## 7. Summary table

| Operation | Type | Purpose |
|-----------|------|---------|
| `listEvents` | Query | Events list with filters, pagination (ListEventsInput). |
| `getEvent` | Query | Single event (detail / edit). Replaces `event(id)`. |
| `getEventRegistrations` | Query | Registrations for one event (drawer). |
| `createEvent` | Mutation | Create event; returns full Event. |
| `updateEvent` | Mutation | Update event (id + UpdateEventInput). |
| `deleteEvent` | Mutation | Delete event (DeleteEventResult). |
| `publishEvent` | Mutation | Publish event. |
| `markRegistrationCheckedIn` | Mutation | Check-in in registrations drawer. |
| `removeEventRegistration` | Mutation | Remove attendee in drawer. |

**Not in provided schema:** `unpublishEvent`, `resendEventTicket` (see [APIS-NEEDED.md](./APIS-NEEDED.md)).

---

## 8. Breaking changes (legacy → provided)

| Old | New |
|-----|-----|
| `event(id)` | `getEvent(id)` |
| `createEvent` returned ID | `createEvent` returns full `Event` |

---

## 9. Notes for wiring the admin hub

- **Auth:** All operations use the same admin Bearer token as the rest of the app.
- **IDs:** Use `ID!` for `id`, `eventId`, `userId`, `registrationId`.
- **Dates:** `startAt` / `endAt` are ISO 8601 strings.
- **Scoping:** Use `communityId`, `ownerType`, `ownerId` in `ListEventsInput` when listing in a community or owner context.
