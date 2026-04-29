import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_DASHBOARD_STATS,
  GET_SYSTEM_HEALTH,
  GET_PLATFORM_ANALYTICS,
  ADMIN_LIST_DISPUTES,
  ADMIN_LIST_ESCROWS,
  ADMIN_FREEZE_ESCROW,
  ADMIN_UNFREEZE_ESCROW,
  ADMIN_RESOLVE_DISPUTE,
  ADMIN_FORCE_RELEASE_ESCROW,
  GET_SYSTEM_ALERTS,
  ACKNOWLEDGE_ALERT,
  GET_PERFORMANCE_METRICS,
  type DashboardStats,
  type SystemHealth,
  type PlatformAnalytics,
  type AdminDispute,
  type AdminEscrow,
  type SystemAlert,
  type PerformanceMetricPoint,
} from "@/services/networks/graphql/admin";

export type { DashboardStats, SystemHealth, PlatformAnalytics, AdminDispute, AdminEscrow, SystemAlert, PerformanceMetricPoint };

/** Maps Dashboard date-range control values to `getPlatformAnalytics(period)` API strings. */
export function dashboardDateRangeToAnalyticsPeriod(
  dateRange: string
): "last_7_days" | "last_30_days" | "last_90_days" | "last_365_days" {
  switch (dateRange) {
    case "7":
      return "last_7_days";
    case "90":
      return "last_90_days";
    case "365":
      return "last_365_days";
    case "30":
    default:
      return "last_30_days";
  }
}

export function useGetDashboardStats() {
  return useQuery<{ getDashboardStats: DashboardStats }>(GET_DASHBOARD_STATS);
}

export function useGetSystemHealth() {
  return useQuery<{ getSystemHealth: SystemHealth }>(GET_SYSTEM_HEALTH);
}

export function useGetPlatformAnalytics(
  period: "last_7_days" | "last_30_days" | "last_90_days" | "last_365_days" = "last_30_days"
) {
  return useQuery<{ getPlatformAnalytics: PlatformAnalytics }>(GET_PLATFORM_ANALYTICS, {
    variables: { period },
  });
}

export function useAdminListDisputes(options: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery<{ adminListDisputes: { disputes: AdminDispute[]; total: number } }>(
    ADMIN_LIST_DISPUTES,
    {
      variables: {
        status: options.status ?? undefined,
        page: options.page ?? 1,
        limit: options.limit ?? 20,
      },
    }
  );
}

export function useAdminListEscrows(options: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery<{ adminListEscrows: { escrows: AdminEscrow[]; total: number } }>(
    ADMIN_LIST_ESCROWS,
    {
      variables: {
        status: options.status ?? undefined,
        page: options.page ?? 1,
        limit: options.limit ?? 20,
      },
    }
  );
}

export function useAdminFreezeEscrow() {
  return useMutation(ADMIN_FREEZE_ESCROW);
}

export function useAdminUnfreezeEscrow() {
  return useMutation(ADMIN_UNFREEZE_ESCROW);
}

export function useAdminForceReleaseEscrow() {
  return useMutation(ADMIN_FORCE_RELEASE_ESCROW);
}

export function useAdminResolveDispute() {
  return useMutation(ADMIN_RESOLVE_DISPUTE);
}

export function useGetSystemAlerts() {
  return useQuery<{ getSystemAlerts: SystemAlert[] }>(GET_SYSTEM_ALERTS, {
    pollInterval: 60000,
  });
}

export function useAcknowledgeAlert() {
  return useMutation<{ acknowledgeAlert: { success: boolean; message: string } }, { id: string; note: string }>(ACKNOWLEDGE_ALERT);
}

export function useGetPerformanceMetrics() {
  return useQuery<{ getPerformanceMetrics: PerformanceMetricPoint[] }>(GET_PERFORMANCE_METRICS, {
    pollInterval: 30000,
  });
}
