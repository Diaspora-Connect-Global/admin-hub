/**
 * Admin login via adminLogin GraphQL mutation.
 * Returns accessToken (use as Bearer), refreshToken, and admin info.
 */

import { adminClient } from "./client";
import { ADMIN_LOGIN, LOGOUT } from "./operations";
import { exchangeRefreshTokenForSession } from "./refreshAccessToken";
import { getAccessToken, clearSession } from "@/stores/session";
import { decodeJwt } from "@/lib/jwt";

function logTokenRoleDiagnostics(accessToken: string, admin: AdminUserInfo | null) {
  const payload = decodeJwt(accessToken);
  if (!payload || !admin) return;

  const tokenRoles = Array.isArray(payload.roles)
    ? payload.roles.filter((role): role is string => typeof role === "string")
    : typeof payload.role === "string"
      ? [payload.role]
      : [];

  const adminRoleName = admin.role?.name;
  const tokenScopeType = typeof payload.scopeType === "string"
    ? payload.scopeType
    : typeof payload.scope === "string"
      ? payload.scope
      : undefined;

  const hasRoleMismatch = !!adminRoleName && tokenRoles.length > 0 && !tokenRoles.includes(adminRoleName);
  const hasScopeMismatch = !!admin.scopeType && !!tokenScopeType && tokenScopeType !== admin.scopeType;

  if (hasRoleMismatch || hasScopeMismatch) {
    console.warn("⚠️ Admin login role/token mismatch detected", {
      adminRole: adminRoleName,
      adminScopeType: admin.scopeType,
      tokenRoles,
      tokenScopeType,
    });
  }
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

    logTokenRoleDiagnostics(data.accessToken, data.admin ?? null);

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
 * Refresh session when the access token expires (fetch-based; safe from Apollo link cycles).
 */
export async function refreshSession(): Promise<
  { ok: true; data: { accessToken: string; refreshToken: string } } | { ok: false; error: LoginError }
> {
  const result = await exchangeRefreshTokenForSession();
  if (result.ok) return result;
  return { ok: false, error: result.error };
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

