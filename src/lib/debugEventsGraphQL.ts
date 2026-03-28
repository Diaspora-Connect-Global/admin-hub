import type { EventFormData } from "@/types/events";

/**
 * Logs event save payloads for pasting into GraphQL Playground / browser console.
 * Enable with localStorage: `localStorage.setItem("debug_events_graphql", "1")` (reload).
 * Or runs automatically in Vite development (`import.meta.env.DEV`).
 */
export function isEventsGraphQLDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem("debug_events_graphql") === "1";
  } catch {
    return false;
  }
}

export function logEventFormSnapshot(data: EventFormData): void {
  if (!isEventsGraphQLDebugEnabled()) return;
  const { bannerImage, ...rest } = data;
  console.groupCollapsed("[Events GraphQL] modal formData (serializable)");
  console.log({
    ...rest,
    date: data.date?.toISOString?.() ?? data.date,
    bannerImage: bannerImage ? `[File: ${bannerImage.name}, ${bannerImage.size} bytes]` : null,
  });
  console.groupEnd();
}

export function logEventMutation(operationName: string, variables: unknown): void {
  if (!isEventsGraphQLDebugEnabled()) return;
  console.groupCollapsed(`[Events GraphQL] ${operationName}`);
  console.log("variables (object):", variables);
  console.log("variables JSON (copy below):");
  console.log(JSON.stringify(variables, null, 2));
  console.groupEnd();
}
