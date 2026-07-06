import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { COMMUNITY_SERVICES } from "@/constants/communityServices";

interface ServiceCheckboxGridProps {
  /** Currently-selected service keys. */
  selected: string[];
  /** Toggle a single service on/off. */
  onToggle: (key: string) => void;
  /** Optional bulk helpers — when provided, "Select all / Clear all" controls render. */
  onSelectAll?: () => void;
  onClearAll?: () => void;
  disabled?: boolean;
  /** Unique prefix so multiple grids on one page keep distinct checkbox ids. */
  idPrefix?: string;
}

/**
 * Reusable checkbox list of the canonical service catalog. Presentation only —
 * the parent owns the selected state. Shared by the create dialogs, the System
 * Settings "Default Services" panels and the detail-page Services editors.
 */
export function ServiceCheckboxGrid({
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
  disabled = false,
  idPrefix = "service",
}: ServiceCheckboxGridProps) {
  const { t } = useTranslation();
  const selectedSet = new Set(selected);

  return (
    <div className="space-y-3">
      {(onSelectAll || onClearAll) && (
        <div className="flex items-center justify-end gap-2">
          {onSelectAll && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              disabled={disabled}
            >
              {t("services.selectAll")}
            </Button>
          )}
          {onClearAll && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={disabled}
            >
              {t("services.clearAll")}
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {COMMUNITY_SERVICES.map((service) => {
          const Icon = service.icon;
          const checkboxId = `${idPrefix}-${service.key}`;
          const label = t(`services.items.${service.key}.label`, service.label);
          const description = t(
            `services.items.${service.key}.description`,
            service.description,
          );
          return (
            <label
              key={service.key}
              htmlFor={checkboxId}
              className="flex items-start gap-3 rounded-md border border-border bg-background p-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={checkboxId}
                checked={selectedSet.has(service.key)}
                onCheckedChange={() => onToggle(service.key)}
                disabled={disabled}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
