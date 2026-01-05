import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Image,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GradientAvatarPlaceholder } from "@/components/GradientAvatarPlaceholder";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import ChatService, { PrivateChat } from "@/services/ChatService";
import { getApiUrl } from "@/lib/query-client";

// Константы для свайпа (улучшенные как в Qt)
const SWIPE_THRESHOLD = 60;           // Порог для срабатывания действия
const SWIPE_ACTION_WIDTH = 80;        // Ширина области действия
const MAX_SWIPE_OFFSET = 120;         // Максимальное смещение
const HORIZONTAL_THRESHOLD = 10;      // Минимальное смещение для определения направления
const DIRECTION_LOCK_RATIO = 1.5;     // Соотношение для блокировки направления
const ANIMATION_DURATION = 150;       // Длительность анимации

// Компонент свайпа для элемента чата с улучшенной обработкой жестов
interface SwipeableChatRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onPin?: () => void;
  onMute?: () => void;
  onSwipeStart?: () => void;  // Уведомление о начале свайпа
  onSwipeEnd?: () => void;    // Уведомление об окончании свайпа
  theme: any;
}

function SwipeableChatRow({ children, onDelete, onPin, onMute, onSwipeStart, onSwipeEnd, theme }: SwipeableChatRowProps) {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const leftOpacity = React.useRef(new Animated.Value(0)).current;
  const rightOpacity = React.useRef(new Animated.Value(0)).current;
  const leftScale = React.useRef(new Animated.Value(0.8)).current;
  const rightScale = React.useRef(new Animated.Value(0.8)).current;
  
  const hasTriggeredHaptic = React.useRef(false);
  const isSwiping = React.useRef(false);
  const isDirectionLocked = React.useRef(false);

  // Эластичное сопротивление за пределами лимита
  const applyElasticResistance = (offset: number): number => {
    if (Math.abs(offset) <= MAX_SWIPE_OFFSET) {
      return offset;
    }
    const overflow = Math.abs(offset) - MAX_SWIPE_OFFSET;
    const resistance = MAX_SWIPE_OFFSET + (overflow * 0.3);
    return offset > 0 ? resistance : -resistance;
  };

  const resetAnimation = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        tension: 300,
        friction: 25,
        useNativeDriver: true,
      }),
      Animated.timing(leftOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(rightOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(leftScale, {
        toValue: 0.8,
        tension: 300,
        friction: 25,
        useNativeDriver: true,
      }),
      Animated.spring(rightScale, {
        toValue: 0.8,
        tension: 300,
        friction: 25,
        useNativeDriver: true,
      }),
    ]).start();
    
    isSwiping.current = false;
    isDirectionLocked.current = false;
    onSwipeEnd?.();
  }, [translateX, leftOpacity, rightOpacity, leftScale, rightScale, onSwipeEnd]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        // ГИСТЕРЕЗИС: Определяем направление жеста
        // Горизонтальное движение должно преобладать над вертикальным
        if (absDx > HORIZONTAL_THRESHOLD && absDx > absDy * DIRECTION_LOCK_RATIO) {
          isSwiping.current = true;
          isDirectionLocked.current = true;
          onSwipeStart?.(); // Уведомляем о начале свайпа
          return true;
        }
        return false;
      },
      
      onPanResponderGrant: () => {
        hasTriggeredHaptic.current = false;
        isSwiping.current = false;
        isDirectionLocked.current = false;
      },
      
      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (!isSwiping.current) return;
        
        const { dx } = gestureState;
        
        // Применяем эластичное сопротивление
        const elasticDx = applyElasticResistance(dx);
        translateX.setValue(elasticDx);
        
        // Показываем действия с анимацией масштаба
        if (dx < -10) {
          const progress = Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1);
          leftOpacity.setValue(progress);
          rightOpacity.setValue(0);
          leftScale.setValue(0.8 + (progress * 0.4));
        } else if (dx > 10) {
          const progress = Math.min(dx / SWIPE_THRESHOLD, 1);
          rightOpacity.setValue(progress);
          leftOpacity.setValue(0);
          rightScale.setValue(0.8 + (progress * 0.4));
        } else {
          leftOpacity.setValue(0);
          rightOpacity.setValue(0);
          leftScale.setValue(0.8);
          rightScale.setValue(0.8);
        }
        
        // Haptic при достижении порога
        if (Math.abs(dx) >= SWIPE_THRESHOLD && !hasTriggeredHaptic.current) {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          hasTriggeredHaptic.current = true;
        }
      },
      
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (!isSwiping.current) return;
        
        const { dx } = gestureState;
        
        if (dx <= -SWIPE_THRESHOLD && onDelete) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          onDelete();
        } else if (dx >= SWIPE_THRESHOLD && onPin) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          onPin();
        }
        
        resetAnimation();
      },
      
      onPanResponderTerminate: () => {
        resetAnimation();
      },
      
      // НЕ отдаём контроль при активном свайпе - блокируем вертикальный скролл
      onPanResponderTerminationRequest: () => !isSwiping.current,
    })
  ).current;

  return (
    <View style={swipeStyles.container}>
      {/* Левое действие (удалить) - справа */}
      <Animated.View
        style={[
          swipeStyles.actionContainer,
          swipeStyles.leftAction,
          { opacity: leftOpacity },
        ]}
      >
        <Animated.View 
          style={[
            swipeStyles.actionButton, 
            { backgroundColor: '#FF3B30', transform: [{ scale: leftScale }] }
          ]}
        >
          <Feather name="trash-2" size={22} color="#FFF" />
          <ThemedText style={swipeStyles.actionText}>Удалить</ThemedText>
        </Animated.View>
      </Animated.View>

      {/* Правое действие (закрепить) - слева */}
      <Animated.View
        style={[
          swipeStyles.actionContainer,
          swipeStyles.rightAction,
          { opacity: rightOpacity },
        ]}
      >
        <Animated.View 
          style={[
            swipeStyles.actionButton, 
            { backgroundColor: theme.primary, transform: [{ scale: rightScale }] }
          ]}
        >
          <Feather name="bookmark" size={22} color="#FFF" />
          <ThemedText style={swipeStyles.actionText}>Закрепить</ThemedText>
        </Animated.View>
      </Animated.View>

      {/* Контент */}
      <Animated.View
        style={[
          swipeStyles.content,
          { 
            transform: [{ translateX }],
            backgroundColor: theme.backgroundDefault,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    // Фиксированная высота как в Telegram (72px)
    minHeight: 72,
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SWIPE_ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAction: {
    right: 0,
  },
  rightAction: {
    left: 0,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    width: '100%',
    height: '100%',
    gap: 4,
  },
  actionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  content: {
    zIndex: 1,
  },
});

// Хелпер для преобразования относительных URL в абсолютные
const resolveAvatarUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    return new URL(trimmed, getApiUrl()).toString();
  } catch {
    return trimmed;
  }
};

export default function ChatsListScreen() {
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [chats, setChats] = useState<PrivateChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Загружаем чаты при фокусе на экран
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadChats();
      }
    }, [user?.id])
  );

  const loadChats = async () => {
    try {
      if (!user?.id) return;
      const userChats = await ChatService.getUserChats(user.id);
      setChats(userChats);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось загрузить чаты");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  // ФИЛЬТРАЦИЯ ПО ПОИСКУ
  const filteredChats = searchText.trim() === "" 
    ? chats 
    : chats.filter((chat) => {
        const search = searchText.toLowerCase();
        const user = chat.otherUser;
        if (!user) return false;
        
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
        return (
          fullName.includes(search) ||
          (user.username?.toLowerCase().includes(search)) ||
          (user.bio?.toLowerCase().includes(search))
        );
      });

  const openChat = (chat: PrivateChat) => {
    if (!chat.otherUser) return;

    (navigation.navigate as any)("ChatNew", {
      chatId: chat.id,
      otherUserId: chat.otherUser.userId,
      otherUserName: chat.otherUser.username,
      otherUserAvatar: chat.otherUser.avatarUrl,
      isOnline: chat.otherUser.isOnline ?? false,
    });
  };

  const handleDeleteChat = (chatId: number) => {
    Alert.alert(
      "Удалить чат",
      "Вы уверены, что хотите удалить этот чат?",
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Удалить", 
          style: "destructive",
          onPress: () => {
            // TODO: Реализовать удаление чата
            setChats(prev => prev.filter(c => c.id !== chatId));
          }
        },
      ]
    );
  };

  const handlePinChat = (chatId: number) => {
    // TODO: Реализовать закрепление чата
    Alert.alert("Закреплено", "Чат закреплён");
  };

  const renderChatItem = ({ item }: { item: PrivateChat }) => {
    const otherUser = item.otherUser;
    if (!otherUser) return null;

    const formattedTime = item.lastMessageAt
      ? new Date(item.lastMessageAt).toLocaleTimeString("ru", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <SwipeableChatRow
        onDelete={() => handleDeleteChat(item.id)}
        onPin={() => handlePinChat(item.id)}
        theme={theme}
      >
        <Pressable
          style={({ pressed }) => [
            styles.chatItem,
            { 
              backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault,
            },
          ]}
          onPress={() => openChat(item)}
        >
          {/* АВАТАР С ОНЛАЙН СТАТУСОМ */}
          <View style={styles.avatarSection}>
            {(() => {
              const avatarUrl = resolveAvatarUrl(otherUser.avatarUrl);
              if (avatarUrl) {
                return (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                  />
                );
              }
              return (
                <GradientAvatarPlaceholder
                  firstName={otherUser.firstName}
                  lastName={otherUser.lastName}
                  username={otherUser.username}
                  size={52}
                />
              );
            })()}
            
            {/* ЗЕЛЕНАЯ ТОЧКА ОНЛАЙНА */}
            {otherUser.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          {/* ОСНОВНОЙ КОНТЕНТ */}
          <View style={styles.chatMainContent}>
            {/* ВЕРХНЯЯ СТРОКА: ИМЯ И ВРЕМЯ */}
            <View style={styles.chatHeaderRow}>
              <ThemedText 
                style={styles.chatUsername} 
                numberOfLines={1}
              >
                {otherUser.firstName 
                  ? `${otherUser.firstName}${otherUser.lastName ? ` ${otherUser.lastName}` : ""}` 
                  : otherUser.username 
                    ? `@${otherUser.username}` 
                    : "Пользователь"}
              </ThemedText>
              <ThemedText style={styles.chatTime}>
                {formattedTime}
              </ThemedText>
            </View>

            {/* НИЖНЯЯ СТРОКА: СТАТУС/БИО */}
            <ThemedText
              style={[styles.chatStatus, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {otherUser.status || otherUser.bio || "Нет статуса"}
            </ThemedText>
          </View>

          {/* РАЗДЕЛИТЕЛЬ */}
          <View
            style={[
              styles.separator,
              { backgroundColor: `${theme.textSecondary}20` },
            ]}
          />
        </Pressable>
      </SwipeableChatRow>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* HEADER - TELEGRAM STYLE WITH PURPLE ACCENTS */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.backgroundDefault,
            paddingTop: Math.max(insets.top, 8),
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => console.log('Edit mode')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ThemedText style={[styles.headerEditButton, { color: theme.primary }]}>
              Edit
            </ThemedText>
          </Pressable>
        </View>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Feather name="folder" size={18} color={theme.text} style={{ marginRight: 6 }} />
            <ThemedText style={styles.headerTitle}>Chats</ThemedText>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {/* Search button */}
          <Pressable
            style={[styles.headerIconButton]}
            onPress={() => setIsSearchMode(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="search" size={22} color={theme.primary} />
          </Pressable>
          
          {/* New chat button */}
          <Pressable
            style={[styles.headerIconButton]}
            onPress={() => navigation.navigate("NewChat" as never)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="edit" size={22} color={theme.primary} />
          </Pressable>
        </View>
      </View>

      {/* SEARCH MODE HEADER */}
      {isSearchMode && (
        <View
          style={[
            styles.searchHeader,
            {
              backgroundColor: theme.backgroundDefault,
              paddingTop: Math.max(insets.top, 8),
            },
          ]}
        >
          <Pressable
            style={styles.searchBackButton}
            onPress={() => {
              setIsSearchMode(false);
              setSearchText("");
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={20} color={theme.primary} />
          </Pressable>
          
          <View
            style={[
              styles.searchInputContainer,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="search" size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Поиск..."
              placeholderTextColor={theme.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText("")}>
                <Feather name="x" size={16} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* СПИСОК ЧАТОВ */}
      {loading ? (
        <View style={[styles.centerContainer]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.chatsList}
          contentContainerStyle={[
            styles.chatsContent,
            filteredChats.length === 0 && styles.emptyContainer,
          ]}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ right: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather
                name="message-circle"
                size={56}
                color={theme.textSecondary}
              />
              <ThemedText style={styles.emptyText}>Нет чатов</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Нажми + чтобы начать разговор
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Floating action button - new chat */}
      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate("NewChat" as never)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="edit" size={24} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  
  // HEADER
  header: { 
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  headerLeft: {
    flex: 1,
  },
  headerEditButton: {
    fontSize: 17,
    fontWeight: "400",
  },
  headerCenter: {
    flex: 2,
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "600",
  },
  headerRight: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 20,
  },
  
  // SEARCH HEADER
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  searchBackButton: { 
    padding: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  
  // CHATS LIST
  chatsList: { 
    flex: 1 
  },
  chatsContent: { 
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // CHAT ITEM (TELEGRAM STYLE) - Фиксированная высота 72px как в Telegram
  chatItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72, // Фиксированная высота как в Telegram
  },
  
  // AVATAR SECTION
  avatarSection: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#31A24C",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  
  // CHAT MAIN CONTENT
  chatMainContent: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatUsername: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  chatTime: {
    fontSize: 13,
    opacity: 0.6,
    marginLeft: 8,
  },
  chatStatus: {
    fontSize: 14,
    opacity: 0.7,
  },
  
  // SEPARATOR
  separator: {
    position: "absolute",
    bottom: 0,
    left: 68,
    right: 0,
    height: 0.5,
  },
  
  // EMPTY STATE
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },

  // FAB (FLOATING ACTION BUTTON)
  fab: { 
    position: "absolute", 
    bottom: 24, 
    right: 24, 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 12,
  },
});
