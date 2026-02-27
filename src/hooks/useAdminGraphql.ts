/**
 * Re-exports: use Admin auth and GraphQL hooks from their dedicated modules.
 * Prefer importing from @/hooks/auth or @/hooks/admin when adding new code.
 */
export { useAdminAuth } from "./auth/useAdminAuth";
export * from "./admin";
