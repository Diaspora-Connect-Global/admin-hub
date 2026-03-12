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
  type Association,
  type CreateAssociationInput,
  type UpdateAssociationInput,
  type AssociationMember,
  type MembershipActionInput,
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
