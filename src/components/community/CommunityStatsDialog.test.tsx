import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import "@/i18n";
import { CommunityStatsDialog } from "./CommunityStatsDialog";
import { GET_COMMUNITY_STATS } from "@/services/networks/graphql/admin";

const COMMUNITY_ID = "0b6f1c2e-3d4a-4b5c-8d9e-0f1a2b3c4d5e";
const community = { id: COMMUNITY_ID, name: "Accra Diaspora Hub" };

const statsMock = (result: Record<string, unknown>) => ({
  request: { query: GET_COMMUNITY_STATS, variables: { communityId: COMMUNITY_ID } },
  result,
});

function renderDialog(mocks: ReadonlyArray<Record<string, unknown>>) {
  const onOpenChange = vi.fn();
  render(
    <MockedProvider mocks={mocks as never} defaultOptions={{ watchQuery: { errorPolicy: "all" } }}>
      <CommunityStatsDialog community={community} open onOpenChange={onOpenChange} />
    </MockedProvider>,
  );
  return onOpenChange;
}

describe("CommunityStatsDialog", () => {
  it("shows the live member and pending-request counts — and no invented post count", async () => {
    renderDialog([statsMock({ data: { getCommunityStats: { memberCount: 1284, pendingRequestCount: 7 } } })]);

    expect(screen.getByRole("dialog", { name: /accra diaspora hub — stats/i })).toBeInTheDocument();
    const members = await screen.findByText("Active members");
    expect(members.nextElementSibling).toHaveTextContent((1284).toLocaleString());
    expect(screen.getByText("Pending join requests").nextElementSibling).toHaveTextContent("7");
    expect(screen.queryByText(/posts/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(COMMUNITY_ID);
  });

  it("shows the failure with a retry instead of zeros", async () => {
    renderDialog([
      statsMock({ data: null, errors: [{ message: "PERMISSION_DENIED: Only community administrators and moderators can view community statistics" }] }),
    ]);

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not have permission/i);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByText("Active members")).not.toBeInTheDocument();
  });

  it("closes from its Close button", async () => {
    const onOpenChange = renderDialog([statsMock({ data: { getCommunityStats: { memberCount: 1, pendingRequestCount: 0 } } })]);
    await screen.findByText("Active members");
    const closeButtons = screen.getAllByRole("button", { name: /^close$/i });
    await userEvent.click(closeButtons[0]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
