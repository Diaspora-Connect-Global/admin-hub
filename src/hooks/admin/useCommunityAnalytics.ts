import { useQuery } from "@apollo/client/react";
import {
  GET_COMMUNITY_ENGAGEMENT_STATS,
  GET_TOP_ASSOCIATIONS,
  type CommunityEngagementStatsData,
  type AssociationRankingData,
} from "@/services/networks/graphql/admin";

// ─── Community Engagement Stats ───────────────────────────────────────────────

interface GetCommunityEngagementStatsResponse {
  getCommunityEngagementStatsFull: CommunityEngagementStatsData;
}

export function useGetCommunityEngagementStats(
  period = "last_30_days",
) {
  return useQuery<GetCommunityEngagementStatsResponse>(
    GET_COMMUNITY_ENGAGEMENT_STATS,
    {
      variables: { period },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    },
  );
}

// ─── Top Associations ─────────────────────────────────────────────────────────

interface GetTopAssociationsResponse {
  getTopAssociations: AssociationRankingData;
}

export function useGetTopAssociations(limit = 10) {
  return useQuery<GetTopAssociationsResponse>(GET_TOP_ASSOCIATIONS, {
    variables: { limit },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
}
