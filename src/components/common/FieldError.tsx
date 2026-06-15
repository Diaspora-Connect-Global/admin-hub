/** Inline form-field error message. Renders nothing when there's no error. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
