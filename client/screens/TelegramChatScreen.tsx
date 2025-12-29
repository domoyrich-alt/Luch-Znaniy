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
import { getApiUrl } from '@/lib/query-client';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Audio, ResizeMode, Video } from 'expo-av';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TelegramInChatSearch } from '@/components/chat/TelegramInChatSearch';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedLib, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import GiftModal from '@/components/chat/GiftModal';
import DoubleTapLike from '@/components/chat/DoubleTapLike';
import ConfettiEffect from '@/components/chat/ConfettiEffect';
import VideoNoteRecorder from '@/components/chat/VideoNoteRecorder';
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

// ==================== DATE SEPARATOR ====================

interface DateSeparatorProps {
  date: Date;
}

const DateSeparator = memo(function DateSeparator({ date }: DateSeparatorProps) {
  const formatDate = (d: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const messageDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    if (messageDay.getTime() === today.getTime()) {
      return 'Сегодня';
    } else if (messageDay.getTime() === yesterday.getTime()) {
      return 'Вчера';
    } else {
      return d.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
    }
  };

  return (
    <View style={styles.dateSeparator}>
      <View style={styles.dateSeparatorBadge}>
        <ThemedText style={styles.dateSeparatorText}>{formatDate(date)}</ThemedText>
      </View>
    </View>
  );
});

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
      return <Feather name="clock" size={14} color="rgba(255,255,255,0.5)" />;
    case 'sent':
      // Одна галочка — отправлено, но не доставлено
      return <Feather name="check" size={14} color="rgba(255,255,255,0.5)" />;
    case 'delivered':
      // Две серые галочки — доставлено, но не прочитано
      return <MaterialCommunityIcons name="check-all" size={16} color="rgba(255,255,255,0.5)" />;
    case 'read':
      // Две белые/синие галочки — прочитано
      return <MaterialCommunityIcons name="check-all" size={16} color="#34C759" />;
    case 'failed':
      return <Feather name="alert-circle" size={14} color="#FF453A" />;
    default:
      return null;
  }
});

// ==================== MESSAGE BUBBLE ====================

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  groupPosition: 'single' | 'first' | 'middle' | 'last';
  isHighlighted?: boolean;
  onLongPress: (message: Message) => void;
  onReactionPress: (messageId: string, emoji: string) => void;
  onReplyPress: (message: Message) => void;
  onDoubleTap: (message: Message) => void;
  onSwipeReply: (message: Message) => void;
  theme: any;
}

const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showAvatar,
  groupPosition,
  isHighlighted,
  onLongPress,
  onReactionPress,
  onReplyPress,
  onDoubleTap,
  onSwipeReply,
  theme,
}: MessageBubbleProps) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Swipe-to-reply gesture
  const translateX = useSharedValue(0);
  const replyIconOpacity = useSharedValue(0);
  const highlightOpacity = useSharedValue(0);
  const SWIPE_THRESHOLD = 60;

  // Динамические радиусы для группировки (Telegram-style)
  const getBubbleRadius = () => {
    const baseRadius = 18;
    const smallRadius = 6;
    
    if (isOwn) {
      // Свои сообщения - справа
      switch (groupPosition) {
        case 'first': return { borderTopLeftRadius: baseRadius, borderTopRightRadius: baseRadius, borderBottomLeftRadius: baseRadius, borderBottomRightRadius: smallRadius };
        case 'middle': return { borderTopLeftRadius: baseRadius, borderTopRightRadius: smallRadius, borderBottomLeftRadius: baseRadius, borderBottomRightRadius: smallRadius };
        case 'last': return { borderTopLeftRadius: baseRadius, borderTopRightRadius: smallRadius, borderBottomLeftRadius: baseRadius, borderBottomRightRadius: baseRadius };
        default: return { borderTopLeftRadius: baseRadius, borderTopRightRadius: baseRadius, borderBottomLeftRadius: baseRadius, borderBottomRightRadius: smallRadius };
      }
    } else {
      // Чужие сообщения - слева
      switch (groupPosition) {
        case 'first': return { borderTopLeftRadius: baseRadius, borderTopRightRadius: baseRadius, borderBottomLeftRadius: smallRadius, borderBottomRightRadius: baseRadius };
        case 'middle': return { borderTopLeftRadius: smallRadius, borderTopRightRadius: baseRadius, borderBottomLeftRadius: smallRadius, borderBottomRightRadius: baseRadius };
        case 'last': return { borderTopLeftRadius: smallRadius, borderTopRightRadius: baseRadius, borderBottomLeftRadius: baseRadius, borderBottomRightRadius: baseRadius };
        default: return { borderTopLeftRadius: baseRadius, borderTopRightRadius: baseRadius, borderBottomLeftRadius: smallRadius, borderBottomRightRadius: baseRadius };
      }
    }
  };

  // Подсветка при выборе/ответе (reanimated)
  useEffect(() => {
    if (isHighlighted) {
      highlightOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 400 }))
      );
    }
  }, [isHighlighted]);

  const highlightStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(139, 92, 246, ${highlightOpacity.value * 0.3})`,
  }));

  const panGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      const tx = isOwn ? Math.min(0, event.translationX) : Math.max(0, event.translationX);
      translateX.value = tx;
      replyIconOpacity.value = interpolate(
        Math.abs(tx),
        [0, SWIPE_THRESHOLD],
        [0, 1],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      const triggered = Math.abs(translateX.value) >= SWIPE_THRESHOLD;
      if (triggered) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onSwipeReply)(message);
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      replyIconOpacity.value = withTiming(0, { duration: 150 });
    });

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const replyIconStyle = useAnimatedStyle(() => ({
    opacity: replyIconOpacity.value,
    transform: [
      { scale: interpolate(replyIconOpacity.value, [0, 1], [0.5, 1], Extrapolate.CLAMP) },
    ],
  }));

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

    if ((message.mediaType === 'video' || (message as any).type === 'video') && message.mediaUrl) {
      const duration = message.mediaDuration || 0;
      const durationText = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
      
      return (
        <Pressable style={styles.videoNoteContainer}>
          <View style={styles.videoNoteCircle}>
            <Video
              source={{ uri: message.mediaUrl }}
              style={styles.videoNote}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              useNativeControls={false}
              isLooping={false}
            />
            {/* Иконка воспроизведения */}
            <View style={styles.videoPlayOverlay}>
              <Feather name="play" size={28} color="#fff" />
            </View>
          </View>
          {/* Бейдж длительности как в Telegram */}
          <View style={styles.videoNoteDuration}>
            <ThemedText style={styles.videoNoteDurationText}>{durationText}</ThemedText>
          </View>
        </Pressable>
      );
    }

    if (message.type === 'voice') {
      // Generate consistent waveform based on message id
      const seed = parseInt(message.id.replace(/\D/g, '').slice(0, 6)) || 12345;
      const waveformData = Array.from({ length: 40 }, (_, i) => {
        const wave = Math.sin((seed + i * 0.5) * 0.3) * 0.4 + 0.5;
        const random = ((seed * (i + 1)) % 100) / 100;
        return Math.max(0.15, Math.min(1, wave * 0.6 + random * 0.4));
      });
      
      const duration = message.mediaDuration || 0;
      
      return (
        <View style={styles.voiceMessage}>
          <Pressable 
            style={[
              styles.voicePlayButton, 
              { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : '#3390EC' }
            ]}
          >
            <Feather 
              name="play" 
              size={18} 
              color="#fff" 
              style={{ marginLeft: 2 }}
            />
          </Pressable>
          <View style={styles.voiceWaveformContainer}>
            <View style={styles.waveform}>
              {waveformData.map((height, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    { 
                      height: height * 20 + 4,
                      backgroundColor: isOwn ? 'rgba(255,255,255,0.7)' : '#3390EC',
                    },
                  ]}
                />
              ))}
            </View>
            <ThemedText 
              style={[
                styles.voiceDuration, 
                { color: isOwn ? 'rgba(255,255,255,0.85)' : '#8E8E93' }
              ]}
            >
              {`${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`}
            </ThemedText>
          </View>
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
    <ReanimatedLib.View
      style={[
        styles.messageWrapper,
        isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper,
        { 
          marginVertical: groupPosition === 'middle' || groupPosition === 'last' ? 1 : 3,
        },
        highlightStyle,
      ]}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], flex: 1, flexDirection: 'row', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
      {/* Reply Icon (appears on swipe) */}
      <ReanimatedLib.View
        style={[
          styles.swipeReplyIcon,
          isOwn ? styles.swipeReplyIconLeft : styles.swipeReplyIconRight,
          replyIconStyle,
        ]}
      >
        <Feather name="corner-up-left" size={20} color="#8B5CF6" />
      </ReanimatedLib.View>

      {/* Аватар */}
      {showAvatar && !isOwn && (
        <View style={[styles.messageAvatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.messageAvatarText}>
            {message.senderName?.charAt(0).toUpperCase() || '?'}
          </ThemedText>
        </View>
      )}
      {/* Placeholder для аватара когда не показан */}
      {!showAvatar && !isOwn && <View style={{ width: 44 }} />}

      {/* Пузырь с жестом свайпа */}
      <GestureDetector gesture={panGesture}>
        <ReanimatedLib.View style={bubbleAnimatedStyle}>
          <DoubleTapLike
            onDoubleTap={() => onDoubleTap(message)}
            onLongPress={handleLongPress}
          >
            <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
            getBubbleRadius(),
          ]}
        >
          {/* Имя отправителя (только для первого в группе) */}
          {groupPosition === 'first' && !isOwn && message.senderName && (
            <ThemedText style={[styles.senderName, { color: '#5AABE5' }]}>
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
              style={[styles.messageText, { color: '#FFFFFF' }]}
            >
              {message.text}
              {message.isEdited && (
                <ThemedText 
                  style={[
                    styles.editedLabel, 
                    { color: 'rgba(255,255,255,0.5)' }
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
              style={styles.messageTime}
            >
              {formatTime(message.createdAt)}
            </ThemedText>
            <StatusIcon status={message.status} isOwn={isOwn} />
          </View>
        </View>

        {/* Реакции */}
        {renderReactions()}
          </DoubleTapLike>
        </ReanimatedLib.View>
      </GestureDetector>
      </Animated.View>
    </ReanimatedLib.View>
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
  chatId?: string | number;
  otherUserId?: number;
  otherUserName?: string;
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
  const isVirtualChatId = typeof initialChatId === 'string' && initialChatId.startsWith('private_');
  const [realChatId, setRealChatId] = useState<string | null>(
    initialChatId && !isVirtualChatId ? initialChatId.toString() : null
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
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showNewMessagesBadge, setShowNewMessagesBadge] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  const isAtBottomRef = useRef(true);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Bottom Sheet animation
  const bottomSheetTranslateY = useSharedValue(SCREEN_HEIGHT);
  const bottomSheetOpacity = useSharedValue(0);

  const [recordMode, setRecordMode] = useState<'voice' | 'video'>('voice');
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTriggeredRef = useRef(false);
  const audioRecordingRef = useRef<Audio.Recording | null>(null);

  const cancelRecording = useCallback(async () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    holdTriggeredRef.current = false;
    setIsRecording(false);

    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }

    try {
      const recording = audioRecordingRef.current;
      audioRecordingRef.current = null;
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
    } catch {
      // ignore
    } finally {
      setRecordingDuration(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, []);

  const isLoading = loadingChats.has(realChatId || '');
  const chat = getChatById(realChatId || '');

  // Сначала создаём/получаем реальный чат, потом загружаем сообщения
  useEffect(() => {
    let isMounted = true;
    
    const initChat = async () => {
      if (!user?.id || !otherUserId || (realChatId && !realChatId.startsWith('private_'))) return;
      
      try {
        // Создаём или получаем существующий чат
        const API_URL = getApiUrl();
        const response = await fetch(`${API_URL}/api/chats/private`, {
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
    if (realChatId && !realChatId.startsWith('private_') && messages.length === 0) {
      loadMessages(realChatId);
    }
    if (realChatId && !realChatId.startsWith('private_') && user?.id) {
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
      const newMsgCount = messages.length - prevMessagesLength.current;
      
      // Если пользователь внизу - скроллим к новым сообщениям
      if (isAtBottomRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        // Показываем бейдж "новые сообщения"
        setUnreadCount(prev => prev + newMsgCount);
        setShowNewMessagesBadge(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  // Отслеживаем позицию скролла
  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    isAtBottomRef.current = isAtBottom;
    
    // Показываем кнопку "вниз" при скролле вверх
    const scrolledUp = contentOffset.y < contentSize.height - layoutMeasurement.height - 300;
    setShowScrollDownButton(scrolledUp && !isAtBottom);
    
    if (isAtBottom && showNewMessagesBadge) {
      setShowNewMessagesBadge(false);
      setUnreadCount(0);
    }
  }, [showNewMessagesBadge]);

  // Скролл к новым сообщениям при нажатии на бейдж
  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowNewMessagesBadge(false);
    setUnreadCount(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

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
      } catch {
        // ошибки отправки уже обрабатываются внутри sendMessage / store
      }
    }
  }, [inputText, user, replyTo, realChatId, sendMessage]);

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
    // Подсветка сообщения при ответе
    setHighlightedMessageId(message.id);
    setTimeout(() => setHighlightedMessageId(null), 1500);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Bottom Sheet handlers - быстрое открытие без долгой анимации
  const openBottomSheet = useCallback(() => {
    setShowAttachMenu(true);
    bottomSheetTranslateY.value = withTiming(0, { duration: 200 });
    bottomSheetOpacity.value = withTiming(1, { duration: 150 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 180 });
    bottomSheetOpacity.value = withTiming(0, { duration: 120 });
    setTimeout(() => setShowAttachMenu(false), 150);
  }, []);

  // Двойной тап для лайка ❤️
  const handleDoubleTap = useCallback((message: Message) => {
    if (user?.id) {
      addReaction(message.id, '❤️', user.id);
    }
  }, [user?.id, addReaction]);

  const handleLoadMore = useCallback(() => {
    if (messages.length > 0 && !isLoading && realChatId && !realChatId.startsWith('private_')) {
      loadMessages(realChatId, 50, messages[0].id);
    }
  }, [messages, isLoading, realChatId, loadMessages]);

  // Обработчики прикрепления файлов
  const uploadFile = useCallback(async (fileUri: string, fileName: string) => {
    const API_URL = getApiUrl();
    const formData = new FormData();

    // @ts-ignore
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'application/octet-stream',
    });

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    const fileUrl: string = result.fileUrl;
    return {
      fileUrl: fileUrl.startsWith('http') ? fileUrl : `${API_URL}${fileUrl}`,
      fileName: result.fileName as string,
      fileSize: result.fileSize as number,
      mimeType: result.mimeType as string,
    };
  }, []);

  const pickAndSendPhoto = useCallback(async (source: 'camera' | 'library') => {
    if (!realChatId || realChatId.startsWith('private_') || !user?.id) return;

    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Нужно разрешение на фото/камеру');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.9,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.9,
        });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const fileName = asset.fileName || `photo_${Date.now()}.jpg`;

    try {
      const uploaded = await uploadFile(uri, fileName);
      await sendMessage(realChatId, {
        senderId: user.id,
        senderName: (user as any).username || (user as any).firstName || 'Я',
        type: 'image',
        mediaType: 'photo',
        mediaUrl: uploaded.fileUrl,
        mediaFileName: uploaded.fileName || fileName,
        mediaSize: uploaded.fileSize,
      });
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось отправить фото');
    }
  }, [realChatId, user?.id, sendMessage, uploadFile]);

  const handleAttachPhoto = useCallback(() => {
    setShowAttachMenu(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('📷 Фото', 'Выберите источник', [
      { text: 'Камера', onPress: () => pickAndSendPhoto('camera') },
      { text: 'Галерея', onPress: () => pickAndSendPhoto('library') },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }, [pickAndSendPhoto]);

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

  const beginVoiceRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Нет доступа', 'Нужно разрешение на микрофон');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setIsRecording(true);
      setRecordingDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      audioRecordingRef.current = recording;
    } catch (e) {
      setIsRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
      Alert.alert('Ошибка', 'Не удалось начать запись');
    }
  }, [isRecording]);

  const finishVoiceRecordingAndSend = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);

    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }

    const recording = audioRecordingRef.current;
    audioRecordingRef.current = null;

    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;

      if (!realChatId || realChatId.startsWith('private_') || !user?.id) return;

      const fileName = `voice_${Date.now()}.m4a`;
      const uploaded = await uploadFile(uri, fileName);
      await sendMessage(realChatId, {
        senderId: user.id,
        senderName: (user as any).username || (user as any).firstName || 'Я',
        type: 'voice',
        mediaType: 'voice',
        mediaUrl: uploaded.fileUrl,
        mediaFileName: uploaded.fileName || fileName,
        mediaSize: uploaded.fileSize,
        mediaDuration: recordingDuration,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось отправить голосовое');
    } finally {
      setRecordingDuration(0);
    }
  }, [isRecording, realChatId, user?.id, sendMessage, uploadFile, recordingDuration]);

  const captureAndSendVideoNote = useCallback(async () => {
    // Открываем инлайн видео рекордер вместо стандартной камеры
    setShowVideoRecorder(true);
  }, []);

  // Обработка записанного видео
  const handleVideoRecorded = useCallback(async (uri: string) => {
    if (!realChatId || realChatId.startsWith('private_') || !user?.id) return;

    const fileName = `video_note_${Date.now()}.mp4`;

    try {
      const uploaded = await uploadFile(uri, fileName);
      await sendMessage(realChatId, {
        senderId: user.id,
        senderName: (user as any).username || (user as any).firstName || 'Я',
        type: 'file',
        mediaType: 'video',
        mediaUrl: uploaded.fileUrl,
        mediaFileName: uploaded.fileName || fileName,
        mediaSize: uploaded.fileSize,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Ошибка', 'Не удалось отправить видео');
    }
  }, [realChatId, user?.id, sendMessage, uploadFile]);

  const toggleRecordMode = useCallback(() => {
    setRecordMode(prev => (prev === 'voice' ? 'video' : 'voice'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleRecordPressIn = useCallback(() => {
    holdTriggeredRef.current = false;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
      if (recordMode === 'voice') {
        beginVoiceRecording();
      } else {
        captureAndSendVideoNote();
      }
    }, 220);
  }, [recordMode, beginVoiceRecording, captureAndSendVideoNote]);

  const handleRecordPressOut = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (recordMode === 'voice' && holdTriggeredRef.current) {
      finishVoiceRecordingAndSend();
    }
  }, [recordMode, finishVoiceRecordingAndSend]);

  const handleRecordPress = useCallback(() => {
    // Tap: toggle mode (voice <-> video). Hold is handled by timer.
    if (!holdTriggeredRef.current && !isRecording) {
      toggleRecordMode();
    }
  }, [toggleRecordMode, isRecording]);

  const handleCall = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('📞 Звонок', `Позвонить ${otherUserName}?`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Позвонить', onPress: () => console.log('Calling...') },
    ]);
  }, [otherUserName]);

  // Рендер сообщения с разделителями дат и группировкой
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    // Сравниваем как строки, т.к. senderId и user.id могут быть разных типов (string/number)
    const isOwn = String(item.senderId) === String(user?.id);
    const prevMessage = messages[index - 1];
    const nextMessage = messages[index + 1];
    
    // Группировка сообщений (Telegram-style)
    const isSameAuthorAsPrev = prevMessage && prevMessage.senderId === item.senderId;
    const isSameAuthorAsNext = nextMessage && nextMessage.senderId === item.senderId;
    const timeDiffPrev = prevMessage ? item.createdAt - prevMessage.createdAt : Infinity;
    const timeDiffNext = nextMessage ? nextMessage.createdAt - item.createdAt : Infinity;
    
    // Группируем если: тот же автор + < 1 минуты + нет ответа
    const isGroupedWithPrev = isSameAuthorAsPrev && timeDiffPrev < 60000 && !item.replyTo;
    const isGroupedWithNext = isSameAuthorAsNext && timeDiffNext < 60000 && !nextMessage?.replyTo;
    
    // Определяем позицию в группе: first, middle, last, single
    const isFirst = !isGroupedWithPrev;
    const isLast = !isGroupedWithNext;
    const groupPosition = isFirst && isLast ? 'single' : isFirst ? 'first' : isLast ? 'last' : 'middle';
    
    const showAvatar = !isOwn && isLast;
    
    // Проверяем нужен ли разделитель даты
    const currentDate = new Date(item.createdAt);
    const prevDate = prevMessage ? new Date(prevMessage.createdAt) : null;
    const showDateSeparator = !prevDate || 
      currentDate.toDateString() !== prevDate.toDateString();
    
    // Подсветка при поиске/ответе
    const isHighlighted = highlightedMessageId === item.id;

    return (
      <>
        {showDateSeparator && <DateSeparator date={currentDate} />}
        <MessageBubble
          message={item}
          isOwn={isOwn}
          showAvatar={showAvatar}
          groupPosition={groupPosition}
          isHighlighted={isHighlighted}
          onLongPress={handleLongPress}
          onReactionPress={(messageId, emoji) => {
            if (user?.id) addReaction(messageId, emoji, user.id);
          }}
          onReplyPress={handleReplyPress}
          onDoubleTap={handleDoubleTap}
          onSwipeReply={handleReplyPress}
          theme={theme}
        />
      </>
    );
  }, [user?.id, messages, theme, handleLongPress, addReaction, handleReplyPress, handleDoubleTap, highlightedMessageId]);

  const keyExtractor = useCallback((item: Message, index: number) => {
    // Гарантируем уникальность ключа
    return `${item.id || item.localId || 'msg'}_${index}`;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
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
            onScroll={handleScroll}
            scrollEventThrottle={16}
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

        {/* NEW MESSAGES BADGE */}
        {showNewMessagesBadge && (
          <Pressable 
            style={styles.newMessagesBadge}
            onPress={scrollToBottom}
          >
            <Feather name="chevron-down" size={16} color="#fff" />
            <ThemedText style={styles.newMessagesBadgeText}>
              {unreadCount > 0 ? `${unreadCount} new` : 'New messages'}
            </ThemedText>
          </Pressable>
        )}

        {/* SCROLL DOWN BUTTON - Telegram style */}
        {showScrollDownButton && !showNewMessagesBadge && (
          <Pressable 
            style={styles.scrollDownButton}
            onPress={scrollToBottom}
          >
            <Feather name="chevron-down" size={22} color="#fff" />
          </Pressable>
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

        {/* TELEGRAM BOTTOM SHEET ATTACH MENU */}
        {showAttachMenu && (
          <>
            {/* Полупрозрачный фон - тап закрывает */}
            <Pressable 
              style={styles.bottomSheetOverlay} 
              onPress={closeBottomSheet}
            >
              <ReanimatedLib.View 
                style={[styles.bottomSheetBackdrop, { opacity: bottomSheetOpacity }]} 
              />
            </Pressable>
            
            {/* Bottom Sheet с инерцией */}
            <ReanimatedLib.View 
              style={[
                styles.bottomSheet,
                { 
                  transform: [{ translateY: bottomSheetTranslateY }],
                  paddingBottom: Math.max(insets.bottom, 20),
                },
              ]}
            >
              {/* Ручка для свайпа */}
              <View style={styles.bottomSheetHandle}>
                <View style={styles.bottomSheetHandleBar} />
              </View>
              
              {/* Сетка опций */}
              <View style={styles.bottomSheetGrid}>
                <Pressable 
                  style={styles.bottomSheetItem} 
                  onPress={() => { closeBottomSheet(); handleAttachPhoto(); }}
                >
                  <View style={[styles.bottomSheetIcon, { backgroundColor: '#8B5CF6' }]}>
                    <Feather name="image" size={26} color="#fff" />
                  </View>
                  <ThemedText style={styles.bottomSheetText}>Фото</ThemedText>
                </Pressable>
                
                <Pressable 
                  style={styles.bottomSheetItem} 
                  onPress={() => { closeBottomSheet(); handleAttachFile(); }}
                >
                  <View style={[styles.bottomSheetIcon, { backgroundColor: '#4ECDC4' }]}>
                    <Feather name="file" size={26} color="#fff" />
                  </View>
                  <ThemedText style={styles.bottomSheetText}>Файл</ThemedText>
                </Pressable>
                
                <Pressable 
                  style={styles.bottomSheetItem} 
                  onPress={() => { closeBottomSheet(); handleAttachLocation(); }}
                >
                  <View style={[styles.bottomSheetIcon, { backgroundColor: '#FF6B6B' }]}>
                    <Feather name="map-pin" size={26} color="#fff" />
                  </View>
                  <ThemedText style={styles.bottomSheetText}>Место</ThemedText>
                </Pressable>
                
                <Pressable 
                  style={styles.bottomSheetItem} 
                  onPress={() => { closeBottomSheet(); handleAttachContact(); }}
                >
                  <View style={[styles.bottomSheetIcon, { backgroundColor: '#FFB347' }]}>
                    <Feather name="user" size={26} color="#fff" />
                  </View>
                  <ThemedText style={styles.bottomSheetText}>Контакт</ThemedText>
                </Pressable>
                
                <Pressable 
                  style={styles.bottomSheetItem} 
                  onPress={() => { closeBottomSheet(); captureAndSendVideoNote(); }}
                >
                  <View style={[styles.bottomSheetIcon, { backgroundColor: '#3390EC' }]}>
                    <Feather name="video" size={26} color="#fff" />
                  </View>
                  <ThemedText style={styles.bottomSheetText}>Видео</ThemedText>
                </Pressable>
                
                <Pressable 
                  style={styles.bottomSheetItem} 
                  onPress={() => { closeBottomSheet(); setGiftModalVisible(true); }}
                >
                  <View style={[styles.bottomSheetIcon, { backgroundColor: '#FF6B9D' }]}>
                    <Feather name="gift" size={26} color="#fff" />
                  </View>
                  <ThemedText style={styles.bottomSheetText}>Подарок</ThemedText>
                </Pressable>
              </View>
            </ReanimatedLib.View>
          </>
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

        {/* INPUT - Telegram December 2025 Style with Glass Effect */}
        <View 
          style={[
            styles.inputContainer, 
            { 
              paddingBottom: isKeyboardVisible ? 8 : Math.max(insets.bottom, 8),
            }
          ]}
        >
          {/* Скрепка в круглом контейнере со стеклянным эффектом */}
          <Pressable 
            onPress={() => {
              if (showAttachMenu) {
                closeBottomSheet();
              } else {
                openBottomSheet();
              }
            }}
          >
            <BlurView intensity={40} tint="dark" style={styles.attachButtonGlass}>
              <Feather name="paperclip" size={22} color="#8E8E93" />
            </BlurView>
          </Pressable>

          {/* Поле ввода со стеклянным эффектом */}
          <BlurView intensity={40} tint="dark" style={styles.inputWrapperGlass}>
            <TextInput
              style={styles.textInput}
              placeholder="Message"
              placeholderTextColor="#8E8E93"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={4000}
              onFocus={() => { if (showAttachMenu) closeBottomSheet(); }}
            />
            
            {/* Иконка стикера внутри поля справа */}
            <Pressable 
              style={styles.stickerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('😊 Стикеры', 'Выберите стикер', [
                  { text: '👍', onPress: () => setInputText(prev => prev + '👍') },
                  { text: '❤️', onPress: () => setInputText(prev => prev + '❤️') },
                  { text: '😂', onPress: () => setInputText(prev => prev + '😂') },
                  { text: 'Отмена', style: 'cancel' },
                ]);
              }}
            >
              <MaterialCommunityIcons name="sticker-emoji" size={24} color="#8E8E93" />
            </Pressable>
          </BlurView>

          {/* Кнопка отправки или камера/микрофон в квадратной рамке */}
          {inputText.trim() ? (
            <Pressable 
              style={styles.sendButton}
              onPress={handleSend}
            >
              <Feather name="arrow-up" size={22} color="#fff" />
            </Pressable>
          ) : (
            <Pressable onPressIn={handleRecordPressIn} onPressOut={handleRecordPressOut} onPress={handleRecordPress}>
              <BlurView intensity={40} tint="dark" style={styles.cameraButtonGlass}>
                <Feather 
                  name={recordMode === 'voice' ? 'mic' : 'camera'} 
                  size={22} 
                  color="#8E8E93" 
                />
              </BlurView>
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
      
      {/* VIDEO NOTE RECORDER */}
      <VideoNoteRecorder
        visible={showVideoRecorder}
        onClose={() => setShowVideoRecorder(false)}
        onVideoRecorded={handleVideoRecorded}
      />
      
      {/* CONFETTI EFFECT */}
      <ConfettiEffect 
        active={showConfetti} 
        count={50}
        duration={2500}
        onComplete={() => setShowConfetti(false)} 
      />
      </ThemedView>
    </GestureHandlerRootView>
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

  // Messages - Telegram December 2025 стиль
  messagesContainer: {
    flex: 1,
    backgroundColor: '#111111', // Чистый чёрный Telegram
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  
  // Date Separator - Telegram December 2025
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateSeparatorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF99',
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

  // Swipe Reply Icon
  swipeReplyIcon: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  swipeReplyIconLeft: {
    left: 12,
  },
  swipeReplyIconRight: {
    right: 12,
  },

  // Message Wrapper - Telegram December 2025
  messageWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginVertical: 1,
  },
  ownMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3390EC', // Telegram blue avatar
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageAvatarText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Message Bubble - Telegram December 2025 iOS style
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.78,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#007AFF', // iOS blue как в Telegram
    borderBottomRightRadius: 6,
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  otherBubble: {
    backgroundColor: '#252528', // Тёмно-серый для входящих
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
  },
  bubbleWithAvatar: {
    marginLeft: 0,
  },
  senderName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#3390EC', // Telegram blue
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16.5,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  editedLabel: {
    fontSize: 13,
    color: '#FFFFFF80',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 5,
  },
  messageTime: {
    fontSize: 13,
    color: '#FFFFFF80',
  },

  // Reply Preview - Telegram December 2025
  replyPreview: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 6,
    marginTop: -4,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    marginLeft: -12,
    paddingLeft: 9,
  },
  replyLine: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#007AFF',
  },
  replyText: {
    fontSize: 14,
    color: '#FFFFFF90',
  },

  // Reactions - Telegram December 2025
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Media
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
  },

  videoNoteContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  videoNoteCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoNote: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoNoteDuration: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  videoNoteDurationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mediaImage: {
    width: 260,
    height: 180,
    maxWidth: 280,
    maxHeight: 400,
    borderRadius: 14,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 220,
    paddingVertical: 4,
  },
  voicePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceWaveformContainer: {
    flex: 1,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 28,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  voiceDuration: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
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

  // Input - Telegram December 2025 (точно как на скрине)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: 'transparent',
  },
  
  // Скрепка в круглом контейнере
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Стеклянная кнопка скрепки
  attachButtonGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 40, 40, 0.5)',
  },
  
  // Поле ввода
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
  },
  
  // Стеклянное поле ввода
  inputWrapperGlass: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 44,
    maxHeight: 120,
    overflow: 'hidden',
    backgroundColor: 'rgba(40, 40, 40, 0.5)',
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    maxHeight: 100,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  
  // Кнопка стикера внутри поля
  stickerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Кнопка отправки
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  
  // Кнопка камеры в квадратной рамке
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(142, 142, 147, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Стеклянная кнопка камеры с рамкой
  cameraButtonGlass: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(142, 142, 147, 0.5)',
    backgroundColor: 'rgba(40, 40, 40, 0.4)',
  },
  
  // Старые стили (для обратной совместимости)
  inputButton: {
    padding: 8,
    borderRadius: 18,
  },
  inputEmojiButton: {
    padding: 6,
    marginLeft: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#3A3A3C',
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
  
  // New Messages Badge
  newMessagesBadge: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  newMessagesBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Scroll Down Button - Telegram style
  scrollDownButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Telegram Bottom Sheet
  bottomSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  bottomSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomSheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomSheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  bottomSheetItem: {
    width: (SCREEN_WIDTH - 40 - 32) / 3, // 3 в ряд
    alignItems: 'center',
    gap: 8,
  },
  bottomSheetIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
