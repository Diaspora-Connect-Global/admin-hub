import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  Observable,
} from "@apollo/client";
import { getAccessToken, getDevUserId, DEV_USER_ID_HEADER_KEY } from "@/stores/session";
import { logger } from "@/lib/logger";

const adminGraphqlUrl =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_ADMIN_GRAPHQL_URL
    ? import.meta.env.VITE_ADMIN_GRAPHQL_URL
    : "https://api.diaspoplug.net/graphql";

const httpLink = new HttpLink({
  uri: adminGraphqlUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const log = logger.child("GraphQL");

const authLink = new ApolloLink((operation, forward) => {
  const accessToken = getAccessToken();
  const devUserId = getDevUserId();
  const headers: Record<string, string> = { ...operation.getContext().headers };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
    log.debug("Request with auth", {
      operation: operation.operationName,
      hasAuth: true,
      devUserId: devUserId ?? undefined,
    });
  } else {
    log.warn("No access token available", {
      operation: operation.operationName,
    });
  }
  if (devUserId) headers[DEV_USER_ID_HEADER_KEY] = devUserId;
  operation.setContext({ headers });
  return forward(operation);
});

const errorLogLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    forward(operation).subscribe({
      next(response) {
        if (response.errors?.length) {
          const isForbidden = response.errors.some(e => e.message?.toLowerCase().includes('forbidden'));
          if (isForbidden) {
            log.error("GraphQL authorization error", {
              operation: operation.operationName,
              errors: response.errors.map((e) => ({
                message: e.message,
                code: e.extensions?.code,
                path: e.path,
              })),
            });
          } else {
            log.warn("GraphQL errors", {
              operation: operation.operationName,
              errors: response.errors.map((e) => e.message),
            });
          }
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
