import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/query-client';
import type { Chat, Message } from '@/types/chat';

export function useChat(chatId?: number) {
  const queryClient = useQueryClient();

  // Получение списка чатов
  const { data: chats = [], isLoading: isLoadingChats } = useQuery<Chat[]>({
    queryKey: ['/api/chats'],
    refetchInterval: 10000, // Обновление каждые 10 секунд
  });

  // Получение сообщений чата
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/chats', chatId, 'messages'],
    enabled: !!chatId,
    refetchInterval: 5000, // Обновление каждые 5 секунд
  });

  // Отправка сообщения
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, text, replyTo }: { chatId: number; text: string; replyTo?: number }) => {
      return apiRequest(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text, replyToId: replyTo }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', variables.chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
  });

  // Редактирование сообщения
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, text }: { messageId: number; text: string }) => {
      return apiRequest(`/api/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ text }),
      });
    },
    onSuccess: (_, variables) => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      }
    },
  });

  // Удаление сообщения
  const deleteMessageMutation = useMutation({
    mutationFn: async ({ messageId, forEveryone }: { messageId: number; forEveryone: boolean }) => {
      return apiRequest(`/api/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ forEveryone }),
      });
    },
    onSuccess: () => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      }
    },
  });

  // Добавление реакции
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: number; emoji: string }) => {
      return apiRequest(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
    },
    onSuccess: () => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      }
    },
  });

  // Закрепление сообщения
  const pinMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest(`/api/messages/${messageId}/pin`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId, 'messages'] });
      }
    },
  });

  // Закрепление чата
  const pinChatMutation = useMutation({
    mutationFn: async (chatId: number) => {
      return apiRequest(`/api/chats/${chatId}/pin`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
  });

  // Отключение уведомлений чата
  const muteChatMutation = useMutation({
    mutationFn: async ({ chatId, muted }: { chatId: number; muted: boolean }) => {
      return apiRequest(`/api/chats/${chatId}/mute`, {
        method: 'POST',
        body: JSON.stringify({ muted }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
    },
  });

  return {
    chats,
    messages,
    isLoadingChats,
    isLoadingMessages,
    sendMessage: sendMessageMutation.mutate,
    editMessage: editMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    addReaction: addReactionMutation.mutate,
    pinMessage: pinMessageMutation.mutate,
    pinChat: pinChatMutation.mutate,
    muteChat: muteChatMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
}
