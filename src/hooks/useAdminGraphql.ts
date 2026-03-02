/**
 * Re-exports: Admin auth, admin GraphQL, and opportunity hooks.
 * Prefer importing from @/hooks/auth, @/hooks/admin, or @/hooks/opportunity.
 */
export { useAdminAuth } from "./auth/useAdminAuth";
export * from "./admin";
export * from "./opportunity";
