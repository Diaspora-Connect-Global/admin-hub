import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_PLATFORM_SETTINGS,
  GET_PLATFORM_SETTING,
  SET_PLATFORM_SETTING,
  SET_BATCH_PLATFORM_SETTINGS,
  type PlatformSetting,
  type SetPlatformSettingInput,
  type SetBatchPlatformSettingsInput,
} from "@/services/networks/graphql/admin";

export type { PlatformSetting, SetPlatformSettingInput, SetBatchPlatformSettingsInput };

export function useGetPlatformSettings(category?: string) {
  return useQuery<{ getPlatformSettings: PlatformSetting[] }>(
    GET_PLATFORM_SETTINGS,
    { variables: { category: category ?? undefined } }
  );
}

export function useGetPlatformSetting(key: string) {
  const { data, loading, error } = useQuery<{ getPlatformSetting: PlatformSetting }>(
    GET_PLATFORM_SETTING,
    { variables: { key }, skip: !key }
  );
  return { setting: data?.getPlatformSetting, loading, error };
}

export function useSetPlatformSetting() {
  return useMutation<
    { setPlatformSetting: PlatformSetting },
    { input: SetPlatformSettingInput }
  >(SET_PLATFORM_SETTING);
}

export function useSetBatchPlatformSettings() {
  return useMutation<
    { setBatchPlatformSettings: PlatformSetting[] },
    { input: SetBatchPlatformSettingsInput }
  >(SET_BATCH_PLATFORM_SETTINGS);
}
