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
 * Calls refreshToken mutation over fetch; updates session store on success.
 */
export async function exchangeRefreshTokenForSession(): Promise<RefreshResult> {
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
        variables: { input: { refreshToken } },
      }),
    });

    const json = (await res.json()) as {
      data?: { refreshToken?: { accessToken?: string; refreshToken?: string } };
      errors?: Array<{ message?: string }>;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: { code: "REFRESH_HTTP", message: `Refresh request failed (${res.status})` },
      };
    }

    if (json.errors?.length) {
      const msg = json.errors[0]?.message ?? "Refresh failed";
      return { ok: false, error: { code: "REFRESH_FAILED", message: msg } };
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
