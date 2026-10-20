import { beforeAll, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateEditOpportunityModal } from "./CreateEditOpportunityModal";
import { OpportunityType, type Opportunity } from "@/types/opportunities";
import { toast } from "@/hooks/use-toast";

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("@/stores/session", () => ({ getUserId: () => "admin-user" }));

/**
 * Money rule: compensation is INTEGER MINOR units on the wire (x100), 64-bit on the backend
 * (GraphQL Float). The modal multiplies by 100 once on input and divides by 100 once when
 * prefilling an edit.
 */
const investment = {
  id: "opp-1",
  title: "Seed round",
  type: OpportunityType.INVESTMENT,
  description: "Raising a seed round",
  compensationMin: 50_000_000_000, // GHS 500,000,000 - past the old 32-bit Int
  compensationMax: 5_000_000_150, // GHS 50,000,001.50
  compensationCurrency: "GHS",
} as unknown as Opportunity;

beforeAll(() => {
  // Radix scroll area / radio group measure size; jsdom has no ResizeObserver.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

async function openAdditionalTab() {
  await userEvent.click(screen.getByRole("tab", { name: "Additional Details" }));
}

describe("CreateEditOpportunityModal compensation (minor units)", () => {
  it("edit: prefills major units (÷100) and saves minor units (×100) past int32", async () => {
    const onSave = vi.fn();
    render(<CreateEditOpportunityModal open onOpenChange={vi.fn()} opportunity={investment} onSave={onSave} />);
    await openAdditionalTab();

    expect(screen.getByDisplayValue("500000000")).toBeInTheDocument();
    const max = screen.getByDisplayValue("50000001.50");
    fireEvent.change(max, { target: { value: "750000000.25" } });

    await userEvent.click(screen.getByRole("button", { name: /Save Draft/ }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const [input, action] = onSave.mock.calls[0];
    expect(action).toBe("draft");
    expect(input.compensationMin).toBe(50_000_000_000);
    expect(input.compensationMax).toBe(75_000_000_025);
  });

  it("create: a typed amount is sent ×100 exactly once", async () => {
    const onSave = vi.fn();
    render(<CreateEditOpportunityModal open onOpenChange={vi.fn()} onSave={onSave} />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Community Outreach Coordinator"), { target: { value: "Senior engineer" } });
    await openAdditionalTab();
    const [minInput] = screen.getAllByPlaceholderText("0");
    fireEvent.change(minInput, { target: { value: "1500.50" } });

    await userEvent.click(screen.getByRole("button", { name: /Save Draft/ }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].compensationMin).toBe(150050);
    expect(onSave.mock.calls[0][0].compensationMax).toBeUndefined();
  });

  it("refuses an amount that cannot be converted exactly instead of dropping it", async () => {
    const onSave = vi.fn();
    render(<CreateEditOpportunityModal open onOpenChange={vi.fn()} opportunity={investment} onSave={onSave} />);
    await openAdditionalTab();
    fireEvent.change(screen.getByDisplayValue("500000000"), { target: { value: "1500.505" } });

    await userEvent.click(screen.getByRole("button", { name: /Save Draft/ }));
    expect(onSave).not.toHaveBeenCalled();
    expect(vi.mocked(toast).mock.calls.map(([a]) => (a as { title?: string }).title)).toContain("Invalid amount");
  });
});
