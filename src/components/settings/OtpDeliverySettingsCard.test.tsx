import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing/react";
import type { MockedResponse } from "@apollo/client/testing";
import { OtpDeliverySettingsCard } from "./OtpDeliverySettingsCard";
import {
  GET_ADMIN_OTP_SETTINGS,
  UPDATE_OTP_SETTINGS,
} from "@/services/networks/graphql/admin";

const defaultSettings = {
  __typename: "OtpSettings",
  email: { __typename: "OtpChannelPolicy", mode: "ALL", countries: [] as string[] },
  sms: { __typename: "OtpChannelPolicy", mode: "NONE", countries: [] as string[] },
  updatedAt: "2026-09-01T12:00:00.000Z",
  updatedByName: "Ama Mensah",
};

function settingsMock(overrides: Partial<typeof defaultSettings> = {}) {
  return {
    request: { query: GET_ADMIN_OTP_SETTINGS },
    result: { data: { adminOtpSettings: { ...defaultSettings, ...overrides } } },
  };
}

function renderCard(mocks: ReadonlyArray<MockedResponse>) {
  return render(
    <MockedProvider mocks={mocks} defaultOptions={{ mutate: { errorPolicy: "all" } }}>
      <OtpDeliverySettingsCard />
    </MockedProvider>,
  );
}

const SAVE_INPUT = {
  // Email is always ALL — the card never offers anything else.
  email: { mode: "ALL", countries: [] as string[] },
  sms: { mode: "LIST", countries: ["GH"] },
};

async function loaded() {
  // The fieldsets render immediately but stay disabled until the query resolves;
  // "Last changed" only appears once settings have loaded, so wait for it.
  await screen.findByText(/Last changed/);
  return {
    email: screen.getByRole("group", { name: /^email codes$/i }),
    sms: screen.getByRole("group", { name: /^sms codes$/i }),
  };
}

async function pickSmsGhana(sms: HTMLElement) {
  await userEvent.click(within(sms).getByRole("radio", { name: /only these countries/i }));
  await userEvent.click(await screen.findByRole("checkbox", { name: /ghana/i }));
}

// ~195 Radix checkboxes per list; give slow CI machines headroom.
describe("OtpDeliverySettingsCard", { timeout: 30000 }, () => {
  it("shows email as always on (no choice), who changed it last, and keeps Save disabled until something changes", async () => {
    renderCard([settingsMock()]);
    const { email, sms } = await loaded();

    expect(email).toHaveTextContent(/always on, in all countries/i);
    expect(within(email).queryAllByRole("radio")).toHaveLength(0);
    expect(within(email).queryAllByRole("checkbox")).toHaveLength(0);
    expect(within(sms).getByRole("radio", { name: /no countries/i })).toBeChecked();

    const lastChanged = screen.getByText(/Last changed/);
    expect(lastChanged).toHaveTextContent("Ama Mensah");
    // Never render a raw user id — only the display name.
    expect(lastChanged.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);

    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("shows an inline error and keeps Save disabled when the SMS list has zero countries", async () => {
    renderCard([settingsMock()]);
    const { sms } = await loaded();
    await userEvent.click(within(sms).getByRole("radio", { name: /only these countries/i }));

    expect(await screen.findByText(/select at least one country/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("saves an SMS change and always sends email ALL", async () => {
    const onMutate = vi.fn();
    renderCard([
      settingsMock(),
      {
        request: { query: UPDATE_OTP_SETTINGS, variables: { input: SAVE_INPUT } },
        result: () => {
          onMutate();
          return {
            data: {
              updateOtpSettings: {
                ...defaultSettings,
                sms: { __typename: "OtpChannelPolicy", mode: "LIST", countries: ["GH"] },
                updatedAt: "2026-10-18T00:00:00.000Z",
              },
            },
          };
        },
      },
      settingsMock({ sms: { __typename: "OtpChannelPolicy", mode: "LIST", countries: ["GH"] } }),
    ]);
    const { sms } = await loaded();
    await pickSmsGhana(sms);

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
        request: { query: UPDATE_OTP_SETTINGS, variables: { input: SAVE_INPUT } },
        // errorPolicy "all" resolves with data:null + errors — never a thrown rejection.
        result: {
          data: null,
          errors: [{ message: "Country list must not be empty" } as never],
        },
      },
      settingsMock(), // consumed by the mutation's refetchQueries even on a refusal
    ]);
    const { sms } = await loaded();
    await pickSmsGhana(sms);
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/country list must not be empty/i)).toBeInTheDocument();
    // No false-success toast/state — the save button must not silently look like it worked.
    expect(screen.queryByText(/^saved$/i)).not.toBeInTheDocument();
  });
});
