import { useMutation, useQuery } from "@apollo/client/react";
import {
  GET_VENDOR,
  GET_MY_VENDOR,
  GET_VENDOR_DASHBOARD,
  GET_VENDOR_ELIGIBILITY,
  LIST_VENDOR_PRODUCTS,
  LIST_VENDOR_ORDERS,
  LIST_VENDORS,
  GET_VENDOR_SUSPENSION_HISTORY,
  APPROVE_VENDOR_KYC,
  REJECT_VENDOR_KYC,
  VERIFY_VENDOR,
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
  type GetVendorSuspensionHistoryQueryResult,
  type ApproveVendorKycMutationResult,
  type RejectVendorKycMutationResult,
  type VerifyVendorMutationResult,
} from "@/services/networks/graphql/vendor";
import type {
  Vendor,
  VendorStatus,
} from "@/types/vendor";

export interface ListVendorsInput {
  status?: VendorStatus | string;
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook to fetch list of vendors (admin view)
 * Auth: Yes — System admin only
 */
export function useListVendors(input: ListVendorsInput = {}, skip = false) {
  const { status, type, search, limit = 20, offset = 0 } = input;
  const result = useQuery<
    ListVendorsQueryResult,
    { input: ListVendorsInput }
  >(LIST_VENDORS, {
    variables: {
      input: {
        limit,
        offset,
        ...(status && status !== "all" && { status }),
        ...(type && { type }),
        ...(search && { search }),
      },
    },
    skip,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const vendors = result.data?.listVendors?.vendors ?? [];
  const total = result.data?.listVendors?.total ?? 0;
  const resultLimit = result.data?.listVendors?.limit ?? limit;
  const resultOffset = result.data?.listVendors?.offset ?? offset;

  return { ...result, vendors, total, limit: resultLimit, offset: resultOffset };
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

/**
 * Hook to fetch suspension history for a vendor (admin-only)
 * Auth: Yes — System admin only
 */
export function useGetVendorSuspensionHistory(vendorId: string | undefined, skip = false) {
  const result = useQuery<
    GetVendorSuspensionHistoryQueryResult,
    { vendorId: string }
  >(GET_VENDOR_SUSPENSION_HISTORY, {
    variables: { vendorId: vendorId || "" },
    skip: !vendorId || skip,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const suspensions = result.data?.getVendorSuspensionHistory ?? [];
  return { suspensions, loading: result.loading, error: result.error };
}

/**
 * Hook to approve vendor KYC (admin-only)
 * Auth: Yes — System admin only
 */
export function useApproveVendorKyc() {
  return useMutation<
    ApproveVendorKycMutationResult,
    { vendorId: string }
  >(APPROVE_VENDOR_KYC);
}

/**
 * Hook to reject vendor KYC with reason (admin-only)
 * Auth: Yes — System admin only
 */
export function useRejectVendorKyc() {
  return useMutation<
    RejectVendorKycMutationResult,
    { vendorId: string; reason: string }
  >(REJECT_VENDOR_KYC);
}

/**
 * Hook to verify a vendor (admin-only)
 * Auth: Yes — System admin only
 */
export function useVerifyVendor() {
  return useMutation<
    VerifyVendorMutationResult,
    { vendorId: string }
  >(VERIFY_VENDOR);
}
