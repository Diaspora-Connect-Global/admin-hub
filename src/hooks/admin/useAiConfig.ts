/**
 * AI Configuration hooks — backed by api-gateway's AiModule.
 *
 * All operations server-side gated to SYSTEM_ADMIN / SUPER_ADMIN; the route
 * also re-gates client-side via the AI Configuration page wrapper.
 *
 * `apiKey` is INPUT-ONLY on upsert — it never appears on any read type.
 */

import { useMutation, useQuery } from "@apollo/client/react";
import {
  AI_LIST_PROVIDER_CREDENTIALS,
  AI_GET_CLASSIFIER_CONFIG,
  AI_GET_POST_CLASSIFICATION,
  AI_GET_BACKFILL_JOB,
  AI_UPSERT_PROVIDER_CREDENTIAL,
  AI_REVOKE_PROVIDER_CREDENTIAL,
  AI_UPDATE_CLASSIFIER_CONFIG,
  AI_SET_PRIMARY_PROVIDER,
  AI_CLASSIFY_POST,
  AI_START_BACKFILL,
  type ProviderCredential,
  type ClassifierConfig,
  type PostClassification,
  type BackfillJob,
  type UpsertProviderCredentialInput,
  type UpdateClassifierConfigInput,
  type StartBackfillInput,
  type AiProviderType,
} from "@/services/networks/graphql/admin";

export type {
  ProviderCredential,
  ClassifierConfig,
  PostClassification,
  BackfillJob,
  UpsertProviderCredentialInput,
  UpdateClassifierConfigInput,
  StartBackfillInput,
  AiProviderType,
};

export function useAiListProviderCredentials() {
  return useQuery<{ aiListProviderCredentials: ProviderCredential[] }>(
    AI_LIST_PROVIDER_CREDENTIALS,
    { fetchPolicy: "cache-and-network" },
  );
}

export function useAiGetClassifierConfig() {
  return useQuery<{ aiGetClassifierConfig: ClassifierConfig }>(
    AI_GET_CLASSIFIER_CONFIG,
    { fetchPolicy: "cache-and-network" },
  );
}

export function useAiGetPostClassification(postId: string | null) {
  return useQuery<{ aiGetPostClassification: PostClassification | null }>(
    AI_GET_POST_CLASSIFICATION,
    {
      variables: { postId: postId ?? "" },
      skip: !postId,
      fetchPolicy: "network-only",
    },
  );
}

/**
 * Polls every `pollMs` while the job is RUNNING (stops automatically when
 * status flips to COMPLETED / FAILED / CANCELLED). Pass `jobId = null` to
 * disable.
 */
export function useAiGetBackfillJob(jobId: string | null, pollMs = 5000) {
  const query = useQuery<{ aiGetBackfillJob: BackfillJob }>(
    AI_GET_BACKFILL_JOB,
    {
      variables: { jobId: jobId ?? "" },
      skip: !jobId,
      fetchPolicy: "network-only",
      pollInterval: jobId ? pollMs : 0,
      notifyOnNetworkStatusChange: true,
    },
  );

  // Stop polling once the job is in a terminal state.
  const status = query.data?.aiGetBackfillJob?.status;
  if (status && status !== "RUNNING" && query.stopPolling) {
    query.stopPolling();
  }

  return query;
}

export function useAiUpsertProviderCredential() {
  return useMutation<
    { aiUpsertProviderCredential: ProviderCredential },
    { input: UpsertProviderCredentialInput }
  >(AI_UPSERT_PROVIDER_CREDENTIAL, {
    refetchQueries: [{ query: AI_LIST_PROVIDER_CREDENTIALS }],
    awaitRefetchQueries: true,
  });
}

export function useAiRevokeProviderCredential() {
  return useMutation<{ aiRevokeProviderCredential: boolean }, { id: string }>(
    AI_REVOKE_PROVIDER_CREDENTIAL,
    {
      refetchQueries: [{ query: AI_LIST_PROVIDER_CREDENTIALS }],
      awaitRefetchQueries: true,
    },
  );
}

export function useAiUpdateClassifierConfig() {
  return useMutation<
    { aiUpdateClassifierConfig: ClassifierConfig },
    { input: UpdateClassifierConfigInput }
  >(AI_UPDATE_CLASSIFIER_CONFIG, {
    refetchQueries: [{ query: AI_GET_CLASSIFIER_CONFIG }],
    awaitRefetchQueries: true,
  });
}

export function useAiSetPrimaryProvider() {
  return useMutation<
    { aiSetPrimaryProvider: ClassifierConfig },
    { provider: AiProviderType }
  >(AI_SET_PRIMARY_PROVIDER, {
    refetchQueries: [{ query: AI_GET_CLASSIFIER_CONFIG }],
    awaitRefetchQueries: true,
  });
}

export function useAiClassifyPost() {
  return useMutation<
    { aiClassifyPost: PostClassification },
    { postId: string }
  >(AI_CLASSIFY_POST);
}

export function useAiStartBackfill() {
  return useMutation<
    { aiStartBackfill: BackfillJob },
    { input: StartBackfillInput }
  >(AI_START_BACKFILL);
}
