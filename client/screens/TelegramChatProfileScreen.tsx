/**
 * TELEGRAM-STYLE CHAT PROFILE SCREEN
 * 
 * Красивый профиль с анимациями:
 * - Параллакс эффект для аватара
 * - Плавные анимации появления
 * - Красивые карточки медиа статистики
 * - Glassmorphism эффекты
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Animated,
  Switch,
  Dimensions,
  Share,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { Feather, MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { useChatStore, Chat, ChatMember } from '@/store/ChatStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 100;
const AVATAR_SIZE = 110;

// Mock данные для медиа статистики
const MEDIA_STATS = {
  photos: 24,
  videos: 8,
  files: 12,
  voice: 15,
  links: 32,
  gifs: 5,
};

// ==================== ANIMATED MEDIA STAT CARD ====================
interface MediaStatCardProps {
  icon: string;
  label: string;
  count: number;
  color: string;
  delay: number;
  onPress: () => void;
}

const MediaStatCard = React.memo(function MediaStatCard({ 
  icon, label, count, color, delay, onPress 
}: MediaStatCardProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay]);

  return (
    <Animated.View 
      style={[
        styles.mediaStatCard,
        { 
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <Pressable 
        style={({ pressed }) => [
          styles.mediaStatCardInner,
          { backgroundColor: color + '15' },
          pressed && { transform: [{ scale: 0.95 }] }
        ]}
        onPress={onPress}
      >
        <View style={[styles.mediaStatIcon, { backgroundColor: color + '25' }]}>
          <Feather name={icon as any} size={20} color={color} />
        </View>
        <ThemedText style={[styles.mediaStatCount, { color }]}>{count}</ThemedText>
        <ThemedText style={styles.mediaStatLabel}>{label}</ThemedText>
      </Pressable>
    </Animated.View>
  );
});

// ==================== ANIMATED ACTION BUTTON ====================
interface ActionButtonProps {
  icon: string;
  label: string;
  color: string;
  delay: number;
  onPress: () => void;
}

const ActionButton = React.memo(function ActionButton({ 
  icon, label, color, delay, onPress 
}: ActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable 
        style={({ pressed }) => [
          styles.actionButton,
          pressed && { transform: [{ scale: 0.9 }], opacity: 0.8 }
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <LinearGradient
          colors={[color, color + 'CC']}
          style={styles.actionButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name={icon as any} size={22} color="#FFFFFF" />
        </LinearGradient>
        <ThemedText style={styles.actionButtonLabel}>{label}</ThemedText>
      </Pressable>
    </Animated.View>
  );
});

// ==================== ТИПЫ ====================

interface ProfileSection {
  id: string;
  title?: string;
  items: ProfileItem[];
}

interface ProfileItem {
  id: string;
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string | boolean;
  type: 'navigation' | 'toggle' | 'action' | 'info' | 'danger';
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

// ==================== SETTINGS ROW ====================

interface SettingsRowProps {
  item: ProfileItem;
  theme: any;
  isLast: boolean;
}

const SettingsRow = React.memo(function SettingsRow({ item, theme, isLast }: SettingsRowProps) {
  const getIconColor = () => {
    if (item.iconColor) return item.iconColor;
    if (item.type === 'danger') return theme.error;
    return theme.primary;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsRow,
        { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault },
        !isLast && styles.settingsRowBorder,
      ]}
      onPress={item.onPress}
      disabled={item.type === 'toggle' || item.type === 'info'}
    >
      <View style={[styles.settingsIcon, { backgroundColor: getIconColor() + '20' }]}>
        <Feather name={item.icon as any} size={20} color={getIconColor()} />
      </View>
      
      <View style={styles.settingsContent}>
        <ThemedText 
          style={[
            styles.settingsTitle,
            item.type === 'danger' && { color: theme.error },
          ]}
        >
          {item.title}
        </ThemedText>
        {item.subtitle && (
          <ThemedText style={[styles.settingsSubtitle, { color: theme.textSecondary }]}>
            {item.subtitle}
          </ThemedText>
        )}
      </View>
      
      {item.type === 'toggle' && typeof item.value === 'boolean' && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: theme.backgroundSecondary, true: theme.primary + '60' }}
          thumbColor={item.value ? theme.primary : theme.textSecondary}
        />
      )}
      
      {item.type === 'navigation' && (
        <View style={styles.settingsChevron}>
          {item.value && typeof item.value === 'string' && (
            <ThemedText style={[styles.settingsValue, { color: theme.textSecondary }]}>
              {item.value}
            </ThemedText>
          )}
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      )}
      
      {item.type === 'info' && item.value && (
        <ThemedText style={[styles.settingsValue, { color: theme.textSecondary }]}>
          {item.value}
        </ThemedText>
      )}
    </Pressable>
  );
});

// ==================== SECTION ====================

interface SectionProps {
  section: ProfileSection;
  theme: any;
}

const Section = React.memo(function Section({ section, theme }: SectionProps) {
  return (
    <View style={styles.section}>
      {section.title && (
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {section.title}
        </ThemedText>
      )}
      <View style={[styles.sectionContent, { backgroundColor: theme.backgroundDefault }]}>
        {section.items.map((item, index) => (
          <SettingsRow
            key={item.id}
            item={item}
            theme={theme}
            isLast={index === section.items.length - 1}
          />
        ))}
      </View>
    </View>
  );
});

// ==================== MEMBER ROW ====================

interface MemberRowProps {
  member: ChatMember;
  theme: any;
  onPress: () => void;
  isOwner?: boolean;
  isAdmin?: boolean;
}

const MemberRow = React.memo(function MemberRow({ 
  member, 
  theme, 
  onPress,
  isOwner,
  isAdmin,
}: MemberRowProps) {
  const getAvatarColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFB347', '#DDA0DD', '#8B5CF6'];
    const name = member.firstName || member.username || '';
    return colors[name.charCodeAt(0) % colors.length];
  };

  const getRoleBadge = () => {
    if (isOwner || member.role === 'owner') return { text: 'Создатель', color: '#FFB347' };
    if (isAdmin || member.role === 'admin') return { text: 'Админ', color: '#4ECDC4' };
    if (member.role === 'restricted') return { text: 'Ограничен', color: '#FF6B6B' };
    return null;
  };

  const badge = getRoleBadge();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.memberRow,
        { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault },
      ]}
      onPress={onPress}
    >
      <View style={[styles.memberAvatar, { backgroundColor: getAvatarColor() }]}>
        <ThemedText style={styles.memberAvatarText}>
          {(member.firstName || member.username || '?').charAt(0).toUpperCase()}
        </ThemedText>
        {member.isOnline && <View style={styles.memberOnline} />}
      </View>
      
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <ThemedText style={styles.memberName}>
            {member.firstName 
              ? `${member.firstName}${member.lastName ? ` ${member.lastName}` : ''}`
              : member.username || 'Пользователь'
            }
          </ThemedText>
          {badge && (
            <View style={[styles.roleBadge, { backgroundColor: badge.color + '20' }]}>
              <ThemedText style={[styles.roleBadgeText, { color: badge.color }]}>
                {badge.text}
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={[styles.memberStatus, { color: theme.textSecondary }]}>
          {member.isOnline ? 'онлайн' : 'был(а) недавно'}
        </ThemedText>
      </View>
    </Pressable>
  );
});

// ==================== MAIN COMPONENT ====================

interface ChatProfileParams {
  chatId: string;
  otherUserId?: number;
  otherUserName?: string;
  phoneNumber?: string;
  chatType?: 'private' | 'group';
}

export default function TelegramChatProfileScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const params = route.params as ChatProfileParams;
  const chatId = params?.chatId;
  const otherUserName = params?.otherUserName || 'Пользователь';
  const phoneNumber = params?.phoneNumber || 'Скрыт';
  const chatType = params?.chatType || 'private';

  // Store
  const chat = useChatStore(state => state.getChatById(chatId));
  const muteChat = useChatStore(state => state.muteChat);
  const blockUser = useChatStore(state => state.blockUser);
  const archiveChat = useChatStore(state => state.archiveChat);
  const deleteChat = useChatStore(state => state.deleteChat);

  // Анимации
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Анимации при монтировании
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Параллакс эффекты
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const avatarScale = scrollY.interpolate({
    inputRange: [-100, 0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [1.3, 1, 0.6],
    extrapolate: 'clamp',
  });
  
  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [0, -30],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT - 50, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  
  const contentOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Состояния
  const [isMuted, setIsMuted] = useState(chat?.isMuted || false);
  const [isBlocked, setIsBlocked] = useState(chat?.isBlocked || false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [customName, setCustomName] = useState(otherUserName);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);

  // Фоны для чата
  const chatBackgrounds: Array<{id: string; color?: string; gradient?: [string, string]; name: string}> = [
    { id: '1', color: '#0D0D0D', name: 'Тёмный' },
    { id: '2', color: '#1C1C1E', name: 'Серый' },
    { id: '3', color: '#2D2D30', name: 'Графит' },
    { id: '4', gradient: ['#667eea', '#764ba2'], name: 'Градиент' },
    { id: '5', gradient: ['#f093fb', '#f5576c'], name: 'Розовый' },
    { id: '6', gradient: ['#4facfe', '#00f2fe'], name: 'Голубой' },
  ];

  // Создаём фиктивный объект чата если нет в store
  const displayChat = chat || {
    id: chatId,
    name: otherUserName,
    type: chatType,
    otherUser: {
      userId: params?.otherUserId,
      firstName: otherUserName,
      isOnline: false,
    },
    memberCount: chatType === 'group' ? 25 : undefined,
  } as any;

  // Обработчики
  const handleMuteToggle = (value: boolean) => {
    setIsMuted(value);
    muteChat(chatId, value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBlockUser = () => {
    Alert.alert(
      isBlocked ? 'Разблокировать' : 'Заблокировать',
      isBlocked 
        ? `Разблокировать ${customName}?`
        : `Заблокировать ${customName}? Пользователь не сможет отправлять вам сообщения.`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: isBlocked ? 'Разблокировать' : 'Заблокировать',
          style: isBlocked ? 'default' : 'destructive',
          onPress: () => {
            setIsBlocked(!isBlocked);
            if (displayChat.otherUser?.userId) {
              blockUser(displayChat.otherUser.userId, !isBlocked);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleDeleteChat = () => {
    Alert.alert(
      'Удалить чат',
      'Вы уверены? История чата будет удалена.',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            deleteChat(chatId);
            navigation.goBack();
            navigation.goBack();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Контакт: ${customName}${phoneNumber !== 'Скрыт' ? `\n${phoneNumber}` : ''}`,
      });
      setShowMoreMenu(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRename = () => {
    setShowMoreMenu(false);
    setShowRenameModal(true);
  };

  const handleSaveRename = () => {
    // Здесь сохраняем новое имя
    setShowRenameModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleChangeBackground = () => {
    setShowMoreMenu(false);
    setShowBackgroundPicker(true);
  };

  const handleSelectBackground = (bg: any) => {
    // Здесь сохраняем выбранный фон
    setShowBackgroundPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Фон изменён', 'Новый фон чата применён');
  };

  // Секции для приватного чата
  const getPrivateChatSections = (): ProfileSection[] => [
    {
      id: 'info',
      items: [
        {
          id: 'phone',
          icon: 'phone',
          title: 'Телефон',
          subtitle: phoneNumber !== 'Скрыт' ? 'Нажмите чтобы позвонить' : undefined,
          type: 'info',
          value: phoneNumber,
        },
        {
          id: 'username',
          icon: 'at-sign',
          title: 'Имя пользователя',
          type: 'info',
          value: `@${customName.toLowerCase().replace(/\s+/g, '_')}`,
        },
        {
          id: 'bio',
          icon: 'info',
          title: 'О себе',
          type: 'info',
          value: 'Ученик школы',
        },
      ],
    },
    {
      id: 'notifications',
      title: 'УВЕДОМЛЕНИЯ',
      items: [
        {
          id: 'mute',
          icon: isMuted ? 'bell-off' : 'bell',
          title: 'Уведомления',
          subtitle: isMuted ? 'Выключены' : 'Включены',
          type: 'toggle',
          value: !isMuted,
          onToggle: (val) => handleMuteToggle(!val),
        },
      ],
    },
    {
      id: 'privacy',
      title: 'КОНФИДЕНЦИАЛЬНОСТЬ',
      items: [
        {
          id: 'block',
          icon: 'slash',
          iconColor: theme.error,
          title: isBlocked ? 'Разблокировать' : 'Заблокировать',
          subtitle: isBlocked ? 'Пользователь заблокирован' : undefined,
          type: 'action',
          onPress: handleBlockUser,
        },
      ],
    },
    {
      id: 'media',
      title: 'МЕДИА И ФАЙЛЫ',
      items: [
        {
          id: 'media',
          icon: 'image',
          title: 'Фото и видео',
          type: 'navigation',
          value: `${MEDIA_STATS.photos} фото, ${MEDIA_STATS.videos} видео`,
          onPress: () => Alert.alert('Медиафайлы', `Фото: ${MEDIA_STATS.photos}\nВидео: ${MEDIA_STATS.videos}`),
        },
        {
          id: 'files',
          icon: 'file',
          title: 'Файлы',
          type: 'navigation',
          value: `${MEDIA_STATS.files} файлов`,
          onPress: () => Alert.alert('Файлы', `Всего файлов: ${MEDIA_STATS.files}`),
        },
        {
          id: 'links',
          icon: 'link',
          title: 'Ссылки',
          type: 'navigation',
          value: `${MEDIA_STATS.links} ссылок`,
          onPress: () => Alert.alert('Ссылки', `Всего ссылок: ${MEDIA_STATS.links}`),
        },
        {
          id: 'voice',
          icon: 'mic',
          title: 'Голосовые сообщения',
          type: 'navigation',
          value: `${MEDIA_STATS.voice} сообщений`,
          onPress: () => Alert.alert('Голосовые', `Всего голосовых: ${MEDIA_STATS.voice}`),
        },
        {
          id: 'gifs',
          icon: 'film',
          title: 'GIF-анимации',
          type: 'navigation',
          value: `${MEDIA_STATS.gifs} гифок`,
          onPress: () => Alert.alert('GIF', `Всего гифок: ${MEDIA_STATS.gifs}`),
        },
      ],
    },
    {
      id: 'actions',
      items: [
        {
          id: 'share',
          icon: 'share',
          title: 'Поделиться контактом',
          type: 'action',
          onPress: handleShare,
        },
        {
          id: 'archive',
          icon: 'archive',
          title: 'Архивировать чат',
          type: 'action',
          onPress: () => {
            archiveChat(chatId, true);
            navigation.goBack();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ],
    },
    {
      id: 'danger',
      items: [
        {
          id: 'delete',
          icon: 'trash-2',
          iconColor: theme.error,
          title: 'Удалить переписку',
          type: 'danger',
          onPress: handleDeleteChat,
        },
      ],
    },
  ];

  // Секции для группы
  const getGroupChatSections = (): ProfileSection[] => [
    {
      id: 'info',
      items: [
        {
          id: 'members',
          icon: 'users',
          title: 'Участники',
          type: 'navigation',
          value: displayChat.memberCount?.toString() || '0',
          onPress: () => {},
        },
        {
          id: 'admins',
          icon: 'shield',
          title: 'Администраторы',
          type: 'navigation',
          onPress: () => {},
        },
        {
          id: 'link',
          icon: 'link',
          title: 'Ссылка на группу',
          type: 'navigation',
          onPress: () => {},
        },
      ],
    },
    {
      id: 'notifications',
      title: 'УВЕДОМЛЕНИЯ',
      items: [
        {
          id: 'mute',
          icon: isMuted ? 'bell-off' : 'bell',
          title: 'Уведомления',
          type: 'toggle',
          value: !isMuted,
          onToggle: (val) => handleMuteToggle(!val),
        },
      ],
    },
    {
      id: 'permissions',
      title: 'ПРАВА',
      items: [
        {
          id: 'permissions',
          icon: 'lock',
          title: 'Права участников',
          type: 'navigation',
          onPress: () => {},
        },
        {
          id: 'banned',
          icon: 'slash',
          title: 'Заблокированные',
          type: 'navigation',
          onPress: () => {},
        },
      ],
    },
    {
      id: 'media',
      title: 'МЕДИА',
      items: [
        {
          id: 'media',
          icon: 'image',
          title: 'Медиа',
          type: 'navigation',
          onPress: () => {},
        },
        {
          id: 'files',
          icon: 'file',
          title: 'Файлы',
          type: 'navigation',
          onPress: () => {},
        },
      ],
    },
    {
      id: 'danger',
      items: [
        {
          id: 'leave',
          icon: 'log-out',
          iconColor: theme.error,
          title: 'Покинуть группу',
          type: 'danger',
          onPress: () => {},
        },
      ],
    },
  ];

  const sections = displayChat.type === 'group' ? getGroupChatSections() : getPrivateChatSections();

  const getAvatarColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFB347', '#DDA0DD', '#8B5CF6'];
    return colors[customName.charCodeAt(0) % colors.length];
  };

  // Рендер модального меню с 3 точками
  const renderMoreMenu = () => (
    <Modal
      visible={showMoreMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMoreMenu(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setShowMoreMenu(false)}
      >
        <View style={[styles.moreMenu, { backgroundColor: theme.backgroundDefault }]}>
          <Pressable 
            style={styles.moreMenuItem}
            onPress={handleChangeBackground}
          >
            <Feather name="image" size={20} color={theme.primary} />
            <ThemedText style={styles.moreMenuText}>Поменять фон чата</ThemedText>
          </Pressable>
          
          <Pressable 
            style={styles.moreMenuItem}
            onPress={handleShare}
          >
            <Feather name="share-2" size={20} color={theme.primary} />
            <ThemedText style={styles.moreMenuText}>Поделиться контактом</ThemedText>
          </Pressable>
          
          <Pressable 
            style={styles.moreMenuItem}
            onPress={handleRename}
          >
            <Feather name="edit-2" size={20} color={theme.primary} />
            <ThemedText style={styles.moreMenuText}>Переименовать</ThemedText>
          </Pressable>
          
          <View style={[styles.moreMenuDivider, { backgroundColor: theme.backgroundSecondary }]} />
          
          <Pressable 
            style={styles.moreMenuItem}
            onPress={() => {
              setShowMoreMenu(false);
              handleDeleteChat();
            }}
          >
            <Feather name="trash-2" size={20} color="#FF6B6B" />
            <ThemedText style={[styles.moreMenuText, { color: '#FF6B6B' }]}>
              Удалить переписку
            </ThemedText>
          </Pressable>
          
          <Pressable 
            style={styles.moreMenuItem}
            onPress={() => {
              setShowMoreMenu(false);
              handleBlockUser();
            }}
          >
            <Feather name="slash" size={20} color="#FF6B6B" />
            <ThemedText style={[styles.moreMenuText, { color: '#FF6B6B' }]}>
              {isBlocked ? 'Разблокировать' : 'Заблокировать'}
            </ThemedText>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  // Рендер модального окна переименования
  const renderRenameModal = () => (
    <Modal
      visible={showRenameModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRenameModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setShowRenameModal(false)}
      >
        <View style={[styles.renameModal, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={styles.renameTitle}>Переименовать контакт</ThemedText>
          <TextInput
            style={[styles.renameInput, { 
              backgroundColor: theme.backgroundSecondary, 
              color: theme.text 
            }]}
            value={customName}
            onChangeText={setCustomName}
            placeholder="Введите имя"
            placeholderTextColor={theme.textSecondary}
            autoFocus
          />
          <View style={styles.renameButtons}>
            <Pressable 
              style={[styles.renameButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => setShowRenameModal(false)}
            >
              <ThemedText>Отмена</ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.renameButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveRename}
            >
              <ThemedText style={{ color: '#fff' }}>Сохранить</ThemedText>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  // Рендер модального окна выбора фона
  const renderBackgroundPicker = () => (
    <Modal
      visible={showBackgroundPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBackgroundPicker(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setShowBackgroundPicker(false)}
      >
        <View style={[styles.backgroundModal, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={styles.backgroundTitle}>Выберите фон чата</ThemedText>
          <View style={styles.backgroundGrid}>
            {chatBackgrounds.map((bg) => (
              <Pressable
                key={bg.id}
                style={styles.backgroundItem}
                onPress={() => handleSelectBackground(bg)}
              >
                {bg.gradient ? (
                  <LinearGradient
                    colors={bg.gradient}
                    style={styles.backgroundPreview}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                ) : (
                  <View style={[styles.backgroundPreview, { backgroundColor: bg.color }]} />
                )}
                <ThemedText style={styles.backgroundName}>{bg.name}</ThemedText>
              </Pressable>
            ))}
          </View>
          <Pressable 
            style={[styles.backgroundCloseButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowBackgroundPicker(false)}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Закрыть</ThemedText>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Модальные окна */}
      {renderMoreMenu()}
      {renderRenameModal()}
      {renderBackgroundPicker()}

      {/* Градиентный фон хедера */}
      <Animated.View style={[styles.headerBackground, { height: headerHeight }]}>
        <LinearGradient
          colors={[getAvatarColor(), getAvatarColor() + '80', theme.backgroundDefault]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Фиксированный Header */}
      <Animated.View 
        style={[
          styles.fixedHeader,
          { 
            paddingTop: insets.top,
            opacity: headerOpacity,
          },
        ]}
      >
        <View style={styles.fixedHeaderContent}>
          <Pressable 
            onPress={() => navigation.goBack()} 
            style={styles.headerButton}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <ThemedText style={styles.fixedHeaderTitle} numberOfLines={1}>
            {customName}
          </ThemedText>
          <Pressable 
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowMoreMenu(true);
            }}
          >
            <Feather name="more-vertical" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Profile Header с параллакс аватаром */}
        <Animated.View 
          style={[
            styles.profileHeader, 
            { 
              paddingTop: insets.top + 20,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Кнопки навигации */}
          <View style={[styles.headerNav, { top: insets.top + 8 }]}>
            <Pressable 
              style={styles.navButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable 
              style={styles.navButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowMoreMenu(true);
              }}
            >
              <Feather name="more-vertical" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Аватар с параллаксом */}
          <Animated.View 
            style={[
              styles.avatarContainer,
              {
                transform: [
                  { scale: avatarScale },
                  { translateY: avatarTranslateY }
                ]
              }
            ]}
          >
            <LinearGradient
              colors={[getAvatarColor(), getAvatarColor() + 'AA']}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ThemedText style={styles.avatarText}>
                {customName.charAt(0).toUpperCase()}
              </ThemedText>
            </LinearGradient>
            {/* Онлайн индикатор */}
            {displayChat.otherUser?.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </Animated.View>

          {/* Имя */}
          <ThemedText style={styles.profileName}>{customName}</ThemedText>
          
          {/* Телефон */}
          {chatType === 'private' && phoneNumber !== 'Скрыт' && (
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Позвонить', phoneNumber);
              }}
            >
              <ThemedText style={[styles.profilePhone, { color: theme.primary }]}>
                {phoneNumber}
              </ThemedText>
            </Pressable>
          )}
          
          {/* Статус */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: displayChat.otherUser?.isOnline ? '#4ECDC4' : '#8E8E93' }
            ]} />
            <ThemedText style={[styles.profileStatus, { color: theme.textSecondary }]}>
              {displayChat.type === 'private' 
                ? (displayChat.otherUser?.isOnline ? 'онлайн' : 'был(а) недавно')
                : `${displayChat.memberCount || 0} участников`
              }
            </ThemedText>
          </View>
        </Animated.View>

        {/* Быстрые действия */}
        <View style={styles.actionsRow}>
          <ActionButton 
            icon="message-circle" 
            label="Написать" 
            color="#8B5CF6"
            delay={100}
            onPress={() => navigation.goBack()}
          />
          <ActionButton 
            icon="phone" 
            label="Позвонить" 
            color="#4ECDC4"
            delay={200}
            onPress={() => Alert.alert('Звонок', 'Функция в разработке')}
          />
          <ActionButton 
            icon="video" 
            label="Видео" 
            color="#45B7D1"
            delay={300}
            onPress={() => Alert.alert('Видеозвонок', 'Функция в разработке')}
          />
          <ActionButton 
            icon={isMuted ? 'bell-off' : 'bell'} 
            label={isMuted ? 'Вкл.' : 'Откл.'}
            color={isMuted ? '#8E8E93' : '#FFB347'}
            delay={400}
            onPress={() => handleMuteToggle(!isMuted)}
          />
        </View>

        {/* Медиа статистика */}
        {chatType === 'private' && (
          <View style={[styles.mediaSection, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.sectionHeader, { color: theme.textSecondary }]}>
              МЕДИА И ФАЙЛЫ
            </ThemedText>
            <View style={styles.mediaStatsGrid}>
              <MediaStatCard 
                icon="image" 
                label="Фото" 
                count={MEDIA_STATS.photos}
                color="#8B5CF6"
                delay={100}
                onPress={() => Alert.alert('Фото', `Всего: ${MEDIA_STATS.photos}`)}
              />
              <MediaStatCard 
                icon="film" 
                label="Видео" 
                count={MEDIA_STATS.videos}
                color="#4ECDC4"
                delay={150}
                onPress={() => Alert.alert('Видео', `Всего: ${MEDIA_STATS.videos}`)}
              />
              <MediaStatCard 
                icon="file" 
                label="Файлы" 
                count={MEDIA_STATS.files}
                color="#45B7D1"
                delay={200}
                onPress={() => Alert.alert('Файлы', `Всего: ${MEDIA_STATS.files}`)}
              />
              <MediaStatCard 
                icon="mic" 
                label="Голос" 
                count={MEDIA_STATS.voice}
                color="#FF6B6B"
                delay={250}
                onPress={() => Alert.alert('Голосовые', `Всего: ${MEDIA_STATS.voice}`)}
              />
              <MediaStatCard 
                icon="link" 
                label="Ссылки" 
                count={MEDIA_STATS.links}
                color="#FFB347"
                delay={300}
                onPress={() => Alert.alert('Ссылки', `Всего: ${MEDIA_STATS.links}`)}
              />
              <MediaStatCard 
                icon="zap" 
                label="GIF" 
                count={MEDIA_STATS.gifs}
                color="#F093FB"
                delay={350}
                onPress={() => Alert.alert('GIF', `Всего: ${MEDIA_STATS.gifs}`)}
              />
            </View>
          </View>
        )}

        {/* Секции настроек */}
        {sections.map((section) => (
          <Section key={section.id} section={section} theme={theme} />
        ))}
      </Animated.ScrollView>
    </ThemedView>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  
  // Header Background
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  
  // Fixed Header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  fixedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  fixedHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerNav: {
    position: 'absolute',
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  
  // Avatar
  avatarContainer: {
    marginTop: 40,
    marginBottom: 16,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarText: {
    fontSize: 44,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ECDC4',
    borderWidth: 4,
    borderColor: '#0D0D0D',
  },
  
  // Profile Info
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  profilePhone: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profileStatus: {
    fontSize: 15,
  },
  
  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  
  // Media Section
  mediaSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  mediaStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaStatCard: {
    width: (SCREEN_WIDTH - 32 - 32 - 20) / 3,
  },
  mediaStatCardInner: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  mediaStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaStatCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  mediaStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  
  // Sections
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionContent: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Settings Row
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  settingsRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
  },
  settingsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  settingsChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsValue: {
    fontSize: 15,
  },

  // Member Row
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  memberOnline: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#31A24C',
    borderWidth: 2,
    borderColor: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // More Menu
  moreMenu: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  moreMenuText: {
    fontSize: 16,
  },
  moreMenuDivider: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 4,
  },

  // Rename Modal
  renameModal: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  renameInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  renameButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  renameButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  // Background Picker Modal
  backgroundModal: {
    width: SCREEN_WIDTH - 32,
    maxHeight: '70%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backgroundTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  backgroundItem: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 3,
  },
  backgroundPreview: {
    width: 70,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  backgroundName: {
    fontSize: 12,
  },
  backgroundCloseButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
