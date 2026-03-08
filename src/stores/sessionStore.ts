import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const SESSION_STORAGE_KEY = "admin-hub-session";

type SessionState = {
  /** Bearer token (accessToken from adminLogin). */
  accessToken: string | null;
  /** Legacy alias for accessToken - use accessToken instead */
  sessionId: string | null;
  /** Refresh token for renewing accessToken. */
  refreshToken: string | null;
  /** Current admin's user id (from adminLogin admin.userId). Used e.g. as ownerId when creating opportunities. */
  userId: string | null;
  devUserId: string | null;
  userEmail: string | null;
  setAccessToken: (accessToken: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setUserId: (userId: string | null) => void;
  setDevUserId: (userId: string | null) => void;
  setUserEmail: (email: string | null) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      sessionId: null, // Legacy alias
      refreshToken: null,
      userId: null,
      devUserId: null,
      userEmail: null,
      setAccessToken: (accessToken) => set({ accessToken: accessToken ?? null, sessionId: accessToken ?? null }),
      setSessionId: (sessionId) => set({ accessToken: sessionId ?? null, sessionId: sessionId ?? null }),
      setRefreshToken: (refreshToken) => set({ refreshToken: refreshToken ?? null }),
      setUserId: (userId) => set({ userId: userId ?? null }),
      setDevUserId: (userId) => set({ devUserId: userId ?? null }),
      setUserEmail: (email) => set({ userEmail: email ?? null }),
      clearSession: () =>
        set({ accessToken: null, sessionId: null, refreshToken: null, userId: null, devUserId: null, userEmail: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        sessionId: state.sessionId, // Keep for legacy compatibility
        refreshToken: state.refreshToken,
        userId: state.userId,
        devUserId: state.devUserId,
        userEmail: state.userEmail,
      }),
    }
  )
);

/** True when the user has a valid session (Bearer token). */
export function isAuthenticated(): boolean {
  return !!useSessionStore.getState().accessToken;
}

/** Get access token without subscribing (for use outside React, e.g. Apollo link). */
export function getAccessTokenFromStore(): string | null {
  return useSessionStore.getState().accessToken;
}

/** Legacy alias for getAccessTokenFromStore - use getAccessTokenFromStore instead */
export function getSessionIdFromStore(): string | null {
  return useSessionStore.getState().accessToken;
}

/** Get current admin user ID without subscribing (from login admin.userId). */
export function getUserIdFromStore(): string | null {
  return useSessionStore.getState().userId;
}

/** Get dev user ID without subscribing. */
export function getDevUserIdFromStore(): string | null {
  return useSessionStore.getState().devUserId;
}
