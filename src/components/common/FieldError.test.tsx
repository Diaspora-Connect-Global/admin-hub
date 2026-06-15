import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldError } from "./FieldError";

describe("FieldError", () => {
  it("renders the message when present", () => {
    render(<FieldError message="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("renders nothing when message is empty", () => {
    const { container } = render(<FieldError message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when message is undefined", () => {
    const { container } = render(<FieldError />);
    expect(container).toBeEmptyDOMElement();
  });
});
