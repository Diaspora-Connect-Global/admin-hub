import { LayoutDashboard, Users, Wallet, Settings, Bell, FileText, HeadphonesIcon, Shield, Store, Key, Activity, MessageSquare, Calendar, Briefcase, Landmark, CircleDot, ListChecks } from "lucide-react";
import { isNavItemVisible, type NavViewer, type NavVisibilityRules } from "@/lib/navVisibility";
import { pathMatches, visibleSectionTabs, type SectionId } from "@/lib/navSections";

type NavIcon = typeof LayoutDashboard;

/**
 * A sidebar entry. Visibility follows the backend role guards: pages whose
 * admin APIs are `@Roles('SUPER_ADMIN','SYSTEM_ADMIN')` declare no
 * `scopedRoles` and are hidden from community / association admins and
 * moderators (see `isNavItemVisible`).
 *
 * An entry with a `section` stands for several pages shown as tabs (see
 * `lib/navSections`): it is visible when any of its tabs is, opens the first
 * tab this admin may see, and stays highlighted on every tab.
 */
type NavItem = {
  id: string;
  titleKey: string;
  icon: NavIcon;
  path: string;
  section?: SectionId;
} & NavVisibilityRules;

interface NavGroup {
  id: string;
  /** Group heading; the first group has none. */
  headingKey?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "home",
    items: [
      // Overview · Analytics. Dashboard stats/health/analytics APIs are
      // system-admin-only; scoped admins are redirected from "/" to their home
      // page (see pages/Index.tsx).
      { id: "dashboard", titleKey: "nav.dashboard", icon: LayoutDashboard, path: "/", section: "dashboard" },
      // Admin tasks live in the platform team's scope; the route sits behind RequireSystemAdmin.
      { id: "tasks", titleKey: "nav.tasks", icon: ListChecks, path: "/tasks", systemAdminOnly: true },
    ],
  },
  {
    id: "people",
    headingKey: "navSection.people",
    items: [
      // All users · Deletion requests · Verifications (KYC)
      { id: "user_management", titleKey: "nav.users", icon: Users, path: "/users", section: "users" },
    ],
  },
  {
    id: "communities",
    headingKey: "navSection.communities",
    items: [
      { id: "communities", titleKey: "nav.communities", icon: Users, path: "/communities", scopedRoles: ["COMMUNITY_ADMIN", "MODERATOR"] },
      { id: "associations", titleKey: "nav.associations", icon: Landmark, path: "/associations", scopedRoles: ["ASSOCIATION_ADMIN"] },
      // Circles · Plans
      { id: "circles", titleKey: "nav.circles", icon: CircleDot, path: "/circles", section: "circles" },
    ],
  },
  {
    id: "content",
    headingKey: "navSection.content",
    items: [
      // Reported content · Posts & comments
      { id: "moderation", titleKey: "nav.moderation", icon: Shield, path: "/moderation", section: "moderation" },
      { id: "events", titleKey: "nav.events", icon: Calendar, path: "/events", scopedRoles: ["COMMUNITY_ADMIN", "ASSOCIATION_ADMIN", "MODERATOR"] },
      { id: "opportunities", titleKey: "nav.opportunities", icon: Briefcase, path: "/opportunities", scopedRoles: ["COMMUNITY_ADMIN", "ASSOCIATION_ADMIN", "MODERATOR"] },
    ],
  },
  {
    id: "commerce",
    headingKey: "navSection.commerce",
    items: [
      { id: "vendor_management", titleKey: "nav.vendors", icon: Store, path: "/vendors" },
      // Escrows · Disputes · Payouts · Wallets & ledger
      { id: "payments", titleKey: "nav.payments", icon: Wallet, path: "/escrow", section: "payments" },
    ],
  },
  {
    id: "support",
    headingKey: "navSection.support",
    items: [
      // Cases · Case types
      { id: "support_cases", titleKey: "nav.supportCases", icon: HeadphonesIcon, path: "/support", section: "support" },
      { id: "chat_management", titleKey: "nav.chat", icon: MessageSquare, path: "/chats" },
      { id: "notifications", titleKey: "nav.notifications", icon: Bell, path: "/notifications" },
    ],
  },
  {
    id: "platform",
    headingKey: "navSection.platform",
    items: [
      // General · AI · OTP (see components/settings/SettingsTabs)
      { id: "system_settings", titleKey: "nav.settings", icon: Settings, path: "/settings" },
      { id: "roles_permissions", titleKey: "nav.roles", icon: Key, path: "/roles" },
      { id: "audit_logs", titleKey: "nav.audit", icon: FileText, path: "/audit" },
      { id: "system_health", titleKey: "nav.systemHealth", icon: Activity, path: "/health" },
    ],
  },
];

/**
 * The entries this admin can see, each resolved to the route it opens and the
 * routes it lights up on. Groups left empty are dropped.
 */
export function resolveNavGroups(viewer: NavViewer) {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.flatMap((item) => {
        if (!item.section) {
          return isNavItemVisible(item, viewer) ? [{ ...item, matchPaths: [item.path] }] : [];
        }
        const tabs = visibleSectionTabs(item.section, viewer);
        if (tabs.length === 0) return [];
        return [{ ...item, path: tabs[0].path, matchPaths: tabs.map((tab) => tab.path) }];
      }),
    }))
    .filter((group) => group.items.length > 0);
}

/** The id of the entry for `pathname`: the one with the longest matching route wins. */
export function activeNavItemId(
  groups: ReturnType<typeof resolveNavGroups>,
  pathname: string,
): string | null {
  let best: { id: string; length: number } | null = null;
  for (const item of groups.flatMap((group) => group.items)) {
    for (const path of item.matchPaths) {
      if (pathMatches(pathname, path) && (!best || path.length > best.length)) best = { id: item.id, length: path.length };
    }
  }
  return best?.id ?? null;
}
