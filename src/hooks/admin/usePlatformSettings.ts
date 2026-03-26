import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_PLATFORM_SETTINGS,
  SET_PLATFORM_SETTING,
  type PlatformSetting,
  type SetPlatformSettingInput,
} from "@/services/networks/graphql/admin";

export type { PlatformSetting, SetPlatformSettingInput };

export function useGetPlatformSettings(category?: string) {
  return useQuery<{ getPlatformSettings: PlatformSetting[] }>(
    GET_PLATFORM_SETTINGS,
    { variables: { category: category ?? undefined } }
  );
}

export function useSetPlatformSetting() {
  return useMutation<
    { setPlatformSetting: PlatformSetting },
    { input: SetPlatformSettingInput }
  >(SET_PLATFORM_SETTING);
}
