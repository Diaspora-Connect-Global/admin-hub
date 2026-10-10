import { gql } from "@apollo/client";
import { adminClient } from "@/services/networks/graphql/admin/client";
import type { ErrorLike } from "@/lib/eventNetworking";

/**
 * The one place the event-networking operations touch the admin Apollo client.
 * The client runs with `errorPolicy: "all"`, so a refused operation RESOLVES
 * with `error` set (and `data: null`): it is thrown here instead of being
 * mistaken for success.
 */
export async function gqlRequest<TData>(query: string, variables?: Record<string, unknown>): Promise<TData> {
  const document = gql(query);
  const isMutation = /^\s*mutation\b/.test(query);
  const result = isMutation
    ? await adminClient.mutate({ mutation: document, variables, errorPolicy: "all" })
    : await adminClient.query({ query: document, variables, fetchPolicy: "no-cache", errorPolicy: "all" });
  if (result.error) throw result.error;
  return result.data as TData;
}

/** `{ code, message }` for every GraphQL error carried by a failure (the gateway puts `code` at the top level). */
export function errorsOf(err: unknown): ErrorLike[] {
  const list = (err as { errors?: unknown } | null)?.errors;
  if (!Array.isArray(list)) return [];
  return list.map((e) => {
    const raw = e as { code?: unknown; message?: unknown; extensions?: { code?: unknown } };
    return { code: String(raw.code ?? raw.extensions?.code ?? ""), message: String(raw.message ?? "") };
  });
}
