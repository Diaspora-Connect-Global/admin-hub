import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  GET_MY_ROLES,
  GET_REPORTS,
  CHECK_PERMISSION,
  UPDATE_REPORT_STATUS,
  GET_REPORT,
} from "@/lib/graphql/operations";

/**
 * Convenience hooks for Admin Service GraphQL.
 * All hooks use the shared adminClient (Bearer token from session).
 */

export function useGetMyRoles() {
  return useQuery(GET_MY_ROLES);
}

export function useGetReports(options: {
  status?: string;
  targetType?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery(GET_REPORTS, {
    variables: {
      status: options.status ?? undefined,
      targetType: options.targetType ?? undefined,
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
    },
  });
}

export function useGetReport(reportId: string | null) {
  return useQuery(GET_REPORT, {
    variables: { reportId: reportId ?? "" },
    skip: !reportId,
  });
}

export function useCheckPermission(variables: {
  requiredRole: string;
  targetScopeType?: string;
  targetScopeId?: string;
  action?: string;
}) {
  return useQuery(CHECK_PERMISSION, {
    variables: {
      requiredRole: variables.requiredRole,
      targetScopeType: variables.targetScopeType ?? undefined,
      targetScopeId: variables.targetScopeId ?? undefined,
      action: variables.action ?? undefined,
    },
  });
}

export function useUpdateReportStatus() {
  return useMutation(UPDATE_REPORT_STATUS);
}

/**
 * Access the Admin Service Apollo client for one-off queries/mutations
 * (e.g. when you need to pass the client to a child or call outside React).
 */
export function useAdminClient() {
  return useApolloClient();
}
