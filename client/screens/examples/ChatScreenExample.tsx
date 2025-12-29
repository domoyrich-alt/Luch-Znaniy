/**
 * ПРИМЕР ИСПОЛЬЗОВАНИЯ АРХИТЕКТУРЫ ЧАТА
 * 
 * Демонстрирует интеграцию классов Chat, Message, User с React Native компонентами
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { useChat, useTyping, useMessages } from '@/hooks/useChat';
import { Message as MessageModel } from '@/models';

// Цвета
const COLORS = {
  background: '#000000',
  cardBg: '#1C1C1E',
  inputBg: '#2C2C2E',
  primary: '#3390EC',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  messageSent: '#3390EC',
  messageReceived: '#2C2C2E',
};

interface ChatScreenExampleProps {
  chatId: string;
  recipientName: string;
}

/**
 * A. КОНТЕЙНЕР ЧАТА
 * Главный блок с списком сообщений и полем ввода
 */
export default function ChatScreenExample({ chatId, recipientName }: ChatScreenExampleProps) {
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');

  // Хуки для работы с чатом
  const { chat, messages, loading, hasMore, loadMore, sendMessage, deleteMessage } = useChat(chatId);
  const { isTyping, getTypingText, sendTyping } = useTyping(chatId);
  const { newMessageCount, resetNewMessageCount } = useMessages(chatId);

  // Автоскролл при новых сообщениях
  useEffect(() => {
    if (newMessageCount > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
      resetNewMessageCount();
    }
  }, [newMessageCount]);

  // Обработка отправки
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !currentUser) return;

    const text = inputText.trim();
    setInputText('');

    try {
      await sendMessage(text);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [inputText, sendMessage, currentUser]);

  // Обработка ввода текста
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    sendTyping(); // Отправляем индикатор печатания
  }, [sendTyping]);

  // Загрузка старых сообщений при скролле вверх
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  /**
   * B. СПИСОК СООБЩЕНИЙ (MessageList)
   */
  const renderMessage = useCallback(({ item, index }: { item: MessageModel; index: number }) => {
    const isMine = item.senderId === String(currentUser?.id);
    const showAvatar = !isMine && (
      index === 0 || messages[index - 1]?.senderId !== item.senderId
    );

    return (
      <MessageItem
        message={item}
        isMine={isMine}
        showAvatar={showAvatar}
        onDelete={() => deleteMessage(item.messageId)}
      />
    );
  }, [currentUser?.id, messages, deleteMessage]);

  const keyExtractor = useCallback((item: MessageModel) => item.messageId, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 56}
    >
      {/* Заголовок */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <ThemedText style={styles.headerTitle}>{recipientName}</ThemedText>
        {isTyping && (
          <Animated.View entering={FadeIn}>
            <ThemedText style={styles.typingText}>{getTypingText()}</ThemedText>
          </Animated.View>
        )}
      </View>

      {/* Список сообщений */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        inverted={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={loading ? <ActivityIndicator color={COLORS.primary} /> : null}
        showsVerticalScrollIndicator={false}
      />

      {/* C. ПОЛЕ ВВОДА (InputBar) */}
      <InputBar
        value={inputText}
        onChangeText={handleTextChange}
        onSend={handleSend}
        bottomInset={insets.bottom}
      />
    </KeyboardAvoidingView>
  );
}

/**
 * MessageItem - компонент отдельного сообщения
 */
interface MessageItemProps {
  message: MessageModel;
  isMine: boolean;
  showAvatar: boolean;
  onDelete: () => void;
}

function MessageItem({ message, isMine, showAvatar, onDelete }: MessageItemProps) {
  // Отображаем удалённые сообщения по-другому
  if (message.isDeleted) {
    return (
      <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
        <View style={[styles.messageBubble, styles.deletedMessage]}>
          <ThemedText style={styles.deletedText}>🗑 Сообщение удалено</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      entering={SlideInUp.duration(200)}
      style={[styles.messageRow, isMine && styles.messageRowMine]}
    >
      {/* Аватар отправителя */}
      {showAvatar && !isMine && (
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>
            {message.senderName?.charAt(0) || '?'}
          </ThemedText>
        </View>
      )}

      {/* Баббл сообщения */}
      <Pressable
        style={[
          styles.messageBubble,
          isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
        ]}
        onLongPress={onDelete}
        delayLongPress={500}
      >
        {/* Имя отправителя (для групповых чатов) */}
        {showAvatar && !isMine && (
          <ThemedText style={styles.senderName}>{message.senderName}</ThemedText>
        )}

        {/* Медиа контент */}
        {message.media && (
          <View style={styles.mediaContainer}>
            {message.media.type === 'image' && (
              <ThemedText>📷 Фото</ThemedText>
            )}
            {message.media.type === 'video' && (
              <ThemedText>🎬 Видео</ThemedText>
            )}
            {message.media.type === 'audio' && (
              <ThemedText>🎵 Голосовое</ThemedText>
            )}
          </View>
        )}

        {/* Текст сообщения */}
        {message.text && (
          <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        )}

        {/* Время и статус */}
        <View style={styles.messageFooter}>
          <ThemedText style={styles.messageTime}>{message.getTimeString()}</ThemedText>
          
          {isMine && (
            <View style={styles.statusIcon}>
              {message.status === 'sending' && (
                <Feather name="clock" size={12} color={COLORS.textSecondary} />
              )}
              {message.status === 'sent' && (
                <Feather name="check" size={12} color={COLORS.textSecondary} />
              )}
              {message.status === 'delivered' && (
                <Feather name="check-circle" size={12} color={COLORS.textSecondary} />
              )}
              {message.status === 'read' && (
                <Feather name="check-circle" size={12} color={COLORS.primary} />
              )}
            </View>
          )}

          {message.isEdited && (
            <ThemedText style={styles.editedText}>изм.</ThemedText>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * InputBar - поле ввода с кнопками
 */
interface InputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  bottomInset: number;
}

function InputBar({ value, onChangeText, onSend, bottomInset }: InputBarProps) {
  const hasText = value.trim().length > 0;

  return (
    <View style={[styles.inputBar, { paddingBottom: Math.max(bottomInset, 8) }]}>
      {/* Кнопка вложений */}
      <Pressable style={styles.attachButton}>
        <Feather name="paperclip" size={22} color={COLORS.textSecondary} />
      </Pressable>

      {/* Текстовое поле */}
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="Сообщение..."
        placeholderTextColor={COLORS.textSecondary}
        multiline
        maxLength={4096}
      />

      {/* Кнопка отправки */}
      {hasText ? (
        <Pressable style={styles.sendButton} onPress={onSend}>
          <Feather name="send" size={22} color={COLORS.primary} />
        </Pressable>
      ) : (
        <Pressable style={styles.micButton}>
          <Feather name="mic" size={22} color={COLORS.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

// ==================== СТИЛИ ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBg,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 12,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 16,
  },
  messageBubbleMine: {
    backgroundColor: COLORS.messageSent,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.messageReceived,
    borderBottomLeftRadius: 4,
  },
  deletedMessage: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.cardBg,
    borderStyle: 'dashed',
  },
  deletedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  mediaContainer: {
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  statusIcon: {
    marginLeft: 2,
  },
  editedText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBg,
  },
  attachButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
    maxHeight: 100,
    marginHorizontal: 4,
  },
  sendButton: {
    padding: 8,
  },
  micButton: {
    padding: 8,
  },
});
