import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_BROADCAST_CAMPAIGNS,
  SEND_BROADCAST,
  type BroadcastCampaign,
  type SendBroadcastInput,
} from "@/services/networks/graphql/admin";

export type { BroadcastCampaign, SendBroadcastInput };

export function useGetBroadcastCampaigns(options: { page?: number; limit?: number } = {}) {
  return useQuery<{ getBroadcastCampaigns: { campaigns: BroadcastCampaign[]; total: number } }>(
    GET_BROADCAST_CAMPAIGNS,
    {
      variables: {
        page: options.page ?? 1,
        limit: options.limit ?? 20,
      },
    }
  );
}

export function useSendBroadcast() {
  return useMutation<
    { sendBroadcast: BroadcastCampaign },
    { input: SendBroadcastInput }
  >(SEND_BROADCAST, {
    refetchQueries: [{ query: GET_BROADCAST_CAMPAIGNS, variables: { page: 1, limit: 20 } }],
  });
}
