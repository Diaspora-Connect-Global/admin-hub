/**
 * Platform money rule: amounts on the wire are INTEGER MINOR UNITS (x100).
 * Convert exactly once at the UI boundary: major -> minor on input, minor -> major on display.
 */

/** Form text in major units ("1234.56") -> integer minor units, or undefined when blank/invalid. */
export function majorTextToMinor(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

/** Integer minor units -> form text in major units ("1234.56", "50000"), "" when null/undefined. */
export function minorToMajorText(minor: number | null | undefined): string {
  if (minor == null) return "";
  return String(Math.round(minor) / 100);
}
