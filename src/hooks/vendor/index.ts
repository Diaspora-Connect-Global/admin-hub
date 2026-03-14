import { useMutation, useQuery } from "@apollo/client/react";
import {
  ADD_MILESTONE,
  CREATE_PRODUCT,
  CREATE_SERVICE_PACKAGE,
  CREATE_VENDOR,
  DELETE_PRODUCT,
  GET_MY_VENDOR,
  GET_VENDOR,
  GET_VENDOR_DASHBOARD,
  GET_VENDOR_ELIGIBILITY,
  LIST_VENDOR_ORDERS,
  LIST_VENDOR_PRODUCTS,
  LIST_VENDOR_SERVICE_PACKAGES,
  PUBLISH_PRODUCT,
  PUBLISH_SERVICE_PACKAGE,
  REINSTATE_VENDOR,
  REQUEST_PAYOUT,
  REQUEST_VENDOR_UPLOAD_URL,
  SUSPEND_VENDOR,
  UPDATE_PRODUCT,
  type GetMyVendorQueryResult,
  type GetVendorDashboardQueryResult,
  type GetVendorEligibilityQueryResult,
  type GetVendorQueryResult,
  type ListVendorOrdersQueryResult,
  type ListVendorProductsQueryResult,
  type ListVendorServicePackagesQueryResult,
} from "@/services/networks/graphql/vendor";

export function useCreateVendor() {
  return useMutation(CREATE_VENDOR);
}

export function useGetVendor(vendorId: string | null) {
  return useQuery<GetVendorQueryResult>(GET_VENDOR, {
    variables: { vendorId: vendorId ?? "" },
    skip: !vendorId,
  });
}

export function useGetMyVendor(skip = false) {
  return useQuery<GetMyVendorQueryResult>(GET_MY_VENDOR, {
    skip,
  });
}

export function useSuspendVendor() {
  return useMutation(SUSPEND_VENDOR);
}

export function useReinstateVendor() {
  return useMutation(REINSTATE_VENDOR);
}

export function useGetVendorDashboard(vendorId: string | null) {
  return useQuery<GetVendorDashboardQueryResult>(GET_VENDOR_DASHBOARD, {
    variables: { vendorId: vendorId ?? undefined },
    skip: !vendorId,
    fetchPolicy: "network-only",
  });
}

export function useGetVendorEligibility(vendorId: string | null) {
  return useQuery<GetVendorEligibilityQueryResult>(GET_VENDOR_ELIGIBILITY, {
    variables: { vendorId: vendorId ?? undefined },
    skip: !vendorId,
    fetchPolicy: "network-only",
  });
}

export function useRequestVendorUploadUrl() {
  return useMutation(REQUEST_VENDOR_UPLOAD_URL);
}

export function useCreateProduct() {
  return useMutation(CREATE_PRODUCT);
}

export function useUpdateProduct() {
  return useMutation(UPDATE_PRODUCT);
}

export function usePublishProduct() {
  return useMutation(PUBLISH_PRODUCT);
}

export function useDeleteProduct() {
  return useMutation(DELETE_PRODUCT);
}

export function useListVendorProducts(options: {
  vendorId: string | null;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<ListVendorProductsQueryResult>(LIST_VENDOR_PRODUCTS, {
    variables: {
      vendorId: options.vendorId ?? undefined,
      status: options.status ?? undefined,
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
    },
    skip: !options.vendorId,
    fetchPolicy: "network-only",
  });
}

export function useCreateServicePackage() {
  return useMutation(CREATE_SERVICE_PACKAGE);
}

export function useAddMilestone() {
  return useMutation(ADD_MILESTONE);
}

export function usePublishServicePackage() {
  return useMutation(PUBLISH_SERVICE_PACKAGE);
}

export function useListVendorServicePackages(options: {
  vendorId: string | null;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<ListVendorServicePackagesQueryResult>(LIST_VENDOR_SERVICE_PACKAGES, {
    variables: {
      vendorId: options.vendorId ?? undefined,
      status: options.status ?? undefined,
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
    },
    skip: !options.vendorId,
    fetchPolicy: "network-only",
  });
}

export function useRequestPayout() {
  return useMutation(REQUEST_PAYOUT);
}

export function useListVendorOrders(options: {
  vendorId: string | null;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<ListVendorOrdersQueryResult>(LIST_VENDOR_ORDERS, {
    variables: {
      vendorId: options.vendorId ?? undefined,
      status: options.status ?? undefined,
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
    },
    skip: !options.vendorId,
    fetchPolicy: "network-only",
  });
}
