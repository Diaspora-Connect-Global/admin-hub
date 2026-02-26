/**
 * Session storage for Admin Service authentication.
 * Backed by Zustand store with localStorage persistence.
 * After login via Auth Service, set the session_id so GraphQL requests send it as Bearer token.
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
