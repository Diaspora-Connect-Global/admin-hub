/**
 * Re-exports: Admin auth, admin GraphQL, and opportunity hooks.
 * Prefer importing from @/hooks/auth, @/hooks/admin, or @/hooks/opportunity.
 */
export { useAdminAuth } from "./auth/useAdminAuth";
export * from "./admin";
export * from "./opportunity";
// `./vendor` shares several hook names with `./admin` (the canonical admin-scoped
// versions). Re-export only the vendor-unique hooks here to avoid ambiguity;
// consumers needing the alternate versions import them directly from "@/hooks/vendor".
export {
  useCreateVendor,
  useRequestVendorUploadUrl,
  useCreateProduct,
  useUpdateProduct,
  usePublishProduct,
  useDeleteProduct,
  useCreateServicePackage,
  useAddMilestone,
  usePublishServicePackage,
  useListVendorServicePackages,
  useRequestPayout,
} from "./vendor";
