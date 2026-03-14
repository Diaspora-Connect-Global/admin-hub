import { gql } from "@apollo/client";

/**
 * Vendor Service — API Gateway GraphQL operations (vendor.resolver.ts).
 *
 * NOTE:
 * - Most operations require Authorization: Bearer <token> (GqlAuthGuard).
 * - createVendor is self-scoped by backend actor id.
 * - System admin views should always pass vendorId where supported.
 */

export type VendorType = "INDIVIDUAL" | "BUSINESS" | "COMMUNITY" | "ASSOCIATION";

export interface VendorDTO {
  id: string;
  vendorType: VendorType | string;
  displayName: string;
  description?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface UploadUrlDTO {
  uploadUrl: string;
  readUrl: string;
  objectKey: string;
  expiresInSeconds?: number;
  [key: string]: unknown;
}

export interface VendorDashboardDTO {
  vendorId?: string;
  totalProducts?: number;
  totalServicePackages?: number;
  totalOrders?: number;
  pendingOrders?: number;
  totalRevenue?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface VendorEligibilityDTO {
  vendorId?: string;
  canSellProducts?: boolean;
  canSellServices?: boolean;
  canRequestPayout?: boolean;
  hasPayoutAccount?: boolean;
  isKycVerified?: boolean;
  reasons?: string[];
  [key: string]: unknown;
}

export interface ProductDTO {
  id: string;
  status?: string | null;
  name?: string | null;
  title?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface ProductListPaginatedDTO {
  items: ProductDTO[];
  total: number;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

export interface ServicePackageDTO {
  id: string;
  status?: string | null;
  title?: string | null;
  name?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface ServicePackageListPaginatedDTO {
  items: ServicePackageDTO[];
  total: number;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

export interface VendorOrderDTO {
  id: string;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface VendorOrderListPaginatedDTO {
  items: VendorOrderDTO[];
  total: number;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

export interface GetVendorQueryResult {
  getVendor: VendorDTO;
}

export interface GetMyVendorQueryResult {
  getMyVendor: VendorDTO;
}

export interface GetVendorDashboardQueryResult {
  getVendorDashboard: VendorDashboardDTO;
}

export interface GetVendorEligibilityQueryResult {
  getVendorEligibility: VendorEligibilityDTO;
}

export interface ListVendorProductsQueryResult {
  listVendorProducts: ProductListPaginatedDTO;
}

export interface ListVendorServicePackagesQueryResult {
  listVendorServicePackages: ServicePackageListPaginatedDTO;
}

export interface ListVendorOrdersQueryResult {
  listVendorOrders: VendorOrderListPaginatedDTO;
}

export interface CreateVendorMutationResult {
  createVendor: VendorDTO;
}

export interface SuspendVendorMutationResult {
  suspendVendor: VendorDTO;
}

export interface ReinstateVendorMutationResult {
  reinstateVendor: VendorDTO;
}

export interface RequestVendorUploadUrlMutationResult {
  requestVendorUploadUrl: UploadUrlDTO;
}

export const CREATE_VENDOR = gql`
  mutation CreateVendor($vendorType: String!, $displayName: String!, $description: String) {
    createVendor(vendorType: $vendorType, displayName: $displayName, description: $description) {
      id
      vendorType
      displayName
      description
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_VENDOR = gql`
  query GetVendor($vendorId: String!) {
    getVendor(vendorId: $vendorId) {
      id
      vendorType
      displayName
      description
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_VENDOR = gql`
  query GetMyVendor {
    getMyVendor {
      id
      vendorType
      displayName
      description
      status
      createdAt
      updatedAt
    }
  }
`;

export const SUSPEND_VENDOR = gql`
  mutation SuspendVendor($vendorId: String!, $reason: String!) {
    suspendVendor(vendorId: $vendorId, reason: $reason) {
      id
      status
      updatedAt
    }
  }
`;

export const REINSTATE_VENDOR = gql`
  mutation ReinstateVendor($vendorId: String!) {
    reinstateVendor(vendorId: $vendorId) {
      id
      status
      updatedAt
    }
  }
`;

export const GET_VENDOR_DASHBOARD = gql`
  query GetVendorDashboard($vendorId: String) {
    getVendorDashboard(vendorId: $vendorId) {
      vendorId
      totalProducts
      totalServicePackages
      totalOrders
      pendingOrders
      totalRevenue
      currency
    }
  }
`;

export const GET_VENDOR_ELIGIBILITY = gql`
  query GetVendorEligibility($vendorId: String) {
    getVendorEligibility(vendorId: $vendorId) {
      vendorId
      canSellProducts
      canSellServices
      canRequestPayout
      hasPayoutAccount
      isKycVerified
      reasons
    }
  }
`;

export const REQUEST_VENDOR_UPLOAD_URL = gql`
  mutation RequestVendorUploadUrl(
    $vendorId: String!
    $fileName: String!
    $contentType: String!
    $fileType: String!
  ) {
    requestVendorUploadUrl(
      vendorId: $vendorId
      fileName: $fileName
      contentType: $contentType
      fileType: $fileType
    ) {
      uploadUrl
      readUrl
      objectKey
      expiresInSeconds
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      status
      updatedAt
    }
  }
`;

export const PUBLISH_PRODUCT = gql`
  mutation PublishProduct($productId: String!) {
    publishProduct(productId: $productId)
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($productId: String!) {
    deleteProduct(productId: $productId)
  }
`;

export const LIST_VENDOR_PRODUCTS = gql`
  query ListVendorProducts($vendorId: String, $status: String, $limit: Int, $offset: Int) {
    listVendorProducts(vendorId: $vendorId, status: $status, limit: $limit, offset: $offset) {
      total
      limit
      offset
      items {
        id
        status
        name
        title
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_SERVICE_PACKAGE = gql`
  mutation CreateServicePackage($input: CreateServicePackageInput!) {
    createServicePackage(input: $input) {
      id
      status
      title
      createdAt
      updatedAt
    }
  }
`;

export const ADD_MILESTONE = gql`
  mutation AddMilestone($input: AddMilestoneInput!) {
    addMilestone(input: $input) {
      id
      status
      updatedAt
    }
  }
`;

export const PUBLISH_SERVICE_PACKAGE = gql`
  mutation PublishServicePackage($packageId: String!) {
    publishServicePackage(packageId: $packageId)
  }
`;

export const LIST_VENDOR_SERVICE_PACKAGES = gql`
  query ListVendorServicePackages($vendorId: String, $status: String, $limit: Int, $offset: Int) {
    listVendorServicePackages(vendorId: $vendorId, status: $status, limit: $limit, offset: $offset) {
      total
      limit
      offset
      items {
        id
        status
        title
        name
        createdAt
        updatedAt
      }
    }
  }
`;

export const REQUEST_PAYOUT = gql`
  mutation RequestPayout($vendorId: String!, $amount: Float!, $currency: String!) {
    requestPayout(vendorId: $vendorId, amount: $amount, currency: $currency)
  }
`;

export const LIST_VENDOR_ORDERS = gql`
  query ListVendorOrders($vendorId: String, $status: String, $limit: Int, $offset: Int) {
    listVendorOrders(vendorId: $vendorId, status: $status, limit: $limit, offset: $offset) {
      total
      limit
      offset
      items {
        id
        status
        amount
        currency
        createdAt
        updatedAt
      }
    }
  }
`;
