import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  Observable,
} from "@apollo/client";
import { getAccessToken, getDevUserId, DEV_USER_ID_HEADER_KEY } from "@/stores/session";
import { refreshSession } from "@/services/networks/graphql/admin/auth";
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
  const operationType = operation.operationName || 'Unknown';
  
  // Determine service type for debugging
  const service = operationType.includes('Event') ? 'Events' :
                  operationType.includes('User') || operationType.includes('Profile') ? 'Users' :
                  operationType.includes('Opportunity') ? 'Opportunities' :
                  operationType.includes('Admin') ? 'Admin' : 'Other';
  
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
    log.warn("No access token available", {
      operation: operationType,
      service: service,
    });
    console.warn(`❌ ${service} Service Request: NO TOKEN`, {
      operation: operationType,
      service: service
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
          const operationType = operation.operationName || 'Unknown';
          const service = operationType.includes('Event') ? 'Events' :
                          operationType.includes('User') || operationType.includes('Profile') ? 'Users' :
                          operationType.includes('Opportunity') ? 'Opportunities' :
                          operationType.includes('Admin') ? 'Admin' : 'Other';
          
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
            
            // Token expired - attempt automatic refresh
            console.log('🔄 JWT token expired (15min expiry), attempting refresh...');
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
