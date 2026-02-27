/**
 * Session API for admin auth. Backed by the session store (Zustand).
 * Use this for get/set/clear session so the admin client and login flow stay in sync.
 */

import {
  useSessionStore,
  getSessionIdFromStore,
  getDevUserIdFromStore,
} from "@/stores/sessionStore";

export const DEV_USER_ID_HEADER_KEY = "x-user-id";

/** Get the current session ID (Bearer token). Returns null if not logged in. */
export function getSessionId(): string | null {
  return getSessionIdFromStore();
}

/** Set the session ID after successful login. */
export function setSessionId(sessionId: string): void {
  useSessionStore.getState().setSessionId(sessionId);
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
