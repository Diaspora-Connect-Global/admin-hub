/**
 * Token expiry monitoring component
 * Placed at app root to monitor JWT expiry across all routes
 */

import { useTokenExpiry } from "@/hooks/auth/useTokenExpiry";

export function TokenExpiryMonitor() {
  // Hook runs on mount and tracks token expiry
  useTokenExpiry();
  
  // Component renders nothing - it's just for side effects
  return null;
}
