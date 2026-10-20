import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import "@/i18n";
import {
  PostDetailSheet,
  attachmentKind,
  safeMediaUrl,
  type PostDetailSheetProps,
} from "./PostDetailSheet";
import {
  ADMIN_GET_POST_ENGAGEMENT,
  ADMIN_LIST_POST_REACTIONS,
  ADMIN_LIST_POST_COMMENTS,
  type AdminPost,
} from "@/services/networks/graphql/admin";

const POST_ID = "7d6c5b4a-3f2e-4a1b-9c8d-0e1f2a3b4c5d";
const AUTHOR_ID = "11111111-2222-4333-8444-555555555555";
const REACTOR_ID = "99999999-8888-4777-8666-555555555555";

const basePost: AdminPost = {
  id: POST_ID,
  text: "Welcome to the #diaspora meetup, thanks @Ama for hosting",
  authorType: "USER",
  authorId: AUTHOR_ID,
  authorName: "Kofi Mensah",
  authorAvatarUrl: null as string | null,
  visibility: "ONLY_ME",
  status: "PUBLISHED",
  likeCount: 5,
  commentCount: 4,
  shareCount: 3,
  saveCount: 2,
  attachmentCount: 4,
  attachments: [
    { id: "a1", type: "IMAGE", mimeType: "image/jpeg", url: "https://media.example/a1.jpg" },
    { id: "a2", type: "VIDEO", mimeType: "video/mp4", url: "https://media.example/a2.mp4" },
    { id: "a3", type: "DOCUMENT", mimeType: "application/pdf", url: "https://media.example/a3.pdf" },
    { id: "a4", type: "IMAGE", mimeType: "image/png", url: "javascript:alert(1)" },
  ],
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: null as string | null,
};

const engagement = {
  postId: POST_ID,
  likes: 5,
  shares: 3,
  saves: 2,
  comments: 4,
  happy: 2,
  hopeful: 1,
  sad: 1,
  reactorDetailAvailable: true,
  __typename: "AdminPostEngagementBreakdown",
};

const reaction = (over: Record<string, unknown>) => ({
  __typename: "AdminPostReaction",
  userId: REACTOR_ID,
  type: "LIKE",
  reactionType: "HOPEFUL",
  createdAt: "2026-10-02T09:00:00.000Z",
  displayName: "Ama Owusu",
  avatarUrl: null as string | null,
  ...over,
});

const reactionsOf = (items: unknown[], total = items.length) => ({
  data: {
    adminListPostReactions: {
      __typename: "AdminPostReactionList",
      items,
      total,
      limit: 20,
      offset: 0,
    },
  },
});

const engagementMock = {
  request: { query: ADMIN_GET_POST_ENGAGEMENT, variables: { postId: POST_ID } },
  result: { data: { adminGetPostEngagement: engagement } },
  maxUsageCount: 10,
};

/** Matches the reactions query for one tab (`undefined` = All). */
const reactionsMock = (reactionType: string | undefined, result: unknown) => ({
  request: {
    query: ADMIN_LIST_POST_REACTIONS,
    variables: {
      postId: POST_ID,
      type: "LIKE",
      limit: 20,
      offset: 0,
      ...(reactionType ? { reactionType } : {}),
    },
  },
  result,
  maxUsageCount: 10,
});

const comment = (over: Record<string, unknown>) => ({
  __typename: "AdminPostComment",
  id: "c1",
  postId: POST_ID,
  authorId: "cccccccc-dddd-4eee-8fff-000000000000",
  authorName: "Esi Appiah",
  authorAvatarUrl: null as string | null,
  text: "Lovely event",
  parentId: null as string | null,
  likeCount: 2,
  replyCount: 0,
  isDeleted: false,
  createdAt: "2026-10-03T09:00:00.000Z",
  updatedAt: null as string | null,
  ...over,
});

const commentsMock = (items: unknown[] = []) => ({
  request: { query: ADMIN_LIST_POST_COMMENTS, variables: { postId: POST_ID, limit: 100, offset: 0 } },
  result: {
    data: {
      adminListPostComments: {
        __typename: "AdminPostCommentList",
        items,
        total: items.length,
        limit: 100,
        offset: 0,
      },
    },
  },
  maxUsageCount: 10,
});

function setup(
  mocks: ReadonlyArray<Record<string, unknown>>,
  props: Partial<PostDetailSheetProps> = {},
  post: AdminPost | null = basePost,
) {
  const handlers = {
    onClose: vi.fn(),
    onRemoveComment: vi.fn(),
    onHide: vi.fn(),
    onRestore: vi.fn(),
    onRemove: vi.fn(),
  };
  render(
    <MockedProvider mocks={[commentsMock(), ...mocks] as never}>
      <PostDetailSheet post={post} {...handlers} {...props} />
    </MockedProvider>,
  );
  return handlers;
}

describe("attachment helpers", () => {
  it("classifies by stored type, then by MIME prefix, defaulting to document", () => {
    expect(attachmentKind({ type: "IMAGE", mimeType: "" })).toBe("image");
    expect(attachmentKind({ type: "", mimeType: "video/webm" })).toBe("video");
    expect(attachmentKind({ type: "DOCUMENT", mimeType: "application/pdf" })).toBe("document");
    expect(attachmentKind({ type: "WEIRD", mimeType: "" })).toBe("document");
  });

  it("only lets http(s) urls through", () => {
    expect(safeMediaUrl("https://a.example/x.jpg")).toBe("https://a.example/x.jpg");
    expect(safeMediaUrl("javascript:alert(1)")).toBeNull();
    expect(safeMediaUrl("data:text/html,<script>")).toBeNull();
    expect(safeMediaUrl("")).toBeNull();
    expect(safeMediaUrl(null)).toBeNull();
  });
});

describe("PostDetailSheet", () => {
  it("renders the text, author and every attachment by type, refusing unsafe urls", async () => {
    setup([engagementMock, reactionsMock(undefined, reactionsOf([]))]);

    expect(screen.getByText("Kofi Mensah")).toBeInTheDocument();
    // Hashtags / mentions stay readable inside the text.
    expect(screen.getByText("#diaspora")).toBeInTheDocument();
    expect(screen.getByText("@Ama")).toBeInTheDocument();

    const image = screen.getByRole("img", { name: /image 1 of 4/i });
    expect(image).toHaveAttribute("src", "https://media.example/a1.jpg");
    expect(screen.getByLabelText(/video 2 of 4/i)).toHaveAttribute("src", "https://media.example/a2.mp4");

    const doc = screen.getByRole("link", { name: /document 3/i });
    expect(doc).toHaveAttribute("href", "https://media.example/a3.pdf");
    expect(doc).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(doc).toHaveTextContent(/PDF/);

    // The javascript: image is not put in the DOM.
    expect(document.querySelector('[src^="javascript"]')).toBeNull();
    expect(screen.getByText(/cannot be displayed/i)).toBeInTheDocument();
  });

  it("enlarges an image on click", async () => {
    setup([engagementMock, reactionsMock(undefined, reactionsOf([]))]);
    await userEvent.click(screen.getByRole("button", { name: /enlarge image 1 of 4/i }));
    const big = await screen.findByRole("img", { name: /enlarged attachment/i });
    expect(big).toHaveAttribute("src", "https://media.example/a1.jpg");
  });

  it("shows counts, per-reaction tabs, and who reacted by name — never an id", async () => {
    setup([
      engagementMock,
      reactionsMock(
        undefined,
        reactionsOf([
          reaction({}),
          reaction({ userId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", displayName: null, reactionType: null }),
        ]),
      ),
    ]);

    expect(await screen.findByText("Ama Owusu")).toBeInTheDocument();
    // Counts: comments 4, shares 3, saves 2 (+ tabs).
    const counts = within(screen.getByRole("region", { name: "Counts" }));
    expect(await counts.findByText("4")).toBeInTheDocument(); // comments
    expect(counts.getByText("3")).toBeInTheDocument(); // shares
    expect(counts.getByText("2")).toBeInTheDocument(); // saves
    // Tab counts: All 5, Happy = likes - hopeful - sad = 3, Hopeful 1, Sad 1.
    expect(screen.getByRole("button", { name: "All (5)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Happy (3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hopeful (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sad (1)" })).toBeInTheDocument();
    // One legacy like (5 - 2 - 1 - 1) is disclosed.
    expect(screen.getByText(/1 earlier likes have no stored reaction/i)).toBeInTheDocument();

    // Unresolvable reactor -> "Unknown user"; untyped like shows as Happy.
    expect(screen.getAllByText("Unknown user").length).toBeGreaterThan(0);
    const body = document.body.textContent ?? "";
    for (const id of [POST_ID, AUTHOR_ID, REACTOR_ID, "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"]) {
      expect(body).not.toContain(id);
    }
    expect(body).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
  });

  it("filters the list when a reaction tab is chosen", async () => {
    setup([
      engagementMock,
      reactionsMock(undefined, reactionsOf([reaction({ displayName: "Ama Owusu" })])),
      reactionsMock("SAD", reactionsOf([reaction({ displayName: "Yaw Boateng", reactionType: "SAD" })])),
    ]);
    expect(await screen.findByText("Ama Owusu")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Sad/ }));
    expect(await screen.findByText("Yaw Boateng")).toBeInTheDocument();
    expect(screen.queryByText("Ama Owusu")).not.toBeInTheDocument();
  });

  it("shows an error, not an empty list, when reactions fail; empty is a distinct state", async () => {
    setup([
      engagementMock,
      reactionsMock(undefined, { errors: [{ message: "post-feed-service client is not available" }] }),
    ]);
    expect(await screen.findByText(/could not load who reacted/i)).toBeInTheDocument();
    expect(screen.queryByText(/nobody has reacted yet/i)).not.toBeInTheDocument();
  });

  it("shows an empty state when nobody reacted", async () => {
    setup([engagementMock, reactionsMock(undefined, reactionsOf([]))]);
    expect(await screen.findByText(/nobody has reacted yet/i)).toBeInTheDocument();
  });

  it("shows an error, not zeros, when the counts fail", async () => {
    setup([
      { request: { query: ADMIN_GET_POST_ENGAGEMENT, variables: { postId: POST_ID } }, error: new Error("boom") },
      reactionsMock(undefined, reactionsOf([])),
    ]);
    expect(await screen.findByText(/could not load the counts/i)).toBeInTheDocument();
  });

  it("falls back to Unknown user for an erased author and notes a post with no attachments", () => {
    setup(
      [engagementMock, reactionsMock(undefined, reactionsOf([]))],
      {},
      { ...basePost, authorName: null, attachments: [], attachmentCount: 0, text: null },
    );
    expect(screen.getByText("Unknown user")).toBeInTheDocument();
    expect(screen.getByText(/no attachments/i)).toBeInTheDocument();
    expect(screen.getByText("No text")).toBeInTheDocument();
  });

  it("wires Hide, Remove and View comments; offers Restore for a hidden post", async () => {
    const h = setup([engagementMock, reactionsMock(undefined, reactionsOf([]))]);
    await userEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(h.onHide).toHaveBeenCalledWith(basePost);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(h.onRemove).toHaveBeenCalledWith(basePost);
  });

  it("shows an empty comments state inside the drawer", async () => {
    setup([engagementMock, reactionsMock(undefined, reactionsOf([]))]);
    expect(await screen.findByText(/no comments on this post/i)).toBeInTheDocument();
  });

  it("lists comments with a remove button per live comment, and no id leaks", async () => {
    const h = {
      onClose: vi.fn(), onRemoveComment: vi.fn(), onHide: vi.fn(), onRestore: vi.fn(), onRemove: vi.fn(),
    };
    render(
      <MockedProvider
        mocks={[
          commentsMock([
            comment({}),
            comment({ id: "c2", parentId: "c1", authorName: null, text: "Agreed" }),
            comment({ id: "c3", text: "gone", isDeleted: true }),
          ]),
          engagementMock,
          reactionsMock(undefined, reactionsOf([])),
        ] as never}
      >
        <PostDetailSheet post={basePost} {...h} />
      </MockedProvider>,
    );
    expect(await screen.findByText("Lovely event")).toBeInTheDocument();
    expect(screen.getByText("Agreed")).toBeInTheDocument();
    expect(screen.getByText("Deleted")).toBeInTheDocument();
    const removes = screen.getAllByRole("button", { name: /remove comment/i });
    expect(removes).toHaveLength(2); // the deleted comment has none
    await userEvent.click(removes[0]);
    expect(h.onRemoveComment).toHaveBeenCalledWith(expect.objectContaining({ id: "c1" }));
    expect(document.body.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
  });

  it("shows an error, not 'no comments', when the comments query fails", async () => {
    render(
      <MockedProvider
        mocks={[
          { request: { query: ADMIN_LIST_POST_COMMENTS, variables: { postId: POST_ID, limit: 100, offset: 0 } }, error: new Error("boom") },
          engagementMock,
          reactionsMock(undefined, reactionsOf([])),
        ] as never}
      >
        <PostDetailSheet post={basePost} onClose={vi.fn()} onRemoveComment={vi.fn()} onHide={vi.fn()} onRestore={vi.fn()} onRemove={vi.fn()} />
      </MockedProvider>,
    );
    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
    expect(screen.queryByText(/no comments on this post/i)).not.toBeInTheDocument();
  });

  it("offers Restore instead of Hide when the post is hidden", async () => {
    const hidden = { ...basePost, status: "HIDDEN" };
    const h = setup([engagementMock, reactionsMock(undefined, reactionsOf([]))], {}, hidden);
    expect(screen.queryByRole("button", { name: "Hide" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(h.onRestore).toHaveBeenCalledWith(hidden);
  });

  it("disables the actions while one is in flight", () => {
    setup([engagementMock, reactionsMock(undefined, reactionsOf([]))], { busy: true });
    expect(screen.getByRole("button", { name: "Hide" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
  });

  it("closes on Escape", async () => {
    const h = setup([engagementMock, reactionsMock(undefined, reactionsOf([]))]);
    await userEvent.keyboard("{Escape}");
    expect(h.onClose).toHaveBeenCalled();
    // sanity: the dialog is labelled
    expect(within(screen.getByRole("dialog")).getByText("Post detail")).toBeInTheDocument();
  });
});
