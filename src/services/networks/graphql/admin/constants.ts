/** Single HTTP endpoint for admin GraphQL (login, refresh, queries). */
export const ADMIN_GRAPHQL_HTTP_URI =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_ADMIN_GRAPHQL_URL
    ? import.meta.env.VITE_ADMIN_GRAPHQL_URL
    : "https://api.diaspoplug.net/graphql";
