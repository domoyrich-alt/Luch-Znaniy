import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import { MediaPicker } from '@/components/chat/MediaPicker';
import { MessageContextMenu } from '@/components/chat/MessageContextMenu';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { ChatMessage, MessageAction, MessageMedia } from '@/types/chat';
import { Spacing, BorderRadius } from '@/constants/theme';

type RouteParams = {
  PrivateChat: {
    chatId: string;
    chatName: string;
    isOnline?: boolean;
  };
};

// Моковые сообщения
const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    chatId: '1',
    senderId: 'other',
    senderName: 'Собеседник',
    type: 'text',
    text: 'Привет! Как дела?',
    timestamp: Date.now() - 1000 * 60 * 60,
    status: 'read',
    reactions: [{ emoji: '👍', userId: 'me', userName: 'Я' }],
  },
  {
    id: '2',
    chatId: '1',
    senderId: 'me',
    senderName: 'Я',
    type: 'text',
    text: 'Привет! Всё отлично, готовлюсь к контрольной 📚',
    timestamp: Date.now() - 1000 * 60 * 55,
    status: 'read',
    reactions: [],
  },
  {
    id: '3',
    chatId: '1',
    senderId: 'other',
    senderName: 'Собеседник',
    type: 'text',
    text: 'По какому предмету?',
    timestamp: Date.now() - 1000 * 60 * 50,
    status: 'read',
    reactions: [],
  },
  {
    id: '4',
    chatId: '1',
    senderId: 'me',
    senderName: 'Я',
    type: 'text',
    text: 'По математике. Завтра пишем!',
    timestamp: Date.now() - 1000 * 60 * 45,
    status: 'read',
    reactions: [
      { emoji: '💪', userId: 'other', userName: 'Собеседник' },
    ],
  },
  {
    id: '5',
    chatId: '1',
    senderId: 'other',
    senderName: 'Собеседник',
    type: 'text',
    text: 'Удачи! Уверен, ты справишься! Если нужна помощь - пиши',
    timestamp: Date.now() - 1000 * 60 * 40,
    status: 'read',
    reactions: [],
  },
];

export default function PrivateChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'PrivateChat'>>();
  const insets = useSafeAreaInsets();

  const { chatId, chatName, isOnline } = route.params;

  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Прокрутка вниз при новых сообщениях
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Симуляция "печатает..."
  const simulateTyping = useCallback(() => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    // Показываем что собеседник печатает после отправки
    typingTimeout.current = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }, 1000);
  }, []);

  // Отправка сообщения
  const handleSend = useCallback(() => {
    if (!inputText.trim() && !editingMessage) return;

    if (editingMessage) {
      // Редактирование
      setMessages(prev =>
        prev.map(msg =>
          msg.id === editingMessage.id
            ? { ...msg, text: inputText.trim(), isEdited: true }
            : msg
        )
      );
      setEditingMessage(null);
    } else {
      // Новое сообщение
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        chatId,
        senderId: String(user?.id || 'me'),
        senderName: (user as any)?.username || (user as any)?.name || 'Я',
        type: 'text',
        text: inputText.trim(),
        timestamp: Date.now(),
        status: 'sending',
        reactions: [],
        replyTo: replyingTo || undefined,
      };

      setMessages(prev => [...prev, newMessage]);
      setReplyingTo(null);

      // Симуляция отправки
      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
          )
        );
        setTimeout(() => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
            )
          );
          simulateTyping();
        }, 500);
      }, 300);
    }

    setInputText('');
    Keyboard.dismiss();
  }, [inputText, editingMessage, replyingTo, chatId, user, simulateTyping]);

  // Отправка голосового
  const handleVoiceSend = useCallback((duration: number) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      chatId,
      senderId: String(user?.id || 'me'),
      senderName: (user as any)?.username || (user as any)?.name || 'Я',
      type: 'voice',
      text: '',
      timestamp: Date.now(),
      status: 'sent',
      reactions: [],
      media: {
        type: 'audio',
        uri: 'voice_message.m4a',
        duration,
      },
    };

    setMessages(prev => [...prev, newMessage]);
    setShowVoiceRecorder(false);
  }, [chatId, user]);

  // Отправка медиа
  const handleMediaSelect = useCallback((media: MessageMedia) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      chatId,
      senderId: String(user?.id || 'me'),
      senderName: (user as any)?.username || (user as any)?.name || 'Я',
      type: media.type === 'image' ? 'image' : 'file',
      text: '',
      timestamp: Date.now(),
      status: 'sent',
      reactions: [],
      media,
    };

    setMessages(prev => [...prev, newMessage]);
    setShowMediaPicker(false);
  }, [chatId, user]);

  // Реакция на сообщение
  const handleReaction = useCallback((emoji: string) => {
    if (!selectedMessage) return;

    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== selectedMessage.id) return msg;

        const userId = String(user?.id || 'me');
        const existingReaction = msg.reactions.find(r => r.userId === userId);
        if (existingReaction) {
          // Удаляем или меняем реакцию
          if (existingReaction.emoji === emoji) {
            return {
              ...msg,
              reactions: msg.reactions.filter(r => r.userId !== userId),
            };
          }
          return {
            ...msg,
            reactions: msg.reactions.map(r =>
              r.userId === userId ? { ...r, emoji } : r
            ),
          };
        }
        // Добавляем новую реакцию
        return {
          ...msg,
          reactions: [...msg.reactions, { emoji, userId, userName: (user as any)?.username || (user as any)?.name || 'Я' }],
        };
      })
    );
    setShowReactionPicker(false);
    setSelectedMessage(null);
  }, [selectedMessage, user]);

  // Действия с сообщением
  const handleMessageAction = useCallback((action: MessageAction) => {
    if (!selectedMessage) return;

    switch (action) {
      case 'reply':
        setReplyingTo(selectedMessage);
        inputRef.current?.focus();
        break;
      case 'edit':
        setEditingMessage(selectedMessage);
        setInputText(selectedMessage.text);
        inputRef.current?.focus();
        break;
      case 'copy':
        // В реальном приложении - Clipboard.setString
        Alert.alert('Скопировано', selectedMessage.text);
        break;
      case 'forward':
        Alert.alert('Переслать', 'Выберите чат для пересылки');
        break;
      case 'delete':
        Alert.alert('Удалить сообщение?', '', [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: () => setMessages(prev => prev.filter(m => m.id !== selectedMessage.id)),
          },
        ]);
        break;
      case 'pin':
        setMessages(prev =>
          prev.map(m =>
            m.id === selectedMessage.id ? { ...m, isPinned: !m.isPinned } : m
          )
        );
        break;
    }
    setSelectedMessage(null);
    setShowContextMenu(false);
  }, [selectedMessage]);

  // Рендер сообщения
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const userId = String(user?.id || 'me');
    const isOwn = item.senderId === userId || item.senderId === 'me';
    const prevMessage = messages[index - 1];
    const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== item.senderId);

    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showAvatar={showAvatar}
        onLongPress={() => {
          setSelectedMessage(item);
          setShowContextMenu(true);
        }}
        onReactionPress={() => {
          setSelectedMessage(item);
          setShowReactionPicker(true);
        }}
        onReplyPress={() => {
          if (item.replyTo) {
            // Прокрутка к цитируемому сообщению
            const replyIndex = messages.findIndex(m => m.id === item.replyTo?.id);
            if (replyIndex >= 0) {
              flatListRef.current?.scrollToIndex({ index: replyIndex, animated: true });
            }
          }
        }}
      />
    );
  };

  // Хедер чата
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.backgroundDefault, paddingTop: insets.top }]}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>

      <Pressable
        style={styles.headerInfo}
        onPress={() => navigation.navigate('ChatInfo', { chatId, chatName })}
      >
        <View style={[styles.headerAvatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.headerAvatarText}>
            {chatName.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.headerTextContainer}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {chatName}
          </ThemedText>
          <ThemedText style={[styles.headerStatus, { color: isTyping ? theme.primary : theme.textSecondary }]}>
            {isTyping ? 'печатает...' : isOnline ? 'онлайн' : 'был(а) недавно'}
          </ThemedText>
        </View>
      </Pressable>

      <View style={styles.headerButtons}>
        <Pressable style={styles.headerButton} onPress={() => Alert.alert('Голосовой звонок')}>
          <Feather name="phone" size={20} color={theme.text} />
        </Pressable>
        <Pressable style={styles.headerButton} onPress={() => Alert.alert('Видеозвонок')}>
          <Feather name="video" size={20} color={theme.text} />
        </Pressable>
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.navigate('ChatInfo', { chatId, chatName })}
        >
          <Feather name="more-vertical" size={20} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );

  // Поле ввода
  const renderInputBar = () => (
    <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault, paddingBottom: insets.bottom + Spacing.xs }]}>
      {/* Превью ответа */}
      {replyingTo && (
        <ReplyPreview
          message={replyingTo}
          onCancel={() => setReplyingTo(null)}
        />
      )}

      {/* Индикатор редактирования */}
      {editingMessage && (
        <View style={[styles.editingBar, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="edit-2" size={16} color={theme.primary} />
          <ThemedText style={[styles.editingText, { color: theme.primary }]} numberOfLines={1}>
            Редактирование: {editingMessage.text}
          </ThemedText>
          <Pressable onPress={() => { setEditingMessage(null); setInputText(''); }}>
            <Feather name="x" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>
      )}

      <View style={styles.inputRow}>
        {/* Кнопка прикрепить */}
        <Pressable style={styles.inputButton} onPress={() => setShowMediaPicker(true)}>
          <Feather name="paperclip" size={22} color={theme.textSecondary} />
        </Pressable>

        {/* Поле ввода */}
        <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.text }]}
            placeholder="Сообщение..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={4096}
          />
          <Pressable style={styles.emojiButton} onPress={() => Alert.alert('Эмодзи')}>
            <Feather name="smile" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Кнопка отправки или голосового */}
        {inputText.trim() || editingMessage ? (
          <Pressable
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={handleSend}
          >
            <Feather name="send" size={20} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowVoiceRecorder(true)}
          >
            <Feather name="mic" size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          inverted={false}
        />

        {renderInputBar()}
      </KeyboardAvoidingView>

      {/* Модальные окна */}
      <ReactionPicker
        visible={showReactionPicker}
        onSelect={handleReaction}
        onClose={() => { setShowReactionPicker(false); setSelectedMessage(null); }}
      />

      <VoiceRecorder
        visible={showVoiceRecorder}
        onSend={handleVoiceSend}
        onCancel={() => setShowVoiceRecorder(false)}
      />

      <MediaPicker
        visible={showMediaPicker}
        onSelect={handleMediaSelect}
        onClose={() => setShowMediaPicker(false)}
      />

      <MessageContextMenu
        visible={showContextMenu}
        message={selectedMessage}
        isOwn={selectedMessage?.senderId === String(user?.id || 'me') || selectedMessage?.senderId === 'me'}
        onAction={handleMessageAction}
        onClose={() => { setShowContextMenu(false); setSelectedMessage(null); }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerTextContainer: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  editingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  editingText: {
    flex: 1,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  inputButton: {
    padding: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: 40,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
    maxHeight: 100,
  },
  emojiButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
