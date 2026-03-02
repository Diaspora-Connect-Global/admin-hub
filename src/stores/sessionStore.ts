import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const SESSION_STORAGE_KEY = "admin-hub-session";

type SessionState = {
  /** Bearer token (accessToken from adminLogin). */
  sessionId: string | null;
  /** Refresh token for renewing accessToken. */
  refreshToken: string | null;
  devUserId: string | null;
  userEmail: string | null;
  setSessionId: (sessionId: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setDevUserId: (userId: string | null) => void;
  setUserEmail: (email: string | null) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      refreshToken: null,
      devUserId: null,
      userEmail: null,
      setSessionId: (sessionId) => set({ sessionId: sessionId ?? null }),
      setRefreshToken: (refreshToken) => set({ refreshToken: refreshToken ?? null }),
      setDevUserId: (userId) => set({ devUserId: userId ?? null }),
      setUserEmail: (email) => set({ userEmail: email ?? null }),
      clearSession: () =>
        set({ sessionId: null, refreshToken: null, devUserId: null, userEmail: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        refreshToken: state.refreshToken,
        devUserId: state.devUserId,
        userEmail: state.userEmail,
      }),
    }
  )
);

/** True when the user has a valid session (Bearer token). */
export function isAuthenticated(): boolean {
  return !!useSessionStore.getState().sessionId;
}

/** Get session ID without subscribing (for use outside React, e.g. Apollo link). */
export function getSessionIdFromStore(): string | null {
  return useSessionStore.getState().sessionId;
}

/** Get dev user ID without subscribing. */
export function getDevUserIdFromStore(): string | null {
  return useSessionStore.getState().devUserId;
}
