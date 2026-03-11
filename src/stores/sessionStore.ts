import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const SESSION_STORAGE_KEY = "admin-hub-session";

type SessionState = {
  adminProfile: {
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
      description?: string | null;
    } | null;
  } | null;
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
  setAdminProfile: (adminProfile: SessionState["adminProfile"]) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      adminProfile: null,
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
      setAdminProfile: (adminProfile) => set({ adminProfile: adminProfile ?? null }),
      clearSession: () =>
        set({ adminProfile: null, accessToken: null, sessionId: null, refreshToken: null, userId: null, devUserId: null, userEmail: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        adminProfile: state.adminProfile,
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

/** Get refresh token without subscribing. */
export function getRefreshTokenFromStore(): string | null {
  return useSessionStore.getState().refreshToken;
}

/** Get dev user ID without subscribing. */
export function getDevUserIdFromStore(): string | null {
  return useSessionStore.getState().devUserId;
}

/** Get current admin profile metadata without subscribing. */
export function getAdminProfileFromStore(): SessionState["adminProfile"] {
  return useSessionStore.getState().adminProfile;
}
