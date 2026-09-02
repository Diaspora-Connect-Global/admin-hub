/**
 * Minor-unit money helpers.
 *
 * Platform rule: every monetary amount on every wire (GraphQL variables and
 * responses, gRPC payloads, DB columns) is an INTEGER in the currency's lowest
 * denomination — pesewas for GHS, cents for USD. `5000` means GHS 50.00.
 *
 * Conversion happens EXACTLY ONCE in each direction, and only here:
 *   - `majorToMinor` at the input boundary (what the admin typed → the wire)
 *   - `formatMinorUnits` / `minorToMajorInput` at the display boundary
 *
 * Never send a decimal, and never divide anywhere else.
 */

/** Currencies the platform settles in. GHS is the base currency. */
export const SUPPORTED_CURRENCIES = ["GHS", "USD", "EUR", "GBP", "NGN", "KES"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** All supported currencies are 2-decimal, so the factor is a constant. */
const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Major units as typed by an admin → integer minor units for the wire.
 * Returns null when the input is not a usable non-negative number, so callers
 * can refuse to submit rather than sending NaN.
 */
export function majorToMinor(input: string | number): number | null {
  let major: number;
  if (typeof input === "number") {
    major = input;
  } else {
    const trimmed = input.trim();
    // `Number("")` is 0, not NaN — without this an empty price field would
    // submit as a real price of zero instead of being refused.
    if (!trimmed) return null;
    major = Number(trimmed);
  }
  if (!Number.isFinite(major) || major < 0) return null;
  // Round after multiplying — 19.99 * 100 is 1998.9999999999998 in float.
  return Math.round(major * MINOR_UNITS_PER_MAJOR);
}

/** Integer minor units → a plain major-unit string for a form input ("5000" → "50.00"). */
export function minorToMajorInput(minor: number): string {
  if (!Number.isFinite(minor)) return "";
  return (minor / MINOR_UNITS_PER_MAJOR).toFixed(2);
}

/** Integer minor units → a localized currency string for display only. */
export function formatMinorUnits(minor: number, currency?: string | null): string {
  const amount = Number.isFinite(minor) ? minor / MINOR_UNITS_PER_MAJOR : 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "GHS",
    }).format(amount);
  } catch {
    // Unknown ISO code (a currency added backend-side before this list) —
    // still show the number rather than throwing inside a table cell.
    return `${currency ?? ""} ${amount.toFixed(2)}`.trim();
  }
}
