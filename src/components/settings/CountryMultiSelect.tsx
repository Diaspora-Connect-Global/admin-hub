import { memo, useCallback, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface CountryMultiSelectProps {
  /** Unique prefix for generated element ids (must be unique per instance on the page). */
  idPrefix: string;
  /** Visible label for the search field, also used as the accessible name of the checkbox group. */
  label: string;
  /** All selectable ISO 3166-1 alpha-2 codes, sorted for display (shared across instances to avoid recomputation). */
  sortedCodes: string[];
  /** code -> localized display name (shared across instances to avoid recomputation). */
  countryNames: Map<string, string>;
  /** Currently-selected ISO codes. */
  selected: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
  describedById?: string;
}

interface CountryRowProps {
  id: string;
  code: string;
  name: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (code: string) => void;
}

/** Memoized so toggling one country re-renders one row, not all ~195. */
const CountryRow = memo(function CountryRow({
  id,
  code,
  name,
  checked,
  disabled,
  onToggle,
}: CountryRowProps) {
  return (
    <div className="flex items-center gap-2 rounded px-1 py-1.5 hover:bg-accent/40">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={() => onToggle(code)}
        disabled={disabled}
      />
      <Label htmlFor={id} className="flex-1 cursor-pointer font-normal">
        {name} <span className="text-xs text-muted-foreground">({code})</span>
      </Label>
    </div>
  );
});

/**
 * Searchable, keyboard-accessible country picker: native checkboxes (so Tab/Space
 * work with zero custom key handling) filtered by a labelled search box, plus a
 * row of removable chips for what's currently selected. Deliberately avoids a
 * hand-rolled combobox/listbox ARIA pattern — those are easy to get subtly wrong
 * for screen readers, and a filtered checkbox list is just as usable here.
 */
export function CountryMultiSelect({
  idPrefix,
  label,
  sortedCodes,
  countryNames,
  selected,
  onChange,
  disabled = false,
  describedById,
}: CountryMultiSelectProps) {
  const [query, setQuery] = useState("");

  const filteredCodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedCodes;
    return sortedCodes.filter((code) => {
      const name = countryNames.get(code) ?? code;
      return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
    });
  }, [query, sortedCodes, countryNames]);

  const sortedSelected = useMemo(
    () =>
      [...selected].sort((a, b) =>
        (countryNames.get(a) ?? a).localeCompare(countryNames.get(b) ?? b),
      ),
    [selected, countryNames],
  );

  // Stable identity (reads latest values via a ref) so memoized rows don't all
  // re-render every time one country is toggled.
  const latest = useRef({ selected, onChange, disabled });
  latest.current = { selected, onChange, disabled };
  const toggle = useCallback((code: string) => {
    const { selected: cur, onChange: change, disabled: off } = latest.current;
    if (off) return;
    change(cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]);
  }, []);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const searchId = `${idPrefix}-search`;
  const listId = `${idPrefix}-list`;

  return (
    <div className="space-y-2">
      <Label htmlFor={searchId}>{label}</Label>

      {sortedSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label={`Selected: ${label}`}>
          {sortedSelected.map((code) => {
            const name = countryNames.get(code) ?? code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggle(code)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary/70 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Remove ${name}`}
              >
                {name}
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}

      <Input
        id={searchId}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search countries…"
        disabled={disabled}
        aria-controls={listId}
        aria-describedby={describedById}
        autoComplete="off"
      />

      <div
        id={listId}
        role="group"
        aria-label={label}
        className="max-h-56 space-y-0.5 overflow-y-auto rounded-md border border-border p-2"
      >
        {filteredCodes.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No countries match &quot;{query}&quot;.
          </p>
        ) : (
          filteredCodes.map((code) => (
            <CountryRow
              key={code}
              id={`${idPrefix}-${code}`}
              code={code}
              name={countryNames.get(code) ?? code}
              checked={selectedSet.has(code)}
              disabled={disabled}
              onToggle={toggle}
            />
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {selected.length} {selected.length === 1 ? "country" : "countries"} selected
      </p>
    </div>
  );
}
