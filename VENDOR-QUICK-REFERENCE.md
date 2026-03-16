# Vendor Service Quick Reference

## Files Modified/Created

```
✅ NEW   src/types/vendor.ts
✅ NEW   src/hooks/admin/useVendor.ts
✅ MOD   src/services/networks/graphql/vendor/operations.ts
✅ MOD   src/pages/VendorManagement.tsx
✅ NEW   docs/VENDOR-INTEGRATION-ADMIN.md
✅ NEW   VENDOR-IMPLEMENTATION-SUMMARY.md (this directory)
```

## Hooks Available

```typescript
// Queries
useListVendors(limit?, offset?, status?)
useGetVendor(vendorId)
useGetVendorDashboard(vendorId)
useGetVendorEligibility(vendorId)
useListVendorProducts(vendorId, status?, limit?, offset?)
useListVendorOrders(vendorId, status?, limit?, offset?)

// Mutations
useSuspendVendor()
useReinstateVendor()
```

## Vendor Statuses

```typescript
type VendorStatus = "DRAFT" | "ACTIVE" | "KYC_PENDING" | "SUSPENDED"

// Color mapping in UI
ACTIVE → Default (green)
DRAFT → Secondary (gray)
KYC_PENDING → Outline (blue)
SUSPENDED → Destructive (red)
```

## Common Patterns

### List with filter
```typescript
const { data } = useListVendors(20, 0, "ACTIVE");
```

### Get vendor analytics
```typescript
const { data } = useGetVendorDashboard("vendor-id-123");
// data.getVendorDashboard.totalEarnings
// data.getVendorDashboard.completedOrders
```

### Suspend vendor
```typescript
const [suspend] = useSuspendVendor();
await suspend({
  variables: { vendorId: "...", reason: "..." }
});
```

## Admin Page Features

✅ Vendor listing table
✅ Search & filter by status
✅ Vendor detail view
  - Overview (basic info + analytics)
  - Products (vendor's products)
  - Orders (vendor's transactions)
✅ Suspend modal
✅ Reinstate modal
✅ Error handling
✅ Loading states

## API Endpoint Status

| Endpoint | Status | Notes |
|----------|--------|-------|
| `listVendors` | ⏳ NEEDS BACKEND | New endpoint required |
| `getVendor` | ✅ EXISTS | Public query |
| `getVendorDashboard` | ✅ EXISTS | Admin query |
| `getVendorEligibility` | ✅ EXISTS | Admin query |
| `listVendorProducts` | ✅ EXISTS | Admin query |
| `listVendorOrders` | ✅ EXISTS | Admin query |
| `suspendVendor` | ✅ EXISTS | Admin mutation |
| `reinstateVendor` | ✅ EXISTS | Admin mutation |

## Translation Keys

```typescript
t("vendors.title")
t("vendors.searchPlaceholder")
```

## Error Handling

All errors caught automatically and displayed:

```typescript
if (error) {
  return <AlertBox title="Error" message={error.message} />;
}
```

## Testing

Manual checklist in `docs/VENDOR-INTEGRATION-ADMIN.md`

## Questions?

See:
1. [VENDOR-IMPLEMENTATION-SUMMARY.md](VENDOR-IMPLEMENTATION-SUMMARY.md) - Full implementation details
2. [docs/VENDOR-INTEGRATION-ADMIN.md](docs/VENDOR-INTEGRATION-ADMIN.md) - Comprehensive guide
3. [src/hooks/admin/useVendor.ts](src/hooks/admin/useVendor.ts) - Hook source code
4. [src/types/vendor.ts](src/types/vendor.ts) - Type definitions
5. [src/pages/VendorManagement.tsx](src/pages/VendorManagement.tsx) - UI component
