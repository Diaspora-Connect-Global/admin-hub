import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "@/lib/logger";
import { RootErrorBoundary } from "@/components/RootErrorBoundary";

const log = logger.child("App");

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    log.error("Unhandled error", { message: event.message, filename: event.filename, lineno: event.lineno });
  });
  window.addEventListener("unhandledrejection", (event) => {
    log.error("Unhandled promise rejection", { reason: String(event.reason) });
  });
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Missing #root element in index.html');
}

createRoot(rootEl).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
);
