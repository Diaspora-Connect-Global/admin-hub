/**
 * Refresh access token via HTTP (no Apollo client) to avoid circular imports
 * with the link chain that triggers refresh on auth errors.
 */

import { print } from "graphql";
import { getRefreshToken, setAccessToken, setRefreshToken } from "@/stores/session";
import { ADMIN_GRAPHQL_HTTP_URI } from "./constants";
import { REFRESH_TOKEN } from "./operations";

export interface RefreshError {
  code?: string;
  message: string;
}

export type RefreshResult =
  | { ok: true; data: { accessToken: string; refreshToken: string } }
  | { ok: false; error: RefreshError };

/**
 * A refresh failure is "definitive" only when the refresh token itself is
 * genuinely dead/revoked (UNAUTHENTICATED) or absent (NO_REFRESH_TOKEN).
 * Everything else (HTTP errors, 5xx, network failures, INTERNAL_SERVER_ERROR,
 * generic REFRESH_FAILED) is transient and must NOT log the admin out — the
 * next interval tick or user activity will retry.
 */
export function isDefinitiveAuthFailure(error: RefreshError): boolean {
  return error.code === "UNAUTHENTICATED" || error.code === "NO_REFRESH_TOKEN";
}

/**
 * Module-level single-flight: the backend rotates the refresh token on every
 * successful exchange, so concurrent refreshes using the same (now-stale) token
 * would make all-but-one fail. All callers (Apollo error link, background
 * interval, proactive-on-activity) share this one in-flight promise.
 */
let inFlight: Promise<RefreshResult> | null = null;

/**
 * Calls refreshToken mutation over fetch; updates session store on success.
 * Deduplicates concurrent calls via a shared in-flight promise.
 */
export function exchangeRefreshTokenForSession(): Promise<RefreshResult> {
  if (inFlight) return inFlight;

  inFlight = doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRefresh(): Promise<RefreshResult> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return { ok: false, error: { code: "NO_REFRESH_TOKEN", message: "No refresh token available" } };
  }

  try {
    const res = await fetch(ADMIN_GRAPHQL_HTTP_URI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: print(REFRESH_TOKEN),
        variables: { refreshToken },
      }),
    });

    const json = (await res.json()) as {
      data?: { refreshToken?: { accessToken?: string; refreshToken?: string } };
      errors?: Array<{ message?: string; extensions?: { code?: string } }>;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: { code: "REFRESH_HTTP", message: `Refresh request failed (${res.status})` },
      };
    }

    if (json.errors?.length) {
      const first = json.errors[0];
      const msg = first?.message ?? "Refresh failed";
      // Propagate the GraphQL extensions.code when present (e.g. UNAUTHENTICATED)
      // so definitive auth failures can be distinguished from transient ones.
      const code = first?.extensions?.code ?? "REFRESH_FAILED";
      return { ok: false, error: { code, message: msg } };
    }

    const data = json.data?.refreshToken;
    if (!data?.accessToken) {
      return { ok: false, error: { code: "REFRESH_FAILED", message: "Failed to refresh token" } };
    }

    setAccessToken(data.accessToken);
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }

    return {
      ok: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || refreshToken,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Refresh failed";
    return { ok: false, error: { code: "REFRESH_FAILED", message } };
  }
}
