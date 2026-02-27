/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_GRAPHQL_URL?: string;
  readonly VITE_AUTH_LOGIN_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
