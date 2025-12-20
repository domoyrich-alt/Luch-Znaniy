import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { ReactionPicker } from '@/components/chat/ReactionPicker';
import { MediaPicker } from '@/components/chat/MediaPicker';
import { MessageContextMenu } from '@/components/chat/MessageContextMenu';
import { useTheme } from '@/hooks/useTheme';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import type { Message } from '@/types/chat';

type PrivateChatRouteParams = {
  PrivateChat: {
    chatId: number;
  };
};

export default function PrivateChatScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<RouteProp<PrivateChatRouteParams, 'PrivateChat'>>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const flatListRef = useRef<FlatList>(null);

  const chatId = route.params?.chatId;
  const { messages, isLoadingMessages, sendMessage, editMessage, deleteMessage, addReaction, pinMessage, isSending } =
    useChat(chatId);

  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!messageText.trim() || !user) return;

    if (editingMessage) {
      // Редактирование сообщения
      editMessage({ messageId: editingMessage.id, text: messageText.trim() });
      setEditingMessage(null);
    } else {
      // Отправка нового сообщения
      sendMessage({
        chatId,
        text: messageText.trim(),
        replyTo: replyTo?.id,
      });
      setReplyTo(null);
    }
    setMessageText('');
  };

  const handleMessageLongPress = (message: Message) => {
    setSelectedMessage(message);
    setShowContextMenu(true);
  };

  const handleReply = () => {
    if (selectedMessage) {
      setReplyTo(selectedMessage);
    }
  };

  const handleEdit = () => {
    if (selectedMessage) {
      setEditingMessage(selectedMessage);
      setMessageText(selectedMessage.text || '');
    }
  };

  const handleDelete = () => {
    if (!selectedMessage) return;

    Alert.alert('Удалить сообщение', 'Вы уверены, что хотите удалить это сообщение?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить для себя',
        onPress: () => deleteMessage({ messageId: selectedMessage.id, forEveryone: false }),
      },
      {
        text: 'Удалить для всех',
        style: 'destructive',
        onPress: () => deleteMessage({ messageId: selectedMessage.id, forEveryone: true }),
      },
    ]);
  };

  const handlePin = () => {
    if (selectedMessage) {
      pinMessage(selectedMessage.id);
    }
  };

  const handleReaction = (emoji: string) => {
    if (selectedMessage) {
      addReaction({ messageId: selectedMessage.id, emoji });
    }
  };

  const handleCopy = () => {
    if (selectedMessage?.text) {
      // В реальном приложении здесь будет Clipboard.setString
      console.log('Скопировано:', selectedMessage.text);
      Alert.alert('Скопировано', 'Текст сообщения скопирован в буфер обмена');
    }
  };

  const handleForward = () => {
    if (selectedMessage) {
      // Переход к экрану выбора чата для пересылки
      console.log('Переслать сообщение:', selectedMessage.id);
    }
  };

  const handleChatInfo = () => {
    navigation.navigate('ChatInfo', { chatId });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        onLongPress={() => handleMessageLongPress(item)}
        onReactionPress={(emoji) => addReaction({ messageId: item.id, emoji })}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Хедер с информацией о чате */}
      <View style={[styles.header, { backgroundColor: theme.backgroundDefault, paddingTop: insets.top }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <Pressable onPress={handleChatInfo} style={styles.headerContent}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
            <Feather name="user" size={20} color={theme.primary} />
          </View>
          <View style={styles.headerInfo}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              Чат
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              в сети
            </ThemedText>
          </View>
        </Pressable>
        <Pressable onPress={handleChatInfo} style={styles.iconButton}>
          <Feather name="more-vertical" size={24} color={theme.text} />
        </Pressable>
      </View>

      {/* Список сообщений */}
      {isLoadingMessages ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="message-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Нет сообщений
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Начните общение
          </ThemedText>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Превью ответа */}
      {replyTo && <ReplyPreview message={replyTo} onCancel={() => setReplyTo(null)} />}

      {/* Поле ввода */}
      <View
        style={[
          styles.inputContainer,
          { paddingBottom: insets.bottom + Spacing.sm, backgroundColor: theme.backgroundDefault },
        ]}
      >
        <Pressable onPress={() => setShowMediaPicker(true)} style={styles.attachButton}>
          <Feather name="paperclip" size={24} color={theme.textSecondary} />
        </Pressable>
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
          placeholder={editingMessage ? 'Редактировать сообщение...' : 'Написать сообщение...'}
          placeholderTextColor={theme.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        {messageText.trim() ? (
          <Pressable
            onPress={handleSend}
            disabled={isSending}
            style={[styles.sendButton, { backgroundColor: Colors.light.primary }]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="send" size={20} color="#FFFFFF" />
            )}
          </Pressable>
        ) : (
          <Pressable style={styles.sendButton}>
            <Feather name="mic" size={24} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Контекстное меню */}
      <MessageContextMenu
        visible={showContextMenu}
        onClose={() => {
          setShowContextMenu(false);
          setSelectedMessage(null);
        }}
        onReply={handleReply}
        onForward={handleForward}
        onCopy={handleCopy}
        onEdit={selectedMessage?.senderId === user?.id ? handleEdit : undefined}
        onDelete={handleDelete}
        onPin={handlePin}
        onReact={() => setShowReactionPicker(true)}
        isOwnMessage={selectedMessage?.senderId === user?.id || false}
      />

      {/* Выбор реакции */}
      <ReactionPicker
        visible={showReactionPicker}
        onClose={() => setShowReactionPicker(false)}
        onSelectReaction={handleReaction}
      />

      {/* Выбор медиа */}
      <MediaPicker
        visible={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelectCamera={() => console.log('Камера')}
        onSelectGallery={() => console.log('Галерея')}
        onSelectFile={() => console.log('Файл')}
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
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'flex-end',
  },
  attachButton: {
    padding: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
