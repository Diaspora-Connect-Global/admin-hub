import { describe, it, expect, vi, beforeAll } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MockedProvider } from "@apollo/client/testing/react";
import type { MockedResponse } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import i18n from "@/i18n";
import Tasks from "./Tasks";
import { TasksNavBadge } from "@/components/tasks/TasksNavBadge";
import { endOfLocalDayIso, linkedItemRoute, taskErrorMessage } from "@/lib/adminTasks";
import {
  ADMIN_TASK,
  ADMIN_TASKS,
  ADMIN_TASK_TEAM,
  CHANGE_ADMIN_TASK_STATUS,
  MY_ADMIN_TASK_COUNTS,
} from "@/services/networks/graphql/admin/tasks";

// Ids that must never reach the screen.
const ME_ID = "a1111111-1111-4111-8111-111111111111";
const AMA_ID = "a2222222-2222-4222-8222-222222222222";
const TASK_1 = "b1111111-1111-4111-8111-111111111111";
const TASK_2 = "b2222222-2222-4222-8222-222222222222";
const TASK_3 = "b3333333-3333-4333-8333-333333333333";
const ITEM_1 = "c1111111-1111-4111-8111-111111111111";
const EVENT_1 = "d1111111-1111-4111-8111-111111111111";
const LINK_ID = "e1111111-1111-4111-8111-111111111111";
const ALL_IDS = [ME_ID, AMA_ID, TASK_1, TASK_2, TASK_3, ITEM_1, EVENT_1, LINK_ID];

const toastMock = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }), toast: toastMock }));
vi.mock("@/components/layout/AdminLayout", () => ({
  AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const me = { __typename: "AdminTaskPerson", id: ME_ID, email: "lead@example.org", role: "SYSTEM_ADMIN" };
const ama = { __typename: "AdminTaskPerson", id: AMA_ID, email: "ama@example.org", role: "MODERATOR" };

const allPerms = {
  __typename: "AdminTaskPermissions",
  canEdit: true,
  canReassign: true,
  canChangeStatus: true,
  canCancel: true,
  canManageChecklist: true,
  canComment: true,
};
const noPerms = { ...Object.fromEntries(Object.keys(allPerms).map((k) => [k, false])), canComment: true };

function mkTask(over: Record<string, unknown> = {}) {
  return {
    __typename: "AdminTask",
    id: TASK_1,
    title: "Prepare the gala newsletter",
    description: "Draft and schedule it",
    status: "TODO",
    priority: "HIGH",
    assignee: ama,
    createdBy: me,
    dueAt: "2030-01-20T17:00:00.000Z",
    blockedReason: null as string | null,
    linkType: null as string | null,
    linkId: null as string | null,
    checklistTotal: 0,
    checklistDone: 0,
    commentCount: 0,
    overdue: false,
    startedAt: null as string | null,
    completedAt: null as string | null,
    cancelledAt: null as string | null,
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    permissions: allPerms,
    ...over,
  };
}

function mkDetail(taskOver: Record<string, unknown> = {}) {
  return {
    __typename: "AdminTaskDetail",
    task: mkTask(taskOver),
    checklist: [{ __typename: "AdminTaskChecklistItem", id: ITEM_1, text: "Write intro", done: false, doneAt: null as string | null, doneBy: null as { id: string; email: string; role: string | null } | null, position: 0 }],
    comments: [] as unknown[],
    events: [
      {
        __typename: "AdminTaskEvent",
        id: EVENT_1,
        type: "STATUS_CHANGED",
        actor: ama,
        fromLabel: "TODO",
        toLabel: "IN_PROGRESS",
        note: null as string | null,
        createdAt: "2026-11-02T10:00:00.000Z",
      },
    ],
  };
}

const forever = { maxUsageCount: Number.POSITIVE_INFINITY };
const teamMock = (viewerCanAssignOthers = true): MockedResponse => ({
  request: { query: ADMIN_TASK_TEAM },
  result: {
    data: {
      adminTaskTeam: {
        __typename: "AdminTaskTeam",
        viewerCanAssignOthers,
        members: [
          { __typename: "AdminTaskTeamMember", admin: me, canAssignOthers: true, isViewer: true },
          { __typename: "AdminTaskTeamMember", admin: ama, canAssignOthers: false, isViewer: false },
        ],
      },
    },
  },
  ...forever,
});
const listMock = (input: Record<string, unknown>, tasks: unknown[]): MockedResponse => ({
  request: { query: ADMIN_TASKS, variables: { input } },
  result: { data: { adminTasks: { __typename: "AdminTaskPage", nextCursor: null, tasks } } },
  ...forever,
});
const MINE = {
  view: "MINE",
  statuses: ["TODO", "IN_PROGRESS", "BLOCKED"],
  sort: "DUE_ASC",
  limit: 50,
};
const TEAM_OPEN = { view: "TEAM", statuses: ["TODO", "IN_PROGRESS", "BLOCKED"], sort: "DUE_ASC", limit: 100 };
const TEAM_DONE = { view: "TEAM", statuses: ["DONE"], sort: "CREATED_DESC", limit: 50 };
const detailMock = (detail: unknown, id = TASK_1): MockedResponse => ({
  request: { query: ADMIN_TASK, variables: { id } },
  result: { data: { adminTask: detail } },
  ...forever,
});

function renderPage(mocks: MockedResponse[], route = "/tasks") {
  return render(
    <MockedProvider mocks={mocks} defaultOptions={{ mutate: { errorPolicy: "all" } }}>
      <MemoryRouter initialEntries={[route]}>
        <Tasks />
      </MemoryRouter>
    </MockedProvider>,
  );
}

const expectNoIds = () => {
  const text = document.body.textContent ?? "";
  for (const id of ALL_IDS) expect(text).not.toContain(id);
  // Nothing in an attribute either (aria-label, title, alt).
  // (href = route param, option value = picker value: both legitimate carriers of an id.)
  const html = document.body.innerHTML.replace(/(href|value)="[^"]*"/g, "");
  for (const id of ALL_IDS) expect(html).not.toContain(id);
};

describe("Tasks — team board", () => {
  it("groups tasks into status columns, flags overdue in text, and shows people by email only", async () => {
    renderPage([
      teamMock(),
      listMock(MINE, []),
      listMock(TEAM_OPEN, [
        mkTask({ id: TASK_1, title: "Prepare the gala newsletter", status: "TODO", overdue: true, checklistTotal: 5, checklistDone: 3, commentCount: 2 }),
        mkTask({ id: TASK_2, title: "Audit vendor list", status: "BLOCKED", blockedReason: "Waiting" }),
      ]),
      listMock(TEAM_DONE, [mkTask({ id: TASK_3, title: "Ship release notes", status: "DONE" })]),
    ]);
    await userEvent.click(await screen.findByRole("tab", { name: "Team board" }));

    const todo = await screen.findByRole("region", { name: "To do" });
    expect(await within(todo).findByText("Prepare the gala newsletter")).toBeInTheDocument();
    expect(within(todo).getByText(/Overdue/)).toBeInTheDocument();
    expect(within(todo).getByText(/3\/5/)).toBeInTheDocument();
    expect(within(todo).getByText("ama@example.org")).toBeInTheDocument();
    expect(within(todo).queryByText("Audit vendor list")).not.toBeInTheDocument();

    expect(within(screen.getByRole("region", { name: "Blocked" })).getByText("Audit vendor list")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Done" })).getByText("Ship release notes")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "In progress" })).queryByRole("button")).not.toBeInTheDocument();
    expectNoIds();
  });
});

describe("Tasks — drawer opened by ?task=", () => {
  it("opens from the URL, shows history in plain words, and exposes every control with full permissions", async () => {
    renderPage(
      [teamMock(), listMock(MINE, []), detailMock(mkDetail({ linkType: "USER", linkId: LINK_ID }))],
      `/tasks?task=${TASK_1}`,
    );
    const dialog = await screen.findByRole("dialog", { name: "Prepare the gala newsletter" });
    expect(await within(dialog).findByText("ama@example.org changed the status from To do to In progress")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Edit title and description" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Move to In progress" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Cancel task" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Assignee")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Add a checklist item")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Open linked user" })).toHaveAttribute("href", `/users/${LINK_ID}`);
    expectNoIds();
  });

  it("hides every control the permissions don't grant", async () => {
    renderPage(
      [teamMock(), listMock(MINE, []), detailMock(mkDetail({ permissions: noPerms }))],
      `/tasks?task=${TASK_1}`,
    );
    const dialog = await screen.findByRole("dialog", { name: "Prepare the gala newsletter" });
    await within(dialog).findByText(/changed the status/);
    expect(within(dialog).queryByRole("button", { name: /Edit title/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^Move to/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel task" })).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Add a checklist item")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("combobox")).not.toBeInTheDocument(); // no reassign / priority select
    expect(within(dialog).queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("checkbox", { name: "Write intro" })).toBeDisabled();
    expect(within(dialog).getByLabelText("Add a comment")).toBeInTheDocument(); // canComment stays
    expectNoIds();
  });

  it("has no link for a linked item type without an admin-hub page", async () => {
    renderPage(
      [teamMock(), listMock(MINE, []), detailMock(mkDetail({ linkType: "POST", linkId: LINK_ID }))],
      `/tasks?task=${TASK_1}`,
    );
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText(/changed the status/);
    expect(within(dialog).queryByRole("link")).not.toBeInTheDocument();
  });

  it("requires a reason before a task can be marked blocked, then reports success once the server confirms", async () => {
    const blocked = mkDetail({ status: "BLOCKED", blockedReason: "Waiting on legal" });
    const mutation: MockedResponse = {
      request: {
        query: CHANGE_ADMIN_TASK_STATUS,
        variables: { taskId: TASK_1, status: "BLOCKED", blockedReason: "Waiting on legal" },
      },
      result: { data: { changeAdminTaskStatus: blocked } },
    };
    renderPage([teamMock(), listMock(MINE, []), detailMock(mkDetail()), mutation], `/tasks?task=${TASK_1}`);
    const dialog = await screen.findByRole("dialog", { name: "Prepare the gala newsletter" });
    await userEvent.click(await within(dialog).findByRole("button", { name: "Move to Blocked" }));

    const confirm = within(dialog).getByRole("button", { name: "Mark as blocked" });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/Why is it blocked/), "   ");
    expect(confirm).toBeDisabled(); // whitespace is not a reason
    await userEvent.type(within(dialog).getByLabelText(/Why is it blocked/), "Waiting on legal");
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);

    expect(await within(dialog).findByText("Blocked: Waiting on legal")).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Status updated." }));
    expectNoIds();
  });

  it("maps a refused mutation's error code to a friendly message and never shows a success toast", async () => {
    const refused: MockedResponse = {
      request: { query: CHANGE_ADMIN_TASK_STATUS, variables: { taskId: TASK_1, status: "DONE" } },
      result: { errors: [new GraphQLError("denied", { extensions: { code: "ADMIN_TASK_NOT_ALLOWED" } })] },
    };
    renderPage([teamMock(), listMock(MINE, []), detailMock(mkDetail()), refused], `/tasks?task=${TASK_1}`);
    const dialog = await screen.findByRole("dialog", { name: "Prepare the gala newsletter" });
    await userEvent.click(await within(dialog).findByRole("button", { name: "Move to Done" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("You can't do that on this task");
    expect(toastMock).not.toHaveBeenCalled();
    // The task on screen is unchanged.
    expect(within(dialog).getByRole("button", { name: "Move to In progress" })).toBeInTheDocument();
  });

  it("explains a task that isn't in the viewer's team", async () => {
    const missing: MockedResponse = {
      request: { query: ADMIN_TASK, variables: { id: TASK_1 } },
      result: { errors: [new GraphQLError("nope", { extensions: { code: "ADMIN_TASK_NOT_FOUND" } })] },
    };
    renderPage([teamMock(), listMock(MINE, []), missing], `/tasks?task=${TASK_1}`);
    expect(await screen.findByText("This task no longer exists or isn't in your team.")).toBeInTheDocument();
    expectNoIds();
  });
});

describe("Tasks — new task dialog", () => {
  it("shows the assignee picker (by email) only to people who can assign others", async () => {
    renderPage([teamMock(true), listMock(MINE, [])]);
    await userEvent.click(screen.getByRole("button", { name: "New task" }));
    const dialog = await screen.findByRole("dialog", { name: "New task" });
    const picker = await within(dialog).findByLabelText("Assignee");
    expect(within(picker).getByRole("option", { name: "ama@example.org" })).toBeInTheDocument();
    expectNoIds();
  });

  it("assigns to yourself, with no picker, when you can't assign others", async () => {
    renderPage([teamMock(false), listMock(MINE, [])]);
    await userEvent.click(screen.getByRole("button", { name: "New task" }));
    const dialog = await screen.findByRole("dialog", { name: "New task" });
    expect(await within(dialog).findByText("This task will be assigned to you.")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Assignee")).not.toBeInTheDocument();
  });

  it("validates against the contract limits before sending anything", async () => {
    renderPage([teamMock(true), listMock(MINE, [])]);
    await userEvent.click(screen.getByRole("button", { name: "New task" }));
    const dialog = await screen.findByRole("dialog", { name: "New task" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Create task" }));
    expect(await within(dialog).findByText("Enter a title.")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByLabelText("Title"));
    await userEvent.paste("x".repeat(201));
    await userEvent.click(within(dialog).getByRole("button", { name: "Create task" }));
    expect(await within(dialog).findByText("The title can be at most 200 characters.")).toBeInTheDocument();
  });
});

describe("Tasks — nav badge", () => {
  it("announces open and overdue counts in its accessible text", async () => {
    render(
      <MockedProvider
       
        mocks={[
          {
            request: { query: MY_ADMIN_TASK_COUNTS },
            result: { data: { myAdminTaskCounts: { __typename: "AdminTaskMyCounts", open: 3, overdue: 1 } } },
          },
        ]}
      >
        <TasksNavBadge />
      </MockedProvider>,
    );
    expect(await screen.findByText("3 open tasks, 1 overdue")).toBeInTheDocument();
  });
});

describe("admin task helpers", () => {
  it("maps every contract error code to a message and falls back for unknown ones", () => {
    const t = i18n.t.bind(i18n);
    const codes = [
      "ADMIN_TASK_NOT_FOUND",
      "ADMIN_TASK_NOT_ALLOWED",
      "ADMIN_TASK_NOT_A_MEMBER",
      "ADMIN_TASK_INVALID_TRANSITION",
      "ADMIN_TASK_LIMIT",
      "ADMIN_TASK_INVALID",
      "ADMIN_TASK_UNAVAILABLE",
    ];
    for (const code of codes) {
      const msg = taskErrorMessage({ errors: [{ extensions: { code } }] }, t);
      expect(msg).not.toContain("tasks.errors");
      expect(msg.length).toBeGreaterThan(10);
    }
    expect(taskErrorMessage({ errors: [{ extensions: { code: "SOMETHING_ELSE" } }] }, t)).toBe(
      "Something went wrong. Please try again.",
    );
    expect(taskErrorMessage(new Error("raw server text"), t)).not.toContain("raw server text");
  });

  it("turns a date into the end of that day in local time", () => {
    const iso = endOfLocalDayIso("2030-03-05")!;
    const d = new Date(iso);
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2030, 2, 5, 23, 59]);
    expect(endOfLocalDayIso("2030-02-31")).toBeNull();
    expect(endOfLocalDayIso("")).toBeNull();
  });

  it("builds links only from the allow-listed admin-hub routes", () => {
    expect(linkedItemRoute("CIRCLE", "abc")).toBe("/circles/abc");
    expect(linkedItemRoute("POST", "abc")).toBeNull();
    expect(linkedItemRoute("javascript:alert(1)", "x")).toBeNull();
    expect(linkedItemRoute("USER", "a/../b")).toBe("/users/a%2F..%2Fb");
  });
});
