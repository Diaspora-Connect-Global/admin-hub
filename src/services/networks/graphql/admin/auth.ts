/**
 * Admin login via adminLogin GraphQL mutation.
 * Returns accessToken (use as Bearer), refreshToken, and admin info.
 */

import { adminClient } from "./client";
import { ADMIN_LOGIN } from "./operations";

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
