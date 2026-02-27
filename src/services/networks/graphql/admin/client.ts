import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  Observable,
} from "@apollo/client";
import { getSessionId, getDevUserId, DEV_USER_ID_HEADER_KEY } from "@/stores/session";
import { logger } from "@/lib/logger";

const adminGraphqlUrl =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_ADMIN_GRAPHQL_URL
    ? import.meta.env.VITE_ADMIN_GRAPHQL_URL
    : "http://localhost:3006/graphql";

const httpLink = new HttpLink({
  uri: adminGraphqlUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const log = logger.child("GraphQL");

const authLink = new ApolloLink((operation, forward) => {
  const sessionId = getSessionId();
  const devUserId = getDevUserId();
  const headers: Record<string, string> = { ...operation.getContext().headers };
  if (sessionId) headers["Authorization"] = `Bearer ${sessionId}`;
  if (devUserId) headers[DEV_USER_ID_HEADER_KEY] = devUserId;
  log.debug("Request", {
    operation: operation.operationName,
    hasAuth: !!sessionId,
    devUserId: devUserId ?? undefined,
  });
  operation.setContext({ headers });
  return forward(operation);
});

const errorLogLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    forward(operation).subscribe({
      next(response) {
        if (response.errors?.length) {
          log.warn("GraphQL errors", {
            operation: operation.operationName,
            errors: response.errors.map((e) => e.message),
          });
        }
        observer.next(response);
      },
      error: (e) => observer.error(e),
      complete: () => observer.complete(),
    });
  });
});

export const adminClient = new ApolloClient({
  link: from([authLink, errorLogLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: "all" },
    query: { errorPolicy: "all" },
    mutate: { errorPolicy: "all" },
  },
});
