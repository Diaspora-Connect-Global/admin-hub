/**
 * Sliding idle session for the super-admin console.
 *
 * While the admin is ACTIVE the access token is refreshed silently (no prompt). After
 * IDLE_CONFIG.idleTimeoutMs (15 min, this console's existing value) without activity a
 * countdown dialog shows for the last minute, then the session is signed out. Activity (and
 * sign-out) sync across tabs; only timestamps/events are broadcast, never tokens.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken, clearSession } from "@/stores/session";
import { useSessionStore } from "@/stores/sessionStore";
import {
  exchangeRefreshTokenForSession,
  isDefinitiveAuthFailure,
} from "@/services/networks/graphql/admin/refreshAccessToken";
import { getJwtExpiry } from "@/lib/jwt";
import {
  IDLE_CONFIG,
  applyRemoteMessage,
  evaluateIdleSession,
  isStoredActivityStale,
  shouldRecordActivity,
  type SignOutReason,
} from "@/lib/idleSession";
import {
  listenRemote,
  markSignOutReason,
  postRemote,
  readStoredActivity,
  rememberSignOutReason,
  withoutBroadcast,
  writeStoredActivity,
} from "@/lib/idleSessionChannel";

const TICK_MS = 1000;
const REFRESH_RETRY_MS = 30_000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll", "wheel", "mousemove"] as const;

let expiryCache: { token: string; exp: number | null } | null = null;
/** Access-token expiry (epoch ms), memoised per token so the 1 s tick never re-decodes it. */
function accessExpiryMs(): number | null {
  const token = getAccessToken();
  if (!token) return null;
  if (expiryCache?.token !== token) {
    expiryCache = { token, exp: getJwtExpiry(token)?.getTime() ?? null };
  }
  return expiryCache.exp;
}

export function useIdleSession() {
  const navigate = useNavigate();
  const sessionId = useSessionStore((s) => s.sessionId);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const stayRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!sessionId) {
      setSecondsLeft(null);
      return;
    }
    const cfg = IDLE_CONFIG;
    let disposed = false;
    let signedOut = false;
    let warningOpen = false;
    let refreshing = false;
    let nextRefreshAt = 0;
    let lastRecorded = 0;

    const stored = readStoredActivity();
    let lastActivity = Date.now();

    const signOut = (reason: SignOutReason, fromRemote = false) => {
      if (signedOut) return;
      signedOut = true;
      rememberSignOutReason(reason);
      const doLogout = () => {
        markSignOutReason(reason);
        clearSession();
      };
      if (fromRemote) withoutBroadcast(doLogout);
      else doLogout();
      setSecondsLeft(null);
      navigate("/login", { replace: true });
    };

    // A previous page load / closed tab that has been idle past the timeout must not revive.
    if (isStoredActivityStale(stored, lastActivity, cfg)) {
      signOut("idle");
      return;
    }
    writeStoredActivity(lastActivity);

    const silentRefresh = async () => {
      if (refreshing || Date.now() < nextRefreshAt) return;
      refreshing = true;
      try {
        // Single-flight at module level: shared with the Apollo error link, so the rotating
        // refresh token is never spent twice.
        const result = await exchangeRefreshTokenForSession();
        if (result.ok === false) {
          if (isDefinitiveAuthFailure(result.error)) {
            if (!disposed) signOut("expired");
          } else {
            nextRefreshAt = Date.now() + REFRESH_RETRY_MS; // transient: keep the session
          }
        }
      } catch {
        nextRefreshAt = Date.now() + REFRESH_RETRY_MS;
      } finally {
        refreshing = false;
      }
    };

    const tick = () => {
      if (disposed || signedOut) return;
      const e = evaluateIdleSession(
        { now: Date.now(), lastActivity, accessExpiresAt: accessExpiryMs() },
        cfg,
      );
      if (e.phase === "expired") return signOut("idle");
      if (e.phase === "warning") {
        warningOpen = true;
        setSecondsLeft(e.secondsLeft);
      } else if (warningOpen) {
        warningOpen = false;
        setSecondsLeft(null);
      }
      if (e.phase === "refreshDue") void silentRefresh();
    };

    const record = () => {
      if (disposed || signedOut) return;
      const now = Date.now();
      // Check expiry BEFORE counting this event, so waking a sleeping tab cannot revive it.
      if (evaluateIdleSession({ now, lastActivity, accessExpiresAt: null }, cfg).phase === "expired") {
        return signOut("idle");
      }
      if (!shouldRecordActivity({ now, lastRecorded, warningOpen }, cfg)) return;
      lastRecorded = now;
      lastActivity = now;
      writeStoredActivity(now);
      postRemote({ type: "activity", at: now });
      tick();
    };

    stayRef.current = record;

    const onVisibility = () => {
      if (document.visibilityState === "visible") record();
    };

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, record, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", onVisibility);
    const stopRemote = listenRemote((msg) => {
      const r = applyRemoteMessage({ lastActivity }, msg, Date.now());
      if (r.signOut) return signOut(r.signOut, true);
      lastActivity = r.lastActivity;
      tick();
    });
    const timer = window.setInterval(tick, TICK_MS);
    tick();

    return () => {
      disposed = true;
      window.clearInterval(timer);
      stopRemote();
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, record, { capture: true }));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sessionId, navigate]);

  const stay = useCallback(() => stayRef.current(), []);
  return { secondsLeft, stay };
}

/**
 * Check if the stored JWT token is past its exp claim.
 * Used by auth guards to gate protected routes.
 */
export function isTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return true;

  const expMs = accessExpiryMs();
  if (!expMs) return false; // Can't determine, assume valid

  return Date.now() >= expMs;
}
