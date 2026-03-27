import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/sessionStore";

/**
 * Zustand `persist` rehydrates from sessionStorage asynchronously.
 * Until then, `sessionId` / `accessToken` are still the initial `null` values,
 * which can incorrectly send logged-in users through `/login` or flash a blank route.
 */
export function useSessionStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useSessionStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useSessionStore.persist.onFinishHydration(() => setHydrated(true));
    if (useSessionStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
}
