# Vendor Service — Admin Hub Frontend Integration

> **Implementation Date:** March 16, 2026  
> **Status:** COMPLETE — GraphQL integration ready for backend connection

---

## Overview

This document describes the frontend implementation of the Vendor Service in the admin-hub application. The implementation aligns with the Vendor Service GraphQL API specification and enables system admins to manage vendors, view analytics, and enforce compliance.

---

## Architecture

### Component Structure

```
src/
├── types/vendor.ts                           # TypeScript types & enums
├── services/networks/graphql/vendor/
│   ├── operations.ts                         # GraphQL queries & mutations
│   └── index.ts                              # Export barrel
├── hooks/admin/
│   └── useVendor.ts                          # React hooks for vendor operations
└── pages/
    └── VendorManagement.tsx                  # Admin vendor management page
```

### Data Flow

```
Admin UI (VendorManagement.tsx)
    ↓
React Hooks (useVendor.ts)
    ↓
Apollo Client Queries/Mutations
    ↓
API Gateway (:3000)
    ↓
Vendor Service (:5008)
```

---

## Files Created / Modified

### 1. **[src/types/vendor.ts](src/types/vendor.ts)** — NEW

TypeScript interfaces for all vendor-related data types:

- `Vendor` — Core vendor profile
- `VendorDashboard` — Sales analytics DTO
- `VendorEligibility` — KYC/compliance status
- `Product` — Product/listing
- `ProductListPaginated` — Paginated products
- `ServicePackage` — Service offering
- `VendorOrder` — Order
- `UploadUrl` — GCS signed URL
- Enums: `VendorType`, `VendorStatus`, `ProductType`, `OrderStatus`, `FileType`

---

### 2. **[src/services/networks/graphql/vendor/operations.ts](src/services/networks/graphql/vendor/operations.ts)** — MODIFIED

Added new GraphQL query:

```typescript
export const LIST_VENDORS = gql`
  query ListVendors($limit: Int, $offset: Int, $status: String) {
    listVendors(limit: $limit, offset: $offset, status: $status) {
      items { id, userId, displayName, description, type, status, rating, ... }
      total
      limit
      offset
    }
  }
`;
```

Also added type interface:

```typescript
export interface ListVendorsQueryResult {
  listVendors: {
    items: VendorDTO[];
    total: number;
    limit?: number;
    offset?: number;
  };
}
```

---

### 3. **[src/hooks/admin/useVendor.ts](src/hooks/admin/useVendor.ts)** — NEW

React hooks for vendor operations:

#### Queries

- `useListVendors(limit, offset, status)` — List vendors with filtering & pagination
- `useGetVendor(vendorId)` — Fetch single vendor profile
- `useGetMyVendor()` — Fetch authenticated user's vendor
- `useGetVendorDashboard(vendorId)` — Fetch analytics/dashboard
- `useGetVendorEligibility(vendorId)` — Check KYC/compliance status
- `useListVendorProducts(vendorId, status, limit, offset)` — List vendor's products
- `useListVendorOrders(vendorId, status, limit, offset)` — List vendor's orders

#### Mutations

- `useSuspendVendor()` — Suspend vendor with reason (admin-only)
- `useReinstateVendor()` — Reinstate suspended vendor (admin-only)

All hooks follow Apollo Client patterns with proper TypeScript typing.

---

### 4. **[src/pages/VendorManagement.tsx](src/pages/VendorManagement.tsx)** — REPLACED

Complete admin vendor management dashboard featuring:

#### Features

- **Vendor Listing Table**
  - Columns: Name, ID, Type, Rating, Status, Created date
  - Paginated (20 items per page)
  - Search by name/ID
  - Filter by status (DRAFT, ACTIVE, KYC_PENDING, SUSPENDED)
  - Bulk selection

- **Vendor Detail Sheet**
  - Tabs: Overview, Products, Orders
  - Overview: Basic info, performance metrics, description
  - Products: List of vendor's products with status
  - Orders: List of vendor's orders with amounts

- **Admin Actions**
  - Suspend vendor (with reason field)
  - Reinstate suspended vendor
  - View vendor analytics
  - Export functionality (placeholder)

- **State Management**
  - Selected vendors tracking
  - Modal states for suspend/reinstate
  - Real-time data fetching via Apollo
  - Error handling & loading states

---

## Usage Examples

### Admin listing vendors

```typescript
import { useListVendors } from "@/hooks/admin/useVendor";

function VendorList() {
  const { data, loading, error } = useListVendors(20, 0, "ACTIVE");
  
  if (loading) return <Loader />;
  if (error) return <Error message={error.message} />;
  
  return (
    <Table>
      {data?.listVendors?.items.map(vendor => (
        <TableRow key={vendor.id}>
          <TableCell>{vendor.displayName}</TableCell>
          <TableCell>{vendor.status}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

### Suspending a vendor

```typescript
import { useSuspendVendor } from "@/hooks/admin/useVendor";

function SuspendModal({ vendorId }) {
  const [suspendVendor, { loading }] = useSuspendVendor();
  
  const handleSuspend = async (reason) => {
    await suspendVendor({
      variables: { vendorId, reason }
    });
  };
  
  return <button onClick={() => handleSuspend("Violates ToS")}>Suspend</button>;
}
```

### Checking vendor eligibility

```typescript
import { useGetVendorEligibility } from "@/hooks/admin/useVendor";

function PayoutForm({ vendorId }) {
  const { data } = useGetVendorEligibility(vendorId);
  
  const canPayout = data?.getVendorEligibility?.canReceivePayout;
  
  return (
    <button disabled={!canPayout}>
      {canPayout ? "Request Payout" : "Complete KYC First"}
    </button>
  );
}
```

---

## Status Mapping

| Backend Value | UI Display | Badge Color |
|---------------|-----------|-------------|
| `DRAFT` | Draft | Secondary |
| `ACTIVE` | Active | Default (green) |
| `KYC_PENDING` | KYC Pending | Outline |
| `SUSPENDED` | Suspended | Destructive (red) |

---

## Pagination

All list queries use **offset-based pagination**:

```typescript
useListVendors(
  limit: 20,        // Items per page
  offset: 0,        // Starting position
  status: "ACTIVE"  // Optional filter
)
```

To fetch next page:
```typescript
offset += limit  // Increment by 20 for next page
```

---

## Error Handling

The admin page handles GraphQL errors gracefully:

```typescript
if (vendorsError) {
  return (
    <AlertBox>
      <AlertTitle>Error loading vendors</AlertTitle>
      <AlertMessage>{vendorsError.message}</AlertMessage>
    </AlertBox>
  );
}
```

Common error scenarios:
- `Unauthorized` — Not logged in or insufficient permissions
- `Vendor not found` — Vendor ID doesn't exist
- `Cannot suspend...` — Business logic validation failed
- Network errors — Automatic retry by Apollo

---

## Internationalization (i18n)

The page uses translation keys:

```typescript
{t("vendors.title")}
{t("vendors.searchPlaceholder")}
```

Add to `src/i18n/locales/` translation files:

```json
{
  "vendors": {
    "title": "Vendor Management",
    "searchPlaceholder": "Search vendors by name or ID...",
    "suspend": "Suspend Vendor",
    "reinstate": "Reinstate Vendor"
  }
}
```

---

## Backend Requirements

### GraphQL Endpoint

The `LIST_VENDORS` query requires a backend implementation:

```graphql
query ListVendors($limit: Int, $offset: Int, $status: String) {
  listVendors(limit: $limit, offset: $offset, status: $status) {
    items {
      id
      userId
      displayName
      description
      type
      status
      logoUrl
      rating
      completedOrders
      createdAt
      updatedAt
    }
    total
    limit
    offset
  }
}
```

### Roles & Permissions

- **All authenticated users** can query their own vendor profile (`getMyVendor`)
- **System admins only** can:
  - `listVendors` — View all vendors
  - `suspendVendor` — Suspend any vendor
  - `reinstateVendor` — Reinstate vendors
  - `getVendorDashboard(vendorId)` — View any vendor's analytics
  - `getVendorEligibility(vendorId)` — Check compliance of any vendor

---

## Testing

### Manual Testing Checklist

- [ ] List vendors with pagination
- [ ] Filter by status
- [ ] Search by name/ID
- [ ] Open vendor detail sheet
- [ ] View vendor products
- [ ] View vendor orders
- [ ] Suspend vendor (enter reason)
- [ ] Reinstate vendor
- [ ] Error states (network error, 401, etc.)
- [ ] Loading states (skeleton or spinner)
- [ ] Empty states (no vendors found)

### GraphQL Testing

Use Apollo Sandbox to test queries:

```graphql
query {
  listVendors(limit: 10, offset: 0, status: "ACTIVE") {
    items {
      id
      displayName
      status
    }
    total
  }
}
```

---

## Future Enhancements

- [ ] **Bulk operations** — Suspend/reinstate multiple vendors
- [ ] **Advanced filters** — Date range, trust score range, revenue filter
- [ ] **Vendor analytics** — Charts for revenue, order trends
- [ ] **Review management** — Flag/remove inappropriate reviews
- [ ] **KYC management** — View KYC documents, approve/reject
- [ ] **Payout history** — Track vendor payouts
- [ ] **Dispute resolution** — Handle vendor disputes

---

## Troubleshooting

### "No vendors found"

**Possible causes:**
- Backend query not returning data
- Filter status doesn't match any vendors
- Search query too specific

**Solution:** Clear filters and check backend logs.

### Suspend button disabled

**Possible cause:** `suspendReason` textarea is empty

**Solution:** Enter a reason before clicking Suspend.

### Dashboard data not loading

**Possible cause:** `selectedVendor` is null, query is skipped

**Solution:** Open vendor detail sheet first to set selectedVendor.

### GraphQL 401 Unauthorized

**Possible causes:**
- JWT token expired
- User role doesn't have admin privileges
- Authorization header missing

**Solution:** Re-login or check token validity.

---

## Additional Resources

- [Vendor Service API Spec](../VENDOR-INTEGRATION.md)
- [GraphQL Operations](src/services/networks/graphql/vendor/operations.ts)
- [Types Reference](src/types/vendor.ts)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)

---

## Contact & Support

For questions about this integration:
- Check the GraphQL operation definitions in `operations.ts`
- Review types in `src/types/vendor.ts`
- Examine hook implementations in `src/hooks/admin/useVendor.ts`
- Check the main page component in `src/pages/VendorManagement.tsx`
