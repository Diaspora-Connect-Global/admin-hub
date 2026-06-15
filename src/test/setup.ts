import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Unmount React trees and clear mocks between tests.
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// jsdom doesn't implement matchMedia — several UI primitives (next-themes,
// use-mobile) read it. Provide a no-op stub.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
