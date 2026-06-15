import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders its children", () => {
    render(<StatusBadge variant="active">Active</StatusBadge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies the success token class for the active variant", () => {
    render(<StatusBadge variant="active">Active</StatusBadge>);
    expect(screen.getByText("Active").className).toContain("bg-success");
  });

  it("applies the destructive token class for the error variant", () => {
    render(<StatusBadge variant="error">Failed</StatusBadge>);
    expect(screen.getByText("Failed").className).toContain("bg-destructive");
  });

  it("falls back to the inactive variant for an unknown variant", () => {
    // @ts-expect-error testing the runtime fallback path
    render(<StatusBadge variant="bogus">Unknown</StatusBadge>);
    expect(screen.getByText("Unknown").className).toContain("bg-muted");
  });
});
