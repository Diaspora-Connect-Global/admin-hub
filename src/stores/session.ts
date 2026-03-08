/**
 * Session API for admin auth. Backed by the session store (Zustand).
 * Use this for get/set/clear session so the admin client and login flow stay in sync.
 */

import {
  useSessionStore,
  getAccessTokenFromStore,
  getSessionIdFromStore,
  getUserIdFromStore,
  getDevUserIdFromStore,
} from "@/stores/sessionStore";

export const DEV_USER_ID_HEADER_KEY = "x-user-id";

/** Get the current access token (Bearer token). Returns null if not logged in. */
export function getAccessToken(): string | null {
  return getAccessTokenFromStore();
}

/** Legacy alias for getAccessToken - use getAccessToken instead */
export function getSessionId(): string | null {
  return getAccessTokenFromStore();
}

/** Set the access token (Bearer) after successful login. */
export function setAccessToken(accessToken: string): void {
  useSessionStore.getState().setAccessToken(accessToken);
}

/** Legacy alias for setAccessToken - use setAccessToken instead */
export function setSessionId(sessionId: string): void {
  useSessionStore.getState().setAccessToken(sessionId);
}

/** Set the refresh token after successful login. */
export function setRefreshToken(refreshToken: string | null): void {
  useSessionStore.getState().setRefreshToken(refreshToken);
}

/** Set the current admin user id (from login admin.userId). Used e.g. as ownerId when creating opportunities. */
export function setUserId(userId: string | null): void {
  useSessionStore.getState().setUserId(userId);
}

/** Get the current admin user id. */
export function getUserId(): string | null {
  return getUserIdFromStore();
}

/** Set the current user email (for display and audit). */
export function setUserEmail(email: string | null): void {
  useSessionStore.getState().setUserEmail(email);
}

/** Clear the session (e.g. on logout). */
export function clearSession(): void {
  useSessionStore.getState().clearSession();
}

/** For local dev: get the test user UUID for x-user-id header. */
export function getDevUserId(): string | null {
  return getDevUserIdFromStore();
}

/** Set dev user ID for local development. */
export function setDevUserId(userId: string | null): void {
  useSessionStore.getState().setDevUserId(userId);
}
