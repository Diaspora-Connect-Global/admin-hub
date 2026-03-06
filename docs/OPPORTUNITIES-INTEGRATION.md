# Opportunities Service — Frontend Integration Guide

This document provides the complete integration guide for the Opportunities Service in the admin hub.

## Key Integration Notes

### GraphQL Operations

- **Query names**: `getOpportunity` and `listOpportunities` (not `opportunity`/`opportunities`)
- **Priority mutation**: Uses flat arguments `setOpportunityPriority(opportunityId: String!, priority: String!)` - **NO input wrapper**
- **Application actions**: `acceptApplication(id: String!, notes: String)` and `reviewApplication(applicationId: String!, notes: String)` use flat arguments

### Known Limitations

1. **Owner Display Names**: `owner.name` returns raw `ownerId` until display name lookup is implemented
2. **User Context Fields**: `isSavedByCurrentUser`, `hasCurrentUserApplied`, `currentUserApplicationId` always return `undefined`
3. **Input Restrictions**: `skills`, `tags`, `subCategory` fields are not available in gateway input - cannot be set via API
4. **Withdraw Application**: Stub implementation - always returns `true`, gRPC call not wired yet

### Usage Examples

#### Super Admin: Set Priority
```typescript
import { useSetOpportunityPriority } from "@/hooks/opportunity/superAdmin";

const [setPriority] = useSetOpportunityPriority();

// ⚠️ Flat arguments - not an input object
await setPriority({
  variables: { 
    opportunityId: "123", 
    priority: "HIGH" // "HIGH" | "NORMAL" | "LOW"
  }
});
```

#### Admin: List by Status
```typescript
import { useListOpportunities } from "@/hooks/opportunity";

// Fetch DRAFT opportunities for review
const { data } = useListOpportunities({ 
  input: { 
    status: 'DRAFT', 
    limit: 20, 
    offset: 0 
  } 
});

// Fetch CLOSED opportunities  
const { data: closedData } = useListOpportunities({ 
  input: { 
    status: 'CLOSED', 
    limit: 20, 
    offset: 0 
  } 
});
```

#### Application Review Workflow
```typescript
import { 
  useReviewApplication, 
  useAcceptApplication, 
  useRejectApplication 
} from "@/hooks/opportunity";

const [reviewApp] = useReviewApplication();
const [acceptApp] = useAcceptApplication();
const [rejectApp] = useRejectApplication();

// Step 1: Add review notes (moves to REVIEWING)
await reviewApp({
  variables: { 
    applicationId: "app123", 
    notes: "Initial screening complete" 
  }
});

// Step 2a: Accept with optional notes
await acceptApp({ 
  variables: { 
    id: "app123", 
    notes: "Strong candidate" 
  } 
});

// OR Step 2b: Reject with reason
await rejectApp({ 
  variables: { 
    id: "app123", 
    reason: "Insufficient experience" 
  } 
});
```

## Type Definitions

All types are available in `@/types/opportunities` including:

- **Enums**: `OpportunityType`, `OpportunityCategory`, `WorkMode`, `EngagementType`, `Visibility`, `ApplicationMethod`, `OpportunityStatus`, `OwnerType`, `PriorityLevel`, `ApplicationStatus`
- **Interfaces**: `Opportunity`, `Application`, `OpportunityOwner`, `FileRef`
- **Input Types**: `CreateOpportunityInput`, `UpdateOpportunityInput`, `ListOpportunitiesInput`, `SubmitApplicationInput`, etc.
- **Response Types**: `OpportunityListResponse`, `ApplicationListResponse`

## Admin Permissions

- **GET operations**: Most are public or require basic authentication
- **Mutations**: Require appropriate admin roles
  - `setOpportunityPriority`: `SYSTEM_ADMIN` only
  - `getApplications`: Admin bypass for SYSTEM_ADMIN to view all applications
  - Other mutations: Owner or admin permissions required

## File Organization

```
src/
├── types/opportunities.ts          # All TypeScript interfaces and enums
├── services/networks/graphql/opportunity/
│   ├── operations.ts               # Main GraphQL operations
│   ├── superAdmin.ts              # SYSTEM_ADMIN only operations  
│   └── index.ts                   # Exports
└── hooks/opportunity/
    ├── index.ts                   # Main hooks for all operations
    └── superAdmin.ts              # SYSTEM_ADMIN only hooks
```