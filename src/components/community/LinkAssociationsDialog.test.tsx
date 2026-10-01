import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import "@/i18n";
import { LinkAssociationsDialog, type LinkTargetCommunity } from "./LinkAssociationsDialog";
import { LINK_ASSOCIATION, SEARCH_ASSOCIATION_OPTIONS } from "@/services/networks/graphql/admin";
import { toast } from "@/hooks/use-toast";

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

const ACCRA = { id: "0b6f1c2e-3d4a-4b5c-8d9e-0f1a2b3c4d5e", name: "Accra Diaspora Hub" };
const LAGOS = { id: "1c7a2d3f-4e5b-4c6d-9e0f-1a2b3c4d5e6f", name: "Lagos Traders" };
const NURSES = { id: "2d8b3e4a-5f6c-4d7e-8f9a-2b3c4d5e6f7a", name: "Ghana Nurses Abroad" };
const ENGINEERS = { id: "3e9c4f5b-6a7d-4e8f-9a0b-3c4d5e6f7a8b", name: "Diaspora Engineers" };
const ALL_IDS = [ACCRA.id, LAGOS.id, NURSES.id, ENGINEERS.id];

const searchMock = (searchTerm?: string, associations = [NURSES, ENGINEERS]) => ({
  request: {
    query: SEARCH_ASSOCIATION_OPTIONS,
    variables: { input: { ...(searchTerm ? { searchTerm } : {}), limit: 20, page: 1 } },
  },
  maxUsageCount: 10,
  result: { data: { searchAssociations: { associations, total: associations.length } } },
});

const linkMock = (communityId: string, result: Record<string, unknown>, onCall = vi.fn()) => ({
  request: { query: LINK_ASSOCIATION, variables: { input: { communityId, associationId: NURSES.id } } },
  result: () => {
    onCall();
    return result;
  },
});

const linked = { data: { linkAssociation: { success: true, message: "Successfully associated" } } };

function renderDialog(communities: LinkTargetCommunity[], mocks: ReadonlyArray<Record<string, unknown>>) {
  const handlers = { onOpenChange: vi.fn(), onChanged: vi.fn(), onCompleted: vi.fn() };
  render(
    <MockedProvider mocks={mocks as never} defaultOptions={{ mutate: { errorPolicy: "all" } }}>
      <LinkAssociationsDialog communities={communities} open {...handlers} />
    </MockedProvider>,
  );
  return handlers;
}

const toastCalls = () => vi.mocked(toast).mock.calls.map(([arg]) => arg as { title?: string; variant?: string });

beforeAll(() => {
  // Radix radio group measures size; jsdom has no ResizeObserver.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("LinkAssociationsDialog", () => {
  it("links the association picked by name, then confirms, re-reads and closes", async () => {
    const onLink = vi.fn();
    const handlers = renderDialog([ACCRA], [searchMock(), linkMock(ACCRA.id, linked, onLink)]);

    expect(screen.getByRole("dialog", { name: /link an association/i })).toHaveTextContent(ACCRA.name);
    const confirm = screen.getByRole("button", { name: /^link association$/i });
    expect(confirm).toBeDisabled();

    await userEvent.click(await screen.findByRole("radio", { name: NURSES.name }));
    expect(screen.getByText(`Selected: ${NURSES.name}`)).toBeInTheDocument();
    await userEvent.click(confirm);

    await waitFor(() => expect(handlers.onOpenChange).toHaveBeenCalledWith(false));
    expect(onLink).toHaveBeenCalledTimes(1);
    expect(handlers.onChanged).toHaveBeenCalledTimes(1);
    expect(handlers.onCompleted).toHaveBeenCalledWith([]);
    expect(toastCalls()).toEqual([
      { title: "Association linked", description: `${NURSES.name} is now linked to ${ACCRA.name}.` },
    ]);
  });

  it("searches associations by name on the server", async () => {
    renderDialog([ACCRA], [searchMock(), searchMock("engineers", [ENGINEERS])]);

    expect(await screen.findByRole("radio", { name: NURSES.name })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/search associations/i), "engineers");

    await waitFor(() => expect(screen.queryByRole("radio", { name: NURSES.name })).not.toBeInTheDocument());
    expect(await screen.findByRole("radio", { name: ENGINEERS.name })).toBeInTheDocument();
  });

  it("shows the refusal and never a success toast when the server refuses (errorPolicy 'all')", async () => {
    const handlers = renderDialog(
      [ACCRA],
      [searchMock(), linkMock(ACCRA.id, { data: null, errors: [{ message: "Forbidden resource" }] })],
    );

    await userEvent.click(await screen.findByRole("radio", { name: NURSES.name }));
    await userEvent.click(screen.getByRole("button", { name: /^link association$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not have permission/i);
    expect(toastCalls().map((c) => c.title)).toEqual(["Couldn't link the association"]);
    expect(toastCalls()[0].variant).toBe("destructive");
    expect(handlers.onChanged).not.toHaveBeenCalled();
    expect(handlers.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("treats success:false as a failure", async () => {
    const handlers = renderDialog(
      [ACCRA],
      [searchMock(), linkMock(ACCRA.id, { data: { linkAssociation: { success: false, message: "Already linked" } } })],
    );

    await userEvent.click(await screen.findByRole("radio", { name: NURSES.name }));
    await userEvent.click(screen.getByRole("button", { name: /^link association$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Already linked");
    expect(handlers.onChanged).not.toHaveBeenCalled();
  });

  it("links several communities, reports the ones that failed by name, and narrows a retry to them", async () => {
    const handlers = renderDialog(
      [ACCRA, LAGOS],
      [
        searchMock(),
        linkMock(ACCRA.id, linked),
        linkMock(LAGOS.id, {
          data: null,
          errors: [{ message: `Community with ID ${LAGOS.id} not found` }],
        }),
      ],
    );

    expect(screen.getByRole("list", { name: /selected communities/i })).toHaveTextContent(LAGOS.name);
    await userEvent.click(await screen.findByRole("radio", { name: NURSES.name }));
    await userEvent.click(screen.getByRole("button", { name: /^link association$/i }));

    const report = await screen.findByRole("alert");
    expect(report).toHaveTextContent("Linked 1 of 2. These communities were not linked:");
    expect(within(report).getByText(LAGOS.name)).toBeInTheDocument();
    expect(within(report).queryByText(ACCRA.name)).not.toBeInTheDocument();
    // The server's reason carried an id, so the translated fallback is shown instead.
    expect(report).toHaveTextContent("Couldn't link the association");

    expect(handlers.onChanged).toHaveBeenCalledTimes(1);
    expect(handlers.onCompleted).toHaveBeenCalledWith([LAGOS.id]);
    expect(handlers.onOpenChange).not.toHaveBeenCalledWith(false);
    expect(toastCalls().map((c) => c.title)).toEqual(["Some links failed"]);
    expect(screen.getByRole("button", { name: /retry the failed ones/i })).toBeEnabled();
  });

  it("never renders a community or association id", async () => {
    renderDialog([ACCRA, LAGOS], [searchMock()]);
    await screen.findByRole("radio", { name: NURSES.name });
    for (const id of ALL_IDS) expect(document.body.textContent).not.toContain(id);
  });
});
