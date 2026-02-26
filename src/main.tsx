import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "@/lib/logger";

const log = logger.child("App");

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    log.error("Unhandled error", { message: event.message, filename: event.filename, lineno: event.lineno });
  });
  window.addEventListener("unhandledrejection", (event) => {
    log.error("Unhandled promise rejection", { reason: String(event.reason) });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
