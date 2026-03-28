import type { EventFormData } from "@/types/events";

const DEFAULT_TICKET_NAME = "General admission";

/**
 * Many event APIs persist “paid” via a default ticket row with `priceInCents`.
 * Omit entirely for free events so the server does not keep stale tickets.
 */
export function buildPaidEventTicketFields(
  data: Pick<EventFormData, "isPaid" | "ticketPrice">,
): { tickets: Array<{ name: string; priceInCents: number }> } | Record<string, never> {
  if (!data.isPaid) {
    return {};
  }
  return {
    tickets: [
      {
        name: DEFAULT_TICKET_NAME,
        priceInCents: Math.max(0, Math.round((Number(data.ticketPrice) || 0) * 100)),
      },
    ],
  };
}
