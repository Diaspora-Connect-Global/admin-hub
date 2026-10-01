import { describe, it, expect, vi, beforeAll } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@/i18n";
import Communities from "./Communities";

const ACTIVE_ID = "11111111-2222-4333-8444-555555555555";
const SUSPENDED_ID = "66666666-7777-4888-9999-000000000000";

const communities = [
  { id: ACTIVE_ID, name: "Accra Diaspora Hub", visibility: "PUBLIC", joinPolicy: "OPEN", createdAt: "2026-01-01T00:00:00.000Z", isSuspended: false },
  { id: SUSPENDED_ID, name: "Lagos Traders", visibility: "PUBLIC", joinPolicy: "OPEN", createdAt: "2026-01-02T00:00:00.000Z", isSuspended: true },
];

const mutationTuple = () => [vi.fn(), { loading: false }];

vi.mock("@/components/layout/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/admin", () => ({
  useCreateCommunity: () => mutationTuple(),
  useGetCommunityAvatarUploadUrl: () => mutationTuple(),
  useGetCommunityCoverUploadUrl: () => mutationTuple(),
  useSuspendCommunity: () => mutationTuple(),
  useUnsuspendCommunity: () => mutationTuple(),
  useGetPlatformSettings: () => ({ data: undefined }),
  useDiscoverAssociations: () => ({ data: undefined, loading: false }),
  useGetUsers: () => ({ data: undefined, loading: false }),
  useListCommunities: () => ({
    data: { listCommunities: { communities, total: communities.length } },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/admin/useEntityTypes", () => ({
  useListCommunityTypes: () => ({ data: { listCommunityTypes: [] }, loading: false }),
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
