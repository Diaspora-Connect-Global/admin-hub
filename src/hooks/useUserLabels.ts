import { useEffect, useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { userLabel } from "@/lib/userLabel";

interface ProfileName {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

/** Ids per request. Each alias is one `getProfile` field in a single HTTP call. */
const BATCH_SIZE = 50;

/** Session cache of resolved labels so paging back and forth never re-fetches. */
const labelCache = new Map<string, string>();

function buildBatchQuery(count: number) {
  const vars = Array.from({ length: count }, (_, i) => `$u${i}: String!`).join(", ");
  const fields = Array.from(
    { length: count },
    (_, i) => `u${i}: getProfile(userId: $u${i}) { profile { userId firstName middleName lastName email } }`,
  ).join("\n");
  return gql(`query ResolveUserLabels(${vars}) {\n${fields}\n}`);
}

function labelOf(p?: ProfileName | null): string {
  const fullName = [p?.firstName, p?.middleName, p?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return userLabel({ name: fullName, email: p?.email }, "");
}

/**
 * Resolve a set of user ids to human labels (full name, else email).
 *
 * Several admin surfaces receive only a user id (support-case reporters, chat
 * group creators, dispute raisers…). User ids must never be displayed, so those
 * surfaces resolve the id here and render the label — or "Unknown user" when
 * the profile cannot be read (erased account, transient failure).
 *
 * Batched: all ids go out as aliased `getProfile` fields in ONE request per 50
 * ids (never one request per row), and resolved labels are cached for the
 * session. Returns id → label; unresolved ids are absent.
 */
export function useUserLabels(ids: ReadonlyArray<string | null | undefined>): ReadonlyMap<string, string> {
  const client = useApolloClient();
  const key = useMemo(
    () => [...new Set(ids.filter((id): id is string => Boolean(id && id.trim())))].sort().join(","),
    [ids],
  );
  const [labels, setLabels] = useState<ReadonlyMap<string, string>>(() => new Map());

  useEffect(() => {
    const unique = key ? key.split(",") : [];
    const pick = () => new Map(unique.flatMap((id) => (labelCache.has(id) ? [[id, labelCache.get(id)!]] : [])));
    const missing = unique.filter((id) => !labelCache.has(id));
    setLabels(pick());
    if (missing.length === 0) return;

    let cancelled = false;
    void (async () => {
      for (let start = 0; start < missing.length; start += BATCH_SIZE) {
        const chunk = missing.slice(start, start + BATCH_SIZE);
        try {
          const { data } = await client.query<Record<string, { profile?: ProfileName | null } | null>>({
            query: buildBatchQuery(chunk.length),
            variables: Object.fromEntries(chunk.map((id, i) => [`u${i}`, id])),
            fetchPolicy: "no-cache",
            // One unreadable profile (erased account) must not blank the rest.
            errorPolicy: "all",
          });
          chunk.forEach((id, i) => {
            const label = labelOf(data?.[`u${i}`]?.profile);
            if (label) labelCache.set(id, label);
          });
        } catch {
          // Unresolvable — callers show their "Unknown user" fallback.
        }
      }
      if (!cancelled) setLabels(pick());
    })();
    return () => {
      cancelled = true;
    };
  }, [key, client]);

  return labels;
}
