import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@/i18n";
import PostManagement from "./PostManagement";

const POST_ID = "11111111-2222-4333-8444-555555555555";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  removeContent: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: mocks.toast,
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/components/layout/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const posts = [
  {
    id: POST_ID,
    text: "Cocoa suppliers wanted in Ghana",
    authorType: "COMMUNITY",
    authorId: "99999999-2222-4333-8444-555555555555",
    authorName: "Accra Union",
    visibility: "EVERYONE",
    status: "PUBLISHED",
    likeCount: 1,
    commentCount: 0,
    shareCount: 0,
    saveCount: 0,
    attachmentCount: 0,
    createdAt: "2026-10-01T10:00:00.000Z",
  },
];

vi.mock("@/hooks/admin", () => ({
  POST_STATUSES: ["PUBLISHED", "HIDDEN"],
  POST_VISIBILITIES: ["EVERYONE"],
  POST_AUTHOR_TYPES: ["USER", "COMMUNITY"],
  useAdminListPosts: () => ({
    data: { adminListPosts: { items: posts, total: 1, limit: 20, offset: 0 } },
    loading: false,
    error: undefined as unknown,
    refetch: mocks.refetch,
  }),
  useAdminListPostComments: () => ({ data: undefined as unknown, loading: false, error: undefined as unknown }),
  useAdminHidePost: () => [vi.fn(), { loading: false }],
  useAdminRestorePost: () => [vi.fn(), { loading: false }],
  useAdminRemoveContent: () => [mocks.removeContent, { loading: false }],
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
  vi.clearAllMocks();
});

async function openRemoveDialog() {
  render(
    <MemoryRouter>
      <PostManagement />
    </MemoryRouter>,
  );
  const row = screen.getByText("Cocoa suppliers wanted in Ghana").closest("tr") as HTMLElement;
  const buttons = within(row).getAllByRole("button");
  await userEvent.click(buttons[buttons.length - 1]);
  await userEvent.click(await screen.findByRole("menuitem", { name: /remove/i }));
  return screen.findByRole("dialog", { name: /remove this post/i });
}

const toastCalls = () => mocks.toast.mock.calls.map(([arg]) => arg as { title?: string; description?: string; variant?: string });

describe("Post management — removing any post", () => {
  it("confirming sends the post id, type and reason, then shows success and refreshes", async () => {
    mocks.removeContent.mockResolvedValue({ data: { adminRemoveContent: { success: true } } });
    const dialog = await openRemoveDialog();
    await userEvent.type(within(dialog).getByLabelText(/reason/i), "Spam");
    await userEvent.click(within(dialog).getByRole("button", { name: /^remove$/i }));

    await waitFor(() => expect(mocks.removeContent).toHaveBeenCalledTimes(1));
    expect(mocks.removeContent).toHaveBeenCalledWith({
      variables: { contentType: "POST", contentId: POST_ID, reason: "Spam" },
    });
    await waitFor(() => expect(mocks.refetch).toHaveBeenCalled());
    expect(toastCalls().some((c) => c.description === "Content removed." && c.variant !== "destructive")).toBe(true);
  });

  it("a refused removal ({ success:false }) shows the error and never claims success", async () => {
    mocks.removeContent.mockResolvedValue({ data: { adminRemoveContent: { success: false, error: "Not allowed" } } });
    const dialog = await openRemoveDialog();
    await userEvent.click(within(dialog).getByRole("button", { name: /^remove$/i }));

    await waitFor(() => expect(toastCalls().some((c) => c.variant === "destructive")).toBe(true));
    expect(toastCalls().some((c) => c.description === "Content removed.")).toBe(false);
    expect(mocks.refetch).not.toHaveBeenCalled();
  });

  it("a GraphQL error resolved as data:null (errorPolicy all) is a failure too", async () => {
    mocks.removeContent.mockResolvedValue({ data: null, error: { message: "Forbidden resource" } });
    const dialog = await openRemoveDialog();
    await userEvent.click(within(dialog).getByRole("button", { name: /^remove$/i }));

    await waitFor(() => expect(toastCalls().some((c) => c.variant === "destructive")).toBe(true));
    expect(toastCalls().some((c) => c.description === "Content removed.")).toBe(false);
  });

  it("never renders a post or author id", async () => {
    await openRemoveDialog();
    expect(document.body.textContent).not.toContain(POST_ID);
    expect(document.body.textContent).not.toContain("99999999-2222-4333-8444-555555555555");
  });
});
