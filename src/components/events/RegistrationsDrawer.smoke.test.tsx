import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const hooks = vi.hoisted(() => ({
  refetch: vi.fn(),
  markCheckedIn: vi.fn().mockResolvedValue({}),
  removeRegistration: vi.fn().mockResolvedValue({}),
}));
const reg = {
  id: "reg-1", eventId: "e1", userId: "user-1", user: { id: "user-1", firstName: "Ama", lastName: "Mensah", email: "ama@example.com", avatarUrl: null },
  quantity: 2, status: "CONFIRMED", registrationStatus: "CONFIRMED", totalAmount: null, currency: null, registeredAt: "2026-11-01T10:00:00Z",
  formResponsesJson: JSON.stringify({ full_name: "Ama Mensah", diet: ["Vegan", "Halal"], newsletter: true }),
};
// Stable result object, as Apollo returns between renders (a fresh one each render loops the drawer's effects).
const registrationsResult = { data: { getEventRegistrations: { total: 1, registrations: [reg] } }, loading: false, refetch: hooks.refetch };
vi.mock("@/hooks/events", () => ({
  useGetEventRegistrations: () => registrationsResult,
  useMarkRegistrationCheckedIn: () => [hooks.markCheckedIn],
  useRemoveEventRegistration: () => [hooks.removeRegistration],
}));
const apolloClient = vi.hoisted(() => ({ query: () => Promise.resolve({ data: null }) }));
vi.mock("@apollo/client/react", () => ({ useApolloClient: () => apolloClient }));
vi.mock("@/components/events/networking/EventNetworkingTabs", () => ({ EventNetworkingTabs: () => null }));

import "@/i18n";
import { RegistrationsDrawer } from "./RegistrationsDrawer";

const event = {
  id: "e1", title: "Gala", isPaid: false,
  registrationFormFields: [
    { id: "full_name", label: "Full name", type: "text", required: true, options: null },
    { id: "diet", label: "Diet", type: "multiselect", required: false, options: ["Vegan", "Halal"], builtin: null },
    { id: "newsletter", label: "Newsletter", type: "checkbox", required: false, options: null, builtin: null },
  ],
} as never;

beforeAll(() => {
  class RO { observe() {} unobserve() {} disconnect() {} }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO;
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture = () => false;
  proto.releasePointerCapture = () => {};
  proto.setPointerCapture = () => {};
  proto.scrollIntoView = () => {};
});
afterEach(() => cleanup());
beforeEach(() => { hooks.markCheckedIn.mockClear(); hooks.removeRegistration.mockClear(); });

const openMenu = () => {
  const trigger = document.querySelector('button[aria-haspopup="menu"]') as HTMLElement;
  fireEvent.keyDown(trigger, { key: "Enter" });
};

describe("RegistrationsDrawer (admin-hub)", () => {
  it("shows answers per registrant with translated default names, no ids; check-in and remove still work", async () => {
    render(<RegistrationsDrawer open onOpenChange={() => {}} event={event} />);
    expect(await screen.findByText("Ama Mensah")).toBeTruthy();
    expect(screen.getByRole("button", { name: /export csv/i })).toBeTruthy();

    openMenu();
    fireEvent.click(await screen.findByText("View answers"));
    expect(await screen.findByText("Vegan, Halal")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
    expect(screen.getByText("Full name")).toBeTruthy();
    expect(screen.queryByText(/reg-1|user-1/)).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" }).find((b) => b.textContent === "Close")!);
    await waitFor(() => expect(screen.queryByText("Vegan, Halal")).toBeNull());

    openMenu();
    fireEvent.click(await screen.findByText(/mark checked in/i));
    await waitFor(() => expect(hooks.markCheckedIn).toHaveBeenCalledWith({ variables: { registrationId: "reg-1" } }));

    openMenu();
    fireEvent.click(await screen.findByText(/remove/i));
    await waitFor(() => expect(hooks.removeRegistration).toHaveBeenCalledWith({ variables: { registrationId: "reg-1" } }));
  });
});
