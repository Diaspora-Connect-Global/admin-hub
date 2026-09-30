import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_ADMIN_OTP_SETTINGS,
  UPDATE_OTP_SETTINGS,
  type OtpSettings,
  type OtpChannelPolicy,
  type OtpChannelMode,
  type UpdateOtpSettingsInput,
} from "@/services/networks/graphql/admin";

export type { OtpSettings, OtpChannelPolicy, OtpChannelMode, UpdateOtpSettingsInput };

/** Per-country OTP delivery policy (EMAIL / SMS). System-admin only. */
export function useAdminOtpSettings() {
  return useQuery<{ adminOtpSettings: OtpSettings }>(GET_ADMIN_OTP_SETTINGS);
}

export function useUpdateOtpSettings() {
  return useMutation<
    { updateOtpSettings: OtpSettings },
    { input: UpdateOtpSettingsInput }
  >(UPDATE_OTP_SETTINGS, {
    refetchQueries: [{ query: GET_ADMIN_OTP_SETTINGS }],
  });
}
