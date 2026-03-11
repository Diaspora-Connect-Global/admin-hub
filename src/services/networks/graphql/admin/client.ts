import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  Observable,
} from "@apollo/client";
import { getAccessToken, getDevUserId, DEV_USER_ID_HEADER_KEY, clearSession } from "@/stores/session";
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

const TOKEN_OPTIONAL_OPERATIONS = new Set(["AdminLogin"]);

function forceRelogin(reason: string) {
  clearSession();
  log.warn("Session cleared; redirecting to login", { reason });
  if (typeof window !== "undefined") {
    const onLoginPage = window.location.pathname.includes("/login");
    if (!onLoginPage) {
      window.location.href = "/login";
    }
  }
}

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
      tokenPreview: accessToken.substring(0, 20) + '...',
      devUserId: devUserId ?? undefined,
    });
    
    // Add detailed service logging
    console.log(`🔍 ${service} Service Request:`, {
      operation: operationType,
      service: service,
      hasToken: true,
      tokenLength: accessToken.length,
      tokenPreview: accessToken.substring(0, 20) + '...'
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
  
  if (devUserId) headers[DEV_USER_ID_HEADER_KEY] = devUserId;
  operation.setContext({ headers });
  return forward(operation);
});

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
            console.warn(`🚫 ${service} permission denied for ${operationType}.`);
            forceRelogin("forbidden-resource");
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

            console.warn(`🔄 ${service} authentication expired for ${operationType}. Re-login required.`);
            forceRelogin("unauthenticated");
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
