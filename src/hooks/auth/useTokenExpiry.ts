/**
 * Inactivity-based session timeout
 * Logs the user out only after 15 consecutive minutes of NO interaction.
 * As long as the user is clicking, typing, scrolling or touching, the
 * countdown is reset and the session stays alive.
 */

import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken, clearSession } from "@/stores/session";
import { toast } from "@/hooks/use-toast";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of no interaction
const WARN_BEFORE_MS = 60 * 1000;              // warn 60 s before that

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"] as const;

export function useTokenExpiry() {
  const navigate = useNavigate();
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningToastShown = useRef(false);

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
  }, [clearTimers, logout]);

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

function getTokenExpMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
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
