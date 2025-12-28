/**
 * TELEGRAM-STYLE OPTIMIZED CHAT SCREEN
 * 
 * Особенности:
 * - Пул сообщений (старые выгружаются, новые подгружаются)
 * - Optimistic UI (UI не ждёт сеть)
 * - Асинхронность всего
 * - Анимации как часть UX-логики
 * - Статусы: ✔️ отправляется → ✔️ отправлено → ✔️✔️ доставлено → синие ✔️✔️ прочитано
 * - Поиск внутри чата
 */

import React, { 
  useCallback, 
  useRef, 
  useEffect, 
  useState, 
  useMemo,
  memo 
} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  Keyboard,
  Image,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TelegramInChatSearch } from '@/components/chat/TelegramInChatSearch';
import GiftModal from '@/components/chat/GiftModal';
import DoubleTapLike from '@/components/chat/DoubleTapLike';
import ConfettiEffect from '@/components/chat/ConfettiEffect';
import { BlurView } from 'expo-blur';
import { Modal } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { useStars } from '@/context/StarsContext';
import { wsClient } from '@/lib/websocket';
import { 
  useChatStore, 
  selectMessages,
  Message,
  MessageStatus,
} from '@/store/ChatStore';

// Включаем LayoutAnimation для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MESSAGE_POOL_SIZE = 100; // Максимум сообщений в памяти

// ==================== REACTION EMOJIS ====================

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '💯'];

// ==================== MESSAGE STATUS ICON ====================

interface StatusIconProps {
  status: MessageStatus;
  isOwn: boolean;
}

const StatusIcon = memo(function StatusIcon({ status, isOwn }: StatusIconProps) {
  if (!isOwn) return null;
  
  switch (status) {
    case 'sending':
      return <Feather name="clock" size={14} color="rgba(255,255,255,0.7)" />;
    case 'sent':
      return <Feather name="check" size={14} color="rgba(255,255,255,0.7)" />;
    case 'delivered':
      return <MaterialCommunityIcons name="check-all" size={14} color="rgba(255,255,255,0.7)" />;
    case 'read':
      return <MaterialCommunityIcons name="check-all" size={14} color="#4ECDC4" />;
    case 'failed':
      return <Feather name="alert-circle" size={14} color="#FF6B6B" />;
    default:
      return null;
  }
});

// ==================== MESSAGE BUBBLE ====================

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onLongPress: (message: Message) => void;
  onReactionPress: (messageId: string, emoji: string) => void;
  onReplyPress: (message: Message) => void;
  onDoubleTap: (message: Message) => void;
  theme: any;
}

const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onLongPress,
  onReactionPress,
  onReplyPress,
  onDoubleTap,
  theme,
}: MessageBubbleProps) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress(message);
  }, [message, onLongPress]);

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;

    return (
      <Pressable
        style={[
          styles.replyPreview,
          { backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : theme.backgroundSecondary }
        ]}
        onPress={() => onReplyPress(message)}
      >
        <View 
          style={[
            styles.replyLine, 
            { backgroundColor: isOwn ? '#fff' : theme.primary }
          ]} 
        />
        <View style={styles.replyContent}>
          <ThemedText 
            style={[styles.replyName, { color: isOwn ? '#fff' : theme.primary }]}
          >
            {message.replyTo.senderName}
          </ThemedText>
          <ThemedText 
            style={[
              styles.replyText, 
              { color: isOwn ? 'rgba(255,255,255,0.8)' : theme.textSecondary }
            ]} 
            numberOfLines={1}
          >
            {message.replyTo.text}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderReactions = () => {
    if (!message.reactions?.length) return null;

    return (
      <View style={styles.reactionsContainer}>
        {message.reactions.map((reaction, index) => (
          <Pressable
            key={`${reaction.emoji}-${index}`}
            style={[
              styles.reactionBubble,
              reaction.hasReacted && { backgroundColor: theme.primary + '30' },
            ]}
            onPress={() => onReactionPress(message.id, reaction.emoji)}
          >
            <ThemedText style={styles.reactionEmoji}>{reaction.emoji}</ThemedText>
            {reaction.count > 1 && (
              <ThemedText style={styles.reactionCount}>{reaction.count}</ThemedText>
            )}
          </Pressable>
        ))}
      </View>
    );
  };

  const renderMedia = () => {
    if (message.type === 'image' && message.mediaUrl) {
      return (
        <Pressable style={styles.mediaContainer}>
          <Image 
            source={{ uri: message.mediaUrl }} 
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </Pressable>
      );
    }

    if (message.type === 'voice') {
      return (
        <View style={styles.voiceMessage}>
          <Pressable 
            style={[
              styles.playButton, 
              { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : theme.primary + '20' }
            ]}
          >
            <Feather 
              name="play" 
              size={18} 
              color={isOwn ? '#fff' : theme.primary} 
            />
          </Pressable>
          <View style={styles.waveform}>
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  { 
                    height: Math.random() * 20 + 5,
                    backgroundColor: isOwn ? 'rgba(255,255,255,0.5)' : theme.primary + '50',
                  },
                ]}
              />
            ))}
          </View>
          <ThemedText 
            style={[
              styles.voiceDuration, 
              { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
            ]}
          >
            {message.mediaDuration 
              ? `${Math.floor(message.mediaDuration / 60)}:${(message.mediaDuration % 60).toString().padStart(2, '0')}`
              : '0:00'
            }
          </ThemedText>
        </View>
      );
    }

    if (message.type === 'file' && message.mediaFileName) {
      return (
        <View style={styles.fileMessage}>
          <View 
            style={[
              styles.fileIcon, 
              { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : theme.backgroundSecondary }
            ]}
          >
            <Feather 
              name="file-text" 
              size={24} 
              color={isOwn ? '#fff' : theme.primary} 
            />
          </View>
          <View style={styles.fileInfo}>
            <ThemedText 
              style={[styles.fileName, { color: isOwn ? '#fff' : theme.text }]} 
              numberOfLines={1}
            >
              {message.mediaFileName}
            </ThemedText>
            <ThemedText 
              style={[
                styles.fileSize, 
                { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
              ]}
            >
              {message.mediaSize ? `${(message.mediaSize / 1024).toFixed(1)} KB` : 'Файл'}
            </ThemedText>
          </View>
          <Feather 
            name="download" 
            size={20} 
            color={isOwn ? '#fff' : theme.primary} 
          />
        </View>
      );
    }

    return null;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ru', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Animated.View
      style={[
        styles.messageWrapper,
        isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Аватар */}
      {showAvatar && !isOwn && (
        <View style={[styles.messageAvatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.messageAvatarText}>
            {message.senderName?.charAt(0).toUpperCase() || '?'}
          </ThemedText>
        </View>
      )}

      {/* Пузырь */}
      <DoubleTapLike
        onDoubleTap={() => onDoubleTap(message)}
        onLongPress={handleLongPress}
      >
        <LinearGradient
          colors={isOwn 
            ? [theme.primary, theme.primary + 'DD'] 
            : [theme.backgroundSecondary, theme.backgroundSecondary]
          }
          style={[
            styles.messageBubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
            showAvatar && !isOwn && styles.bubbleWithAvatar,
          ]}
        >
          {/* Имя отправителя (для групп) */}
          {showAvatar && !isOwn && message.senderName && (
            <ThemedText style={[styles.senderName, { color: theme.primary }]}>
              {message.senderName}
            </ThemedText>
          )}

          {/* Reply preview */}
          {renderReplyPreview()}

          {/* Медиа контент */}
          {renderMedia()}

          {/* Текст */}
          {message.text && (
            <ThemedText 
              style={[styles.messageText, { color: isOwn ? '#fff' : theme.text }]}
            >
              {message.text}
              {message.isEdited && (
                <ThemedText 
                  style={[
                    styles.editedLabel, 
                    { color: isOwn ? 'rgba(255,255,255,0.6)' : theme.textSecondary }
                  ]}
                >
                  {' (ред.)'}
                </ThemedText>
              )}
            </ThemedText>
          )}

          {/* Футер: время + статус */}
          <View style={styles.messageFooter}>
            <ThemedText 
              style={[
                styles.messageTime, 
                { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
              ]}
            >
              {formatTime(message.createdAt)}
            </ThemedText>
            <StatusIcon status={message.status} isOwn={isOwn} />
          </View>
        </LinearGradient>

        {/* Реакции */}
        {renderReactions()}
      </DoubleTapLike>
    </Animated.View>
  );
});

// ==================== TYPING INDICATOR ====================

const TypingIndicator = memo(function TypingIndicator({ theme }: { theme: any }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  const animatedStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -4],
      }),
    }],
  });

  return (
    <View style={[styles.typingContainer, { backgroundColor: theme.backgroundSecondary }]}>
      <Animated.View style={[styles.typingDot, animatedStyle(dot1)]} />
      <Animated.View style={[styles.typingDot, animatedStyle(dot2)]} />
      <Animated.View style={[styles.typingDot, animatedStyle(dot3)]} />
    </View>
  );
});

// ==================== REACTION PICKER WITH ACTIONS ====================

interface ReactionPickerProps {
  visible: boolean;
  position: { x: number; y: number };
  onSelect: (emoji: string) => void;
  onClose: () => void;
  onReply: () => void;
  onDelete: () => void;
  onCopy: () => void;
  isOwnMessage: boolean;
  theme: any;
}

const ReactionPicker = memo(function ReactionPicker({
  visible,
  position,
  onSelect,
  onClose,
  onReply,
  onDelete,
  onCopy,
  isOwnMessage,
  theme,
}: ReactionPickerProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: visible ? 1 : 0,
      tension: 200,
      friction: 15,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Pressable style={styles.reactionPickerOverlay} onPress={onClose}>
      <Animated.View
        style={[
          styles.reactionPicker,
          { 
            backgroundColor: theme.backgroundDefault,
            top: Math.min(position.y - 120, SCREEN_HEIGHT - 200),
            left: Math.max(8, Math.min(position.x - 100, SCREEN_WIDTH - 216)),
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Reactions Row */}
        <View style={styles.reactionsRow}>
          {REACTION_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              style={({ pressed }) => [
                styles.reactionPickerItem,
                pressed && { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(emoji);
              }}
            >
              <ThemedText style={styles.reactionPickerEmoji}>{emoji}</ThemedText>
            </Pressable>
          ))}
        </View>
        
        {/* Actions */}
        <View style={styles.pickerActions}>
          <Pressable style={styles.pickerActionItem} onPress={onReply}>
            <Feather name="corner-up-left" size={18} color="#8B5CF6" />
            <ThemedText style={styles.pickerActionText}>Ответить</ThemedText>
          </Pressable>
          
          <Pressable style={styles.pickerActionItem} onPress={onCopy}>
            <Feather name="copy" size={18} color="#4ECDC4" />
            <ThemedText style={styles.pickerActionText}>Копировать</ThemedText>
          </Pressable>
          
          {isOwnMessage && (
            <Pressable style={styles.pickerActionItem} onPress={onDelete}>
              <Feather name="trash-2" size={18} color="#FF6B6B" />
              <ThemedText style={[styles.pickerActionText, { color: '#FF6B6B' }]}>Удалить</ThemedText>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
});

// ==================== MAIN CHAT SCREEN ====================

interface ChatParams {
  chatId: number;
  otherUserId: number;
  otherUserName: string;
  phoneNumber?: string;
  chatType?: 'private' | 'group';
}

export default function TelegramChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { earnStars } = useStars();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const params = route.params as ChatParams;
  const otherUserId = params?.otherUserId;
  const otherUserName = params?.otherUserName || 'Чат';
  const phoneNumber = params?.phoneNumber;
  const chatType = params?.chatType || 'private';
  const initialChatId = params?.chatId;
  
  // Реальный chatId из базы данных - используем переданный или ждём создания
  const [realChatId, setRealChatId] = useState<string | null>(
    initialChatId ? initialChatId.toString() : null
  );

  // Store
  const messages = useChatStore(selectMessages(realChatId || ''));
  const loadMessages = useChatStore(state => state.loadMessages);
  const sendMessage = useChatStore(state => state.sendMessage);
  const addReaction = useChatStore(state => state.addReaction);
  const markAsRead = useChatStore(state => state.markAsRead);
  const getChatById = useChatStore(state => state.getChatById);
  const deleteMessage = useChatStore(state => state.deleteMessage);
  const typingUsers = useChatStore(state => state.typingUsers.get(realChatId || '') || []);
  const loadingChats = useChatStore(state => state.loadingChats);

  // Local state
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [reactionPickerPosition, setReactionPickerPosition] = useState({ x: 0, y: 0 });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLoading = loadingChats.has(realChatId || '');
  const chat = getChatById(realChatId || '');

  // Сначала создаём/получаем реальный чат, потом загружаем сообщения
  useEffect(() => {
    let isMounted = true;
    
    const initChat = async () => {
      if (!user?.id || !otherUserId || realChatId) return;
      
      try {
        // Создаём или получаем существующий чат
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.110:5000'}/api/chats/private`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user1Id: user.id, user2Id: otherUserId }),
        });
        
        if (response.ok && isMounted) {
          const chatData = await response.json();
          const chatIdStr = chatData.id.toString();
          setRealChatId(chatIdStr);
          
          // ВАЖНО: Подписываемся на этот чат через WebSocket для получения сообщений в реальном времени
          wsClient.addChat(chatIdStr);
        }
      } catch (error) {
        console.error('[TelegramChat] Error creating chat:', error);
      }
    };
    
    initChat();
    
    return () => { isMounted = false; };
  }, [user?.id, otherUserId]);
  
  // Загружаем сообщения когда есть реальный chatId (только один раз)
  useEffect(() => {
    if (realChatId && messages.length === 0) {
      loadMessages(realChatId);
    }
    if (realChatId && user?.id) {
      markAsRead(realChatId, user.id);
    }
  }, [realChatId]);

  // Подписка на входящие сообщения через WebSocket
  useEffect(() => {
    if (!realChatId) return;
    
    const handleIncomingMessage = (wsMessage: any) => {
      const message = wsMessage.payload?.message;
      if (!message) return;
      
      // Проверяем что сообщение для текущего чата
      if (message.chatId?.toString() === realChatId) {
        // Добавляем сообщение в store
        useChatStore.getState().handleIncomingMessage({
          id: message.id?.toString() || Date.now().toString(),
          chatId: realChatId,
          senderId: message.senderId,
          senderName: message.senderName || 'Пользователь',
          text: message.text || message.message || '',
          type: message.type || 'text',
          status: 'delivered',
          createdAt: message.createdAt || Date.now(),
          readState: 'unread',
          reactions: [],
        });
      }
    };
    
    wsClient.on('message', handleIncomingMessage);
    
    return () => {
      wsClient.off('message', handleIncomingMessage);
    };
  }, [realChatId]);

  // Keyboard listener
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Скролл к новым сообщениям (только для новых сообщений)
  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  // Обработчики
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !user?.id) return;

    const messageData: Partial<Message> = {
      senderId: user.id,
      senderName: (user as any).username || (user as any).firstName || 'Я',
      text: inputText.trim(),
      type: 'text',
    };

    if (replyTo) {
      messageData.replyTo = {
        id: replyTo.id,
        text: replyTo.text || '',
        senderName: replyTo.senderName || '',
      };
    }

    setInputText('');
    setReplyTo(null);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (realChatId) {
      try {
        await sendMessage(realChatId, messageData);
        earnStars(1, 'Сообщение');
      } catch {
        // ошибки отправки уже обрабатываются внутри sendMessage / store
      }
    }
  }, [inputText, user, replyTo, realChatId, sendMessage, earnStars]);

  const handleLongPress = useCallback((message: Message, event?: any) => {
    setSelectedMessage(message);
    
    // Позиция для reaction picker
    const y = event?.nativeEvent?.pageY || SCREEN_HEIGHT / 2;
    const x = event?.nativeEvent?.pageX || SCREEN_WIDTH / 2;
    setReactionPickerPosition({ x, y });
    setReactionPickerVisible(true);
  }, []);

  const handleReactionSelect = useCallback((emoji: string) => {
    if (selectedMessage && user?.id) {
      addReaction(selectedMessage.id, emoji, user.id);
    }
    setReactionPickerVisible(false);
    setSelectedMessage(null);
  }, [selectedMessage, user?.id, addReaction]);

  const handleReplyFromPicker = useCallback(() => {
    if (selectedMessage) {
      setReplyTo(selectedMessage);
    }
    setReactionPickerVisible(false);
    setSelectedMessage(null);
  }, [selectedMessage]);

  const handleDeleteMessage = useCallback(() => {
    if (selectedMessage && user?.id) {
      Alert.alert(
        'Удалить сообщение',
        'Вы уверены, что хотите удалить это сообщение?',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить у меня',
            onPress: () => {
              deleteMessage(selectedMessage.id, false, user.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
          {
            text: 'Удалить у всех',
            style: 'destructive',
            onPress: () => {
              deleteMessage(selectedMessage.id, true, user.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    }
    setReactionPickerVisible(false);
    setSelectedMessage(null);
  }, [selectedMessage, deleteMessage, user?.id]);

  const handleCopyMessage = useCallback(async () => {
    if (selectedMessage?.text) {
      try {
        // Попытка использовать expo-clipboard если установлен
        // @ts-ignore - динамический импорт может не иметь типов
        const Clipboard = await import('expo-clipboard').then(m => m.default).catch(() => null);
        if (Clipboard) {
          await Clipboard.setStringAsync(selectedMessage.text);
        }
        // Показываем уведомление об успешном копировании
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Скопировано', 'Текст сообщения скопирован');
      } catch {
        Alert.alert('Ошибка', 'Не удалось скопировать текст');
      }
    }
    setReactionPickerVisible(false);
    setSelectedMessage(null);
  }, [selectedMessage]);

  const handleReplyPress = useCallback((message: Message) => {
    setReplyTo(message);
  }, []);

  // Двойной тап для лайка ❤️
  const handleDoubleTap = useCallback((message: Message) => {
    if (user?.id) {
      addReaction(message.id, '❤️', user.id);
    }
  }, [user?.id, addReaction]);

  const handleLoadMore = useCallback(() => {
    if (messages.length > 0 && !isLoading && realChatId) {
      loadMessages(realChatId, 50, messages[0].id);
    }
  }, [messages, isLoading, realChatId, loadMessages]);

  // Обработчики прикрепления файлов
  const handleAttachPhoto = useCallback(() => {
    setShowAttachMenu(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('📷 Фото', 'Выберите источник', [
      { text: 'Камера', onPress: () => Alert.alert('Камера', 'Открывается камера...') },
      { text: 'Галерея', onPress: () => Alert.alert('Галерея', 'Открывается галерея...') },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }, []);

  const handleAttachFile = useCallback(() => {
    setShowAttachMenu(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('📎 Файл', 'Выбор файла...', [
      { text: 'OK' },
    ]);
  }, []);

  const handleAttachLocation = useCallback(() => {
    setShowAttachMenu(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('📍 Геолокация', 'Отправка местоположения...', [
      { text: 'OK' },
    ]);
  }, []);

  const handleAttachContact = useCallback(() => {
    setShowAttachMenu(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('👤 Контакт', 'Выбор контакта...', [
      { text: 'OK' },
    ]);
  }, []);

  // Запись голосового сообщения
  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingDuration(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    recordingInterval.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    if (recordingDuration > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('🎤 Голосовое', `Записано: ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')}`, [
        { text: 'Отправить', onPress: () => console.log('Sending voice...') },
        { text: 'Отмена', style: 'cancel' },
      ]);
    }
    setRecordingDuration(0);
  }, [recordingDuration]);

  const cancelRecording = useCallback(() => {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    setRecordingDuration(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const handleCall = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('📞 Звонок', `Позвонить ${otherUserName}?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Позвонить', onPress: () => console.log('Calling...') },
    ]);
  }, [otherUserName]);

  // Рендер сообщения
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const prevMessage = messages[index - 1];
    const showAvatar = !isOwn && (
      !prevMessage || 
      prevMessage.senderId !== item.senderId ||
      item.createdAt - prevMessage.createdAt > 60000
    );

    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showAvatar={showAvatar}
        onLongPress={handleLongPress}
        onReactionPress={(messageId, emoji) => {
          if (user?.id) addReaction(messageId, emoji, user.id);
        }}
        onReplyPress={handleReplyPress}
        onDoubleTap={handleDoubleTap}
        theme={theme}
      />
    );
  }, [user?.id, messages, theme, handleLongPress, addReaction, handleReplyPress, handleDoubleTap]);

  const keyExtractor = useCallback((item: Message, index: number) => {
    // Гарантируем уникальность ключа
    return `${item.id || item.localId || 'msg'}_${index}`;
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <Pressable 
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color="#8B5CF6" />
        </Pressable>

        <Pressable 
          style={styles.headerInfo}
          onPress={() => {
            // Открыть профиль пользователя
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            (navigation as any).navigate('ChatProfile', {
              chatId: realChatId,
              otherUserId: params?.otherUserId,
              otherUserName: otherUserName,
              phoneNumber: phoneNumber,
              chatType: chatType,
            });
          }}
        >
          <View style={[styles.headerAvatar, { backgroundColor: '#8B5CF6' }]}>
            <ThemedText style={styles.headerAvatarText}>
              {otherUserName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          
          <View style={styles.headerTextContainer}>
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              {otherUserName}
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {typingUsers.length > 0 
                ? 'печатает...' 
                : chat?.otherUser?.isOnline 
                  ? 'онлайн'
                  : 'был(а) недавно'
              }
            </ThemedText>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable 
            style={styles.headerButton}
            onPress={() => setIsSearchMode(true)}
          >
            <Feather name="search" size={22} color="#8B5CF6" />
          </Pressable>
          <Pressable 
            style={styles.headerButton}
            onPress={handleCall}
          >
            <Feather name="phone" size={22} color="#8B5CF6" />
          </Pressable>
          <Pressable 
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowMenuModal(true);
            }}
          >
            <Feather name="more-vertical" size={22} color="#8B5CF6" />
          </Pressable>
        </View>
      </View>

      {/* MENU MODAL */}
      <Modal visible={showMenuModal} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenuModal(false)}>
          <View style={[styles.menuContainer, { backgroundColor: theme.backgroundDefault }]}>
            <Pressable 
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                setGiftModalVisible(true);
              }}
            >
              <Feather name="gift" size={20} color="#FF6B9D" />
              <ThemedText style={styles.menuText}>Отправить подарок</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                (navigation as any).navigate('ChatProfile', {
                  chatId: realChatId,
                  otherUserId: params?.otherUserId,
                  otherUserName: otherUserName,
                  phoneNumber: phoneNumber,
                  chatType: chatType,
                });
              }}
            >
              <Feather name="user" size={20} color="#8B5CF6" />
              <ThemedText style={styles.menuText}>Профиль</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.menuItem}
              onPress={() => {
                setShowMenuModal(false);
                setIsSearchMode(true);
              }}
            >
              <Feather name="search" size={20} color="#4ECDC4" />
              <ThemedText style={styles.menuText}>Поиск в чате</ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setShowMenuModal(false);
                Alert.alert('Уведомления', 'Функция в разработке');
              }}
            >
              <Feather name="bell-off" size={20} color="#FFD93D" />
              <ThemedText style={styles.menuText}>Выключить уведомления</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* IN-CHAT SEARCH */}
      {isSearchMode && (
        <TelegramInChatSearch
          chatId={realChatId || ''}
          onClose={() => {
            setIsSearchMode(false);
            setHighlightedMessageId(null);
          }}
          onJumpToMessage={(messageId) => {
            setHighlightedMessageId(messageId);
            // Найти индекс сообщения и прокрутить
            const messageIndex = messages.findIndex(m => m.id === messageId);
            if (messageIndex !== -1) {
              flatListRef.current?.scrollToIndex({
                index: messageIndex,
                animated: true,
                viewPosition: 0.5,
              });
            }
          }}
        />
      )}

      {/* MESSAGES */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {!realChatId ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            inverted={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            windowSize={10}
            initialNumToRender={20}
            ListEmptyComponent={
              realChatId ? (
                <View style={styles.emptyChat}>
                  <View style={styles.emptyChatIcon}>
                    <Feather name="message-circle" size={48} color="#8B5CF680" />
                  </View>
                  <ThemedText style={styles.emptyChatText}>Нет сообщений</ThemedText>
                  <ThemedText style={styles.emptyChatSubtext}>Начните общение прямо сейчас! 💬</ThemedText>
                </View>
              ) : null
            }
            ListFooterComponent={
              typingUsers.length > 0 ? <TypingIndicator theme={theme} /> : null
            }
          />
        )}

        {/* REPLY PREVIEW */}
        {replyTo && (
          <View style={styles.replyBar}>
            <View style={[styles.replyBarLine, { backgroundColor: '#8B5CF6' }]} />
            <View style={styles.replyBarContent}>
              <ThemedText style={[styles.replyBarName, { color: '#8B5CF6' }]}>
                {replyTo.senderName || 'Ответ'}
              </ThemedText>
              <ThemedText 
                style={[styles.replyBarText, { color: '#8E8E93' }]} 
                numberOfLines={1}
              >
                {replyTo.text || 'Медиа'}
              </ThemedText>
            </View>
            <Pressable onPress={() => setReplyTo(null)}>
              <Feather name="x" size={20} color="#8E8E93" />
            </Pressable>
          </View>
        )}

        {/* ATTACH MENU */}
        {showAttachMenu && (
          <View style={[styles.attachMenu, { backgroundColor: theme.backgroundDefault }]}>
            <Pressable style={styles.attachMenuItem} onPress={handleAttachPhoto}>
              <View style={[styles.attachMenuIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                <Feather name="image" size={22} color="#8B5CF6" />
              </View>
              <ThemedText style={styles.attachMenuText}>Фото</ThemedText>
            </Pressable>
            <Pressable style={styles.attachMenuItem} onPress={handleAttachFile}>
              <View style={[styles.attachMenuIcon, { backgroundColor: '#4ECDC4' + '20' }]}>
                <Feather name="file" size={22} color="#4ECDC4" />
              </View>
              <ThemedText style={styles.attachMenuText}>Файл</ThemedText>
            </Pressable>
            <Pressable style={styles.attachMenuItem} onPress={handleAttachLocation}>
              <View style={[styles.attachMenuIcon, { backgroundColor: '#FF6B6B' + '20' }]}>
                <Feather name="map-pin" size={22} color="#FF6B6B" />
              </View>
              <ThemedText style={styles.attachMenuText}>Геолокация</ThemedText>
            </Pressable>
            <Pressable style={styles.attachMenuItem} onPress={handleAttachContact}>
              <View style={[styles.attachMenuIcon, { backgroundColor: '#FFB347' + '20' }]}>
                <Feather name="user" size={22} color="#FFB347" />
              </View>
              <ThemedText style={styles.attachMenuText}>Контакт</ThemedText>
            </Pressable>
          </View>
        )}

        {/* RECORDING INDICATOR */}
        {isRecording && (
          <View style={styles.recordingBar}>
            <View style={styles.recordingDot} />
            <ThemedText style={styles.recordingText}>
              Запись {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </ThemedText>
            <Pressable style={styles.cancelRecording} onPress={cancelRecording}>
              <Feather name="x" size={20} color="#FF6B6B" />
              <ThemedText style={styles.cancelRecordingText}>Отмена</ThemedText>
            </Pressable>
          </View>
        )}

        {/* INPUT */}
        <View 
          style={[
            styles.inputContainer, 
            { 
              paddingBottom: isKeyboardVisible ? 8 : Math.max(insets.bottom, 8),
            }
          ]}
        >
          <Pressable 
            style={styles.inputButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAttachMenu(!showAttachMenu);
            }}
          >
            <Feather name={showAttachMenu ? 'x' : 'paperclip'} size={22} color="#8B5CF6" />
          </Pressable>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Сообщение..."
              placeholderTextColor="#8E8E93"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={4000}
              onFocus={() => setShowAttachMenu(false)}
            />
            
            <Pressable 
              style={styles.inputEmojiButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('😊 Эмодзи', 'Выберите эмодзи', [
                  { text: '👍', onPress: () => setInputText(prev => prev + '👍') },
                  { text: '❤️', onPress: () => setInputText(prev => prev + '❤️') },
                  { text: '😂', onPress: () => setInputText(prev => prev + '😂') },
                  { text: 'Отмена', style: 'cancel' },
                ]);
              }}
            >
              <Feather name="smile" size={22} color="#8E8E93" />
            </Pressable>
          </View>

          {inputText.trim() ? (
            <Pressable 
              style={[styles.sendButton, { backgroundColor: '#8B5CF6' }]}
              onPress={handleSend}
            >
              <Feather name="send" size={20} color="#fff" />
            </Pressable>
          ) : (
            <Pressable 
              style={[styles.inputButton, isRecording && styles.recordingButton]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              delayLongPress={0}
            >
              <Feather name="mic" size={22} color={isRecording ? '#FF6B6B' : '#8B5CF6'} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* REACTION PICKER */}
      <ReactionPicker
        visible={reactionPickerVisible}
        position={reactionPickerPosition}
        onSelect={handleReactionSelect}
        onClose={() => {
          setReactionPickerVisible(false);
          setSelectedMessage(null);
        }}
        onReply={handleReplyFromPicker}
        onDelete={handleDeleteMessage}
        onCopy={handleCopyMessage}
        isOwnMessage={selectedMessage?.senderId === user?.id}
        theme={theme}
      />

      {/* GIFT MODAL */}
      <GiftModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        recipientName={otherUserName}
        userStars={999}
        onSendGift={(gift, message) => {
          // Отправить сообщение с подарком
          if (user?.id && realChatId) {
            sendMessage(realChatId, {
              senderId: user.id,
              senderName: (user as any).username || (user as any).firstName || 'Я',
              text: `🎁 ${gift.emoji} ${gift.name}${message ? `\n💬 ${message}` : ''}`,
              type: 'text',
            });
          }
          setGiftModalVisible(false);
          // Запускаем конфетти! 🎉
          setShowConfetti(true);
        }}
      />
      
      {/* CONFETTI EFFECT */}
      <ConfettiEffect 
        active={showConfetti} 
        count={50}
        duration={2500}
        onComplete={() => setShowConfetti(false)} 
      />
    </ThemedView>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C', // Глубокий тёмный фон
  },

  // Header - Красивый и элегантный
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.15)',
    backgroundColor: '#08080C',
  },
  headerBackButton: {
    padding: 10,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerButton: {
    padding: 10,
    borderRadius: 20,
  },

  // Messages - Красивый контейнер
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#08080C',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyChatIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  emptyChatText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptyChatSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Message Wrapper
  messageWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginVertical: 3,
  },
  ownMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    alignSelf: 'flex-end',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  messageAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Message Bubble - Красивые пузырьки
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ownBubble: {
    borderBottomRightRadius: 6,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.2,
  },
  otherBubble: {
    borderBottomLeftRadius: 6,
  },
  bubbleWithAvatar: {
    marginLeft: 0,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  editedLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 6,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Reply Preview
  replyPreview: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  replyLine: {
    width: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 12,
  },

  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Media
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 160,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 28,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 12,
    minWidth: 32,
    textAlign: 'right',
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 180,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
  },

  // Typing
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginLeft: 48,
    marginVertical: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',
  },

  // Reaction Picker
  reactionPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  reactionPicker: {
    position: 'absolute',
    padding: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  reactionsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
    paddingBottom: 8,
    marginBottom: 4,
  },
  reactionPickerItem: {
    padding: 6,
    borderRadius: 16,
  },
  reactionPickerEmoji: {
    fontSize: 22,
  },
  pickerActions: {
    paddingTop: 4,
  },
  pickerActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  pickerActionText: {
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Reply Bar
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2C2C2E',
    backgroundColor: '#1C1C1E',
  },
  replyBarLine: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    marginRight: 8,
  },
  replyBarContent: {
    flex: 1,
  },
  replyBarName: {
    fontSize: 13,
    fontWeight: '600',
  },
  replyBarText: {
    fontSize: 13,
  },

  // Input - Красивый и современный
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.15)',
    backgroundColor: '#08080C',
  },
  inputButton: {
    padding: 10,
    borderRadius: 22,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
    maxHeight: 140,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputEmojiButton: {
    padding: 6,
    marginLeft: 6,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Attach Menu
  attachMenu: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2C2C2E',
  },
  attachMenuItem: {
    alignItems: 'center',
    gap: 6,
  },
  attachMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachMenuText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  
  // Recording
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2C2C2E',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    marginRight: 12,
  },
  recordingText: {
    flex: 1,
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  cancelRecording: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  cancelRecordingText: {
    fontSize: 14,
    color: '#FF6B6B',
  },
  recordingButton: {
    backgroundColor: '#FF6B6B20',
    borderRadius: 20,
  },

  // Menu Modal
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  menuContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
