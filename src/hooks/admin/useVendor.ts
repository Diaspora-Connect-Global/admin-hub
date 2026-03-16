import { useMutation, useQuery } from "@apollo/client/react";
import {
  GET_VENDOR,
  GET_MY_VENDOR,
  GET_VENDOR_DASHBOARD,
  GET_VENDOR_ELIGIBILITY,
  LIST_VENDOR_PRODUCTS,
  LIST_VENDOR_ORDERS,
  LIST_VENDORS,
  SUSPEND_VENDOR,
  REINSTATE_VENDOR,
  type GetVendorQueryResult,
  type ListVendorsQueryResult,
  type GetVendorDashboardQueryResult,
  type GetVendorEligibilityQueryResult,
  type ListVendorProductsQueryResult,
  type ListVendorOrdersQueryResult,
  type SuspendVendorMutationResult,
  type ReinstateVendorMutationResult,
} from "@/services/networks/graphql/vendor";
import type {
  Vendor,
  VendorStatus,
} from "@/types/vendor";

/**
 * Hook to fetch list of vendors (admin view)
 * Auth: Yes — System admin only
 */
export function useListVendors(
  limit = 20,
  offset = 0,
  status: VendorStatus | "all" | undefined = undefined,
  skip = false
) {
  return useQuery<
    ListVendorsQueryResult,
    { limit?: number; offset?: number; status?: string }
  >(LIST_VENDORS, {
    variables: {
      limit,
      offset,
      ...(status && status !== "all" && { status }),
    },
    skip,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });
}

/**
 * Hook to fetch a vendor's public profile
 * Auth: No
 */
export function useGetVendor(vendorId: string | null, skip = false) {
  return useQuery<GetVendorQueryResult, { vendorId: string }>(GET_VENDOR, {
    variables: { vendorId: vendorId || "" },
    skip: !vendorId || skip,
    fetchPolicy: "network-only",
  });
}

/**
 * Hook to fetch the authenticated user's vendor profile
 * Auth: Yes
 */
export function useGetMyVendor(skip = false) {
  const { data, loading, error } = useQuery<{ getMyVendor: Vendor | null }>(
    GET_MY_VENDOR,
    {
      skip,
      fetchPolicy: "network-only",
    }
  );
  return { data: data?.getMyVendor, loading, error };
}

/**
 * Hook to fetch vendor dashboard (sales analytics)
 * Auth: Yes
 * vendorId: optional — omit for authenticated user's own dashboard, admins can pass another vendor's ID
 */
export function useGetVendorDashboard(vendorId: string | null = null, skip = false) {
  return useQuery<GetVendorDashboardQueryResult, { vendorId?: string }>(
    GET_VENDOR_DASHBOARD,
    {
      variables: vendorId ? { vendorId } : {},
      skip,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );
}

/**
 * Hook to fetch vendor eligibility (KYC, payout, selling status)
 * Auth: Yes
 * Use to gate "Request Payout" or "Publish Product" buttons in the UI
 */
export function useGetVendorEligibility(vendorId: string | null = null, skip = false) {
  return useQuery<GetVendorEligibilityQueryResult, { vendorId?: string }>(
    GET_VENDOR_ELIGIBILITY,
    {
      variables: vendorId ? { vendorId } : {},
      skip,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );
}

/**
 * Hook to fetch paginated product list for a vendor
 * Auth: Yes
 * vendorId: optional — omit to default to authenticated vendor
 */
export function useListVendorProducts(
  vendorId: string | null = null,
  status: string | null = null,
  limit = 20,
  offset = 0,
  skip = false
) {
  return useQuery<
    ListVendorProductsQueryResult,
    { vendorId?: string; status?: string; limit?: number; offset?: number }
  >(LIST_VENDOR_PRODUCTS, {
    variables: {
      ...(vendorId && { vendorId }),
      ...(status && { status }),
      limit,
      offset,
    },
    skip,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });
}

/**
 * Hook to fetch paginated order list for a vendor
 * Auth: Yes
 * vendorId: optional — omit for authenticated vendor
 */
export function useListVendorOrders(
  vendorId: string | null = null,
  status: string | null = null,
  limit = 20,
  offset = 0,
  skip = false
) {
  return useQuery<
    ListVendorOrdersQueryResult,
    { vendorId?: string; status?: string; limit?: number; offset?: number }
  >(LIST_VENDOR_ORDERS, {
    variables: {
      ...(vendorId && { vendorId }),
      ...(status && { status }),
      limit,
      offset,
    },
    skip,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });
}

/**
 * Hook to suspend a vendor (admin-only)
 * Auth: Yes — System admin / moderator roles only
 */
export function useSuspendVendor() {
  return useMutation<
    SuspendVendorMutationResult,
    { vendorId: string; reason: string }
  >(SUSPEND_VENDOR);
}

/**
 * Hook to reinstate a suspended vendor (admin-only)
 * Auth: Yes — System admin / super admin only
 */
export function useReinstateVendor() {
  return useMutation<
    ReinstateVendorMutationResult,
    { vendorId: string }
  >(REINSTATE_VENDOR);
}
