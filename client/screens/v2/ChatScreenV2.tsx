/**
 * CHAT SCREEN V2
 * Экран чата с новой архитектурой
 * 
 * Структура:
 * - ChatHeader: верхняя панель с аватаром и кнопками
 * - MessageList: список сообщений
 * - ChatInput: поле ввода с вложениями
 * - AttachMenu: меню скрепки
 * - EmojiPicker: клавиатура смайликов
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/context/AuthContext';
import { useStars } from '@/context/StarsContext';
import ChatService, { PrivateMessage } from '@/services/ChatService';
import ImageViewer from '@/components/ImageViewer';
import { wsClient } from '@/lib/websocket';

import {
  ChatHeader,
  MessageBubble,
  ChatInput,
  AttachMenu,
  EmojiPicker,
  TelegramDarkColors as colors,
  TelegramSizes as sizes,
  type Message,
  type AttachOption,
} from '@/components/chat/v2';
import { TypingIndicator } from '@/components/chat/v2/TypingIndicator';
import { ReactionPicker } from '@/components/chat/v2/ReactionPicker';
import GiftModal from '@/components/chat/GiftModal';

// ======================
// ТИПЫ
// ======================
interface ChatParams {
  chatId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  isOnline?: boolean;
}

// ======================
// MAIN SCREEN
// ======================
export default function ChatScreenV2() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { spendStars } = useStars();

  const params = route.params as ChatParams;
  const chatId = params?.chatId;
  const otherUserId = params?.otherUserId;
  const otherUserName = params?.otherUserName || 'Чат';
  const otherUserAvatar = params?.otherUserAvatar;
  const isOnline = params?.isOnline ?? false;

  // Состояние
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Модальные окна
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  
  // Typing indicator
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Reaction picker state
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [reactionTargetMessage, setReactionTargetMessage] = useState<Message | null>(null);
  
  // Превью
  const [mediaPreview, setMediaPreview] = useState<{
    uri: string;
    type: 'photo' | 'video' | 'file';
    name?: string;
  } | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  // Загрузка сообщений
  useEffect(() => {
    if (chatId && user?.id) {
      loadMessages();
      ChatService.markMessagesAsRead(chatId, user.id).catch(console.error);
      
      // Подключаем WebSocket для real-time обновлений
      wsClient.connect(user.id, [chatId.toString()]);
    }
  }, [chatId, user?.id]);

  // Подписка на WebSocket сообщения
  useEffect(() => {
    if (!chatId || !user?.id) return;

    // Обработчик входящих сообщений
    const handleNewMessage = (wsMessage: any) => {
      const msgData = wsMessage.payload;
      
      // Проверяем, что сообщение для этого чата и не от нас
      if (msgData.chatId === chatId && msgData.senderId !== user.id) {
        const newMessage: Message = {
          id: msgData.id,
          text: msgData.message,
          senderId: msgData.senderId,
          createdAt: msgData.createdAt,
          isRead: false,
          mediaUrl: msgData.mediaUrl,
          mediaType: msgData.mediaType,
          isGift: msgData.message?.startsWith('🎁 Подарок:'),
        };
        
        setMessages(prev => {
          // Проверяем, нет ли уже этого сообщения
          if (prev.some(m => m.id === msgData.id)) return prev;
          return [...prev, newMessage];
        });
        
        // Отмечаем как прочитанное
        ChatService.markMessagesAsRead(chatId, user.id).catch(console.error);
        
        // Haptic feedback
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        // Скролл вниз
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    // Обработчик прочтения сообщений
    const handleMessageRead = (wsMessage: any) => {
      const { chatId: readChatId, userId: readUserId } = wsMessage.payload;
      
      if (readChatId === chatId && readUserId !== user.id) {
        // Отмечаем все наши сообщения как прочитанные
        setMessages(prev => prev.map(msg => 
          msg.senderId === user.id ? { ...msg, isRead: true } : msg
        ));
      }
    };

    wsClient.on('message', handleNewMessage);
    wsClient.on('message_read', handleMessageRead);

    // Typing indicator handler
    const handleTyping = (wsMessage: any) => {
      const { chatId: typingChatId, userId: typingUserId, isTyping } = wsMessage.payload;
      if (typingChatId === chatId && typingUserId === otherUserId) {
        setIsOtherTyping(isTyping);
      }
    };

    // Message reaction handler
    const handleReaction = (wsMessage: any) => {
      const { messageId, emoji, action, userId: reactionUserId } = wsMessage.payload;
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;
        
        const reactions = [...(msg.reactions || [])];
        const existingIndex = reactions.findIndex(r => r.emoji === emoji);
        
        if (action === 'add') {
          if (existingIndex >= 0) {
            reactions[existingIndex] = {
              ...reactions[existingIndex],
              count: reactions[existingIndex].count + 1,
              users: [...reactions[existingIndex].users, reactionUserId],
            };
          } else {
            reactions.push({ emoji, count: 1, users: [reactionUserId] });
          }
        } else if (action === 'remove' && existingIndex >= 0) {
          reactions[existingIndex] = {
            ...reactions[existingIndex],
            count: reactions[existingIndex].count - 1,
            users: reactions[existingIndex].users.filter((id: number) => id !== reactionUserId),
          };
          if (reactions[existingIndex].count === 0) {
            reactions.splice(existingIndex, 1);
          }
        }
        
        return { ...msg, reactions };
      }));
    };

    // Message edited handler
    const handleMessageEdited = (wsMessage: any) => {
      const { messageId, newMessage, editedAt } = wsMessage.payload;
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, text: newMessage, isEdited: true } : msg
      ));
    };

    // Message deleted handler
    const handleMessageDeleted = (wsMessage: any) => {
      const { messageId, forAll } = wsMessage.payload;
      if (forAll) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    };

    wsClient.on('typing', handleTyping);
    wsClient.on('message_reaction', handleReaction);
    wsClient.on('message_edited', handleMessageEdited);
    wsClient.on('message_deleted', handleMessageDeleted);

    return () => {
      wsClient.off('message', handleNewMessage);
      wsClient.off('message_read', handleMessageRead);
      wsClient.off('typing', handleTyping);
      wsClient.off('message_reaction', handleReaction);
      wsClient.off('message_edited', handleMessageEdited);
      wsClient.off('message_deleted', handleMessageDeleted);
    };
  }, [chatId, user?.id, otherUserId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      if (chatId) {
        const msgs = await ChatService.getChatMessages(chatId, 100);
        
        // Преобразуем в формат Message
        const formattedMessages: Message[] = msgs.map(msg => ({
          id: msg.id,
          text: msg.message,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          isRead: msg.isRead,
          mediaUrl: msg.mediaUrl,
          mediaType: msg.mediaType as any,
          isGift: msg.message?.startsWith('🎁 Подарок:'),
          reactions: (msg as any).reactions || [],
          isEdited: (msg as any).isEdited,
          replyTo: (msg as any).replyTo ? {
            id: (msg as any).replyTo.id,
            text: (msg as any).replyTo.message || '📎 Медиа',
            senderName: (msg as any).replyTo.senderId === user?.id ? 'Вы' : otherUserName,
          } : undefined,
        }));
        
        setMessages(formattedMessages);
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить сообщения');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Отправка сообщения
  const handleSend = useCallback(async () => {
    if ((!messageText.trim() && !mediaPreview) || !chatId || !user?.id) return;

    setSending(true);
    try {
      if (mediaPreview) {
        // Отправка медиа
        const fileName = mediaPreview.uri.split('/').pop() || 'file';
        const { fileUrl, fileSize } = await ChatService.uploadFile(
          mediaPreview.uri,
          fileName
        );

        const msg = await ChatService.sendMediaMessage(
          chatId,
          user.id,
          fileUrl,
          mediaPreview.type,
          fileName,
          fileSize
        );

        const newMessage: Message = {
          id: msg.id,
          text: msg.message,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          isRead: msg.isRead,
          mediaUrl: msg.mediaUrl,
          mediaType: msg.mediaType as any,
        };

        setMessages(prev => [...prev, newMessage]);
        setMediaPreview(null);
      } else {
        // Отправка текста (с возможным reply)
        let msg;
        if (replyingTo) {
          // Send with reply using new API
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || ''}/api/chats/${chatId}/messages/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              senderId: user.id,
              message: messageText,
              replyToId: replyingTo.id,
              senderName: user.firstName || 'User',
            }),
          });
          msg = await response.json();
        } else {
          msg = await ChatService.sendMessage(chatId, user.id, messageText);
        }
        
        const newMessage: Message = {
          id: msg.id,
          text: msg.message,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          isRead: msg.isRead,
          replyTo: msg.replyTo ? {
            id: msg.replyTo.id,
            text: msg.replyTo.message || '📎 Медиа',
            senderName: msg.replyTo.senderId === user.id ? 'Вы' : otherUserName,
          } : undefined,
        };

        setMessages(prev => [...prev, newMessage]);
      }
      
      setMessageText('');
      setReplyingTo(null);  // Clear reply after sending
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
      console.error(error);
    } finally {
      setSending(false);
    }
  }, [messageText, mediaPreview, chatId, user?.id, replyingTo, otherUserName]);

  // Обработка вложений
  const handleAttachOption = useCallback(async (option: AttachOption) => {
    switch (option) {
      case 'photo':
        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images as any,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

          if (!result.canceled && result.assets?.[0]) {
            setMediaPreview({
              uri: result.assets[0].uri,
              type: 'photo',
              name: result.assets[0].uri.split('/').pop(),
            });
          }
        } catch (error) {
          console.error('Ошибка выбора фото:', error);
        }
        break;

      case 'video':
        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos as any,
            allowsEditing: false,
          });

          if (!result.canceled && result.assets?.[0]) {
            setMediaPreview({
              uri: result.assets[0].uri,
              type: 'video',
              name: result.assets[0].uri.split('/').pop(),
            });
          }
        } catch (error) {
          console.error('Ошибка выбора видео:', error);
        }
        break;

      case 'gift':
        setGiftModalVisible(true);
        break;

      case 'location':
        Alert.alert('Место', 'Функция в разработке');
        break;

      case 'contact':
        Alert.alert('Контакт', 'Функция в разработке');
        break;

      case 'file':
        Alert.alert('Файл', 'Функция в разработке');
        break;
    }
  }, []);

  // Отправка подарка
  const handleSendGift = useCallback(async (gift: any, giftMessage: string) => {
    if (!chatId || !user?.id) return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const giftText = `🎁 Подарок: ${gift.emoji} ${gift.name}${giftMessage ? `\n💬 ${giftMessage}` : ''}`;
      
      const canSpend = await spendStars(gift.price, 'chat_gift', `Подарок в чате: ${gift.name}`);
      if (!canSpend) {
        Alert.alert('⭐ Недостаточно звёзд', `Нужно ${gift.price} ⭐`);
        return;
      }
      
      const msg = await ChatService.sendMessage(chatId, user.id, giftText);
      
      const newMessage: Message = {
        id: msg.id,
        text: msg.message,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
        isGift: true,
      };

      setMessages(prev => [...prev, newMessage]);
      setGiftModalVisible(false);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      Alert.alert('🎁 Подарок отправлен!', `${gift.emoji} ${gift.name} для ${otherUserName}`);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить подарок');
      console.error(error);
    }
  }, [chatId, user?.id, spendStars, otherUserName]);

  // Выбор эмодзи
  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessageText(prev => prev + emoji);
    // Обновляем позицию курсора на конец текста
    setCursorPosition(prev => prev + emoji.length);
  }, []);

  // Вставка эмодзи на позицию курсора
  const handleTextWithEmoji = useCallback((text: string, newCursorPosition: number) => {
    setMessageText(text);
    setCursorPosition(newCursorPosition);
  }, []);

  // Обработка изменения выделения/курсора
  const handleSelectionChange = useCallback((selection: { start: number; end: number }) => {
    setCursorPosition(selection.start);
  }, []);

  // Нажатие на изображение
  const handleImagePress = useCallback((url: string) => {
    setSelectedImageUrl(url);
    setImageViewerVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Handle reply swipe
  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Handle double tap for ❤️ reaction
  const handleDoubleTap = useCallback(async (message: Message) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || ''}/api/messages/${message.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, emoji: '❤️' }),
      });
      
      if (response.ok) {
        // Update locally immediately
        setMessages(prev => prev.map(msg => {
          if (msg.id !== message.id) return msg;
          const reactions = [...(msg.reactions || [])];
          const heartIndex = reactions.findIndex(r => r.emoji === '❤️');
          
          if (heartIndex >= 0) {
            if (!reactions[heartIndex].users.includes(user.id)) {
              reactions[heartIndex] = {
                ...reactions[heartIndex],
                count: reactions[heartIndex].count + 1,
                users: [...reactions[heartIndex].users, user.id],
              };
            }
          } else {
            reactions.push({ emoji: '❤️', count: 1, users: [user.id] });
          }
          
          return { ...msg, reactions };
        }));
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  }, [user?.id]);

  // Handle long press to show reaction picker
  const handleLongPress = useCallback((message: Message) => {
    setReactionTargetMessage(message);
    setReactionPickerVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Handle reaction selection from picker
  const handleReactionSelect = useCallback(async (emoji: string) => {
    if (!reactionTargetMessage || !user?.id) return;
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || ''}/api/messages/${reactionTargetMessage.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, emoji }),
      });
      
      if (response.ok) {
        // Update locally
        setMessages(prev => prev.map(msg => {
          if (msg.id !== reactionTargetMessage.id) return msg;
          const reactions = [...(msg.reactions || [])];
          const emojiIndex = reactions.findIndex(r => r.emoji === emoji);
          
          if (emojiIndex >= 0) {
            if (!reactions[emojiIndex].users.includes(user.id)) {
              reactions[emojiIndex] = {
                ...reactions[emojiIndex],
                count: reactions[emojiIndex].count + 1,
                users: [...reactions[emojiIndex].users, user.id],
              };
            }
          } else {
            reactions.push({ emoji, count: 1, users: [user.id] });
          }
          
          return { ...msg, reactions };
        }));
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
    
    setReactionPickerVisible(false);
    setReactionTargetMessage(null);
  }, [reactionTargetMessage, user?.id]);

  // Handle reaction tap (toggle own reaction)
  const handleReactionPress = useCallback(async (message: Message, emoji: string) => {
    if (!user?.id) return;
    
    const reaction = message.reactions?.find(r => r.emoji === emoji);
    const hasMyReaction = reaction?.users.includes(user.id);
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || ''}/api/messages/${message.id}/reactions`, {
        method: hasMyReaction ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, emoji }),
      });
      
      if (response.ok) {
        // Update locally
        setMessages(prev => prev.map(msg => {
          if (msg.id !== message.id) return msg;
          const reactions = [...(msg.reactions || [])];
          const emojiIndex = reactions.findIndex(r => r.emoji === emoji);
          
          if (hasMyReaction && emojiIndex >= 0) {
            reactions[emojiIndex] = {
              ...reactions[emojiIndex],
              count: reactions[emojiIndex].count - 1,
              users: reactions[emojiIndex].users.filter((id: number) => id !== user.id),
            };
            if (reactions[emojiIndex].count === 0) {
              reactions.splice(emojiIndex, 1);
            }
          } else if (!hasMyReaction) {
            if (emojiIndex >= 0) {
              reactions[emojiIndex] = {
                ...reactions[emojiIndex],
                count: reactions[emojiIndex].count + 1,
                users: [...reactions[emojiIndex].users, user.id],
              };
            } else {
              reactions.push({ emoji, count: 1, users: [user.id] });
            }
          }
          
          return { ...msg, reactions };
        }));
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  }, [user?.id]);

  // Рендер сообщения
  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isOwn={item.senderId === user?.id}
      onImagePress={handleImagePress}
      onReply={handleReply}
      onDoubleTap={handleDoubleTap}
      onLongPress={() => handleLongPress(item)}
      onReactionPress={handleReactionPress}
      currentUserId={user?.id}
    />
  ), [user?.id, handleImagePress, handleReply, handleDoubleTap, handleLongPress, handleReactionPress]);

  const keyExtractor = useCallback((item: Message) => item.id.toString(), []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={{ paddingTop: insets.top }}>
        <ChatHeader
          chatName={otherUserName}
          avatar={otherUserAvatar}
          isOnline={isOnline}
          onBackPress={() => navigation.goBack()}
          onAvatarPress={() => {
            // TODO: Открыть профиль пользователя
          }}
          onCallPress={() => Alert.alert('Звонок', 'Функция в разработке')}
          onVideoCallPress={() => Alert.alert('Видеозвонок', 'Функция в разработке')}
          onSearchPress={() => Alert.alert('Поиск', 'Функция в разработке')}
          onMenuPress={() => Alert.alert('Меню', 'Функция в разработке')}
        />
      </View>
      
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        inverted={false}
        onTouchStart={() => {
          if (reactionPickerVisible) {
            setReactionPickerVisible(false);
            setReactionTargetMessage(null);
          }
        }}
        ListFooterComponent={
          <TypingIndicator
            visible={isOtherTyping}
            userName={otherUserName}
          />
        }
      />
      
      {/* Input */}
      <ChatInput
        value={messageText}
        onChangeText={setMessageText}
        onSend={handleSend}
        onAttachPress={() => setAttachMenuVisible(true)}
        onEmojiPress={() => setEmojiPickerVisible(true)}
        mediaPreview={mediaPreview}
        onCancelMedia={() => setMediaPreview(null)}
        disabled={sending}
        bottomInset={insets.bottom}
        onSelectionChange={handleSelectionChange}
        replyTo={replyingTo ? {
          id: replyingTo.id,
          text: replyingTo.text || '📎 Медиа',
          senderName: replyingTo.senderId === user?.id ? 'Вы' : otherUserName,
        } : undefined}
        onCancelReply={() => setReplyingTo(null)}
      />
      
      {/* Attach Menu */}
      <AttachMenu
        visible={attachMenuVisible}
        onClose={() => setAttachMenuVisible(false)}
        onSelect={handleAttachOption}
      />
      
      {/* Emoji Picker */}
      <EmojiPicker
        visible={emojiPickerVisible}
        onClose={() => setEmojiPickerVisible(false)}
        onEmojiSelect={handleEmojiSelect}
        cursorPosition={cursorPosition}
        messageText={messageText}
        onTextWithEmoji={handleTextWithEmoji}
      />
      
      {/* Gift Modal */}
      <GiftModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        onSendGift={handleSendGift}
        userStars={0} // TODO: получить из контекста
        recipientName={otherUserName}
      />
      
      {/* Image Viewer */}
      <ImageViewer
        visible={imageViewerVisible}
        imageUrl={selectedImageUrl}
        onClose={() => setImageViewerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ======================
// СТИЛИ
// ======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,  // Тёмный фон как в Telegram
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.background,  // Тёмный фон
    flexGrow: 1,
  },
});
