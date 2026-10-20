// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { print } from "graphql";

const UUID = "0b9a6b1e-5f1c-4a52-9f0b-1d2c3e4f5a6b";

const listHook = vi.fn();
vi.mock("@/hooks/admin/useNotifications", () => ({
  useMyAdminNotifications: (...a: unknown[]) => listHook(...a),
  useMyAdminUnreadCount: () => ({ data: { myAdminNotifications: { unreadCount: 2 } }, refetch: vi.fn() }),
  useMarkNotificationAsRead: () => [vi.fn(), { loading: false }],
  useMarkMyAdminNotificationsRead: () => [vi.fn(), { loading: false }],
  useDeleteNotification: () => [vi.fn(), { loading: false }],
}));

import { AdminNotificationBell } from "./AdminNotificationBell";
import { GET_MY_ADMIN_NOTIFICATIONS } from "@/services/networks/graphql/admin";

const row = (id: string, title: string, isRead = false) => ({
  id,
  type: "moderation.report.created",
  title,
  message: "Needs review",
  data: { reportId: UUID },
  read: isRead,
  isRead,
  createdAt: "2026-10-19T10:00:00Z",
});

describe("AdminNotificationBell (platform admins)", () => {
  afterEach(() => cleanup());

  it("reads only the platform-directed query, never the personal inbox or the platform-wide list", () => {
    const doc = print(GET_MY_ADMIN_NOTIFICATIONS);
    expect(doc).toContain("myAdminNotifications(scope: PLATFORM");
    expect(doc).not.toContain("getNotificationsWithMeta");
    expect(doc).not.toContain("listInAppNotifications");
  });

  it("shows the directed items, unread badge equals the server count, and no ids are displayed", () => {
    listHook.mockReturnValue({
      data: {
        myAdminNotifications: {
          notifications: [row("n1", "New report to review"), row("n2", "KYC awaiting review", true)],
          total: 2, limit: 20, offset: 0, unreadCount: 2,
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
    render(<MemoryRouter><AdminNotificationBell /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("New report to review")).toBeTruthy();
    expect(screen.getByText("KYC awaiting review")).toBeTruthy();
    expect(screen.getAllByText(/2/).length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain(UUID);
    expect(document.body.textContent).not.toContain("n1");
    expect(screen.queryByText("Clear all")).toBeNull();
  });

  it("shows the empty state when nothing is directed to the admin", () => {
    listHook.mockReturnValue({
      data: { myAdminNotifications: { notifications: [], total: 0, limit: 20, offset: 0, unreadCount: 0 } },
      loading: false, error: undefined, refetch: vi.fn(),
    });
    render(<MemoryRouter><AdminNotificationBell /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Nothing needs your attention right now.")).toBeTruthy();
  });
});
