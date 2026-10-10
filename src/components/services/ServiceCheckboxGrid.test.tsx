import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ServiceCheckboxGrid } from "./ServiceCheckboxGrid";

describe("ServiceCheckboxGrid Events-only preset", () => {
  it("offers the preset only when a handler is passed, and calls it", () => {
    const onEventsOnly = vi.fn();
    const { rerender } = render(<ServiceCheckboxGrid selected={["posts", "events"]} onToggle={() => {}} />);
    expect(screen.queryByRole("button", { name: "Events-only" })).toBeNull();

    rerender(<ServiceCheckboxGrid selected={["posts", "events"]} onToggle={() => {}} onEventsOnly={onEventsOnly} />);
    fireEvent.click(screen.getByRole("button", { name: "Events-only" }));
    expect(onEventsOnly).toHaveBeenCalledTimes(1);
  });

  it("marks the preset active (and explains it) when exactly ['events'] is selected", () => {
    render(<ServiceCheckboxGrid selected={["events"]} onToggle={() => {}} onEventsOnly={() => {}} />);
    expect(screen.getByRole("button", { name: "Events-only" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/Events dashboard/)).toBeTruthy();
  });

  it("is not active when other services are on too", () => {
    render(<ServiceCheckboxGrid selected={["events", "posts"]} onToggle={() => {}} onEventsOnly={() => {}} />);
    expect(screen.getByRole("button", { name: "Events-only" }).getAttribute("aria-pressed")).toBe("false");
  });
});
