import { describe, it, expect, vi, afterEach } from "vitest";
import { downloadTextFile, fileNameSlug } from "./download";

describe("fileNameSlug", () => {
  it("builds a file-safe slug from a display name", () => {
    expect(fileNameSlug("Accra Diaspora Hub", "export")).toBe("accra-diaspora-hub");
    expect(fileNameSlug("  Côte d'Ivoire — Paris / Île-de-France  ", "export")).toBe("cote-d-ivoire-paris-ile-de-france");
  });

  it("falls back when nothing file-safe is left", () => {
    expect(fileNameSlug("…", "export")).toBe("export");
  });

  it("caps the length without leaving a trailing dash", () => {
    const slug = fileNameSlug(`${"a".repeat(59)} b`, "export");
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("stays fast on pathological input", () => {
    const start = performance.now();
    fileNameSlug(`${"-".repeat(50_000)}x${"-".repeat(50_000)}`, "export");
    expect(performance.now() - start).toBeLessThan(200);
  });
});

describe("downloadTextFile", () => {
  afterEach(() => vi.restoreAllMocks());

  it("saves the content under the given file name", () => {
    const createObjectURL = vi.fn(() => "blob:mock");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadTextFile("community-accra.json", "{}", "application/json");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.download).toBe("community-accra.json");
    expect(anchor.href).toBe("blob:mock");
  });
});
