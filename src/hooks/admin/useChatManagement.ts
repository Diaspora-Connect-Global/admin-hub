import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_FLAGGED_CONVERSATIONS,
  GET_CHAT_SETTINGS,
  FLAG_CONVERSATION,
  REVIEW_CONVERSATION,
  UPDATE_CHAT_SETTING,
  LIST_DM_CONVERSATIONS,
  LIST_GROUP_CONVERSATIONS,
  GET_CONVERSATION_MEMBERS,
  type FlaggedConversation,
  type ChatSetting,
  type AdminDMConversationItem,
  type AdminGroupConversationItem,
  type ConversationMemberItem,
  type AdminDMConversationsData,
  type AdminGroupConversationsData,
} from "@/services/networks/graphql/admin";

export type {
  FlaggedConversation,
  ChatSetting,
  AdminDMConversationItem,
  AdminGroupConversationItem,
  ConversationMemberItem,
};

export function useGetFlaggedConversations(options: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery<{ getFlaggedConversations: { conversations: FlaggedConversation[]; total: number } }>(
    GET_FLAGGED_CONVERSATIONS,
    {
      variables: {
        status: options.status ?? undefined,
        page: options.page ?? 1,
        limit: options.limit ?? 20,
      },
    }
  );
}

export function useGetChatSettings() {
  return useQuery<{ getChatSettings: ChatSetting[] }>(GET_CHAT_SETTINGS);
}

export function useFlagConversation() {
  return useMutation<
    { flagConversation: { success: boolean; message?: string } },
    { conversationId: string; reason: string }
  >(FLAG_CONVERSATION);
}

export function useReviewConversation() {
  return useMutation<
    { reviewConversation: { success: boolean; message?: string } },
    { id: string; newStatus: string }
  >(REVIEW_CONVERSATION, {
    refetchQueries: [{ query: GET_FLAGGED_CONVERSATIONS, variables: { page: 1, limit: 20 } }],
  });
}

export function useUpdateChatSetting() {
  return useMutation<
    { updateChatSetting: ChatSetting },
    { input: { key: string; value: string } }
  >(UPDATE_CHAT_SETTING, {
    refetchQueries: [{ query: GET_CHAT_SETTINGS }],
  });
}

export function useListDMConversations(options: {
  limit?: number;
  offset?: number;
  flagged?: boolean;
} = {}) {
  return useQuery<{ listDMConversations: AdminDMConversationsData }>(
    LIST_DM_CONVERSATIONS,
    {
      variables: {
        filters: {
          limit: options.limit ?? 50,
          offset: options.offset ?? 0,
          flagged: options.flagged,
        },
      },
    }
  );
}

export function useListGroupConversations(options: {
  limit?: number;
  offset?: number;
  flagged?: boolean;
} = {}) {
  return useQuery<{ listGroupConversations: AdminGroupConversationsData }>(
    LIST_GROUP_CONVERSATIONS,
    {
      variables: {
        filters: {
          limit: options.limit ?? 50,
          offset: options.offset ?? 0,
          flagged: options.flagged,
        },
      },
    }
  );
}
