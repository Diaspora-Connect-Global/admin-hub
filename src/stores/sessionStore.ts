import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const SESSION_STORAGE_KEY = "admin-hub-session";

type SessionState = {
  sessionId: string | null;
  devUserId: string | null;
  setSessionId: (sessionId: string | null) => void;
  setDevUserId: (userId: string | null) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      devUserId: null,
      setSessionId: (sessionId) => set({ sessionId: sessionId ?? null }),
      setDevUserId: (userId) =>
        set({ devUserId: userId ?? null }),
      clearSession: () => set({ sessionId: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        devUserId: state.devUserId,
      }),
    }
  )
);

/** Get session ID without subscribing (for use outside React, e.g. Apollo link). */
export function getSessionIdFromStore(): string | null {
  return useSessionStore.getState().sessionId;
}

/** Get dev user ID without subscribing. */
export function getDevUserIdFromStore(): string | null {
  return useSessionStore.getState().devUserId;
}
