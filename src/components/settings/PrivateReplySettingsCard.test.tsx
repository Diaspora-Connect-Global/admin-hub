import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import { PrivateReplySettingsCard } from "./PrivateReplySettingsCard";
import {
  GET_ADMIN_PRIVATE_REPLY_SETTINGS,
  UPDATE_PRIVATE_REPLY_SETTINGS,
} from "@/services/networks/graphql/admin";

const loadedSettings = {
  __typename: "PrivateReplySettings",
  maxMembers: 10,
  memberManagement: "STARTER",
  newMembersSeeHistory: false,
  updatedAt: "2026-09-01T12:00:00.000Z",
  updatedByName: "Ama Mensah",
};

function settingsMock(overrides: Partial<typeof loadedSettings> = {}) {
  return {
    request: { query: GET_ADMIN_PRIVATE_REPLY_SETTINGS },
    result: { data: { adminPrivateReplySettings: { ...loadedSettings, ...overrides } } },
  };
}

function renderCard(mocks: ReadonlyArray<Record<string, unknown>>) {
  return render(
    <MockedProvider mocks={mocks} defaultOptions={{ mutate: { errorPolicy: "all" } }}>
      <PrivateReplySettingsCard />
    </MockedProvider>,
  );
}

describe("PrivateReplySettingsCard", () => {
  it("renders loaded settings, shows who changed it last, and keeps Save disabled until something changes", async () => {
    renderCard([settingsMock()]);

    expect(await screen.findByDisplayValue("10")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /the person who started it/i })).toBeChecked();

    const lastChanged = screen.getByText(/Last changed/);
    expect(lastChanged).toHaveTextContent("Ama Mensah");
    // Never render a raw user id — only the display name.
    expect(lastChanged.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);

    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("shows an inline error and keeps Save disabled for an out-of-range value", async () => {
    renderCard([settingsMock()]);

    // Wait for the loaded value first — the field is populated (and disabled)
    // asynchronously, and editing too early would just be overwritten once it loads.
    await screen.findByDisplayValue("10");
    const input = screen.getByLabelText(/maximum people in a private conversation/i);
    // jsdom/user-event can't drive selection on type="number" inputs; fireEvent instead.
    fireEvent.change(input, { target: { value: "1" } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/between 2 and 50/i);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("enables Save on a valid change and saves successfully", async () => {
    const onMutate = vi.fn();
    renderCard([
      settingsMock(),
      {
        request: {
          query: UPDATE_PRIVATE_REPLY_SETTINGS,
          variables: {
            input: { maxMembers: 20, memberManagement: "STARTER", newMembersSeeHistory: false },
          },
        },
        result: () => {
          onMutate();
          return {
            data: {
              updatePrivateReplySettings: {
                ...loadedSettings,
                maxMembers: 20,
                updatedAt: "2026-09-29T00:00:00.000Z",
              },
            },
          };
        },
      },
      settingsMock({ maxMembers: 20 }), // refetchQueries after the mutation
    ]);

    await screen.findByDisplayValue("10");
    const input = screen.getByLabelText(/maximum people in a private conversation/i);
    fireEvent.change(input, { target: { value: "20" } });

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await userEvent.click(saveButton);

    await waitFor(() => expect(onMutate).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/could not save/i)).not.toBeInTheDocument();
  });

  it("surfaces a server refusal instead of a false success (errorPolicy 'all' trap)", async () => {
    renderCard([
      settingsMock(),
      {
        request: {
          query: UPDATE_PRIVATE_REPLY_SETTINGS,
          variables: {
            input: { maxMembers: 20, memberManagement: "STARTER", newMembersSeeHistory: false },
          },
        },
        // errorPolicy "all" resolves with data:null + errors — never a thrown rejection.
        result: {
          data: null,
          errors: [{ message: "Maximum people must be a whole number between 2 and 50" } as never],
        },
      },
      settingsMock(), // consumed by the mutation's refetchQueries even on a refusal
    ]);

    await screen.findByDisplayValue("10");
    const input = screen.getByLabelText(/maximum people in a private conversation/i);
    fireEvent.change(input, { target: { value: "20" } });
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText(/maximum people must be a whole number between 2 and 50/i),
    ).toBeInTheDocument();
  });
});
