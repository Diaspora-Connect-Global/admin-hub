/**
 * Platform money rule: amounts on the wire are INTEGER MINOR UNITS (x100).
 * Convert exactly once at the UI boundary: major -> minor on input, minor -> major on display.
 *
 * Opportunity compensation is 64-bit on the backend (bigint / int64) and a GraphQL Float,
 * exact for integers up to Number.MAX_SAFE_INTEGER, so the largest amount is
 * 90,071,992,547,409.91 major units. Parsing is done on the TEXT (integer and cents parts),
 * never as `Number(text) * 100`, which is inexact for large amounts.
 */
export const MAX_MINOR_UNITS = Number.MAX_SAFE_INTEGER;

const MAJOR_TEXT = /^(\d*)(?:\.(\d{0,2}))?$/;

/** Form text in major units ("1234.56") -> integer minor units, or undefined when blank/invalid/too large. */
export function majorTextToMinor(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const m = MAJOR_TEXT.exec(trimmed);
  if (!m || (!m[1] && !m[2])) return undefined; // negatives, exponents, more than 2 decimals, letters, "."
  const major = Number(m[1] || "0");
  const cents = Number((m[2] ?? "").padEnd(2, "0"));
  const minor = major * 100 + cents;
  if (!Number.isSafeInteger(major) || !Number.isSafeInteger(minor) || minor > MAX_MINOR_UNITS) return undefined;
  return minor;
}

/** True when the text is blank (no amount) or a valid amount; false when it must be corrected. */
export function isValidMajorText(text: string): boolean {
  return !text.trim() || majorTextToMinor(text) !== undefined;
}

/** Integer minor units -> form text in major units ("1234.56", "50000"), "" when null/undefined/invalid. */
export function minorToMajorText(minor: number | null | undefined): string {
  if (minor == null || !Number.isSafeInteger(minor) || minor < 0) return "";
  const major = Math.floor(minor / 100);
  const cents = minor % 100;
  return cents === 0 ? String(major) : `${major}.${String(cents).padStart(2, "0")}`;
}
