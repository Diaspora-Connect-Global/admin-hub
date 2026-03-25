import { gql } from "@apollo/client";

/**
 * Marketplace Service — GraphQL operations.
 * Auth: Bearer JWT required on guarded operations.
 */

// ─── Fragments ───────────────────────────────────────────────────────────────

export const MARKETPLACE_PRODUCT_FIELDS = gql`
  fragment MarketplaceProductFields on MarketplaceProductType {
    id
    vendor_id
    title
    description
    price
    currency
    inventory_count
    status
    product_type
    images
    tags
    download_url
    shipping_profile_id
    created_at
    updated_at
  }
`;

export const MARKETPLACE_SERVICE_FIELDS = gql`
  fragment MarketplaceServiceFields on MarketplaceServiceType {
    id
    vendor_id
    title
    description
    base_price
    currency
    status
    tags
    created_at
    updated_at
  }
`;

export const MARKETPLACE_ORDER_FIELDS = gql`
  fragment MarketplaceOrderFields on MarketplaceOrderType {
    id
    buyer_id
    vendor_id
    status
    items {
      product_id
      quantity
      price
      currency
    }
    total_amount
    currency
    shipping_address
    notes
    created_at
    updated_at
  }
`;

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface MarketplaceProduct {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  inventory_count: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  product_type: "PHYSICAL" | "DIGITAL";
  images: string[];
  tags: string[];
  download_url?: string;
  shipping_profile_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceService {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  base_price: number;
  currency: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  vendor_id: string;
  status: "PENDING" | "CONFIRMED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "DISPUTED";
  items?: OrderItem[];
  total_amount: number;
  currency: string;
  shipping_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStats {
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_spent: number;
  currency: string;
}

export interface SearchProductsInput {
  query?: string;
  category?: string;
  vendor_id?: string;
  min_price?: number;
  max_price?: number;
  product_type?: string;
  page?: number;
  limit?: number;
}

export interface SearchServicesInput {
  query?: string;
  vendor_id?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

export interface CreateProductOrderInput {
  vendor_id: string;
  items: { product_id: string; quantity: number }[];
  shipping_address?: string;
  notes?: string;
}

export interface CreateServiceOrderInput {
  service_id: string;
  notes?: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const GET_MARKETPLACE_PRODUCT = gql`
  ${MARKETPLACE_PRODUCT_FIELDS}
  query GetProduct($product_id: ID!) {
    getProduct(product_id: $product_id) {
      success
      message
      product { ...MarketplaceProductFields }
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  ${MARKETPLACE_PRODUCT_FIELDS}
  query SearchProducts($input: SearchProductsInput!) {
    searchProducts(input: $input) {
      success
      products { ...MarketplaceProductFields }
      total
      page
      limit
    }
  }
`;

export const GET_FEATURED_PRODUCTS = gql`
  ${MARKETPLACE_PRODUCT_FIELDS}
  query GetFeaturedProducts($page: Int, $limit: Int) {
    getFeaturedProducts(page: $page, limit: $limit) {
      success
      products { ...MarketplaceProductFields }
      total
      page
      limit
    }
  }
`;

export const GET_VENDOR_MARKETPLACE_PRODUCTS = gql`
  ${MARKETPLACE_PRODUCT_FIELDS}
  query GetVendorProducts($vendor_id: ID!, $page: Int, $limit: Int) {
    getVendorProducts(vendor_id: $vendor_id, page: $page, limit: $limit) {
      success
      products { ...MarketplaceProductFields }
      total
      page
      limit
    }
  }
`;

export const GET_RELATED_PRODUCTS = gql`
  ${MARKETPLACE_PRODUCT_FIELDS}
  query GetRelatedProducts($product_id: ID!, $limit: Int) {
    getRelatedProducts(product_id: $product_id, limit: $limit) {
      success
      products { ...MarketplaceProductFields }
      total
      page
      limit
    }
  }
`;

export const GET_RECOMMENDED_PRODUCTS = gql`
  ${MARKETPLACE_PRODUCT_FIELDS}
  query GetRecommendedProducts($limit: Int) {
    getRecommendedProducts(limit: $limit) {
      success
      products { ...MarketplaceProductFields }
      total
      page
      limit
    }
  }
`;

export const GET_MARKETPLACE_SERVICE = gql`
  ${MARKETPLACE_SERVICE_FIELDS}
  query GetMarketplaceService($service_id: ID!) {
    getMarketplaceService(service_id: $service_id) {
      success
      message
      service { ...MarketplaceServiceFields }
    }
  }
`;

export const SEARCH_MARKETPLACE_SERVICES = gql`
  ${MARKETPLACE_SERVICE_FIELDS}
  query SearchMarketplaceServices($input: SearchServicesInput!) {
    searchMarketplaceServices(input: $input) {
      success
      services { ...MarketplaceServiceFields }
      total
      page
      limit
    }
  }
`;

export const GET_FEATURED_MARKETPLACE_SERVICES = gql`
  ${MARKETPLACE_SERVICE_FIELDS}
  query GetFeaturedMarketplaceServices($page: Int, $limit: Int) {
    getFeaturedMarketplaceServices(page: $page, limit: $limit) {
      success
      services { ...MarketplaceServiceFields }
      total
      page
      limit
    }
  }
`;

export const GET_VENDOR_MARKETPLACE_SERVICES = gql`
  ${MARKETPLACE_SERVICE_FIELDS}
  query GetVendorMarketplaceServices($vendor_id: ID!, $page: Int, $limit: Int) {
    getVendorMarketplaceServices(vendor_id: $vendor_id, page: $page, limit: $limit) {
      success
      services { ...MarketplaceServiceFields }
      total
      page
      limit
    }
  }
`;

export const GET_MARKETPLACE_ORDER = gql`
  ${MARKETPLACE_ORDER_FIELDS}
  query GetMarketplaceOrder($order_id: ID!) {
    getMarketplaceOrder(order_id: $order_id) {
      success
      message
      order { ...MarketplaceOrderFields }
    }
  }
`;

export const MY_ORDERS = gql`
  ${MARKETPLACE_ORDER_FIELDS}
  query MyOrders($status: String, $page: Int, $limit: Int) {
    myOrders(status: $status, page: $page, limit: $limit) {
      success
      orders { ...MarketplaceOrderFields }
      total
      page
      limit
    }
  }
`;

export const MY_VENDOR_ORDERS = gql`
  ${MARKETPLACE_ORDER_FIELDS}
  query MyVendorOrders($vendor_id: ID!, $status: String, $page: Int, $limit: Int) {
    myVendorOrders(vendor_id: $vendor_id, status: $status, page: $page, limit: $limit) {
      success
      orders { ...MarketplaceOrderFields }
      total
      page
      limit
    }
  }
`;

export const MY_ORDER_STATS = gql`
  query MyOrderStats {
    myOrderStats {
      success
      stats {
        total_orders
        completed_orders
        cancelled_orders
        total_spent
        currency
      }
    }
  }
`;

export const VENDOR_ORDER_STATS = gql`
  query VendorOrderStats($vendor_id: ID!) {
    vendorOrderStats(vendor_id: $vendor_id) {
      success
      stats {
        total_orders
        completed_orders
        cancelled_orders
        total_spent
        currency
      }
    }
  }
`;

export const CONVERT_CURRENCY = gql`
  query ConvertCurrency($amount: Float!, $from_currency: String!, $to_currency: String!) {
    convertCurrency(amount: $amount, from_currency: $from_currency, to_currency: $to_currency) {
      success
      converted_amount
      to_currency
      exchange_rate
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const MARKETPLACE_CREATE_PRODUCT = gql`
  ${MARKETPLACE_PRODUCT_FIELDS}
  mutation MarketplaceCreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      success
      message
      product { ...MarketplaceProductFields }
    }
  }
`;

export const MARKETPLACE_UPDATE_PRODUCT = gql`
  ${MARKETPLACE_PRODUCT_FIELDS}
  mutation MarketplaceUpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      success
      message
      product { ...MarketplaceProductFields }
    }
  }
`;

export const MARKETPLACE_PUBLISH_PRODUCT = gql`
  ${MARKETPLACE_PRODUCT_FIELDS}
  mutation MarketplacePublishProduct($product_id: ID!) {
    publishProduct(product_id: $product_id) {
      success
      message
      product { ...MarketplaceProductFields }
    }
  }
`;

export const UNPUBLISH_PRODUCT = gql`
  ${MARKETPLACE_PRODUCT_FIELDS}
  mutation UnpublishProduct($product_id: ID!) {
    unpublishProduct(product_id: $product_id) {
      success
      message
      product { ...MarketplaceProductFields }
    }
  }
`;

export const MARKETPLACE_DELETE_PRODUCT = gql`
  mutation MarketplaceDeleteProduct($product_id: ID!) {
    deleteProduct(product_id: $product_id) {
      success
      message
    }
  }
`;

export const CREATE_MARKETPLACE_SERVICE = gql`
  ${MARKETPLACE_SERVICE_FIELDS}
  mutation CreateMarketplaceService($input: CreateServiceInput!) {
    createMarketplaceService(input: $input) {
      success
      message
      service { ...MarketplaceServiceFields }
    }
  }
`;

export const PUBLISH_MARKETPLACE_SERVICE = gql`
  ${MARKETPLACE_SERVICE_FIELDS}
  mutation PublishMarketplaceService($service_id: ID!) {
    publishMarketplaceService(service_id: $service_id) {
      success
      message
      service { ...MarketplaceServiceFields }
    }
  }
`;

export const DELETE_MARKETPLACE_SERVICE = gql`
  mutation DeleteMarketplaceService($service_id: ID!) {
    deleteMarketplaceService(service_id: $service_id) {
      success
      message
    }
  }
`;

export const CREATE_PRODUCT_ORDER = gql`
  ${MARKETPLACE_ORDER_FIELDS}
  mutation CreateProductOrder($input: CreateProductOrderInput!) {
    createProductOrder(input: $input) {
      success
      message
      order { ...MarketplaceOrderFields }
    }
  }
`;

export const CREATE_SERVICE_ORDER = gql`
  ${MARKETPLACE_ORDER_FIELDS}
  mutation CreateServiceOrder($input: CreateServiceOrderInput!) {
    createServiceOrder(input: $input) {
      success
      message
      order { ...MarketplaceOrderFields }
    }
  }
`;

export const CANCEL_MARKETPLACE_ORDER = gql`
  ${MARKETPLACE_ORDER_FIELDS}
  mutation CancelMarketplaceOrder($order_id: ID!, $reason: String) {
    cancelMarketplaceOrder(order_id: $order_id, reason: $reason) {
      success
      message
      order { ...MarketplaceOrderFields }
    }
  }
`;

export const CONFIRM_ORDER_DELIVERY = gql`
  ${MARKETPLACE_ORDER_FIELDS}
  mutation ConfirmOrderDelivery($order_id: ID!) {
    confirmOrderDelivery(order_id: $order_id) {
      success
      message
      order { ...MarketplaceOrderFields }
    }
  }
`;

export const COMPLETE_MARKETPLACE_ORDER = gql`
  ${MARKETPLACE_ORDER_FIELDS}
  mutation CompleteMarketplaceOrder($order_id: ID!) {
    completeMarketplaceOrder(order_id: $order_id) {
      success
      message
      order { ...MarketplaceOrderFields }
    }
  }
`;
