import { describe, it, expect } from "vitest";
import en from "./locales/en.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import nl from "./locales/nl.json";

/** Recursively collect dotted key paths from a nested translation object. */
function flatKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === "object" && !Array.isArray(value)
      ? flatKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

const enKeys = new Set(flatKeys(en as Record<string, unknown>));
const locales = { de, es, fr, nl } as Record<string, Record<string, unknown>>;

describe("i18n locale parity", () => {
  for (const [name, locale] of Object.entries(locales)) {
    it(`[${name}] has the same keys as en.json`, () => {
      const keys = new Set(flatKeys(locale));
      const missing = [...enKeys].filter((k) => !keys.has(k));
      const extra = [...keys].filter((k) => !enKeys.has(k));
      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    });
  }
});
