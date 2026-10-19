import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("@/services/networks/graphql/events/eventNetworking", async () => {
  const actual = await vi.importActual<typeof import("@/services/networks/graphql/events/eventNetworking")>("@/services/networks/graphql/events/eventNetworking");
  return {
    ...actual,
    listRegistrationsByStatus: vi.fn(),
    approveRegistration: vi.fn(),
    rejectRegistration: vi.fn(),
  };
});
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

import * as api from "@/services/networks/graphql/events/eventNetworking";
import type { ManagedRegistration } from "@/services/networks/graphql/events/eventNetworking";
import { ApprovalsPanel } from "./ApprovalsPanel";
import { toast } from "@/hooks/use-toast";

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("ApprovalsPanel", () => {
  const person = (id: string, first: string, pos: number | null = null): ManagedRegistration => ({
    id, eventId: "e1", status: "x", registrationStatus: null, waitlistPosition: pos, quantity: 1,
    totalAmount: null, currency: null, registeredAt: null, user: { firstName: first, lastName: "Mensah", email: null, avatarUrl: null },
  });

  const onlyPending = (rows: ManagedRegistration[]) =>
    vi.mocked(api.listRegistrationsByStatus).mockImplementation(async (_e, status) =>
      status === "PENDING_APPROVAL" ? { registrations: rows, total: rows.length } : { registrations: [], total: 0 });

  it("lists pending people and waitlist ordered by position, with no ids on screen", async () => {
    vi.mocked(api.listRegistrationsByStatus).mockImplementation(async (_e, status) =>
      status === "PENDING_APPROVAL"
        ? { registrations: [person("11111111-2222-3333-4444-555555555555", "Ama")], total: 1 }
        : { registrations: [person("r3", "Kofi", 2), person("r2", "Esi", 1)], total: 2 });
    const { container } = render(<ApprovalsPanel eventId="e1" />);
    await screen.findByText("Ama Mensah");
    const text = container.textContent ?? "";
    expect(text.indexOf("Esi")).toBeLessThan(text.indexOf("Kofi"));
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/i);
  });

  it("declines with the typed reason and refreshes", async () => {
    onlyPending([person("r1", "Ama")]);
    vi.mocked(api.rejectRegistration).mockResolvedValue({ id: "r1", status: "rejected", registrationStatus: "REJECTED" });
    render(<ApprovalsPanel eventId="e1" />);
    await screen.findByText("Ama Mensah");
    fireEvent.click(screen.getAllByRole("button", { name: /decline/i })[0]);
    fireEvent.change(await screen.findByLabelText(/reason/i), { target: { value: "Event is members only" } });
    fireEvent.click(screen.getByRole("button", { name: /decline registration/i }));
    await waitFor(() => expect(api.rejectRegistration).toHaveBeenCalledWith("r1", "Event is members only"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Registration declined" })));
  });

  it("shows a refused approval as a friendly message, not as success", async () => {
    onlyPending([person("r1", "Ama")]);
    vi.mocked(api.approveRegistration).mockRejectedValue(new api.EventOperationError("That can't be done in the registration's current state. Refresh and try again.", ["EVENT_CONFLICT"]));
    render(<ApprovalsPanel eventId="e1" />);
    await screen.findByText("Ama Mensah");
    fireEvent.click(screen.getAllByRole("button", { name: /approve/i })[0]);
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Could not approve", variant: "destructive" })));
    expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ title: "Registration approved" }));
  });
});
