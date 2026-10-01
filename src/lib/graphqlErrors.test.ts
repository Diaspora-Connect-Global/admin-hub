import { describe, it, expect } from "vitest";
import { displayErrorMessage } from "./graphqlErrors";

const ID = "0b6f1c2e-3d4a-4b5c-8d9e-0f1a2b3c4d5e";

describe("displayErrorMessage", () => {
  it("passes a readable server reason through", () => {
    expect(displayErrorMessage(new Error("Community already deleted"), "Couldn't delete")).toBe(
      "Community already deleted",
    );
  });

  it("maps known shapes the same way friendlyErrorMessage does", () => {
    expect(displayErrorMessage(new Error("Forbidden resource"), "Couldn't delete")).toBe(
      "You do not have permission to perform this action.",
    );
  });

  it("never returns a message that carries an id — the fallback is shown instead", () => {
    expect(displayErrorMessage(new Error(`Community with ID ${ID} not found`), "Couldn't delete")).toBe(
      "Couldn't delete",
    );
    expect(displayErrorMessage(new Error(`circle ${ID.toUpperCase()} is dissolved`), "Couldn't dissolve")).toBe(
      "Couldn't dissolve",
    );
  });

  it("uses the fallback for an empty error", () => {
    expect(displayErrorMessage(undefined, "Couldn't delete")).toBe("Couldn't delete");
  });
});
