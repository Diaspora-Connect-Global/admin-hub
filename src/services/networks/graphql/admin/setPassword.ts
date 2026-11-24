import { gql } from "@apollo/client";
import { adminClient } from "./client";

const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!, $resetCode: String!, $newPassword: String!) {
    resetPassword(email: $email, resetCode: $resetCode, newPassword: $newPassword)
  }
`;

/** Sends a one-time reset code. The gateway answers with a status string, not an error. */
export async function forgotPasswordRequest(email: string): Promise<string> {
  const result = await adminClient.mutate<{ forgotPassword: string }>({
    mutation: FORGOT_PASSWORD,
    variables: { email },
  });
  return result.data?.forgotPassword ?? "Password reset failed";
}

/** Consumes the code and sets the password. Failure comes back as "Password reset failed: ...". */
export async function resetPasswordRequest(input: {
  email: string;
  resetCode: string;
  newPassword: string;
}): Promise<string> {
  const result = await adminClient.mutate<{ resetPassword: string }>({
    mutation: RESET_PASSWORD,
    variables: input,
  });
  return result.data?.resetPassword ?? "Password reset failed";
}
