/**
 * Vendor service TypeScript types/interfaces
 * Aligns with backend Vendor Service GraphQL schema
 */

export type VendorType = "INDIVIDUAL" | "BUSINESS" | "COMMUNITY" | "ASSOCIATION";
export type VendorStatus = "DRAFT" | "ACTIVE" | "KYC_PENDING" | "SUSPENDED";
export type ProductType = "PHYSICAL" | "DIGITAL";
export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type OrderStatus = "CREATED" | "SHIPPED" | "DELIVERED" | "REFUNDED";
export type FileType = "product" | "logo" | "download";

/**
 * Vendor capability (e.g., selling products, services)
 */
export interface VendorCapability {
  type: string;
  enabled: boolean;
}

/**
 * Payout account for vendor
 */
export interface PayoutAccount {
  id: string;
  provider: string; // e.g. "STRIPE", "PAYPAL"
  currency: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt?: string;
  verifiedAt?: string | null;
}

/**
 * Core Vendor profile
 */
export interface Vendor {
  id: string;
  userId: string;
  displayName: string;
  description?: string | null;
  type: VendorType;
  status: VendorStatus;
  logoUrl?: string | null;
  rating?: number;
  completedOrders?: number;
  capabilities?: VendorCapability[];
  payoutAccounts?: PayoutAccount[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Vendor dashboard — sales analytics
 */
export interface VendorDashboard {
  id?: string;
  vendorId?: string;
  userId?: string;
  displayName?: string;
  totalSales?: number;
  totalEarnings?: number;
  averageRating?: number;
  totalRatings?: number;
  completedOrders?: number;
  status?: VendorStatus;
}

/**
 * Vendor eligibility for operations (KYC, selling, payout)
 */
export interface VendorEligibility {
  vendorId?: string;
  canSell?: boolean; // can list products/services
  canReceivePayout?: boolean; // KYC verified AND has verified payout account
  isCompliant?: boolean; // no active suspensions
  status?: string;
  payoutAccountCount?: number;
  verifiedPayoutAccounts?: number;
  activeSuspensionCount?: number;
}

/**
 * Product/Listing
 */
export interface Product {
  id: string;
  vendorId: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  inventoryCount: number;
  productType: ProductType;
  status: ProductStatus;
  shippingProfileId?: string;
  downloadUrl?: string | null;
  images?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Paginated product list response
 */
export interface ProductListPaginated {
  totalCount: number;
  items: Product[];
  limit?: number;
  offset?: number;
}

/**
 * Service package milestone
 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  percentageOfTotal: number;
  estimatedDays: number;
  deliverables: string[];
  order: number;
}

/**
 * Service package
 */
export interface ServicePackage {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  basePrice: number;
  currency: string;
  estimatedDuration: number;
  status: ProductStatus;
  benefits?: string[];
  milestones?: Milestone[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Paginated service package list response
 */
export interface ServicePackageListPaginated {
  totalCount: number;
  items: ServicePackage[];
  limit?: number;
  offset?: number;
}

/**
 * Vendor order
 */
export interface VendorOrder {
  id: string;
  vendorId: string;
  buyerId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Paginated vendor order list response
 */
export interface VendorOrderListPaginated {
  totalCount: number;
  items: VendorOrder[];
  limit?: number;
  offset?: number;
}

/**
 * GCS signed URL for file upload
 */
export interface UploadUrl {
  uploadUrl: string; // PUT to this URL
  readUrl: string; // use this in product.images[] or logoUrl
  objectKey: string; // GCS object key (can be stored for reference)
  expiresInSeconds?: number;
}
