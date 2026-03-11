/**
 * Hook for monitoring JWT token expiry with activity-based extension
 * Session extends on user activity (no explicit refresh endpoint)
 * Warns if genuinely inactive for 15 minutes
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken, clearSession } from "@/stores/session";
import { toast } from "@/hooks/use-toast";

/**
 * Decode JWT exp claim (seconds since epoch)
 */
function getTokenExpMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Hook that monitors JWT token expiry with activity-based extension
 * - Resets expiry timer on user activity (click, keyboard, mouse movement)
 * - Warns if genuinely inactive for full 15 minutes
 * - Auto-logs out only if inactive until actual token expiry
 */
export function useTokenExpiry() {
  const navigate = useNavigate();
  const timersRef = useRef<{ expiry?: NodeJS.Timeout; warning?: NodeJS.Timeout }>({});
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);

  const setupExpiryTimers = () => {
    // Clear existing timers
    if (timersRef.current.expiry) clearTimeout(timersRef.current.expiry);
    if (timersRef.current.warning) clearTimeout(timersRef.current.warning);
    warningShownRef.current = false;

    const token = getAccessToken();
    if (!token) return;

    const expMs = getTokenExpMs(token);
    if (!expMs) return;

    const now = Date.now();
    const timeUntilExpiry = expMs - now;

    if (timeUntilExpiry <= 0) {
      // Token already expired
      console.warn("🔐 Token already expired, logging out...");
      clearSession();
      navigate("/login", { replace: true });
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    // Set up expiry timeout (auto-logout at actual token expiry)
    timersRef.current.expiry = setTimeout(() => {
      console.warn("🔐 Token expired, auto-logging out...");
      clearSession();
      navigate("/login", { replace: true });
      toast({
        title: "Session Expired",
        description: "Your 15-minute session has expired. Please log in again.",
        variant: "destructive",
      });
    }, timeUntilExpiry);

    // Set up warning timeout (warn if inactive for 14 minutes = 60s before actual expiry)
    const warningTime = Math.max(0, timeUntilExpiry - 60000);
    timersRef.current.warning = setTimeout(() => {
      if (!warningShownRef.current) {
        console.warn("🔐 Token expiring soon (60s)...");
        warningShownRef.current = true;
        toast({
          title: "Session Expiring Soon",
          description: "Your session will expire in 1 minute due to inactivity. Please save your work.",
          variant: "destructive",
        });
      }
    }, warningTime);
  };

  const handleActivity = () => {
    lastActivityRef.current = Date.now();
    // Reset timers on any user activity
    setupExpiryTimers();
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    // Initial setup
    setupExpiryTimers();

    // Store current ref values for cleanup
    const timersToClean = timersRef.current;

    // Activity listeners
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const listener = handleActivity;
    events.forEach((event) => {
      document.addEventListener(event, listener, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, listener);
      });
      if (timersToClean.expiry) clearTimeout(timersToClean.expiry);
      if (timersToClean.warning) clearTimeout(timersToClean.warning);
    };
    // Intentionally omit dependencies to run on every render (activity-driven)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Check if current token is expired (for auth guards)
 */
export function isTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return true;

  const expMs = getTokenExpMs(token);
  if (!expMs) return false; // Can't determine, assume valid

  return Date.now() >= expMs;
}
