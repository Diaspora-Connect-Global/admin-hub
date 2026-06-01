/**
 * Payment Provider Keys hooks — backed by api-gateway's payment-provider
 * credential admin operations.
 *
 * All operations server-side gated to SYSTEM_ADMIN / SUPER_ADMIN; the route
 * also re-gates client-side via the Payment Provider Keys page wrapper.
 *
 * `apiKey` / `apiSecret` / `webhookSecret` are INPUT-ONLY on upsert / rotate —
 * they never appear on any read type. Only the masked `keyPreview` is returned.
 */

import { useMutation, useQuery } from "@apollo/client/react";
import {
  PAYMENT_LIST_PROVIDER_CREDENTIALS,
  PAYMENT_UPSERT_PROVIDER_CREDENTIAL,
  PAYMENT_ROTATE_PROVIDER_CREDENTIAL,
  PAYMENT_DISABLE_PROVIDER_CREDENTIAL,
  PAYMENT_ENABLE_PROVIDER_CREDENTIAL,
  type PaymentProviderCredential,
  type PaymentProviderType,
  type UpsertPaymentProviderCredentialInput,
  type RotatePaymentProviderCredentialInput,
} from "@/services/networks/graphql/admin";

export type {
  PaymentProviderCredential,
  PaymentProviderType,
  UpsertPaymentProviderCredentialInput,
  RotatePaymentProviderCredentialInput,
};

interface PaymentListProviderCredentialsVariables {
  provider?: string;
  environment?: string;
  onlyActive?: boolean;
}

export function usePaymentProviderKeysList(
  variables?: PaymentListProviderCredentialsVariables,
) {
  return useQuery<
    { paymentListProviderCredentials: PaymentProviderCredential[] },
    PaymentListProviderCredentialsVariables
  >(PAYMENT_LIST_PROVIDER_CREDENTIALS, {
    variables: {
      provider: variables?.provider ?? undefined,
      environment: variables?.environment ?? undefined,
      onlyActive: variables?.onlyActive ?? undefined,
    },
    fetchPolicy: "cache-and-network",
  });
}

export function usePaymentUpsertProviderKey() {
  return useMutation<
    { paymentUpsertProviderCredential: PaymentProviderCredential },
    { input: UpsertPaymentProviderCredentialInput }
  >(PAYMENT_UPSERT_PROVIDER_CREDENTIAL, {
    refetchQueries: [{ query: PAYMENT_LIST_PROVIDER_CREDENTIALS }],
    awaitRefetchQueries: true,
  });
}

export function usePaymentRotateProviderKey() {
  return useMutation<
    { paymentRotateProviderCredential: PaymentProviderCredential },
    { input: RotatePaymentProviderCredentialInput }
  >(PAYMENT_ROTATE_PROVIDER_CREDENTIAL, {
    refetchQueries: [{ query: PAYMENT_LIST_PROVIDER_CREDENTIALS }],
    awaitRefetchQueries: true,
  });
}

export function usePaymentDisableProviderKey() {
  return useMutation<
    { paymentDisableProviderCredential: boolean },
    { id: string }
  >(PAYMENT_DISABLE_PROVIDER_CREDENTIAL, {
    refetchQueries: [{ query: PAYMENT_LIST_PROVIDER_CREDENTIALS }],
    awaitRefetchQueries: true,
  });
}

export function usePaymentEnableProviderKey() {
  return useMutation<
    { paymentEnableProviderCredential: boolean },
    { id: string }
  >(PAYMENT_ENABLE_PROVIDER_CREDENTIAL, {
    refetchQueries: [{ query: PAYMENT_LIST_PROVIDER_CREDENTIALS }],
    awaitRefetchQueries: true,
  });
}
