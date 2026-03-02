/**
 * Admin service GraphQL hooks. Use the shared admin client (Bearer from session).
 * Replace stub hooks with real operations from @/services/admin when backend is ready.
 */

import { gql } from "@apollo/client";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  GET_MY_ROLES,
  GET_REPORTS,
  GET_REPORT,
  CHECK_PERMISSION,
  UPDATE_REPORT_STATUS,
  GET_ADMIN_ROLES,
  GET_MODERATION_ACTIONS,
  GET_CONTENT_PRIORITIES,
  GET_COMMUNITY_STATS,
  GET_ASSOCIATION_STATS,
  GET_AUDIT_LOGS,
  ADMIN_LOGIN,
  ASSIGN_ADMIN_ROLE,
  REVOKE_ADMIN_ROLE,
  CREATE_REPORT,
  BAN_USER,
  UNBAN_USER,
  DELETE_POST,
  BOOST_CONTENT,
  UNBOOST_CONTENT,
  CREATE_COMMUNITY,
  CREATE_ASSOCIATION,
  ASSIGN_MEMBER_ROLE,
} from "@/services/networks/graphql/admin";

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

export function useLoginMutation() {
  return useMutation(ADMIN_LOGIN);
}

export function useGetAdminRoles(variables: {
  userId?: string | null;
  scopeType?: string | null;
  scopeId?: string | null;
}) {
  return useQuery(GET_ADMIN_ROLES, {
    variables: {
      userId: variables.userId ?? undefined,
      scopeType: variables.scopeType ?? undefined,
      scopeId: variables.scopeId ?? undefined,
    },
  });
}

export function useGetModerationActions(options: {
  adminId?: string | null;
  actionType?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  limit?: number;
  offset?: number;
}) {
  return useQuery(GET_MODERATION_ACTIONS, {
    variables: {
      adminId: options.adminId ?? undefined,
      actionType: options.actionType ?? undefined,
      targetType: options.targetType ?? undefined,
      targetId: options.targetId ?? undefined,
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
    },
  });
}

export function useGetContentPriorities(variables: {
  priorityLevel?: string | null;
  scopeType?: string | null;
  scopeId?: string | null;
}) {
  return useQuery(GET_CONTENT_PRIORITIES, {
    variables: {
      priorityLevel: variables.priorityLevel ?? undefined,
      scopeType: variables.scopeType ?? undefined,
      scopeId: variables.scopeId ?? undefined,
    },
  });
}

export function useGetCommunityStats(communityId: string | null) {
  return useQuery(GET_COMMUNITY_STATS, {
    variables: { communityId: communityId ?? "" },
    skip: !communityId,
  });
}

export function useGetAssociationStats(associationId: string | null) {
  return useQuery(GET_ASSOCIATION_STATS, {
    variables: { associationId: associationId ?? "" },
    skip: !associationId,
  });
}

export function useGetAuditLogs(options: {
  actorId?: string | null;
  action?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  limit?: number;
  offset?: number;
}) {
  return useQuery(GET_AUDIT_LOGS, {
    variables: {
      actorId: options.actorId ?? undefined,
      action: options.action ?? undefined,
      resourceType: options.resourceType ?? undefined,
      resourceId: options.resourceId ?? undefined,
      fromDate: options.fromDate ?? undefined,
      toDate: options.toDate ?? undefined,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    },
  });
}

export function useAssignAdminRole() {
  return useMutation(ASSIGN_ADMIN_ROLE);
}
export function useRevokeAdminRole() {
  return useMutation(REVOKE_ADMIN_ROLE);
}
export function useCreateReport() {
  return useMutation(CREATE_REPORT);
}
export function useBanUser() {
  return useMutation(BAN_USER);
}
export function useUnbanUser() {
  return useMutation(UNBAN_USER);
}
export function useDeletePost() {
  return useMutation(DELETE_POST);
}
export function useBoostContent() {
  return useMutation(BOOST_CONTENT);
}
export function useUnboostContent() {
  return useMutation(UNBOOST_CONTENT);
}
export function useCreateCommunity() {
  return useMutation(CREATE_COMMUNITY);
}
export function useCreateAssociation() {
  return useMutation(CREATE_ASSOCIATION);
}
export function useAssignMemberRole() {
  return useMutation(ASSIGN_MEMBER_ROLE);
}

export function useForgotPassword() {
  return useMutation(gql`
    mutation ForgotPassword($email: String!) {
      forgotPassword(email: $email) {
        success
        message
      }
    }
  `);
}

export function useGetUsers(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  skip?: boolean;
}) {
  return useQuery(
    gql`
      query GetUsers($limit: Int, $offset: Int, $search: String) {
        getUsers(limit: $limit, offset: $offset, search: $search) {
          items { id email displayName createdAt }
          total
          limit
          offset
        }
      }
    `,
    {
      variables: {
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
        search: options?.search ?? undefined,
      },
      skip: options?.skip ?? true,
    }
  );
}

export function useAdminClient() {
  return useApolloClient();
}
