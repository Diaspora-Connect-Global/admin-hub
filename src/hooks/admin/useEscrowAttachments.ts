import { useQuery } from "@apollo/client/react";
import {
  GET_ESCROW_ATTACHMENTS,
  type EscrowAttachment,
  type EscrowAttachmentListResponse,
} from "@/services/networks/graphql/admin";

export type { EscrowAttachment, EscrowAttachmentListResponse };

export function useGetEscrowAttachments(
  escrowId: string | null,
  limit: number = 20,
) {
  return useQuery<{ getEscrowAttachments: EscrowAttachmentListResponse }>(
    GET_ESCROW_ATTACHMENTS,
    {
      variables: {
        escrowId: escrowId ?? "",
        limit,
        offset: 0,
      },
      skip: !escrowId,
    },
  );
}
