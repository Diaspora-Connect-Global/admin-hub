import { useQuery } from "@apollo/client/react";
import {
  GET_CHAT_VOLUME_ANALYTICS,
  type ChatVolumeAnalyticsData,
  type ChatVolumeDataPoint,
  type ActiveChatStat,
} from "@/services/networks/graphql/admin";

export type { ChatVolumeAnalyticsData, ChatVolumeDataPoint, ActiveChatStat };

export function useGetChatVolumeAnalytics(period?: string) {
  return useQuery<{ getChatVolumeAnalytics: ChatVolumeAnalyticsData }>(
    GET_CHAT_VOLUME_ANALYTICS,
    {
      variables: { period: period ?? "last_7_days" },
    }
  );
}
