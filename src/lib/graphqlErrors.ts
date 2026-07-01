/** Apollo `errorPolicy: "all"` can resolve with `errors` set — surface them instead of showing a false success. */
export function throwIfGraphQLErrors(result: unknown, operationLabel: string): void {
  const errors = (result as { errors?: ReadonlyArray<{ message?: string }> | undefined })?.errors;
  if (!errors?.length) return;
  const msg = errors.map((e) => e.message ?? "Unknown GraphQL error").join("; ");
  throw new Error(`${operationLabel}: ${msg}`);
}

/**
 * Maps a backend DB CHECK-constraint name to admin-friendly guidance.
 *
 * The backend enforces invariants at the DB layer (see the `@Check(...)`
 * decorators / `CONSTRAINT ck_* CHECK (...)` migrations in the services). When
 * one is violated, Postgres surfaces a raw message like
 * `new row for relation "events" violates check constraint "ck_events_title_length"`
 * which is meaningless to an admin. This table turns each into a clear sentence.
 *
 * Keep in sync with the backend constraints. Anything not listed falls through
 * to the generic handling in `friendlyErrorMessage`.
 */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  // event-service — events
  ck_events_title_length: "Event title must be at least 5 characters long.",
  ck_events_description_length: "Event description must be at least 20 characters long.",
  ck_events_dates: "The event's start time must be before its end time.",
  ck_events_capacity_positive: "Event capacity must be greater than zero.",
  // event-service — tickets
  ck_tickets_name_length: "Ticket name must be at least 2 characters long.",
  ck_tickets_price_positive: "Ticket price cannot be negative.",
  ck_tickets_min_max_order:
    "Minimum per order must be at least 1 and cannot exceed the maximum per order.",
  ck_tickets_quantity_positive: "Ticket quantity must be greater than zero.",
  // event-service — registrations
  ck_registrations_quantity: "Registration quantity must be at least 1.",
  ck_registrations_amount: "Registration amount cannot be negative.",
  // event-service — promotions
  ck_promo_discount_value: "Discount value must be greater than zero.",
  ck_promo_percentage: "A percentage discount cannot exceed 100%.",
  // event-service — recurring / calendar
  ck_recurring_duration_positive: "Duration must be at least 1 minute.",
  ck_recurring_interval_positive: "Recurrence interval must be at least 1.",
  ck_recurring_capacity_positive: "Capacity must be greater than zero.",
  ck_cal_date_range: "End date cannot be before the start date.",
};

/** Extract a raw message from any thrown value / Apollo error shape. */
function rawMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  const anyErr = err as {
    message?: string;
    graphQLErrors?: ReadonlyArray<{ message?: string }>;
    networkError?: { message?: string };
  };
  if (anyErr.graphQLErrors?.length) {
    return anyErr.graphQLErrors.map((e) => e.message ?? "").filter(Boolean).join("; ");
  }
  return anyErr.message ?? anyErr.networkError?.message ?? "";
}

/**
 * Turns any backend/Apollo error into an admin-friendly message. Handles, in
 * order: known DB CHECK constraints, common Postgres error shapes (unique /
 * not-null / foreign-key / value-too-long), network failures, and finally
 * falls back to the raw message (or a generic sentence when empty).
 *
 * Use this at every mutation catch site instead of `(e as Error).message` so
 * admins never see raw SQL/GraphQL internals.
 */
export function friendlyErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const raw = rawMessage(err);
  if (!raw) return fallback;

  // 1) Named DB CHECK constraints.
  const ckMatch = raw.match(/(?:check constraint\s+"|constraint\s+")?(ck_[a-z0-9_]+)"?/i);
  if (ckMatch) {
    const mapped = CONSTRAINT_MESSAGES[ckMatch[1]];
    if (mapped) return mapped;
  }

  // 2) Common Postgres error shapes.
  if (/duplicate key value violates unique constraint/i.test(raw)) {
    return "This record already exists — a value that must be unique is duplicated.";
  }
  if (/violates not-null constraint/i.test(raw)) {
    const col = raw.match(/column "([^"]+)"/i)?.[1];
    return col
      ? `Required field is missing: ${col.replace(/_/g, " ")}.`
      : "A required field is missing.";
  }
  if (/violates foreign key constraint/i.test(raw)) {
    return "A referenced record could not be found. Please refresh and try again.";
  }
  if (/value too long for type character varying\((\d+)\)/i.test(raw)) {
    const max = raw.match(/character varying\((\d+)\)/i)?.[1];
    return max ? `One of the fields is too long (max ${max} characters).` : "One of the fields is too long.";
  }

  // 3) Network / gateway failures.
  if (/failed to fetch|networkerror|err_failed|502|bad gateway|503|service unavailable/i.test(raw)) {
    return "Cannot reach the server right now. Please try again in a moment.";
  }
  if (/unauthenticated|not authenticated|jwt|unauthorized|401/i.test(raw)) {
    return "Your session has expired. Please sign in again.";
  }
  if (/forbidden|not authorized|permission|403/i.test(raw)) {
    return "You do not have permission to perform this action.";
  }

  // 4) Fall back to the raw message, stripping any GraphQL operation prefix.
  return raw.replace(/^[A-Za-z ]+:\s*/, "").trim() || fallback;
}
