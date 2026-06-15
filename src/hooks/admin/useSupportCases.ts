/**
 * Support Cases hooks (support-service CASE model).
 *
 * Replaces the legacy ticket hooks in useSupportTickets.ts. All operations talk
 * to the api-gateway support resolver; field names are camelCase (the gateway
 * maps proto snake_case for us). `allCases` returns the paginated wrapper
 * `{ cases, total }`.
 */

import { useQuery, useMutation } from "@apollo/client/react";
import {
  ALL_CASES,
  SUPPORT_CASE,
  CASE_INTERNAL_NOTES,
  CASE_EVIDENCE,
  CASE_STATUS_HISTORY,
  ADMIN_CASE_TYPES,
  ASSIGN_CASE,
  UPDATE_CASE_STATUS,
  ADD_CASE_INTERNAL_NOTE,
  REQUEST_CASE_EVIDENCE_UPLOAD_URL,
  ADD_CASE_EVIDENCE,
  CREATE_SUPPORT_CASE_TYPE,
  UPDATE_SUPPORT_CASE_TYPE,
  DEACTIVATE_SUPPORT_CASE_TYPE,
  type AllCasesResponse,
  type SupportCase,
  type SupportCaseSummary,
  type SupportCaseNote,
  type SupportCaseEvidence,
  type SupportCaseStatusHistoryEntry,
  type SupportCaseType,
  type SupportEvidenceUploadUrl,
  type CaseStatus,
  type OwnerType,
  type CasePriority,
  type CreateSupportCaseTypeInput,
  type UpdateSupportCaseTypeInput,
} from "@/services/networks/graphql/admin";

export type {
  AllCasesResponse,
  SupportCase,
  SupportCaseSummary,
  SupportCaseNote,
  SupportCaseEvidence,
  SupportCaseStatusHistoryEntry,
  SupportCaseType,
  SupportEvidenceUploadUrl,
  CaseStatus,
  OwnerType,
  CasePriority,
  CreateSupportCaseTypeInput,
  UpdateSupportCaseTypeInput,
};

export interface AllCasesFilters {
  ownerType?: OwnerType;
  status?: CaseStatus;
  priority?: CasePriority;
  limit?: number;
  offset?: number;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function useAllCases(filters: AllCasesFilters = {}) {
  return useQuery<AllCasesResponse>(ALL_CASES, {
    variables: {
      ownerType: filters.ownerType ?? undefined,
      status: filters.status ?? undefined,
      priority: filters.priority ?? undefined,
      limit: filters.limit ?? 25,
      offset: filters.offset ?? 0,
    },
    fetchPolicy: "cache-and-network",
  });
}

export function useSupportCase(id: string | null) {
  return useQuery<{ supportCase: SupportCase | null }>(SUPPORT_CASE, {
    variables: { id: id ?? "" },
    skip: !id,
  });
}

export function useCaseInternalNotes(
  caseId: string | null,
  options: { limit?: number; offset?: number } = {},
) {
  return useQuery<{ caseInternalNotes: SupportCaseNote[] }>(CASE_INTERNAL_NOTES, {
    variables: {
      caseId: caseId ?? "",
      limit: options.limit ?? undefined,
      offset: options.offset ?? undefined,
    },
    skip: !caseId,
  });
}

export function useCaseEvidence(caseId: string | null) {
  return useQuery<{ caseEvidence: SupportCaseEvidence[] }>(CASE_EVIDENCE, {
    variables: { caseId: caseId ?? "" },
    skip: !caseId,
  });
}

export function useCaseStatusHistory(caseId: string | null) {
  return useQuery<{ caseStatusHistory: SupportCaseStatusHistoryEntry[] }>(
    CASE_STATUS_HISTORY,
    {
      variables: { caseId: caseId ?? "" },
      skip: !caseId,
    },
  );
}

export function useAdminCaseTypes(
  filters: { ownerType?: OwnerType; ownerEntityId?: string } = {},
) {
  return useQuery<{ adminCaseTypes: SupportCaseType[] }>(ADMIN_CASE_TYPES, {
    variables: {
      ownerType: filters.ownerType ?? undefined,
      ownerEntityId: filters.ownerEntityId ?? undefined,
    },
    fetchPolicy: "cache-and-network",
  });
}

// ── Case mutations ───────────────────────────────────────────────────────────

export function useAssignCase() {
  return useMutation<
    { assignCase: SupportCase },
    { caseId: string; assigneeUserId: string }
  >(ASSIGN_CASE, {
    refetchQueries: ["AllCases", "SupportCase", "CaseStatusHistory"],
  });
}

export function useUpdateCaseStatus() {
  return useMutation<
    { updateCaseStatus: SupportCase },
    {
      caseId: string;
      targetStatus: CaseStatus;
      reason?: string;
      resolutionSummary?: string;
    }
  >(UPDATE_CASE_STATUS, {
    refetchQueries: ["AllCases", "SupportCase", "CaseStatusHistory"],
  });
}

export function useAddCaseInternalNote() {
  return useMutation<
    { addCaseInternalNote: SupportCaseNote },
    { input: { caseId: string; body: string } }
  >(ADD_CASE_INTERNAL_NOTE, {
    refetchQueries: ["CaseInternalNotes"],
  });
}

export function useRequestCaseEvidenceUploadUrl() {
  return useMutation<
    { requestCaseEvidenceUploadUrl: SupportEvidenceUploadUrl },
    { caseId: string; contentType: string; fileName: string }
  >(REQUEST_CASE_EVIDENCE_UPLOAD_URL);
}

export function useAddCaseEvidence() {
  return useMutation<
    { addCaseEvidence: SupportCaseEvidence },
    { caseId: string; evidenceId: string; sizeBytes?: number }
  >(ADD_CASE_EVIDENCE, {
    refetchQueries: ["CaseEvidence"],
  });
}

// ── Case-type config mutations ───────────────────────────────────────────────

export function useCreateCaseType() {
  return useMutation<
    { createSupportCaseType: SupportCaseType },
    { input: CreateSupportCaseTypeInput }
  >(CREATE_SUPPORT_CASE_TYPE, {
    refetchQueries: ["AdminCaseTypes"],
  });
}

export function useUpdateCaseType() {
  return useMutation<
    { updateSupportCaseType: SupportCaseType },
    { input: UpdateSupportCaseTypeInput }
  >(UPDATE_SUPPORT_CASE_TYPE, {
    refetchQueries: ["AdminCaseTypes"],
  });
}

export function useDeactivateCaseType() {
  return useMutation<{ deactivateSupportCaseType: SupportCaseType }, { id: string }>(
    DEACTIVATE_SUPPORT_CASE_TYPE,
    {
      refetchQueries: ["AdminCaseTypes"],
    },
  );
}
