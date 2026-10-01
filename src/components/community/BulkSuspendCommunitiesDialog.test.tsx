import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import "@/i18n";
import { BulkSuspendCommunitiesDialog, type BulkSuspendTarget } from "./BulkSuspendCommunitiesDialog";
import { SUSPEND_COMMUNITY } from "@/services/networks/graphql/admin";
import { toast } from "@/hooks/use-toast";

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

const ACCRA: BulkSuspendTarget = { id: "0b6f1c2e-3d4a-4b5c-8d9e-0f1a2b3c4d5e", name: "Accra Diaspora Hub", isSuspended: false };
const LAGOS: BulkSuspendTarget = { id: "1c7a2d3f-4e5b-4c6d-9e0f-1a2b3c4d5e6f", name: "Lagos Traders", isSuspended: false };
const KUMASI: BulkSuspendTarget = { id: "2d8b3e4a-5f6c-4d7e-8f9a-2b3c4d5e6f7a", name: "Kumasi Circle", isSuspended: true };

const okPayload = { success: true, message: "Community suspended", timestamp: "2026-10-01T00:00:00.000Z" };

const suspendMock = (communityId: string, result: Record<string, unknown>, onCall = vi.fn(), reason?: string) => ({
  request: {
    query: SUSPEND_COMMUNITY,
    variables: { input: { communityId, ...(reason ? { reason } : {}) } },
  },
  result: () => {
    onCall();
    return result;
  },
});

function renderDialog(communities: BulkSuspendTarget[], mocks: ReadonlyArray<Record<string, unknown>>) {
  const handlers = { onOpenChange: vi.fn(), onChanged: vi.fn(), onCompleted: vi.fn() };
  render(
    <MockedProvider mocks={mocks as never} defaultOptions={{ mutate: { errorPolicy: "all" } }}>
      <BulkSuspendCommunitiesDialog communities={communities} open {...handlers} />
    </MockedProvider>,
  );
  return handlers;
}

const toastCalls = () => vi.mocked(toast).mock.calls.map(([arg]) => arg as { title?: string; variant?: string });

describe("BulkSuspendCommunitiesDialog", () => {
  it("names what will happen, suspends each active community with the reason, and closes", async () => {
    const onAccra = vi.fn();
    const onLagos = vi.fn();
    const handlers = renderDialog(
      [ACCRA, LAGOS],
      [
        suspendMock(ACCRA.id, { data: { suspendCommunity: okPayload } }, onAccra, "Coordinated fraud"),
        suspendMock(LAGOS.id, { data: { suspendCommunity: okPayload } }, onLagos, "Coordinated fraud"),
      ],
    );

    const dialog = screen.getByRole("dialog", { name: /suspend the selected communities/i });
    expect(dialog).toHaveTextContent(/nobody new can join/i);
    expect(dialog).toHaveTextContent("Will be suspended (2):");
    expect(within(dialog).getByText(ACCRA.name)).toBeInTheDocument();
    expect(within(dialog).getByText(LAGOS.name)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/reason \(optional\)/i), "Coordinated fraud");
    await userEvent.click(screen.getByRole("button", { name: "Suspend (2)" }));

    await waitFor(() => expect(handlers.onOpenChange).toHaveBeenCalledWith(false));
    expect(onAccra).toHaveBeenCalledTimes(1);
    expect(onLagos).toHaveBeenCalledTimes(1);
    expect(handlers.onChanged).toHaveBeenCalledTimes(1);
    expect(handlers.onCompleted).toHaveBeenCalledWith([]);
    expect(toastCalls()).toEqual([{ title: "Communities suspended", description: "Suspended: 2." }]);
  });

  it("skips communities that are already suspended, so their recorded reason is not overwritten", async () => {
    const onAccra = vi.fn();
    const handlers = renderDialog([ACCRA, KUMASI], [suspendMock(ACCRA.id, { data: { suspendCommunity: okPayload } }, onAccra)]);

    expect(screen.getByText(/already suspended — left unchanged/i)).toHaveTextContent("(1)");
    await userEvent.click(screen.getByRole("button", { name: "Suspend (1)" }));

    await waitFor(() => expect(handlers.onOpenChange).toHaveBeenCalledWith(false));
    expect(onAccra).toHaveBeenCalledTimes(1);
  });

  it("disables confirm when every selected community is already suspended", () => {
    renderDialog([KUMASI], []);
    expect(screen.getByText("Every selected community is already suspended.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspend (0)" })).toBeDisabled();
  });

  it("reports a partial failure by name, never as a success, and narrows a retry to the failures", async () => {
    const handlers = renderDialog(
      [ACCRA, LAGOS],
      [
        suspendMock(ACCRA.id, { data: { suspendCommunity: okPayload } }),
        suspendMock(LAGOS.id, { data: null, errors: [{ message: "Forbidden resource" }] }),
      ],
    );

    await userEvent.click(screen.getByRole("button", { name: "Suspend (2)" }));

    const report = await screen.findByRole("alert");
    expect(report).toHaveTextContent("Suspended 1 of 2. These communities were not suspended:");
    expect(within(report).getByText(LAGOS.name)).toBeInTheDocument();
    expect(report).toHaveTextContent(/do not have permission/i);
    expect(toastCalls().map((c) => c.title)).toEqual(["Some suspensions failed"]);
    expect(toastCalls()[0].variant).toBe("destructive");
    expect(handlers.onChanged).toHaveBeenCalledTimes(1);
    expect(handlers.onCompleted).toHaveBeenCalledWith([LAGOS.id]);
    expect(handlers.onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByText("Will be suspended (1):")).toBeInTheDocument();
  });

  it("treats success:false as a failure and does not re-read when nothing changed", async () => {
    const handlers = renderDialog(
      [ACCRA],
      [suspendMock(ACCRA.id, { data: { suspendCommunity: { ...okPayload, success: false, message: "Community not found" } } })],
    );

    await userEvent.click(screen.getByRole("button", { name: "Suspend (1)" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Community not found");
    expect(handlers.onChanged).not.toHaveBeenCalled();
    expect(toastCalls().map((c) => c.title)).toEqual(["Some suspensions failed"]);
  });

  it("never renders a community id", () => {
    renderDialog([ACCRA, LAGOS, KUMASI], []);
    for (const c of [ACCRA, LAGOS, KUMASI]) expect(document.body.textContent).not.toContain(c.id);
  });
});
