import { describe, it, expect, vi, beforeAll } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@/i18n";
import CircleManagement from "./CircleManagement";

const CIRCLE_ID = "3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a99";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  refetch: vi.fn(),
  suspendCircle: vi.fn(),
}));

const circle = {
  id: CIRCLE_ID,
  circleNumber: "CIR-2026-0007",
  name: "Sunday Runners",
  handle: "sunday-runners",
  discoverable: true,
  joinMode: "REQUEST",
  status: "ACTIVE",
  memberCount: 6,
  createdAt: "2026-09-01T00:00:00.000Z",
};

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }), toast: mocks.toast }));

vi.mock("@/components/layout/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/admin", () => ({
  CIRCLE_STATUSES: ["ACTIVE", "DORMANT", "SUSPENDED", "ARCHIVED", "DISSOLVED"],
  useAdminCircles: () => ({
    data: { adminCircles: [circle] },
    loading: false,
    error: undefined as unknown,
    refetch: mocks.refetch,
  }),
  useAdminCircleSubscriptions: () => ({ data: { adminCircleSubscriptions: [] as unknown[] } }),
  useAdminSuspendCircle: () => [mocks.suspendCircle, { loading: false }],
  useAdminUnsuspendCircle: () => [vi.fn(), { loading: false }],
  useAdminDissolveCircle: () => [vi.fn(), { loading: false }],
}));

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

async function suspendFromTheList() {
  render(
    <MemoryRouter>
      <CircleManagement />
    </MemoryRouter>,
  );
  const row = screen.getByText("Sunday Runners").closest("tr") as HTMLElement;
  const buttons = within(row).getAllByRole("button");
  await userEvent.click(buttons[buttons.length - 1]);
  await userEvent.click(await screen.findByRole("menuitem", { name: /^suspend$/i }));
  const dialog = await screen.findByRole("dialog", { name: /suspend sunday runners\?/i });
  await userEvent.type(within(dialog).getByLabelText(/reason \(required\)/i), "Fraud");
  await userEvent.click(within(dialog).getByRole("button", { name: /^suspend$/i }));
}

const toastTitles = () => mocks.toast.mock.calls.map(([arg]) => (arg as { title?: string }).title);

describe("Circle management — platform acts report the server's answer", () => {
  it("a refused suspension shows only an error, never a success toast, and does not re-read", async () => {
    // errorPolicy "all": the refusal RESOLVES with data null + error.
    mocks.suspendCircle.mockResolvedValue({ data: null, error: { message: "Forbidden resource" } });
    await suspendFromTheList();

    await waitFor(() => expect(toastTitles()).toEqual(["Something went wrong"]));
    expect(mocks.toast.mock.calls[0][0]).toMatchObject({
      description: "You do not have permission to perform this action.",
      variant: "destructive",
    });
    expect(mocks.refetch).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: /suspend sunday runners\?/i })).toBeInTheDocument();
  });

  it("a confirmed suspension shows success, closes and re-reads the list", async () => {
    mocks.suspendCircle.mockResolvedValue({ data: { adminSuspendCircle: { ...circle, status: "SUSPENDED" } } });
    await suspendFromTheList();

    await waitFor(() => expect(mocks.refetch).toHaveBeenCalledTimes(1));
    expect(toastTitles()).toEqual(["Success"]);
    expect(mocks.suspendCircle).toHaveBeenCalledWith({ variables: { circleId: CIRCLE_ID, reason: "Fraud" } });
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /suspend sunday runners\?/i })).not.toBeInTheDocument(),
    );
    expect(document.body.textContent).not.toContain(CIRCLE_ID);
  });
});
