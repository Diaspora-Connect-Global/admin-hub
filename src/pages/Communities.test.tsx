import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@/i18n";
import Communities from "./Communities";
import { toast } from "@/hooks/use-toast";

const ACTIVE_ID = "11111111-2222-4333-8444-555555555555";
const SUSPENDED_ID = "66666666-7777-4888-9999-000000000000";

const communities = [
  { id: ACTIVE_ID, name: "Accra Diaspora Hub", visibility: "PUBLIC", joinPolicy: "OPEN", createdAt: "2026-01-01T00:00:00.000Z", isSuspended: false, memberCount: 12 },
  { id: SUSPENDED_ID, name: "Lagos Traders", visibility: "PUBLIC", joinPolicy: "OPEN", createdAt: "2026-01-02T00:00:00.000Z", isSuspended: true, memberCount: 3 },
];

const mocks = vi.hoisted(() => ({
  exportCommunityData: vi.fn(),
  bulkExportCommunities: vi.fn(),
  downloadTextFile: vi.fn(),
}));

const mutationTuple = () => [vi.fn(), { loading: false }];
const idleQuery = { data: undefined as unknown, loading: false, error: undefined as unknown, refetch: vi.fn() };

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

vi.mock("@/lib/download", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/download")>()),
  downloadTextFile: mocks.downloadTextFile,
}));

vi.mock("@/components/layout/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/admin", () => ({
  useCreateCommunity: () => mutationTuple(),
  useGetCommunityAvatarUploadUrl: () => mutationTuple(),
  useGetCommunityCoverUploadUrl: () => mutationTuple(),
  useSuspendCommunity: () => mutationTuple(),
  useUnsuspendCommunity: () => mutationTuple(),
  useLinkAssociation: () => mutationTuple(),
  useSoftDeleteCommunity: () => mutationTuple(),
  useExportCommunityData: () => [mocks.exportCommunityData, { loading: false }],
  useBulkExportCommunities: () => [mocks.bulkExportCommunities, { loading: false }],
  useSearchAssociationOptions: () => idleQuery,
  useGetCommunityStats: () => ({ ...idleQuery, loading: true }),
  useGetPlatformSettings: () => ({ data: undefined as unknown }),
  useGetUsers: () => ({ data: undefined as unknown, loading: false }),
  useListCommunities: () => ({
    data: { listCommunities: { communities, total: communities.length } },
    loading: false,
    error: undefined as unknown,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/admin/useEntityTypes", () => ({
  useListCommunityTypes: () => ({ data: { listCommunityTypes: [] as unknown[] }, loading: false }),
}));

beforeAll(() => {
  // Radix menus measure and capture pointers; jsdom implements neither.
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  mocks.exportCommunityData.mockResolvedValue({
    data: { exportCommunityData: { success: true, format: "JSON", content: '{"name":"Accra Diaspora Hub"}' } },
  });
  mocks.bulkExportCommunities.mockResolvedValue({
    data: { bulkExportCommunities: { success: true, format: "JSON", content: "[]" } },
  });
});

const toastTitles = () => vi.mocked(toast).mock.calls.map(([arg]) => (arg as { title?: string }).title);

async function openRowMenu(name: string) {
  await userEvent.click(within(rowOf(name)).getByRole("button", { name: "Actions" }));
}

function renderPage() {
  return render(
    <MemoryRouter>
      <Communities />
    </MemoryRouter>,
  );
}

const rowOf = (name: string) => screen.getByText(name).closest("tr") as HTMLElement;

describe("Communities list — suspension", () => {
  it("shows a Suspended badge only on the suspended community", () => {
    renderPage();
    expect(within(rowOf("Lagos Traders")).getByText("Suspended")).toBeInTheDocument();
    expect(within(rowOf("Accra Diaspora Hub")).queryByText("Suspended")).not.toBeInTheDocument();
  });

  it("offers Unsuspend for a suspended community and Suspend for an active one", async () => {
    renderPage();

    await userEvent.click(within(rowOf("Lagos Traders")).getByRole("button", { name: "Actions" }));
    expect(await screen.findByRole("menuitem", { name: /unsuspend/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /^suspend$/i })).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    await userEvent.click(within(rowOf("Accra Diaspora Hub")).getByRole("button", { name: "Actions" }));
    expect(await screen.findByRole("menuitem", { name: /^suspend$/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /unsuspend/i })).not.toBeInTheDocument();
  });

  it("opens the unsuspend confirmation for a suspended community", async () => {
    renderPage();

    await userEvent.click(within(rowOf("Lagos Traders")).getByRole("button", { name: "Actions" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /unsuspend/i }));

    const dialog = await screen.findByRole("dialog", { name: /unsuspend community/i });
    expect(within(dialog).getByText(/Lagos Traders/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /^unsuspend$/i })).toBeInTheDocument();
  });

  it("never renders a community id", () => {
    renderPage();
    expect(document.body.textContent).not.toContain(ACTIVE_ID);
    expect(document.body.textContent).not.toContain(SUSPENDED_ID);
  });
});

describe("Communities list — every control does something real", () => {
  it("has no Analytics placeholder; the stats item opens live stats for that community", async () => {
    renderPage();
    await openRowMenu("Accra Diaspora Hub");
    expect(screen.queryByRole("menuitem", { name: /analytics/i })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("menuitem", { name: /view stats/i }));
    expect(await screen.findByRole("dialog", { name: /accra diaspora hub — stats/i })).toBeInTheDocument();
  });

  it("opens the association picker for a row's link action", async () => {
    renderPage();
    await userEvent.click(within(rowOf("Accra Diaspora Hub")).getByRole("button", { name: "Link Association" }));
    const dialog = await screen.findByRole("dialog", { name: /link an association/i });
    expect(dialog).toHaveTextContent("Accra Diaspora Hub");
    expect(within(dialog).getByLabelText(/search associations/i)).toBeInTheDocument();
  });

  it("opens a delete confirmation that names the community and what will happen", async () => {
    renderPage();
    await openRowMenu("Accra Diaspora Hub");
    await userEvent.click(await screen.findByRole("menuitem", { name: /delete community/i }));
    const dialog = await screen.findByRole("alertdialog", { name: /delete accra diaspora hub\?/i });
    expect(dialog).toHaveTextContent(/active members: 12/i);
  });

  it("exports one community as JSON named after it, never after its id", async () => {
    renderPage();
    await openRowMenu("Accra Diaspora Hub");
    await userEvent.click(await screen.findByRole("menuitem", { name: /export data/i }));

    await waitFor(() => expect(mocks.downloadTextFile).toHaveBeenCalledTimes(1));
    expect(mocks.exportCommunityData).toHaveBeenCalledWith({ variables: { communityId: ACTIVE_ID, format: "JSON" } });
    const [fileName, content, mime] = mocks.downloadTextFile.mock.calls[0];
    expect(fileName).toBe("community-accra-diaspora-hub.json");
    expect(fileName).not.toContain(ACTIVE_ID);
    expect(content).toBe('{"name":"Accra Diaspora Hub"}');
    expect(mime).toBe("application/json");
    expect(toastTitles()).toEqual(["Export ready"]);
  });

  it("never reports an export as ready when the server refuses it (errorPolicy 'all')", async () => {
    mocks.exportCommunityData.mockResolvedValue({ data: null, error: { message: "Forbidden resource" } });
    renderPage();
    await openRowMenu("Accra Diaspora Hub");
    await userEvent.click(await screen.findByRole("menuitem", { name: /export data/i }));

    await waitFor(() => expect(toastTitles()).toEqual(["Couldn't export the community"]));
    expect(vi.mocked(toast).mock.calls[0][0]).toMatchObject({
      description: "You do not have permission to perform this action.",
      variant: "destructive",
    });
    expect(mocks.downloadTextFile).not.toHaveBeenCalled();
  });

  it("exports the rows on screen when nothing is selected, and only the selection otherwise", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /export communities/i }));
    await waitFor(() => expect(mocks.bulkExportCommunities).toHaveBeenCalledTimes(1));
    expect(mocks.bulkExportCommunities).toHaveBeenLastCalledWith({
      variables: { ids: [ACTIVE_ID, SUSPENDED_ID], format: "JSON" },
    });
    expect(mocks.downloadTextFile.mock.calls[0][0]).toMatch(/^communities-export-\d{4}-\d{2}-\d{2}\.json$/);

    await userEvent.click(screen.getByRole("checkbox", { name: "Select Lagos Traders" }));
    await userEvent.click(screen.getByRole("button", { name: "Export selected (1)" }));
    await waitFor(() => expect(mocks.bulkExportCommunities).toHaveBeenCalledTimes(2));
    expect(mocks.bulkExportCommunities).toHaveBeenLastCalledWith({ variables: { ids: [SUSPENDED_ID], format: "JSON" } });
  });

  it("bulk suspend names the selected communities and skips the one already suspended", async () => {
    renderPage();
    expect(screen.getByRole("button", { name: /bulk actions/i })).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: /select all communities/i }));
    await userEvent.click(screen.getByRole("button", { name: /bulk actions/i }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /bulk suspend/i }));

    const dialog = await screen.findByRole("dialog", { name: /suspend the selected communities/i });
    expect(dialog).toHaveTextContent("Will be suspended (1):");
    expect(dialog).toHaveTextContent(/already suspended — left unchanged.*\(1\)/i);
    expect(within(dialog).getByRole("button", { name: "Suspend (1)" })).toBeEnabled();
  });

  it("bulk link opens the picker for every selected community", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("checkbox", { name: /select all communities/i }));
    await userEvent.click(screen.getByRole("button", { name: /bulk actions/i }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /bulk link associations/i }));

    const dialog = await screen.findByRole("dialog", { name: /link an association/i });
    const targets = within(dialog).getByRole("list", { name: /selected communities/i });
    expect(targets).toHaveTextContent("Accra Diaspora Hub");
    expect(targets).toHaveTextContent("Lagos Traders");
  });
});
