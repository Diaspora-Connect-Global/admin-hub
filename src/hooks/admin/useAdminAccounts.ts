import { useMutation, useQuery } from "@apollo/client/react";
import {
  CREATE_ADMIN,
  GET_ADMIN_BY_ID,
  LIST_ADMINS,
  UPDATE_ADMIN_STATUS,
  ASSIGN_ADMIN_ROLE_MUTATION,
  REVOKE_ADMIN_ROLE_MUTATION,
  type AdminAccount,
  type CreateAdminInput,
  type UpdateAdminStatusInput,
  type AssignAdminRoleInput,
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
