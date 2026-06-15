import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@/i18n"; // initialise i18next so t() returns real strings
import { LoadingState, ErrorState, EmptyState } from "./StateViews";

describe("LoadingState", () => {
  it("exposes a busy status region", () => {
    render(<LoadingState rows={3} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });
});

describe("ErrorState", () => {
  it("renders an alert and calls onRetry when the retry button is clicked", async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("omits the retry button when no handler is given", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders a custom title and message", () => {
    render(<EmptyState title="No results" message="Try another filter" />);
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Try another filter")).toBeInTheDocument();
  });
});
