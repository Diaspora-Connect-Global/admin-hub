/**
 * Formatting helpers for admin role assignments.
 *
 * Admin accounts carry no human name — they're identified by email. Their role
 * assignments come back as raw enums + scope UUIDs (e.g.
 * "COMMUNITY_ADMIN · COMMUNITY · 6ba028da-…"). These helpers turn that into
 * operator-friendly text like "Community admin — Tigray Community".
 */

export interface AdminRoleAssignment {
  roleType?: string | null;
  scopeType?: string | null;
  scopeId?: string | null;
}

/**
 * Convert a role enum like "COMMUNITY_ADMIN" into "Community admin".
 * Nullish/empty input falls back to "Admin".
 */
export function formatRoleType(roleType?: string | null): string {
  const words = (roleType ?? "")
    .trim()
    .split("_")
    .filter(Boolean)
    .map((w) => w.toLowerCase());
  if (words.length === 0) return "Admin";
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ");
}

/**
 * Friendly label for a single role assignment. Appends the resolved scope name
 * when the scopeId is known; otherwise returns the role label alone (never the
 * raw scope type or UUID).
 */
export function formatAdminRole(
  role: AdminRoleAssignment,
  scopeNameById: Map<string, string>,
): string {
  const label = formatRoleType(role.roleType);
  const scopeName = role.scopeId ? scopeNameById.get(role.scopeId) : undefined;
  return scopeName ? `${label} — ${scopeName}` : label;
}
