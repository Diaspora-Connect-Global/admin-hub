import { useMutation, useQuery } from "@apollo/client/react";
import {
  CREATE_ASSOCIATION,
  GET_ASSOCIATION,
  SEARCH_ASSOCIATIONS,
  UPDATE_ASSOCIATION,
  LINK_ASSOCIATION,
  UNLINK_ASSOCIATION,
  APPROVE_MEMBERSHIP,
  REJECT_MEMBERSHIP,
  REMOVE_MEMBER,
  INVITE_MEMBER,
  GET_ASSOCIATION_MEMBERS,
  GET_PENDING_MEMBERSHIP_REQUESTS,
  GET_ASSOCIATION_AVATAR_UPLOAD_URL,
  GET_ASSOCIATION_STATS,
  UPDATE_COMMUNITY,
  UPDATE_COMMUNITY_VISIBILITY,
  UPDATE_COMMUNITY_JOIN_POLICY,
  SOFT_DELETE_COMMUNITY,
  RESTORE_COMMUNITY,
  SEARCH_COMMUNITIES_ADVANCED,
  COMMUNITY_BAN_USER,
  COMMUNITY_UNBAN_USER,
  SUSPEND_MEMBER,
  UNSUSPEND_MEMBER,
  TRANSFER_OWNERSHIP,
  GET_MODERATION_LOGS,
  GET_BANNED_USERS_LIST,
  GET_SUSPENDED_USERS_LIST,
  LIST_COMMUNITY_MEMBERS,
  LIST_ASSOCIATION_MEMBERS,
  SEARCH_MEMBERS,
  GET_COMMUNITY_AVATAR_UPLOAD_URL,
  GET_COMMUNITY_COVER_UPLOAD_URL,
  DELETE_ENTITY_IMAGE,
  type Association,
  type CreateAssociationInput,
  type UpdateAssociationInput,
  type AssociationMember,
  type MembershipActionInput,
  type UpdateCommunityInput,
  type CommunityMutationPayload,
} from "@/services/networks/graphql/admin/operations";

// ─── Input / Result types ────────────────────────────────────────────────────

export interface SearchAssociationsInput {
  query?: string;
  page?: number;
  limit?: number;
  associationTypeId?: string;
  visibility?: string;
}

interface SearchAssociationsResult {
  searchAssociations: {
    associations: Association[];
    total: number;
    page: number;
    limit: number;
  };
}

interface GetAssociationResult {
  getAssociation: Association;
}

interface CreateAssociationResult {
  createAssociation: {
    id: string;
    name: string;
    defaultGroupId: string;
    joinPolicy: string;
    visibility: string;
    createdAt: string;
  };
}

interface UpdateAssociationResult {
  updateAssociation: Association;
}

interface MutationSuccessResult {
  success: boolean;
  message: string;
}

interface GetAssociationMembersResult {
  getAssociationMembers: {
    members: AssociationMember[];
    total: number;
    page: number;
  };
}

interface GetPendingRequestsResult {
  getPendingMembershipRequests: {
    requests: { userId: string; requestedAt: string; message?: string }[];
    total: number;
  };
}

interface AvatarUploadUrlResult {
  getAssociationAvatarUploadUrl: {
    uploadUrl: string;
    fileKey: string;
  };
}

interface AssociationStatsResult {
  getAssociationStats: {
    totalMembers: number;
    activeMembers: number;
    pendingRequests: number;
  };
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useCreateAssociation() {
  return useMutation<CreateAssociationResult, { input: CreateAssociationInput }>(
    CREATE_ASSOCIATION,
  );
}

export function useGetAssociation(id: string | null) {
  return useQuery<GetAssociationResult>(GET_ASSOCIATION, {
    variables: { id: id ?? "" },
    skip: !id,
  });
}

export function useSearchAssociations(input: SearchAssociationsInput) {
  return useQuery<SearchAssociationsResult>(SEARCH_ASSOCIATIONS, {
    variables: { input },
  });
}

export function useUpdateAssociation() {
  return useMutation<UpdateAssociationResult, { input: UpdateAssociationInput }>(
    UPDATE_ASSOCIATION,
  );
}

export function useLinkAssociation() {
  return useMutation<
    { linkAssociation: MutationSuccessResult },
    { input: { associationId: string; communityId: string } }
  >(LINK_ASSOCIATION);
}

export function useUnlinkAssociation() {
  return useMutation<
    { unlinkAssociation: MutationSuccessResult },
    { input: { associationId: string; communityId: string } }
  >(UNLINK_ASSOCIATION);
}

export function useApproveMembership() {
  return useMutation<
    { approveMembership: MutationSuccessResult },
    { input: MembershipActionInput }
  >(APPROVE_MEMBERSHIP);
}

export function useRejectMembership() {
  return useMutation<
    { rejectMembership: MutationSuccessResult },
    { input: MembershipActionInput }
  >(REJECT_MEMBERSHIP);
}

export function useRemoveMember() {
  return useMutation<
    { removeMember: MutationSuccessResult },
    { input: MembershipActionInput }
  >(REMOVE_MEMBER);
}

export function useInviteMember() {
  return useMutation<
    { inviteMember: MutationSuccessResult },
    { input: MembershipActionInput }
  >(INVITE_MEMBER);
}

export function useGetAssociationMembers(
  associationId: string | null,
  options?: { page?: number; limit?: number; status?: string },
) {
  return useQuery<GetAssociationMembersResult>(GET_ASSOCIATION_MEMBERS, {
    variables: {
      associationId: associationId ?? "",
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
      status: options?.status ?? undefined,
    },
    skip: !associationId,
  });
}

export function useGetPendingMembershipRequests(
  entityId: string | null,
  entityType: "COMMUNITY" | "ASSOCIATION",
) {
  return useQuery<GetPendingRequestsResult>(GET_PENDING_MEMBERSHIP_REQUESTS, {
    variables: { entityId: entityId ?? "", entityType },
    skip: !entityId,
  });
}

export function useGetAssociationAvatarUploadUrl() {
  return useMutation<AvatarUploadUrlResult, { associationId: string }>(
    GET_ASSOCIATION_AVATAR_UPLOAD_URL,
  );
}

export function useAssociationStats(associationId: string | null) {
  return useQuery<AssociationStatsResult>(GET_ASSOCIATION_STATS, {
    variables: { associationId: associationId ?? "" },
    skip: !associationId,
  });
}

// ─── Community Management Hooks ──────────────────────────────────────────────

export function useUpdateCommunity() {
  return useMutation<
    { updateCommunity: CommunityMutationPayload },
    { id: string; input: UpdateCommunityInput }
  >(UPDATE_COMMUNITY);
}

export function useUpdateCommunityVisibility() {
  return useMutation<
    { updateCommunityVisibility: { id: string; visibility: string; updatedAt: string } },
    { communityId: string; visibility: string }
  >(UPDATE_COMMUNITY_VISIBILITY);
}

export function useUpdateCommunityJoinPolicy() {
  return useMutation<
    { updateCommunityJoinPolicy: { id: string; joinPolicy: string; updatedAt: string } },
    { communityId: string; joinPolicy: string; priceAmount?: number; priceCurrency?: string }
  >(UPDATE_COMMUNITY_JOIN_POLICY);
}

export function useSoftDeleteCommunity() {
  return useMutation<
    { softDeleteCommunity: { success: boolean; message: string; deletedAt: string } },
    { communityId: string }
  >(SOFT_DELETE_COMMUNITY);
}

export function useRestoreCommunity() {
  return useMutation<
    { restoreCommunity: { success: boolean; message: string; restoredAt: string } },
    { communityId: string }
  >(RESTORE_COMMUNITY);
}

export function useSearchCommunitiesAdvanced(variables?: {
  searchTerm?: string;
  communityTypeId?: string;
  visibility?: string;
  country?: string;
  limit?: number;
  offset?: number;
}, skip = false) {
  return useQuery<{
    searchCommunitiesAdvanced: {
      communities: Array<{
        id: string; name: string; description?: string; visibility: string; joinPolicy: string;
        communityTypeId?: string; communityType?: { id: string; name: string; isEmbassy: boolean };
        memberCount?: number; createdAt: string; avatarUrl?: string;
      }>;
      total: number;
    };
  }>(SEARCH_COMMUNITIES_ADVANCED, { variables, skip });
}

// ─── Community Moderation Hooks ───────────────────────────────────────────────

export function useCommunityBanUser() {
  return useMutation<
    { banUser: { success: boolean; message: string; bannedAt: string } },
    { userId: string; entityId: string; entityType: string; reason?: string }
  >(COMMUNITY_BAN_USER);
}

export function useCommunityUnbanUser() {
  return useMutation<
    { unbanUser: { success: boolean; message: string; unbannedAt: string } },
    { userId: string; entityId: string; entityType: string }
  >(COMMUNITY_UNBAN_USER);
}

export function useSuspendMember() {
  return useMutation<
    { suspendMember: { success: boolean; message: string; suspendedAt: string } },
    { userId: string; entityId: string; entityType: string; reason?: string }
  >(SUSPEND_MEMBER);
}

export function useUnsuspendMember() {
  return useMutation<
    { unsuspendMember: { success: boolean; message: string; unsuspendedAt: string } },
    { userId: string; entityId: string; entityType: string }
  >(UNSUSPEND_MEMBER);
}

export function useTransferOwnership() {
  return useMutation<
    { transferOwnership: { success: boolean; message: string; timestamp: string } },
    { currentOwnerId: string; newOwnerId: string; entityId: string; entityType: string }
  >(TRANSFER_OWNERSHIP);
}

export function useGetModerationLogs(entityId: string | null, entityType: string, limit = 20, offset = 0) {
  return useQuery<{
    getModerationLogs: Array<{
      id: string; entityId: string; entityType: string; action: string;
      performedBy: string; targetUser?: string; details?: string; createdAt: string;
    }>;
  }>(GET_MODERATION_LOGS, {
    variables: { entityId: entityId ?? "", entityType, limit, offset },
    skip: !entityId,
  });
}

export function useGetBannedUsersList(entityId: string | null, entityType: string) {
  return useQuery<{
    getBannedUsers: Array<{ userId: string; bannedBy?: string; reason?: string; bannedAt: string }>;
  }>(GET_BANNED_USERS_LIST, {
    variables: { entityId: entityId ?? "", entityType },
    skip: !entityId,
  });
}

export function useGetSuspendedUsersList(entityId: string | null, entityType: string) {
  return useQuery<{
    getSuspendedUsers: Array<{ userId: string; suspendedBy?: string; reason?: string; suspendedAt: string }>;
  }>(GET_SUSPENDED_USERS_LIST, {
    variables: { entityId: entityId ?? "", entityType },
    skip: !entityId,
  });
}

export function useListCommunityMembers(communityId: string | null, limit = 20, offset = 0) {
  return useQuery<{
    listCommunityMembers: {
      members: Array<{ userId: string; role: string; status: string; joinedAt: string }>;
      total: number;
    };
  }>(LIST_COMMUNITY_MEMBERS, {
    variables: { communityId: communityId ?? "", limit, offset },
    skip: !communityId,
  });
}

export function useListAssociationMembers(associationId: string | null, limit = 20, offset = 0) {
  return useQuery<{
    listAssociationMembers: {
      members: Array<{ userId: string; role: string; status: string; joinedAt: string }>;
      total: number;
    };
  }>(LIST_ASSOCIATION_MEMBERS, {
    variables: { associationId: associationId ?? "", limit, offset },
    skip: !associationId,
  });
}

export function useSearchMembers(entityId: string | null, entityType: string, searchTerm: string, limit = 10) {
  return useQuery<{
    searchMembers: Array<{ userId: string; role: string; status: string; joinedAt: string }>;
  }>(SEARCH_MEMBERS, {
    variables: { entityId: entityId ?? "", entityType, searchTerm, limit },
    skip: !entityId || !searchTerm,
  });
}

// ─── Community Upload URL Hooks ───────────────────────────────────────────────

export function useGetCommunityAvatarUploadUrl() {
  return useMutation<
    { getCommunityAvatarUploadUrl: { uploadUrl: string; fileUrl: string } },
    { communityId: string; filename: string; contentType: string }
  >(GET_COMMUNITY_AVATAR_UPLOAD_URL);
}

export function useGetCommunityCoverUploadUrl() {
  return useMutation<
    { getCommunityCoverUploadUrl: { uploadUrl: string; fileUrl: string } },
    { communityId: string; filename: string; contentType: string }
  >(GET_COMMUNITY_COVER_UPLOAD_URL);
}

export function useDeleteEntityImage() {
  return useMutation<
    { deleteEntityImage: { success: boolean; message: string; timestamp: string } },
    { entityId: string; entityType: string; imageType: string }
  >(DELETE_ENTITY_IMAGE);
}
