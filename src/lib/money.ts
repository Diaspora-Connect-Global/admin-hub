/**
 * Money on this platform is an INTEGER in the currency's lowest denomination —
 * pesewas for GHS, cents for USD. Every wire (GraphQL, gRPC, DB) carries minor
 * units and nothing else.
 *
 * Conversion happens EXACTLY ONCE in each direction, and only here:
 *   • minor -> major (/100) at the display boundary  -> `formatMinorUnits`
 *   • major -> minor (*100) at the input boundary    -> `majorToMinorUnits`
 *
 * A second /100 somewhere downstream is invisible in review and shows up as a
 * price that is 100x wrong in production — that exact bug has already been
 * fixed once on this platform (payment-service's CreatePaymentIntent). Import
 * these instead of writing the arithmetic inline.
 *
 * There is NO FX conversion anywhere. A price is set deliberately per currency;
 * a GHS amount is never derived from a USD one.
 */

/** The currencies the platform settles in. All are 2-decimal-place currencies. */
export const SUPPORTED_CURRENCIES = ["GHS", "USD", "EUR", "GBP", "NGN", "KES"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Minor units per major unit. Every supported currency is 2dp. */
const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Display a minor-unit integer as money. This is the ONLY /100 in the console.
 *
 * Falls back to a plain grouped number when the currency code is unknown to
 * `Intl` rather than throwing — an admin table must still render.
 */
export function formatMinorUnits(minor: number | null | undefined, currency?: string | null): string {
  const value = Number(minor ?? 0) / MINOR_UNITS_PER_MAJOR;
  const code = (currency ?? "").trim().toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code || "GHS",
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)}${code ? ` ${code}` : ""}`;
  }
}

/**
 * Parse an admin-typed major-unit amount ("12.50") into minor units (1250).
 * This is the ONLY *100 in the console.
 *
 * Returns `null` for anything that is not a non-negative number, so callers can
 * refuse to submit rather than silently sending 0 — a price accidentally set to
 * zero is a plan given away for free.
 *
 * `Math.round` after the multiply is load-bearing: 19.99 * 100 is
 * 1998.9999999999998 in IEEE-754, and `Math.trunc` would charge 19.98.
 */
export function majorToMinorUnits(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (raw === "") return null;
  // Reject "1,50", "12.345" and other things that are not a plain 2dp amount.
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * MINOR_UNITS_PER_MAJOR);
}

/**
 * Minor units back into the major-unit string an input field shows, so an edit
 * form is seeded with what was actually stored. Not a display formatter — no
 * currency symbol, no grouping separators (they would fail `majorToMinorUnits`
 * on the way back in).
 */
export function minorToMajorInput(minor: number | null | undefined): string {
  return (Number(minor ?? 0) / MINOR_UNITS_PER_MAJOR).toFixed(2);
}
