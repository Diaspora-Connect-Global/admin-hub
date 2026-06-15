import { z } from "zod";

/**
 * Shared zod primitives + helpers for the admin credential modals.
 *
 * These modals keep their controlled-input structure (they have intricate
 * "leave blank to keep existing secret" rotation semantics); zod is used purely
 * as a validation layer that produces per-field error messages rendered inline.
 */

/** ISO 3166-1 alpha-2 country code (two uppercase letters). */
export const isoAlpha2 = z
  .string()
  .regex(/^[A-Z]{2}$/, "Use 2-letter ISO country codes (e.g. GH, NG, US)");

/** An http(s) URL. Empty string is rejected — wrap in .optional()/.or() for optional. */
export const httpUrl = z
  .string()
  .url("Enter a valid URL (https://…)")
  .refine((v) => /^https?:\/\//i.test(v), "URL must start with http:// or https://");

/** A string that must parse as JSON. */
export const jsonString = z
  .string()
  .refine((v) => {
    try {
      JSON.parse(v);
      return true;
    } catch {
      return false;
    }
  }, "Must be valid JSON");

/** An ISO timestamp that must be in the future. */
export const futureIso = z
  .string()
  .refine((v) => {
    const t = new Date(v).getTime();
    return !Number.isNaN(t) && t > Date.now();
  }, "Expiry must be a future date");

/**
 * Run a zod schema against a value and return a flat { field: message } map of
 * the FIRST error per field. Returns null when valid.
 */
export function validate<T>(schema: z.ZodType<T>, value: unknown): Record<string, string> | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
