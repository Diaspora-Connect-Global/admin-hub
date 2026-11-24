import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/auth/useAdminAuth";
import { activeTabPath, visibleSectionTabs, type SectionId } from "@/lib/navSections";

interface SectionTabsProps {
  section: SectionId;
  /** i18n key naming the section, read out by screen readers. */
  labelKey: string;
}

/**
 * Tab bar shared by the pages of one merged section (same look as the
 * Settings tabs). Each tab is a link to its own route, so the back button and
 * old bookmarks keep working. Tabs the admin may not open are hidden; with
 * fewer than two left, nothing is rendered.
 */
export function SectionTabs({ section, labelKey }: SectionTabsProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { isSystemAdmin, scopedRole } = useAdminAuth();

  const tabs = visibleSectionTabs(section, { isSystemAdmin, scopedRole });
  if (tabs.length < 2) return null;

  const active = activeTabPath(tabs, pathname);

  return (
    <div className="border-b border-border overflow-x-auto">
      <nav className="flex gap-1 -mb-px" aria-label={t(labelKey)}>
        {tabs.map((tab) => {
          const isActive = tab.path === active;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {t(tab.titleKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
