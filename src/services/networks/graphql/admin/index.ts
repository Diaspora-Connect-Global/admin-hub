/** Admin GraphQL: client, operations, and login. */
export { adminClient } from "./client";
export * from "./operations";
export {
  login,
  type LoginResponse,
  type LoginError,
  type AdminUserInfo,
  type AdminRoleInfo,
} from "./auth";
