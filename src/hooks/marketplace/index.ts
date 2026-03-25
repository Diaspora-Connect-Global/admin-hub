/**
 * Marketplace Service hooks.
 * Auth: Bearer JWT on all guarded operations.
 */
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_MARKETPLACE_PRODUCT, SEARCH_PRODUCTS, GET_FEATURED_PRODUCTS,
  GET_VENDOR_MARKETPLACE_PRODUCTS, GET_RELATED_PRODUCTS, GET_RECOMMENDED_PRODUCTS,
  GET_MARKETPLACE_SERVICE, SEARCH_MARKETPLACE_SERVICES, GET_FEATURED_MARKETPLACE_SERVICES,
  GET_VENDOR_MARKETPLACE_SERVICES, GET_MARKETPLACE_ORDER, MY_ORDERS, MY_VENDOR_ORDERS,
  MY_ORDER_STATS, VENDOR_ORDER_STATS, CONVERT_CURRENCY, MARKETPLACE_CREATE_PRODUCT,
  MARKETPLACE_UPDATE_PRODUCT, MARKETPLACE_PUBLISH_PRODUCT, UNPUBLISH_PRODUCT,
  MARKETPLACE_DELETE_PRODUCT, CREATE_MARKETPLACE_SERVICE, PUBLISH_MARKETPLACE_SERVICE,
  DELETE_MARKETPLACE_SERVICE, CREATE_PRODUCT_ORDER, CREATE_SERVICE_ORDER,
  CANCEL_MARKETPLACE_ORDER, CONFIRM_ORDER_DELIVERY, COMPLETE_MARKETPLACE_ORDER,
  type MarketplaceProduct, type MarketplaceService, type MarketplaceOrder,
  type OrderStats, type SearchProductsInput, type SearchServicesInput,
  type CreateProductOrderInput, type CreateServiceOrderInput,
} from "@/services/networks/graphql/marketplace";

type ProductListResult = { success: boolean; products: MarketplaceProduct[]; total: number; page: number; limit: number };
type ServiceListResult = { success: boolean; services: MarketplaceService[]; total: number; page: number; limit: number };
type OrderListResult = { success: boolean; orders: MarketplaceOrder[]; total: number; page: number; limit: number };

export function useGetMarketplaceProduct(productId: string | null) {
  return useQuery<{ getProduct: { success: boolean; message?: string; product: MarketplaceProduct } }>(
    GET_MARKETPLACE_PRODUCT, { variables: { product_id: productId ?? "" }, skip: !productId }
  );
}

export function useSearchProducts(input: SearchProductsInput, skip = false) {
  return useQuery<{ searchProducts: ProductListResult }>(
    SEARCH_PRODUCTS, { variables: { input }, skip }
  );
}

export function useGetFeaturedProducts(page = 1, limit = 20) {
  return useQuery<{ getFeaturedProducts: ProductListResult }>(
    GET_FEATURED_PRODUCTS, { variables: { page, limit } }
  );
}

export function useGetVendorMarketplaceProducts(vendorId: string | null, page = 1, limit = 20) {
  return useQuery<{ getVendorProducts: ProductListResult }>(
    GET_VENDOR_MARKETPLACE_PRODUCTS, { variables: { vendor_id: vendorId ?? "", page, limit }, skip: !vendorId }
  );
}

export function useGetRelatedProducts(productId: string | null, limit = 6) {
  return useQuery<{ getRelatedProducts: ProductListResult }>(
    GET_RELATED_PRODUCTS, { variables: { product_id: productId ?? "", limit }, skip: !productId }
  );
}

export function useGetRecommendedProducts(limit = 10) {
  return useQuery<{ getRecommendedProducts: ProductListResult }>(
    GET_RECOMMENDED_PRODUCTS, { variables: { limit } }
  );
}

export function useGetMarketplaceService(serviceId: string | null) {
  return useQuery<{ getMarketplaceService: { success: boolean; message?: string; service: MarketplaceService } }>(
    GET_MARKETPLACE_SERVICE, { variables: { service_id: serviceId ?? "" }, skip: !serviceId }
  );
}

export function useSearchMarketplaceServices(input: SearchServicesInput, skip = false) {
  return useQuery<{ searchMarketplaceServices: ServiceListResult }>(
    SEARCH_MARKETPLACE_SERVICES, { variables: { input }, skip }
  );
}

export function useGetFeaturedMarketplaceServices(page = 1, limit = 20) {
  return useQuery<{ getFeaturedMarketplaceServices: ServiceListResult }>(
    GET_FEATURED_MARKETPLACE_SERVICES, { variables: { page, limit } }
  );
}

export function useGetVendorMarketplaceServices(vendorId: string | null, page = 1, limit = 20) {
  return useQuery<{ getVendorMarketplaceServices: ServiceListResult }>(
    GET_VENDOR_MARKETPLACE_SERVICES, { variables: { vendor_id: vendorId ?? "", page, limit }, skip: !vendorId }
  );
}

export function useGetMarketplaceOrder(orderId: string | null) {
  return useQuery<{ getMarketplaceOrder: { success: boolean; message?: string; order: MarketplaceOrder } }>(
    GET_MARKETPLACE_ORDER, { variables: { order_id: orderId ?? "" }, skip: !orderId }
  );
}

export function useMyOrders(status?: string, page = 1, limit = 20) {
  return useQuery<{ myOrders: OrderListResult }>(
    MY_ORDERS, { variables: { status, page, limit } }
  );
}

export function useMyVendorOrders(vendorId: string | null, status?: string, page = 1, limit = 20) {
  return useQuery<{ myVendorOrders: OrderListResult }>(
    MY_VENDOR_ORDERS, { variables: { vendor_id: vendorId ?? "", status, page, limit }, skip: !vendorId }
  );
}

export function useMyOrderStats() {
  return useQuery<{ myOrderStats: { success: boolean; stats: OrderStats } }>(MY_ORDER_STATS);
}

export function useVendorOrderStats(vendorId: string | null) {
  return useQuery<{ vendorOrderStats: { success: boolean; stats: OrderStats } }>(
    VENDOR_ORDER_STATS, { variables: { vendor_id: vendorId ?? "" }, skip: !vendorId }
  );
}

export function useConvertCurrency(amount: number, fromCurrency: string, toCurrency: string, skip = false) {
  return useQuery<{ convertCurrency: { success: boolean; converted_amount: number; to_currency: string; exchange_rate: number } }>(
    CONVERT_CURRENCY, { variables: { amount, from_currency: fromCurrency, to_currency: toCurrency }, skip }
  );
}

export function useMarketplaceCreateProduct() {
  return useMutation<{ createProduct: { success: boolean; message?: string; product: MarketplaceProduct } }>(MARKETPLACE_CREATE_PRODUCT);
}

export function useMarketplaceUpdateProduct() {
  return useMutation<{ updateProduct: { success: boolean; message?: string; product: MarketplaceProduct } }>(MARKETPLACE_UPDATE_PRODUCT);
}

export function useMarketplacePublishProduct() {
  return useMutation<{ publishProduct: { success: boolean; message?: string; product: MarketplaceProduct } }, { product_id: string }>(MARKETPLACE_PUBLISH_PRODUCT);
}

export function useUnpublishProduct() {
  return useMutation<{ unpublishProduct: { success: boolean; message?: string; product: MarketplaceProduct } }, { product_id: string }>(UNPUBLISH_PRODUCT);
}

export function useMarketplaceDeleteProduct() {
  return useMutation<{ deleteProduct: { success: boolean; message: string } }, { product_id: string }>(MARKETPLACE_DELETE_PRODUCT);
}

export function useCreateMarketplaceService() {
  return useMutation<{ createMarketplaceService: { success: boolean; message?: string; service: MarketplaceService } }>(CREATE_MARKETPLACE_SERVICE);
}

export function usePublishMarketplaceService() {
  return useMutation<{ publishMarketplaceService: { success: boolean; message?: string; service: MarketplaceService } }, { service_id: string }>(PUBLISH_MARKETPLACE_SERVICE);
}

export function useDeleteMarketplaceService() {
  return useMutation<{ deleteMarketplaceService: { success: boolean; message: string } }, { service_id: string }>(DELETE_MARKETPLACE_SERVICE);
}

export function useCreateProductOrder() {
  return useMutation<{ createProductOrder: { success: boolean; message?: string; order: MarketplaceOrder } }, { input: CreateProductOrderInput }>(CREATE_PRODUCT_ORDER);
}

export function useCreateServiceOrder() {
  return useMutation<{ createServiceOrder: { success: boolean; message?: string; order: MarketplaceOrder } }, { input: CreateServiceOrderInput }>(CREATE_SERVICE_ORDER);
}

export function useCancelMarketplaceOrder() {
  return useMutation<{ cancelMarketplaceOrder: { success: boolean; message?: string; order: MarketplaceOrder } }, { order_id: string; reason?: string }>(CANCEL_MARKETPLACE_ORDER);
}

export function useConfirmOrderDelivery() {
  return useMutation<{ confirmOrderDelivery: { success: boolean; message?: string; order: MarketplaceOrder } }, { order_id: string }>(CONFIRM_ORDER_DELIVERY);
}

export function useCompleteMarketplaceOrder() {
  return useMutation<{ completeMarketplaceOrder: { success: boolean; message?: string; order: MarketplaceOrder } }, { order_id: string }>(COMPLETE_MARKETPLACE_ORDER);
}
