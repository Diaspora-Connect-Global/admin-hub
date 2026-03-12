import { useMutation, useQuery } from "@apollo/client/react";
import {
  CREATE_COMMUNITY_TYPE,
  LIST_COMMUNITY_TYPES,
  DELETE_COMMUNITY_TYPE,
  CREATE_ASSOCIATION_TYPE,
  LIST_ASSOCIATION_TYPES,
  DELETE_ASSOCIATION_TYPE,
  type CommunityType,
  type CreateCommunityTypeInput,
  type AssociationType,
  type CreateAssociationTypeInput,
} from "@/services/networks/graphql/admin";

export function useCreateCommunityType() {
  return useMutation<
    { createCommunityType: CommunityType },
    { input: CreateCommunityTypeInput }
  >(CREATE_COMMUNITY_TYPE);
}

export function useListCommunityTypes() {
  return useQuery<{ listCommunityTypes: CommunityType[] }>(LIST_COMMUNITY_TYPES);
}

export function useDeleteCommunityType() {
  return useMutation<
    { deleteCommunityType: { success: boolean; message: string } },
    { id: string }
  >(DELETE_COMMUNITY_TYPE);
}

export function useCreateAssociationType() {
  return useMutation<
    { createAssociationType: AssociationType },
    { input: CreateAssociationTypeInput }
  >(CREATE_ASSOCIATION_TYPE);
}

export function useListAssociationTypes() {
  return useQuery<{ listAssociationTypes: AssociationType[] }>(
    LIST_ASSOCIATION_TYPES
  );
}

export function useDeleteAssociationType() {
  return useMutation<
    { deleteAssociationType: { success: boolean; message: string } },
    { id: string }
  >(DELETE_ASSOCIATION_TYPE);
}
