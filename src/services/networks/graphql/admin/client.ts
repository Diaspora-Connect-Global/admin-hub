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
import { ADMIN_GRAPHQL_HTTP_URI } from "./constants";
import { createTokenRefreshErrorLink } from "./tokenRefreshLink";

const httpLink = new HttpLink({
  uri: ADMIN_GRAPHQL_HTTP_URI,
  headers: {
    "Content-Type": "application/json",
  },
});

const log = logger.child("GraphQL");

const TOKEN_OPTIONAL_OPERATIONS = new Set(["AdminLogin"]);

function getServiceName(operationType: string) {
  if (/event/i.test(operationType)) return "Events";
  if (/(user|profile)/i.test(operationType)) return "Users";
  if (/opportunit(y|ies)|application/i.test(operationType)) return "Opportunities";
  if (/admin|auth|login|logout|refresh/i.test(operationType)) return "Admin";
  return "Other";
}

const authLink = new ApolloLink((operation, forward) => {
  const accessToken = getAccessToken();
  const devUserId = getDevUserId();
  const operationType = operation.operationName || 'Unknown';
  const isTokenOptionalOperation = TOKEN_OPTIONAL_OPERATIONS.has(operationType);
  const service = getServiceName(operationType);
  
  const headers: Record<string, string> = { ...operation.getContext().headers };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
    log.debug("Request with auth", {
      operation: operationType,
      service: service,
      hasAuth: true,
      tokenLength: accessToken.length,
      devUserId: devUserId ?? undefined,
    });
  } else {
    if (isTokenOptionalOperation) {
      log.debug("No access token required", {
        operation: operationType,
        service: service,
      });
    } else {
      log.warn("No access token available", {
        operation: operationType,
        service: service,
      });
      console.warn(`❌ ${service} Service Request: NO TOKEN`, {
        operation: operationType,
        service: service
      });
    }
  }
  
  if (import.meta.env.DEV && devUserId) headers[DEV_USER_ID_HEADER_KEY] = devUserId;
  operation.setContext({ headers });
  return forward(operation);
});

const tokenRefreshErrorLink = createTokenRefreshErrorLink();

const errorLogLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    forward(operation).subscribe({
      next(response) {
        if (response.errors?.length) {
          const operationType = operation.operationName || 'Unknown';
          const service = getServiceName(operationType);
          const errorMessages = response.errors.map((e) => e.message ?? "");
          const isForbidden = errorMessages.some((message) => message.toLowerCase().includes("forbidden"));
          const isUnauthenticated = errorMessages.some((message) =>
            /(unauthenticated|unauthorized|jwt|token expired|invalid token|expired)/i.test(message)
          );

          if (isForbidden) {
            log.error("GraphQL authorization error", {
              operation: operationType,
              service: service,
              errors: response.errors.map((e) => ({
                message: e.message,
                code: e.extensions?.code,
                path: e.path,
              })),
            });
            
            // Add detailed error logging
            console.error(`❌ ${service} Service Error:`, {
              operation: operationType,
              service: service,
              errors: response.errors.map(e => e.message),
              path: response.errors.map(e => e.path).filter(Boolean)
            });
            console.warn(`🚫 ${service} permission denied for ${operationType}. Session kept active.`);
          } else if (isUnauthenticated) {
            log.warn("GraphQL authentication error", {
              operation: operationType,
              service: service,
              errors: response.errors.map((e) => ({
                message: e.message,
                code: e.extensions?.code,
                path: e.path,
              })),
            });

            console.warn(`🔄 ${service} authentication expired for ${operationType}. Session kept active (inactivity timer controls logout).`);
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
  link: from([authLink, tokenRefreshErrorLink, errorLogLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: "all" },
    query: { errorPolicy: "all" },
    mutate: { errorPolicy: "all" },
  },
});
