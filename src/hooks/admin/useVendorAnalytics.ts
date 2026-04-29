import { useQuery } from "@apollo/client/react";
import {
  GET_VENDOR_SALES_ANALYTICS,
  type VendorSalesAnalyticsResponse,
} from "@/services/networks/graphql/admin/operations";

export type { VendorSalesAnalyticsResponse };

/**
 * Fetches vendor sales analytics for the given period.
 *
 * @param period - One of "last_7_days" | "last_30_days" | "last_90_days" | "last_365_days".
 *                 Defaults to "last_30_days" when omitted.
 */
export function useGetVendorSalesAnalytics(period?: string) {
  return useQuery<{ getVendorSalesAnalytics: VendorSalesAnalyticsResponse }>(
    GET_VENDOR_SALES_ANALYTICS,
    {
      variables: { period: period ?? "last_30_days" },
    },
  );
}
