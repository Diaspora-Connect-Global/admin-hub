/**
 * Admin login via adminLogin GraphQL mutation.
 * Returns accessToken (use as Bearer), refreshToken, and admin info.
 */

import { adminClient } from "./client";
import { ADMIN_LOGIN, REFRESH_TOKEN, LOGOUT } from "./operations";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearSession } from "@/stores/session";

interface RefreshTokenMutationData {
  refreshToken: {
    accessToken: string;
    refreshToken: string;
    sessionToken?: string;
  };
}

interface LogoutMutationData {
  logout: {
    success: boolean;
    message: string;
  };
}

export interface AdminRoleInfo {
  id: string;
  name: string;
  scopeType: string;
  permissions: string[];
  description?: string | null;
}

export interface AdminUserInfo {
  id: string;
  userId: string;
  scopeType: string;
  scopeId: string | null;
  isActive: boolean;
  role: AdminRoleInfo | null;
}

export interface LoginResponse {
  /** Use as Authorization: Bearer <accessToken> (expires ~15 min). */
  accessToken: string;
  /** Use for token refresh (expires ~8 hours). */
  refreshToken: string | null;
  email: string;
  admin: AdminUserInfo | null;
}

export interface LoginError {
  code?: string;
  message: string;
}

interface AdminLoginMutationData {
  adminLogin: {
    success: boolean;
    message: string | null;
    error: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    admin: {
      id: string;
      userId: string;
      scopeType: string;
      scopeId: string | null;
      isActive: boolean;
      role: {
        id: string;
        name: string;
        scopeType: string;
        permissions: string[];
        description: string | null;
      } | null;
    } | null;
  };
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: true; data: LoginResponse } | { ok: false; error: LoginError }> {
  try {
    const result = await adminClient.mutate<AdminLoginMutationData>({
      mutation: ADMIN_LOGIN,
      variables: { input: { email, password } },
    });

    const data = result.data?.adminLogin;
    const gqlErrors = (result as { errors?: Array<{ message: string }> }).errors;
    if (!data) {
      const msg = gqlErrors?.[0]?.message ?? result.error?.message ?? "Login failed";
      return { ok: false, error: { code: "LOGIN_FAILED", message: msg } };
    }

    if (!data.success || !data.accessToken) {
      const message = data.error ?? data.message ?? "Login failed";
      return { ok: false, error: { code: "LOGIN_FAILED", message } };
    }

    return {
      ok: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? null,
        email,
        admin: data.admin ?? null,
      },
    };
  } catch (e) {
    const err = e as { graphQLErrors?: Array<{ message: string }>; message?: string };
    const message = err.graphQLErrors?.[0]?.message ?? err.message ?? "Network error";
    return { ok: false, error: { code: "LOGIN_FAILED", message } };
  }
}

/**
 * Refresh session token when it expires
 */
export async function refreshSession(): Promise<{ ok: true; data: { accessToken: string; refreshToken: string } } | { ok: false; error: LoginError }> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return { ok: false, error: { code: "NO_REFRESH_TOKEN", message: "No refresh token available" } };
    }

    const result = await adminClient.mutate<RefreshTokenMutationData>({
      mutation: REFRESH_TOKEN,
      variables: { refreshToken },
    });

    const data = result.data?.refreshToken;
    if (!data?.accessToken) {
      return { ok: false, error: { code: "REFRESH_FAILED", message: "Failed to refresh token" } };
    }

    // Update stored tokens
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
    const err = e as { graphQLErrors?: Array<{ message: string }>; message?: string };
    const message = err.graphQLErrors?.[0]?.message ?? err.message ?? "Refresh failed";
    return { ok: false, error: { code: "REFRESH_FAILED", message } };
  }
}

/**
 * Logout and invalidate session
 */
export async function logout(): Promise<{ ok: boolean; error?: LoginError }> {
  try {
    const accessToken = getAccessToken();
    if (accessToken) {
      await adminClient.mutate<LogoutMutationData>({
        mutation: LOGOUT,
        variables: {
          sessionId: accessToken,
          logoutAll: false,
        },
      });
    }
    clearSession();
    return { ok: true };
  } catch (e) {
    // Still clear local session even if server call fails
    clearSession();
    const err = e as { message?: string };
    return { ok: false, error: { code: "LOGOUT_FAILED", message: err.message ?? "Logout failed" } };
  }
}

