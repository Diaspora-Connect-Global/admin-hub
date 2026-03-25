import { useMutation, useQuery } from "@apollo/client/react";
import {
  CREATE_ADMIN,
  GET_ADMIN_BY_ID,
  LIST_ADMINS,
  UPDATE_ADMIN_STATUS,
  ASSIGN_ADMIN_ROLE_MUTATION,
  REVOKE_ADMIN_ROLE_MUTATION,
  ADMIN_BAN_USER,
  ADMIN_BAN_VENDOR,
  ADMIN_REMOVE_CONTENT,
  ADMIN_FORCE_RELEASE_ESCROW,
  ADMIN_RESOLVE_DISPUTE,
  BULK_BAN_USERS,
  BULK_REMOVE_CONTENT,
  GET_ROLE_DEFINITIONS,
  CREATE_ROLE_DEFINITION,
  type AdminAccount,
  type CreateAdminInput,
  type UpdateAdminStatusInput,
  type AssignAdminRoleInput,
  type RoleDefinition,
  type CreateRoleDefinitionInput,
} from "@/services/networks/graphql/admin";

export function useCreateAdmin() {
  return useMutation<
    { createAdmin: { success: boolean; message: string; admin: AdminAccount } },
    { input: CreateAdminInput }
  >(CREATE_ADMIN);
}

export function useGetAdminById(adminId: string | null) {
  return useQuery<
    { getAdminById: { success: boolean; admin: AdminAccount } },
    { adminId: string }
  >(GET_ADMIN_BY_ID, {
    variables: { adminId: adminId || "" },
    skip: !adminId,
  });
}

export function useListAdmins(
  limit = 20,
  offset = 0,
  status?: string,
  adminType?: string
) {
  return useQuery<
    {
      listAdmins: {
        admins: AdminAccount[];
        total: number;
      };
    },
    { limit: number; offset: number; status?: string; adminType?: string }
  >(LIST_ADMINS, {
    variables: { limit, offset, status, adminType },
  });
}

export function useUpdateAdminStatus() {
  return useMutation<
    { updateAdminStatus: { success: boolean; message: string } },
    { input: UpdateAdminStatusInput }
  >(UPDATE_ADMIN_STATUS);
}

export function useAssignAdminRole() {
  return useMutation<
    {
      assignAdminRole: {
        success: boolean;
        message: string;
        assignment: {
          id: string;
          roleType: string;
          scopeType: string;
          scopeId?: string;
        };
      };
    },
    { input: AssignAdminRoleInput }
  >(ASSIGN_ADMIN_ROLE_MUTATION);
}

export function useRevokeAdminRole() {
  return useMutation<
    { revokeAdminRole: { success: boolean; message: string } },
    { roleAssignmentId: string; reason?: string }
  >(REVOKE_ADMIN_ROLE_MUTATION);
}

// ─── Enforcement Hooks ───────────────────────────────────────────────────────

export function useAdminBanUser() {
  return useMutation<
    { adminBanUser: { success: boolean; error?: string } },
    { userId: string; reason: string; permanent?: boolean }
  >(ADMIN_BAN_USER);
}

export function useAdminBanVendor() {
  return useMutation<
    { adminBanVendor: { success: boolean; error?: string } },
    { vendorId: string; reason: string; permanent?: boolean }
  >(ADMIN_BAN_VENDOR);
}

export function useAdminRemoveContent() {
  return useMutation<
    { adminRemoveContent: { success: boolean; error?: string } },
    { contentType: string; contentId: string; reason: string }
  >(ADMIN_REMOVE_CONTENT);
}

export function useAdminForceReleaseEscrow() {
  return useMutation<
    { adminForceReleaseEscrow: { success: boolean; error?: string } },
    { escrowId: string; reason: string }
  >(ADMIN_FORCE_RELEASE_ESCROW);
}

export function useAdminResolveDispute() {
  return useMutation<
    { adminResolveDispute: { success: boolean; error?: string } },
    { disputeId: string; outcome: string; notes?: string }
  >(ADMIN_RESOLVE_DISPUTE);
}

export function useBulkBanUsers() {
  return useMutation<
    { bulkBanUsers: { successCount: number; failureCount: number; failures: string[] } },
    { userIds: string[]; reason: string }
  >(BULK_BAN_USERS);
}

export function useBulkRemoveContent() {
  return useMutation<
    { bulkRemoveContent: { successCount: number; failureCount: number; failures: string[] } },
    { postIds: string[]; reason?: string }
  >(BULK_REMOVE_CONTENT);
}

// ─── Role Definition Hooks ────────────────────────────────────────────────────

export function useGetRoleDefinitions(scopeType?: string, scopeId?: string) {
  return useQuery<
    { getRoleDefinitions: { success: boolean; message?: string; roles: RoleDefinition[] } },
    { scopeType?: string; scopeId?: string; createdBy?: string }
  >(GET_ROLE_DEFINITIONS, {
    variables: { scopeType, scopeId },
  });
}

export function useCreateRoleDefinition() {
  return useMutation<
    { createRoleDefinition: { success: boolean; message: string } },
    { input: CreateRoleDefinitionInput }
  >(CREATE_ROLE_DEFINITION);
}
