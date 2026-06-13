/**
 * KYC Provider Keys hooks — backed by api-gateway's KYC-provider credential
 * admin operations.
 *
 * All operations server-side gated to SYSTEM_ADMIN / SUPER_ADMIN; the route
 * also re-gates client-side via the KYC Provider Keys page wrapper.
 *
 * `apiKey` / `apiSecret` / `webhookSecret` are INPUT-ONLY on upsert — they never
 * appear on any read type. Only the masked `keyPreview` plus the boolean
 * `hasApiSecret` / `hasWebhookSecret` flags are returned. Each provider keeps a
 * SINGLE active credential (single-upsert model); revoke is keyed by `provider`.
 */

import { useMutation, useQuery } from "@apollo/client/react";
import {
  KYC_LIST_PROVIDER_CREDENTIALS,
  KYC_UPSERT_PROVIDER_CREDENTIAL,
  KYC_REVOKE_PROVIDER_CREDENTIAL,
  type KycProviderCredential,
  type KycProviderType,
  type UpsertKycProviderCredentialInput,
} from "@/services/networks/graphql/admin";

export type {
  KycProviderCredential,
  KycProviderType,
  UpsertKycProviderCredentialInput,
};

interface KycListProviderCredentialsVariables {
  provider?: string;
  onlyActive?: boolean;
}

export function useKycProviderKeysList(
  variables?: KycListProviderCredentialsVariables,
) {
  return useQuery<
    { kycListProviderCredentials: KycProviderCredential[] },
    KycListProviderCredentialsVariables
  >(KYC_LIST_PROVIDER_CREDENTIALS, {
    variables: {
      provider: variables?.provider ?? undefined,
      onlyActive: variables?.onlyActive ?? undefined,
    },
    fetchPolicy: "cache-and-network",
  });
}

export function useKycUpsertProviderKey() {
  return useMutation<
    { kycUpsertProviderCredential: KycProviderCredential },
    { input: UpsertKycProviderCredentialInput }
  >(KYC_UPSERT_PROVIDER_CREDENTIAL, {
    refetchQueries: [{ query: KYC_LIST_PROVIDER_CREDENTIALS }],
    awaitRefetchQueries: true,
  });
}

export function useKycRevokeProviderKey() {
  return useMutation<
    { kycRevokeProviderCredential: boolean },
    { provider: string }
  >(KYC_REVOKE_PROVIDER_CREDENTIAL, {
    refetchQueries: [{ query: KYC_LIST_PROVIDER_CREDENTIALS }],
    awaitRefetchQueries: true,
  });
}
