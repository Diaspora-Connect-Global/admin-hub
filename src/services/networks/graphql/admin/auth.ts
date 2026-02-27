/**
 * Admin login via GraphQL. No Bearer token required; response session token
 * is stored for subsequent admin requests.
 */

import { adminClient } from "./client";
import { LOGIN } from "./operations";

export interface LoginResponse {
  session_id: string;
  email?: string;
}

export interface LoginError {
  code?: string;
  message: string;
}

interface LoginMutationData {
  login: { sessionId?: string; session_id?: string };
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: true; data: LoginResponse } | { ok: false; error: LoginError }> {
  try {
    const result = await adminClient.mutate<LoginMutationData>({
      mutation: LOGIN,
      variables: { input: { email, password } },
    });

    const data = result.data?.login;
    const gqlErrors = (result as { errors?: Array<{ message: string }> }).errors;
    if (!data) {
      const msg = gqlErrors?.[0]?.message ?? result.error?.message ?? "Login failed";
      return { ok: false, error: { code: "LOGIN_FAILED", message: msg } };
    }

    const sessionId = data.sessionId ?? data.session_id;
    if (!sessionId || typeof sessionId !== "string") {
      return { ok: false, error: { code: "INVALID_RESPONSE", message: "Invalid login response" } };
    }

    return {
      ok: true,
      data: { session_id: sessionId, email },
    };
  } catch (e) {
    const err = e as { graphQLErrors?: Array<{ message: string }>; message?: string };
    const message = err.graphQLErrors?.[0]?.message ?? err.message ?? "Network error";
    return { ok: false, error: { code: "LOGIN_FAILED", message } };
  }
}
