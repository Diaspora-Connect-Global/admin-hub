import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import "@/i18n";
import { CircleActionDialogs, type CircleAction } from "./CircleActionDialogs";
import {
  ADMIN_SUSPEND_CIRCLE,
  ADMIN_UNSUSPEND_CIRCLE,
  ADMIN_DISSOLVE_CIRCLE,
  type AdminCircle,
} from "@/services/networks/graphql/admin";
import { toast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

const CIRCLE_ID = "3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a99";

const circle: AdminCircle = {
  id: CIRCLE_ID,
  circleNumber: "CIR-2026-0007",
  name: "Sunday Runners",
  handle: "sunday-runners",
  tagline: null,
  description: null,
  avatarUrl: null,
  bannerUrl: null,
  discoverable: true,
  joinMode: "REQUEST",
  status: "ACTIVE",
  founderUserId: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
  memberCount: 6,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  archivedAt: null,
};

const circleAs = (status: string) => ({ __typename: "Circle", ...circle, status });

/**
 * Renders the dialog with the same callbacks CircleManagement / CircleDetail
 * pass: a success toast inside onSuccess, an error toast inside onError.
 */
function renderDialog(action: CircleAction, mocks: ReadonlyArray<Record<string, unknown>>) {
  const onClose = vi.fn();
  const onSuccess = vi.fn(async (message: string) => {
    toast({ title: "Success", description: message });
  });
  const onError = vi.fn((e: unknown) => {
    toast({ title: "Something went wrong", description: friendlyErrorMessage(e), variant: "destructive" });
  });
  render(
    <MockedProvider mocks={mocks as never} defaultOptions={{ mutate: { errorPolicy: "all" } }}>
      <CircleActionDialogs action={action} circle={circle} onClose={onClose} onSuccess={onSuccess} onError={onError} />
    </MockedProvider>,
  );
  return { onClose, onSuccess, onError };
}

const toastTitles = () => vi.mocked(toast).mock.calls.map(([arg]) => (arg as { title?: string }).title);

describe("CircleActionDialogs", () => {
  it("suspends with the required reason, then confirms and closes", async () => {
    const handlers = renderDialog("suspend", [
      {
        request: { query: ADMIN_SUSPEND_CIRCLE, variables: { circleId: CIRCLE_ID, reason: "Fraudulent fundraising" } },
        result: { data: { adminSuspendCircle: circleAs("SUSPENDED") } },
      },
    ]);

    const confirm = screen.getByRole("button", { name: /^suspend$/i });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/reason \(required\)/i), "  Fraudulent fundraising ");
    await userEvent.click(confirm);

    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Sunday Runners has been suspended."));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    expect(handlers.onError).not.toHaveBeenCalled();
    expect(toastTitles()).toEqual(["Success"]);
  });

  it("never shows a success toast when the server refuses (errorPolicy 'all' resolves the refusal)", async () => {
    const handlers = renderDialog("suspend", [
      {
        request: { query: ADMIN_SUSPEND_CIRCLE, variables: { circleId: CIRCLE_ID, reason: "Spam" } },
        result: { data: null, errors: [{ message: "Forbidden resource" } as never] },
      },
    ]);

    await userEvent.type(screen.getByLabelText(/reason \(required\)/i), "Spam");
    await userEvent.click(screen.getByRole("button", { name: /^suspend$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not have permission/i);
    expect(handlers.onSuccess).not.toHaveBeenCalled();
    expect(handlers.onClose).not.toHaveBeenCalled();
    expect(handlers.onError).toHaveBeenCalledTimes(1);
    expect(toastTitles()).toEqual(["Something went wrong"]);
  });

  it("treats a resolved mutation with no circle as a failure", async () => {
    const handlers = renderDialog("dissolve", [
      {
        request: { query: ADMIN_DISSOLVE_CIRCLE, variables: { circleId: CIRCLE_ID, reason: "Court order" } },
        result: { data: { adminDissolveCircle: null } },
      },
    ]);

    await userEvent.type(screen.getByLabelText(/reason \(required\)/i), "Court order");
    await userEvent.click(screen.getByRole("button", { name: /^dissolve$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't dissolve the circle");
    expect(handlers.onSuccess).not.toHaveBeenCalled();
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("lifts a suspension without requiring a reason", async () => {
    const handlers = renderDialog("unsuspend", [
      {
        request: { query: ADMIN_UNSUSPEND_CIRCLE, variables: { circleId: CIRCLE_ID } },
        result: { data: { adminUnsuspendCircle: circleAs("ACTIVE") } },
      },
    ]);

    await userEvent.click(screen.getByRole("button", { name: /lift suspension/i }));

    await waitFor(() =>
      expect(handlers.onSuccess).toHaveBeenCalledWith("The suspension on Sunday Runners has been lifted."),
    );
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("never shows an id that the server put in its refusal", async () => {
    const handlers = renderDialog("dissolve", [
      {
        request: { query: ADMIN_DISSOLVE_CIRCLE, variables: { circleId: CIRCLE_ID, reason: "Court order" } },
        result: { data: null, errors: [{ message: `Circle ${CIRCLE_ID} is already dissolved` } as never] },
      },
    ]);

    await userEvent.type(screen.getByLabelText(/reason \(required\)/i), "Court order");
    await userEvent.click(screen.getByRole("button", { name: /^dissolve$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't dissolve the circle");
    expect(document.body.textContent).not.toContain(CIRCLE_ID);
    const errorToast = vi.mocked(toast).mock.calls[0][0] as { description?: string };
    expect(errorToast.description).not.toContain(CIRCLE_ID);
    expect(handlers.onSuccess).not.toHaveBeenCalled();
  });
});
