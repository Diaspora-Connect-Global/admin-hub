import { Observable } from "@apollo/client";
import type { ApolloLink } from "@apollo/client/link";
import { ErrorLink } from "@apollo/client/link/error";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";
import { clearSession } from "@/stores/session";
import { exchangeRefreshTokenForSession } from "./refreshAccessToken";

/** Mutations that must never trigger refresh+retry (avoid loops / wrong semantics). */
const SKIP_REFRESH_OPERATION_NAMES = new Set(["AdminLogin", "Logout"]);

let refreshInFlight: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = exchangeRefreshTokenForSession()
      .then((r) => r.ok)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function isAuthFailure(error: unknown): boolean {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some((e) => {
      const code = e.extensions?.code;
      if (code === "UNAUTHENTICATED") return true;
      const msg = e.message ?? "";
      return /(jwt|token expired|invalid token|expired signature|access token|session expired|must be logged in|not authenticated)/i.test(
        msg,
      );
    });
  }
  if (ServerError.is(error) && error.statusCode === 401) return true;
  return false;
}

function redirectToLoginExpired(): void {
  const path = window.location.pathname;
  if (path.startsWith("/login")) return;
  window.location.replace(`${window.location.origin}/login?expired=1`);
}

/**
 * On auth-related GraphQL/network errors: refresh tokens once, retry the operation.
 * Uses fetch-based refresh to avoid circular dependency with Apollo client.
 */
export function createTokenRefreshErrorLink(): ErrorLink {
  return new ErrorLink(({ error, operation, forward }) => {
    const name = operation.operationName ?? "";
    if (SKIP_REFRESH_OPERATION_NAMES.has(name)) {
      return undefined;
    }

    if (!isAuthFailure(error)) {
      return undefined;
    }

    const ctx = operation.getContext() as { authRetryCount?: number };
    const retries = ctx.authRetryCount ?? 0;
    if (retries >= 1) {
      return undefined;
    }
    operation.setContext({ ...ctx, authRetryCount: retries + 1 });

    return new Observable<ApolloLink.Result>((observer) => {
      let innerSub: { unsubscribe: () => void } | undefined;

      refreshOnce()
        .then((ok) => {
          if (!ok) {
            clearSession();
            redirectToLoginExpired();
            observer.error(error);
            return;
          }
          innerSub = forward(operation).subscribe({
            next: (v) => observer.next(v),
            error: (e) => observer.error(e),
            complete: () => observer.complete(),
          });
        })
        .catch((e) => observer.error(e));

      return () => innerSub?.unsubscribe();
    });
  });
}
