/**
 * Shared JWT decode utilities.
 * Uses browser-native atob() only — no external dependencies.
 */

export interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: unknown;
}

/**
 * Decode a JWT and return its payload, or null if the token is malformed.
 * Does NOT verify the signature — suitable for reading claims client-side only.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Convert base64url → base64, then pad to a multiple of 4
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Return the expiry as a Date object, or null if the token is malformed
 * or contains no `exp` claim.
 */
export function getJwtExpiry(token: string): Date | null {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") return null;
  return new Date(payload.exp * 1000);
}

/**
 * Return true if the token is expired or malformed.
 * A token with no `exp` claim is treated as not expired.
 */
export function isJwtExpired(token: string): boolean {
  const expiry = getJwtExpiry(token);
  if (expiry === null) {
    // No exp claim — check whether we could even decode it
    return decodeJwt(token) === null;
  }
  return Date.now() >= expiry.getTime();
}
