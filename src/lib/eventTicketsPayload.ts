import type { EventFormData } from "@/types/events";

const DEFAULT_TICKET_NAME = "General Admission";

const normalizeTicketType = (
  value: EventFormData["tickets"][number]["ticketType"] | "paid" | "donation" | string | undefined,
): "general" | "vip" | "early_bird" | "group" | "student" | "member" | "free" => {
  switch (value) {
    case "vip":
    case "early_bird":
    case "group":
    case "student":
    case "member":
    case "free":
    case "general":
      return value;
    default:
      return "general";
  }
};

/**
 * Build the pricing portion of a CreateEventInput payload.
 *
 * Rules:
 * - Free event: omit `isPaid`, `ticketPrice`, `currency`, and `tickets`.
 * - Paid event, single tier: send `isPaid`, `ticketPrice` (cents), and `currency`.
 * - Paid event, multiple tiers: send `isPaid`, `currency`, and `tickets[]`.
 */
export function buildPaidEventTicketFields(
  data: Pick<EventFormData, "isPaid" | "ticketPrice" | "currency" | "tickets">,
):
  | {
      isPaid: true;
      ticketPrice: number;
      currency?: string;
    }
  | {
      isPaid: true;
      currency?: string;
      tickets: Array<{
        name: string;
        ticketType: "general" | "vip" | "early_bird" | "group" | "student" | "member" | "free";
        priceInCents: number;
        currency?: string;
        quantity: number;
        maxPerOrder: number;
      }>;
    }
  | Record<string, never> {
  if (!data.isPaid) {
    return {};
  }

  const normalizedTickets = Array.isArray(data.tickets) ? data.tickets : [];
  const meaningfulTickets = normalizedTickets.filter(
    (ticket) =>
      Boolean(ticket?.name?.trim()) ||
      Number(ticket?.price) > 0 ||
      Number(ticket?.quantity) > 0,
  );

  if (meaningfulTickets.length > 1) {
    return {
      isPaid: true,
      currency: data.currency || "USD",
      tickets: meaningfulTickets.map((ticket, index) => ({
        name: ticket.name.trim() || `${DEFAULT_TICKET_NAME} ${index + 1}`,
        ticketType: normalizeTicketType(ticket.ticketType),
        priceInCents: Math.max(0, Math.round((Number(ticket.price) || 0) * 100)),
        currency: ticket.currency || data.currency || "USD",
        quantity: Math.max(1, Math.floor(Number(ticket.quantity) || 1)),
        maxPerOrder: Math.max(1, Math.floor(Number(ticket.maxPerOrder) || 1)),
      })),
    };
  }

  const firstTicket = meaningfulTickets[0];
  const ticketPrice = firstTicket ? Number(firstTicket.price) : Number(data.ticketPrice) || 0;

  return {
    isPaid: true,
    ticketPrice: Math.max(0, Math.round(ticketPrice * 100)),
    currency: firstTicket?.currency || data.currency || "USD",
  };
}
