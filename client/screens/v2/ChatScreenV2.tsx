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
  
  // Модальные окна
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  
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
    }
  }, [chatId, user?.id]);

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
        // Отправка текста
        const msg = await ChatService.sendMessage(chatId, user.id, messageText);
        
        const newMessage: Message = {
          id: msg.id,
          text: msg.message,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          isRead: msg.isRead,
        };

        setMessages(prev => [...prev, newMessage]);
      }
      
      setMessageText('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
      console.error(error);
    } finally {
      setSending(false);
    }
  }, [messageText, mediaPreview, chatId, user?.id]);

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
  }, []);

  // Нажатие на изображение
  const handleImagePress = useCallback((url: string) => {
    setSelectedImageUrl(url);
    setImageViewerVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Рендер сообщения
  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isOwn={item.senderId === user?.id}
      onImagePress={handleImagePress}
    />
  ), [user?.id, handleImagePress]);

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
    backgroundColor: '#0F0F0F',  // Тёмный фон как в Telegram
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0F0F0F',  // Тёмный фон
    flexGrow: 1,
  },
});
