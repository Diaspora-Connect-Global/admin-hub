import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import "@/i18n";
import { SuspendCommunityDialog, type SuspendableCommunity } from "./SuspendCommunityDialog";
import { SUSPEND_COMMUNITY, UNSUSPEND_COMMUNITY } from "@/services/networks/graphql/admin";
import { toast } from "@/hooks/use-toast";

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

const COMMUNITY_ID = "0b6f1c2e-3d4a-4b5c-8d9e-0f1a2b3c4d5e";
const active: SuspendableCommunity = { id: COMMUNITY_ID, name: "Accra Diaspora Hub", isSuspended: false };
const suspended: SuspendableCommunity = { ...active, isSuspended: true };

const okPayload = { success: true, message: "ok", timestamp: "2026-09-30T00:00:00.000Z" };

function renderDialog(
  community: SuspendableCommunity,
  mocks: ReadonlyArray<Record<string, unknown>>,
  handlers = { onOpenChange: vi.fn(), onChanged: vi.fn() },
) {
  render(
    <MockedProvider mocks={mocks as never} defaultOptions={{ mutate: { errorPolicy: "all" } }}>
      <SuspendCommunityDialog
        community={community}
        open
        onOpenChange={handlers.onOpenChange}
        onChanged={handlers.onChanged}
      />
    </MockedProvider>,
  );
  return handlers;
}

const toastTitles = () => vi.mocked(toast).mock.calls.map(([arg]) => (arg as { title?: string }).title);

describe("SuspendCommunityDialog", () => {
  it("suspends with the optional reason, confirms, and re-reads the community", async () => {
    const onMutate = vi.fn();
    const handlers = renderDialog(active, [
      {
        request: {
          query: SUSPEND_COMMUNITY,
          variables: { input: { communityId: COMMUNITY_ID, reason: "Fraudulent fundraising" } },
        },
        result: () => {
          onMutate();
          return { data: { suspendCommunity: okPayload } };
        },
      },
    ]);

    expect(screen.getByRole("dialog", { name: /suspend community/i })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/reason \(optional\)/i), "  Fraudulent fundraising ");
    await userEvent.click(screen.getByRole("button", { name: /^suspend$/i }));

    await waitFor(() => expect(handlers.onChanged).toHaveBeenCalledTimes(1));
    expect(onMutate).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenChange).toHaveBeenCalledWith(false);
    expect(toastTitles()).toEqual(["Community suspended"]);
  });

  it("sends no reason when the field is left blank", async () => {
    const handlers = renderDialog(active, [
      {
        request: { query: SUSPEND_COMMUNITY, variables: { input: { communityId: COMMUNITY_ID } } },
        result: { data: { suspendCommunity: okPayload } },
      },
    ]);

    await userEvent.click(screen.getByRole("button", { name: /^suspend$/i }));
    await waitFor(() => expect(handlers.onChanged).toHaveBeenCalledTimes(1));
  });

  it("shows the refusal and never a success toast when the server refuses (errorPolicy 'all')", async () => {
    const handlers = renderDialog(active, [
      {
        request: { query: SUSPEND_COMMUNITY, variables: { input: { communityId: COMMUNITY_ID } } },
        // errorPolicy "all" resolves with data:null + errors instead of rejecting.
        result: { data: null, errors: [{ message: "Forbidden resource" } as never] },
      },
    ]);

    await userEvent.click(screen.getByRole("button", { name: /^suspend$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not have permission/i);
    expect(toastTitles()).toEqual(["Couldn't suspend the community"]);
    expect(vi.mocked(toast).mock.calls[0][0]).toMatchObject({ variant: "destructive" });
    expect(handlers.onChanged).not.toHaveBeenCalled();
    expect(handlers.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("treats success:false as a failure", async () => {
    const handlers = renderDialog(active, [
      {
        request: { query: SUSPEND_COMMUNITY, variables: { input: { communityId: COMMUNITY_ID } } },
        result: { data: { suspendCommunity: { ...okPayload, success: false, message: "Community not found" } } },
      },
    ]);

    await userEvent.click(screen.getByRole("button", { name: /^suspend$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Community not found");
    expect(handlers.onChanged).not.toHaveBeenCalled();
  });

  it("offers Unsuspend for a suspended community, without a reason field", async () => {
    const handlers = renderDialog(suspended, [
      {
        request: { query: UNSUSPEND_COMMUNITY, variables: { input: { communityId: COMMUNITY_ID } } },
        result: { data: { unsuspendCommunity: okPayload } },
      },
    ]);

    expect(screen.getByRole("dialog", { name: /unsuspend community/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/reason/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^unsuspend$/i }));

    await waitFor(() => expect(handlers.onChanged).toHaveBeenCalledTimes(1));
    expect(toastTitles()).toEqual(["Community unsuspended"]);
  });

  it("never renders the community id", () => {
    renderDialog(active, []);
    expect(document.body.textContent).not.toContain(COMMUNITY_ID);
  });
});
