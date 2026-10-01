import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import "@/i18n";
import { DeleteCommunityDialog, type DeletableCommunity } from "./DeleteCommunityDialog";
import { SOFT_DELETE_COMMUNITY } from "@/services/networks/graphql/admin";
import { toast } from "@/hooks/use-toast";

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

const COMMUNITY_ID = "0b6f1c2e-3d4a-4b5c-8d9e-0f1a2b3c4d5e";
const community: DeletableCommunity = { id: COMMUNITY_ID, name: "Accra Diaspora Hub", membersCount: 128 };

const deleteMock = (result: Record<string, unknown>, onCall = vi.fn()) => ({
  request: { query: SOFT_DELETE_COMMUNITY, variables: { communityId: COMMUNITY_ID } },
  result: () => {
    onCall();
    return result;
  },
});

function renderDialog(mocks: ReadonlyArray<Record<string, unknown>>) {
  const handlers = { onOpenChange: vi.fn(), onDeleted: vi.fn() };
  render(
    <MockedProvider mocks={mocks as never} defaultOptions={{ mutate: { errorPolicy: "all" } }}>
      <DeleteCommunityDialog community={community} open {...handlers} />
    </MockedProvider>,
  );
  return handlers;
}

const toastTitles = () => vi.mocked(toast).mock.calls.map(([arg]) => (arg as { title?: string }).title);

describe("DeleteCommunityDialog", () => {
  it("says what deletion does: memberships end, default group deleted, not undoable", () => {
    renderDialog([]);
    const dialog = screen.getByRole("alertdialog", { name: /delete accra diaspora hub\?/i });
    expect(dialog).toHaveTextContent(/all of its memberships end \(active members: 128\)/i);
    expect(dialog).toHaveTextContent(/default group is deleted/i);
    expect(dialog).toHaveTextContent(/can't be undone from the console/i);
  });

  it("stays disabled until the community name is typed, then deletes, confirms and re-reads", async () => {
    const onDelete = vi.fn();
    const handlers = renderDialog([
      deleteMock({ data: { softDeleteCommunity: { success: true, message: "Community deleted", deletedAt: null } } }, onDelete),
    ]);

    const confirm = screen.getByRole("button", { name: /^delete community$/i });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/type .* to confirm/i), "Accra Diaspora");
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/type .* to confirm/i), " Hub");
    await userEvent.click(confirm);

    await waitFor(() => expect(handlers.onDeleted).toHaveBeenCalledTimes(1));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenChange).toHaveBeenCalledWith(false);
    expect(toastTitles()).toEqual(["Community deleted"]);
  });

  it("shows the refusal and never a success toast when the server refuses (errorPolicy 'all')", async () => {
    const handlers = renderDialog([deleteMock({ data: null, errors: [{ message: "Forbidden resource" }] })]);

    await userEvent.type(screen.getByLabelText(/type .* to confirm/i), "Accra Diaspora Hub");
    await userEvent.click(screen.getByRole("button", { name: /^delete community$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not have permission/i);
    expect(toastTitles()).toEqual(["Couldn't delete the community"]);
    expect(handlers.onDeleted).not.toHaveBeenCalled();
    expect(handlers.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("treats success:false as a failure", async () => {
    const handlers = renderDialog([
      deleteMock({ data: { softDeleteCommunity: { success: false, message: "Community already deleted", deletedAt: null } } }),
    ]);

    await userEvent.type(screen.getByLabelText(/type .* to confirm/i), "Accra Diaspora Hub");
    await userEvent.click(screen.getByRole("button", { name: /^delete community$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Community already deleted");
    expect(handlers.onDeleted).not.toHaveBeenCalled();
  });

  it("closes on Escape", async () => {
    const handlers = renderDialog([]);
    await userEvent.keyboard("{Escape}");
    expect(handlers.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("never renders the community id, even when the refusal names it", async () => {
    renderDialog([deleteMock({ data: null, errors: [{ message: `Community with ID ${COMMUNITY_ID} not found` }] })]);
    await userEvent.type(screen.getByLabelText(/type .* to confirm/i), "Accra Diaspora Hub");
    await userEvent.click(screen.getByRole("button", { name: /^delete community$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't delete the community");
    expect(document.body.textContent).not.toContain(COMMUNITY_ID);
  });
});
