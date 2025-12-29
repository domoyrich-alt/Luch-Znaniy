/**
 * TELEGRAM-STYLE USER PROFILE SCREEN
 * Чистый минималистичный дизайн как в Telegram
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Share,
  StatusBar,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import { getApiUrl } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Цвета в стиле Telegram
const COLORS = {
  primary: "#3390EC",
  background: "#000000",
  cardBg: "#1C1C1E",
  inputBg: "#2C2C2E",
  textPrimary: "#FFFFFF",
  textSecondary: "#8E8E93",
  textLink: "#3390EC",
  border: "#38383A",
  online: "#34C759",
  destructive: "#FF3B30",
};

type UserProfileRouteProp = RouteProp<HomeStackParamList, "UserProfile">;

interface UserProfile {
  userId: number;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  birthday?: string | null;
  isContact?: boolean;
}

interface ReceivedGift {
  id: number;
  senderId: number | null;
  receiverId: number;
  giftTypeId: number;
  message: string | null;
  isAnonymous: boolean;
  isOpened: boolean;
  isPrivate: boolean;
  sentAt: string;
  giftType?: {
    id: number;
    name: string;
    emoji: string;
    price: number;
    rarity: string;
    description: string;
  };
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string;
  };
}

// ==================== TAB TYPES ====================
type TabType = "saved" | "gifts" | "links" | "gifs";

export default function TelegramUserProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<UserProfileRouteProp>();
  const { user: currentUser } = useAuth();

  const { userId, firstName, lastName, username } = route.params;
  const isOwnProfile = currentUser?.id === userId;

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [gifts, setGifts] = useState<ReceivedGift[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [showGiftDetail, setShowGiftDetail] = useState(false);
  const [selectedGift, setSelectedGift] = useState<ReceivedGift | null>(null);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showUsernameSheet, setShowUsernameSheet] = useState(false);
  const [showGiftActions, setShowGiftActions] = useState(false);

  const displayName = `${firstName} ${lastName}`.trim() || "Пользователь";
  const normalizedUsername = username?.replace(/^@+/, "") || "";

  // Загрузка профиля
  useEffect(() => {
    loadProfile();
    loadGifts();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await apiGet<UserProfile>(`/api/user/${userId}/profile`);
      setProfile(data);
    } catch (error) {
      console.error("Load profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGifts = async () => {
    try {
      setLoadingGifts(true);
      const data = await apiGet<ReceivedGift[]>(`/api/user/${userId}/gifts/received`);
      setGifts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load gifts error:", error);
    } finally {
      setLoadingGifts(false);
    }
  };

  const resolveUrl = (url?: string | null) => {
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

  const avatarUrl = resolveUrl(profile?.avatarUrl);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as any).navigate("EditProfile");
  };

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (navigation as any).navigate("ChatsTab", {
      screen: "TelegramChat",
      params: {
        recipientId: userId,
        recipientName: displayName,
      },
    });
  };

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Звонок", "Функция в разработке");
  };

  const handleVideoCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Видеозвонок", "Функция в разработке");
  };

  const handleMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMoreSheet(true);
  };

  const handleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMoreSheet(false);
    Alert.alert("Уведомления", "Уведомления отключены");
  };

  const handleBlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMoreSheet(false);
    Alert.alert(
      "Заблокировать",
      `Заблокировать ${displayName}?`,
      [
        { text: "Отмена", style: "cancel" },
        { text: "Заблокировать", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const handleDeleteChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMoreSheet(false);
    Alert.alert(
      "Удалить чат",
      "Вы уверены?",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Удалить", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const handleUsernamePress = () => {
    if (normalizedUsername) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowUsernameSheet(true);
    }
  };

  const handleCopyUsername = async () => {
    if (normalizedUsername) {
      await Clipboard.setStringAsync(`@${normalizedUsername}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowUsernameSheet(false);
    }
  };

  const handleShareUsername = async () => {
    if (normalizedUsername) {
      await Share.share({ message: `https://t.me/${normalizedUsername}` });
      setShowUsernameSheet(false);
    }
  };

  const handleGiftPress = (gift: ReceivedGift) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGift(gift);
    setShowGiftDetail(true);
  };

  const handleGiftLongPress = (gift: ReceivedGift) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedGift(gift);
    setShowGiftActions(true);
  };

  const handleToggleGiftPrivacy = async (gift: ReceivedGift) => {
    try {
      await apiPost(`/api/gifts/${gift.id}/toggle-privacy`, {});
      loadGifts(); // Reload gifts
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось изменить приватность");
    }
  };

  const getStatusText = () => {
    if (profile?.isOnline) return "online";

    if (!profile?.lastSeen) return "last seen recently";

    const diff = Date.now() - new Date(profile.lastSeen).getTime();
    if (diff < 60_000) return "last seen just now";
    if (diff < 3_600_000) return "last seen recently";
    if (diff < 86_400_000) return "last seen today";
    if (diff < 604_800_000) return "last seen this week";

    return "last seen a long time ago";
  };

  // Показываем телефон только если это контакт
  const showPhoneNumber = profile?.isContact && profile?.phoneNumber;

  // Gift count by emoji for tab
  const giftEmojis = gifts.slice(0, 3).map((g) => g.giftType?.emoji || "🎁").join(" ");

  // ==================== RENDER FUNCTIONS ====================

  const renderActionButton = (
    icon: keyof typeof Feather.glyphMap,
    label: string,
    onPress: () => void,
    isPrimary?: boolean
  ) => (
    <Pressable style={styles.actionButton} onPress={onPress}>
      <View style={[styles.actionIconContainer, isPrimary && styles.actionIconPrimary]}>
        <Feather name={icon} size={22} color={isPrimary ? COLORS.textPrimary : COLORS.textLink} />
      </View>
      <ThemedText style={styles.actionLabel}>{label}</ThemedText>
    </Pressable>
  );

  const renderInfoRow = (
    label: string,
    value: string,
    onPress?: () => void
  ) => (
    <Pressable
      style={styles.infoRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.infoContent}>
        <ThemedText style={styles.infoLabel}>{label}</ThemedText>
        <ThemedText style={[styles.infoValue, onPress && { color: COLORS.textLink }]}>{value}</ThemedText>
      </View>
      {onPress && (
        <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
      )}
    </Pressable>
  );

  const renderGiftItem = ({ item, index }: { item: ReceivedGift; index: number }) => {
    const senderAvatar = item.sender?.avatarUrl ? resolveUrl(item.sender.avatarUrl) : null;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <Pressable
          style={styles.giftItem}
          onPress={() => handleGiftPress(item)}
          onLongPress={() => handleGiftLongPress(item)}
          delayLongPress={300}
        >
          {/* Sender avatar badge */}
          {!item.isAnonymous && senderAvatar ? (
            <Image source={{ uri: senderAvatar }} style={styles.giftSenderAvatar} />
          ) : (
            <View style={[styles.giftSenderAvatar, styles.giftSenderAvatarPlaceholder]}>
              <ThemedText style={styles.giftSenderInitial}>
                {item.isAnonymous ? "?" : item.sender?.firstName?.charAt(0) || "?"}
              </ThemedText>
            </View>
          )}

          {/* Gift emoji */}
          <View style={styles.giftEmojiContainer}>
            <ThemedText style={styles.giftEmoji}>
              {item.giftType?.emoji || "🎁"}
            </ThemedText>
          </View>

          {/* Private indicator */}
          {item.isPrivate && (
            <View style={styles.privateIndicator}>
              <Feather name="eye-off" size={10} color={COLORS.textSecondary} />
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* ==================== HEADER (Telegram-style) ==================== */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.headerButton}>
          <Feather name="chevron-left" size={28} color={COLORS.textLink} />
        </Pressable>

        {isOwnProfile ? (
          <Pressable onPress={handleEdit} style={styles.headerButton}>
            <ThemedText style={styles.editText}>Edit</ThemedText>
          </Pressable>
        ) : (
          <Pressable onPress={handleMore} style={styles.headerButton}>
            <Feather name="more-vertical" size={22} color={COLORS.textLink} />
          </Pressable>
        )}
      </View>

      {/* ==================== AVATAR & NAME ==================== */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <ThemedText style={styles.avatarText}>
                {firstName?.charAt(0) || "?"}
              </ThemedText>
            </View>
          )}
        </View>

        <ThemedText style={styles.displayName}>{displayName}</ThemedText>
        <ThemedText style={[
          styles.statusText, 
          profile?.isOnline && styles.statusOnline
        ]}>
          {getStatusText()}
        </ThemedText>
      </View>

      {/* ==================== ACTION BUTTONS (Simplified Telegram-style) ==================== */}
      {!isOwnProfile && (
        <View style={styles.actionsRow}>
          {renderActionButton("message-circle", "Message", handleMessage, true)}
          {renderActionButton("phone", "Call", handleCall)}
          {renderActionButton("video", "Video", handleVideoCall)}
        </View>
      )}

      {/* ==================== INFO CARD ==================== */}
      <View style={styles.infoCard}>
        {showPhoneNumber && (
          <>
            {renderInfoRow("mobile", profile.phoneNumber!)}
            <View style={styles.infoDivider} />
          </>
        )}
        {normalizedUsername && (
          <>
            {renderInfoRow("username", `@${normalizedUsername}`, handleUsernamePress)}
            <View style={styles.infoDivider} />
          </>
        )}
        {profile?.bio && (
          <>
            {renderInfoRow("bio", profile.bio)}
            <View style={styles.infoDivider} />
          </>
        )}
        {profile?.birthday && (
          renderInfoRow("birthday", profile.birthday)
        )}
      </View>

      {/* ==================== GIFTS SECTION (без табов - Telegram-style) ==================== */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Gifts</ThemedText>
        {gifts.length > 0 && (
          <ThemedText style={styles.sectionCount}>{gifts.length}</ThemedText>
        )}
      </View>

      <View style={styles.giftsContainer}>
        {loadingGifts ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : gifts.length === 0 ? (
          <View style={styles.emptyGifts}>
            <ThemedText style={styles.emptyEmoji}>🎁</ThemedText>
            <ThemedText style={styles.emptyText}>No gifts yet</ThemedText>
          </View>
        ) : (
          <FlatList
            data={gifts}
            renderItem={renderGiftItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            contentContainerStyle={styles.giftsGrid}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* ==================== GIFT DETAIL MODAL ==================== */}
      <Modal
        visible={showGiftDetail}
        animationType="fade"
        transparent
        onRequestClose={() => setShowGiftDetail(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGiftDetail(false)}
        >
          <View style={styles.giftDetailCard}>
            {selectedGift && (
              <>
                <ThemedText style={styles.giftDetailEmoji}>
                  {selectedGift.giftType?.emoji || "🎁"}
                </ThemedText>
                <ThemedText style={styles.giftDetailName}>
                  {selectedGift.giftType?.name || "Gift"}
                </ThemedText>
                <ThemedText style={styles.giftDetailPrice}>
                  ⭐ {selectedGift.giftType?.price || 0}
                </ThemedText>
                <ThemedText style={styles.giftDetailFrom}>
                  {selectedGift.isAnonymous
                    ? "From anonymous sender"
                    : `From ${selectedGift.sender?.firstName || "someone"}`}
                </ThemedText>
                {selectedGift.message && (
                  <ThemedText style={styles.giftDetailMessage}>
                    "{selectedGift.message}"
                  </ThemedText>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ==================== GIFT ACTIONS BOTTOM SHEET ==================== */}
      <Modal
        visible={showGiftActions}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGiftActions(false)}
      >
        <Pressable
          style={styles.bottomSheetOverlay}
          onPress={() => setShowGiftActions(false)}
        >
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.bottomSheetHandle} />
            
            {selectedGift && (
              <>
                <Pressable style={styles.bottomSheetItem} onPress={() => {
                  handleGiftPress(selectedGift);
                  setShowGiftActions(false);
                }}>
                  <Feather name="eye" size={22} color={COLORS.textPrimary} />
                  <ThemedText style={styles.bottomSheetText}>View Details</ThemedText>
                </Pressable>
                
                {isOwnProfile && (
                  <>
                    <Pressable style={styles.bottomSheetItem} onPress={() => {
                      handleToggleGiftPrivacy(selectedGift);
                      setShowGiftActions(false);
                    }}>
                      <Feather name={selectedGift.isPrivate ? "eye" : "eye-off"} size={22} color={COLORS.textPrimary} />
                      <ThemedText style={styles.bottomSheetText}>
                        {selectedGift.isPrivate ? "Make Public" : "Make Private"}
                      </ThemedText>
                    </Pressable>
                    
                    <Pressable style={styles.bottomSheetItem}>
                      <Feather name="star" size={22} color="#FFD700" />
                      <ThemedText style={styles.bottomSheetText}>Exchange for Stars</ThemedText>
                    </Pressable>
                  </>
                )}
              </>
            )}
            
            <Pressable 
              style={[styles.bottomSheetItem, styles.bottomSheetCancel]} 
              onPress={() => setShowGiftActions(false)}
            >
              <ThemedText style={styles.bottomSheetCancelText}>Cancel</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ==================== MORE ACTIONS BOTTOM SHEET ==================== */}
      <Modal
        visible={showMoreSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMoreSheet(false)}
      >
        <Pressable
          style={styles.bottomSheetOverlay}
          onPress={() => setShowMoreSheet(false)}
        >
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.bottomSheetHandle} />
            
            <Pressable style={styles.bottomSheetItem} onPress={handleMute}>
              <Feather name="bell-off" size={22} color={COLORS.textPrimary} />
              <ThemedText style={styles.bottomSheetText}>Mute</ThemedText>
            </Pressable>
            
            <Pressable style={styles.bottomSheetItem} onPress={() => {
              setShowMoreSheet(false);
              (navigation as any).navigate("ChatsTab", {
                screen: "TelegramChat",
                params: { recipientId: userId, recipientName: displayName },
              });
            }}>
              <Feather name="search" size={22} color={COLORS.textPrimary} />
              <ThemedText style={styles.bottomSheetText}>Search</ThemedText>
            </Pressable>
            
            <Pressable style={[styles.bottomSheetItem, styles.bottomSheetDestructive]} onPress={handleBlock}>
              <Feather name="slash" size={22} color={COLORS.destructive} />
              <ThemedText style={[styles.bottomSheetText, { color: COLORS.destructive }]}>Block User</ThemedText>
            </Pressable>
            
            <Pressable style={[styles.bottomSheetItem, styles.bottomSheetDestructive]} onPress={handleDeleteChat}>
              <Feather name="trash-2" size={22} color={COLORS.destructive} />
              <ThemedText style={[styles.bottomSheetText, { color: COLORS.destructive }]}>Delete Chat</ThemedText>
            </Pressable>
            
            <Pressable 
              style={[styles.bottomSheetItem, styles.bottomSheetCancel]} 
              onPress={() => setShowMoreSheet(false)}
            >
              <ThemedText style={styles.bottomSheetCancelText}>Cancel</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ==================== USERNAME ACTIONS BOTTOM SHEET ==================== */}
      <Modal
        visible={showUsernameSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUsernameSheet(false)}
      >
        <Pressable
          style={styles.bottomSheetOverlay}
          onPress={() => setShowUsernameSheet(false)}
        >
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.bottomSheetHandle} />
            
            <Pressable style={styles.bottomSheetItem} onPress={handleCopyUsername}>
              <Feather name="copy" size={22} color={COLORS.textPrimary} />
              <ThemedText style={styles.bottomSheetText}>Copy</ThemedText>
            </Pressable>
            
            <Pressable style={styles.bottomSheetItem} onPress={handleShareUsername}>
              <Feather name="share" size={22} color={COLORS.textPrimary} />
              <ThemedText style={styles.bottomSheetText}>Share</ThemedText>
            </Pressable>
            
            <Pressable style={styles.bottomSheetItem}>
              <MaterialIcons name="qr-code-2" size={22} color={COLORS.textPrimary} />
              <ThemedText style={styles.bottomSheetText}>QR Code</ThemedText>
            </Pressable>
            
            <Pressable 
              style={[styles.bottomSheetItem, styles.bottomSheetCancel]} 
              onPress={() => setShowUsernameSheet(false)}
            >
              <ThemedText style={styles.bottomSheetCancelText}>Cancel</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const GIFT_SIZE = (SCREEN_WIDTH - 48 - 16) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    height: 44,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  editText: {
    fontSize: 17,
    color: COLORS.textLink,
  },

  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingVertical: 16,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  statusOnline: {
    color: COLORS.online,
  },

  // Action Buttons
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 32,
  },
  actionButton: {
    alignItems: "center",
    minWidth: 64,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cardBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionIconPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 16,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  sectionCount: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  // Gifts
  giftsContainer: {
    flex: 1,
  },
  giftsGrid: {
    padding: 12,
    paddingBottom: 100,
  },
  giftItem: {
    width: GIFT_SIZE,
    height: GIFT_SIZE,
    margin: 4,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  giftSenderAvatar: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  giftSenderAvatarPlaceholder: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  giftSenderInitial: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  giftEmojiContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  giftEmoji: {
    fontSize: 48,
  },
  privateIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    padding: 4,
  },
  loader: {
    marginTop: 40,
  },
  emptyGifts: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Gift Detail Card
  giftDetailCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH - 80,
    alignItems: "center",
  },
  giftDetailEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  giftDetailName: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  giftDetailPrice: {
    fontSize: 16,
    color: "#FFD700",
    marginBottom: 12,
  },
  giftDetailFrom: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  giftDetailMessage: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 16,
  },

  // Bottom Sheet
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  bottomSheetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 16,
  },
  bottomSheetText: {
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  bottomSheetDestructive: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomSheetCancel: {
    justifyContent: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomSheetCancelText: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
