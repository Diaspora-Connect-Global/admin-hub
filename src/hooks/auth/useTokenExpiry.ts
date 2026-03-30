/**
 * Inactivity-based session timeout
 * Logs the user out only after 15 consecutive minutes of NO interaction.
 * As long as the user is clicking, typing, scrolling or touching, the
 * countdown is reset and the session stays alive.
 */

import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken, clearSession } from "@/stores/session";
import { useSessionStore } from "@/stores/sessionStore";
import { exchangeRefreshTokenForSession } from "@/services/networks/graphql/admin/refreshAccessToken";
import { toast } from "@/hooks/use-toast";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of no interaction
const WARN_BEFORE_MS = 60 * 1000;              // warn 60 s before that
/** Refresh access token this long before JWT exp to avoid bursts of 401s. */
const PROACTIVE_REFRESH_BEFORE_EXP_MS = 120_000;

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"] as const;

function getTokenExpMs(token: string): number | null {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function useTokenExpiry() {
  const navigate = useNavigate();
  const sessionId = useSessionStore((s) => s.sessionId);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningToastShown = useRef(false);
  const refreshInFlight = useRef(false);

  const clearTimers = useCallback(() => {
    if (expiryTimer.current) { clearTimeout(expiryTimer.current); expiryTimer.current = null; }
    if (warningTimer.current) { clearTimeout(warningTimer.current); warningTimer.current = null; }
  }, []);

  const logout = useCallback(() => {
    clearTimers();
    clearSession();
    navigate("/login", { replace: true });
    toast({
      title: "Session Expired",
      description: "You were logged out due to inactivity.",
      variant: "destructive",
    });
  }, [navigate, clearTimers]);

  const logoutExpired = useCallback(() => {
    clearTimers();
    clearSession();
    navigate("/login?expired=1", { replace: true });
    toast({
      title: "Session Expired",
      description: "Your session expired and could not be refreshed. Please log in again.",
      variant: "destructive",
    });
  }, [navigate, clearTimers]);

  const maybeRefreshAccessTokenSoon = useCallback(async (): Promise<boolean> => {
    if (refreshInFlight.current) return true;

    const token = getAccessToken();
    if (!token) return true;

    const expMs = getTokenExpMs(token);
    if (!expMs) return true;

    const msLeft = expMs - Date.now();
    const shouldRefresh = msLeft <= 0 || msLeft <= PROACTIVE_REFRESH_BEFORE_EXP_MS;
    if (!shouldRefresh) return true;

    refreshInFlight.current = true;
    try {
      const result = await exchangeRefreshTokenForSession();
      return result.ok;
    } finally {
      refreshInFlight.current = false;
    }
  }, []);

  // Called on every user interaction — resets the countdown from scratch
  const resetInactivityTimer = useCallback(() => {
    if (!getAccessToken()) return; // already logged out

    clearTimers();
    warningToastShown.current = false;

    // Warn 60 s before the inactivity timeout fires
    warningTimer.current = setTimeout(() => {
      if (!warningToastShown.current) {
        warningToastShown.current = true;
        toast({
          title: "Still there?",
          description: "You'll be logged out in 1 minute due to inactivity.",
          variant: "destructive",
        });
      }
    }, INACTIVITY_TIMEOUT_MS - WARN_BEFORE_MS);

    // Log out after full inactivity window
    expiryTimer.current = setTimeout(logout, INACTIVITY_TIMEOUT_MS);

    void maybeRefreshAccessTokenSoon().then((ok) => {
      if (!ok) logoutExpired();
    });
  }, [clearTimers, logout, maybeRefreshAccessTokenSoon, logoutExpired]);

  useEffect(() => {
    if (!sessionId) return;
    const id = setInterval(() => {
      void maybeRefreshAccessTokenSoon().then((ok) => {
        if (!ok) logoutExpired();
      });
    }, 60_000);
    void maybeRefreshAccessTokenSoon().then((ok) => {
      if (!ok) logoutExpired();
    });
    return () => clearInterval(id);
  }, [sessionId, maybeRefreshAccessTokenSoon, logoutExpired]);

  useEffect(() => {
    if (!getAccessToken()) return;

    // Kick off the initial countdown
    resetInactivityTimer();

    // Attach activity listeners — each interaction resets the clock
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      clearTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Check if the stored JWT token is past its exp claim.
 * Used by auth guards to gate protected routes.
 */
export function isTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return true;

  const expMs = getTokenExpMs(token);
  if (!expMs) return false; // Can't determine, assume valid

  return Date.now() >= expMs;
}
