/** Apollo `errorPolicy: "all"` can resolve with `errors` set — surface them instead of showing a false success. */
export function throwIfGraphQLErrors(result: unknown, operationLabel: string): void {
  const errors = (result as { errors?: ReadonlyArray<{ message?: string }> | undefined })?.errors;
  if (!errors?.length) return;
  const msg = errors.map((e) => e.message ?? "Unknown GraphQL error").join("; ");
  throw new Error(`${operationLabel}: ${msg}`);
}
