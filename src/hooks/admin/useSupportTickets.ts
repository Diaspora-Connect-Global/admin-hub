import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_SUPPORT_TICKETS,
  GET_SUPPORT_TICKET,
  CREATE_SUPPORT_TICKET,
  UPDATE_SUPPORT_TICKET,
  REPLY_TO_SUPPORT_TICKET,
  DELETE_SUPPORT_TICKET,
  BULK_UPDATE_TICKET_STATUS,
  BULK_ASSIGN_TICKETS,
  type SupportTicket,
  type TicketMessage,
  type CreateSupportTicketInput,
  type UpdateSupportTicketInput,
  type BulkUpdateTicketStatusInput,
  type BulkAssignTicketsInput,
} from "@/services/networks/graphql/admin";

export type { SupportTicket, TicketMessage, CreateSupportTicketInput, UpdateSupportTicketInput, BulkUpdateTicketStatusInput, BulkAssignTicketsInput };

export function useGetSupportTickets(options: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery<{ getSupportTickets: { tickets: SupportTicket[]; total: number } }>(
    GET_SUPPORT_TICKETS,
    {
      variables: {
        status: options.status ?? undefined,
        page: options.page ?? 1,
        limit: options.limit ?? 20,
      },
    }
  );
}

export function useGetSupportTicket(ticketId: string | null) {
  return useQuery<{ getSupportTicket: SupportTicket }>(GET_SUPPORT_TICKET, {
    variables: { ticketId: ticketId ?? "" },
    skip: !ticketId,
  });
}

export function useCreateSupportTicket() {
  return useMutation<
    { createSupportTicket: Pick<SupportTicket, "id" | "subject" | "status" | "priority" | "category" | "createdAt"> },
    { input: CreateSupportTicketInput }
  >(CREATE_SUPPORT_TICKET, {
    refetchQueries: [{ query: GET_SUPPORT_TICKETS, variables: { page: 1, limit: 20 } }],
  });
}

export function useUpdateSupportTicket() {
  return useMutation<
    { updateSupportTicket: { success: boolean; message?: string } },
    { input: UpdateSupportTicketInput }
  >(UPDATE_SUPPORT_TICKET);
}

export function useReplyToSupportTicket() {
  return useMutation<
    { replyToSupportTicket: TicketMessage },
    { ticketId: string; message: string }
  >(REPLY_TO_SUPPORT_TICKET);
}

export function useDeleteSupportTicket() {
  return useMutation<
    { deleteSupportTicket: boolean },
    { ticketId: string }
  >(DELETE_SUPPORT_TICKET);
}

export function useBulkUpdateTicketStatus() {
  return useMutation<
    { bulkUpdateTicketStatus: boolean },
    BulkUpdateTicketStatusInput
  >(BULK_UPDATE_TICKET_STATUS);
}

export function useBulkAssignTickets() {
  return useMutation<
    { bulkAssignTickets: boolean },
    BulkAssignTicketsInput
  >(BULK_ASSIGN_TICKETS);
}
