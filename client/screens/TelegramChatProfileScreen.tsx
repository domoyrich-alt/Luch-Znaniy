/**
 * TELEGRAM-STYLE CHAT PROFILE SCREEN
 * Чистый минималистичный дизайн как в Telegram
 */

import React, { useState, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api";
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

interface ChatProfileParams {
  chatId: string;
  otherUserId?: number;
  otherUserName?: string;
  phoneNumber?: string;
  chatType?: 'private' | 'group';
}

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

export default function TelegramChatProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { user: currentUser } = useAuth();

  const params = route.params as ChatProfileParams;
  const userId = params?.otherUserId;
  const displayName = params?.otherUserName || "Пользователь";

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

  const normalizedUsername = profile?.username?.replace(/^@+/, "") || "";

  // Загрузка профиля
  useEffect(() => {
    if (userId) {
      loadProfile();
      loadGifts();
    }
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;
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
    if (!userId) return;
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

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
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
        { 
          text: "Удалить", 
          style: "destructive", 
          onPress: () => {
            navigation.goBack();
            navigation.goBack();
          } 
        },
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

  const getAvatarInitial = () => {
    return displayName?.charAt(0)?.toUpperCase() || "?";
  };

  const getAvatarColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFB347', '#DDA0DD', '#8B5CF6'];
    return colors[displayName.charCodeAt(0) % colors.length];
  };

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
        >
          {!item.isAnonymous && senderAvatar ? (
            <Image source={{ uri: senderAvatar }} style={styles.giftSenderAvatar} />
          ) : (
            <View style={[styles.giftSenderAvatar, styles.giftSenderAvatarPlaceholder]}>
              <ThemedText style={styles.giftSenderInitial}>
                {item.isAnonymous ? "?" : item.sender?.firstName?.charAt(0) || "?"}
              </ThemedText>
            </View>
          )}

          <View style={styles.giftEmojiContainer}>
            <ThemedText style={styles.giftEmoji}>
              {item.giftType?.emoji || "🎁"}
            </ThemedText>
          </View>

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

      {/* ==================== HEADER ==================== */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.headerButton}>
          <Feather name="chevron-left" size={28} color={COLORS.textLink} />
        </Pressable>

        <Pressable onPress={handleMore} style={styles.headerButton}>
          <Feather name="more-vertical" size={22} color={COLORS.textLink} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== AVATAR & NAME ==================== */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: getAvatarColor() }]}>
                <ThemedText style={styles.avatarText}>
                  {getAvatarInitial()}
                </ThemedText>
              </View>
            )}
            {profile?.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <ThemedText style={styles.displayName}>{displayName}</ThemedText>
          <ThemedText style={[
            styles.statusText, 
            profile?.isOnline && styles.statusOnline
          ]}>
            {getStatusText()}
          </ThemedText>
        </View>

        {/* ==================== ACTION BUTTONS ==================== */}
        {!isOwnProfile && (
          <View style={styles.actionsRow}>
            {renderActionButton("message-circle", "Message", handleMessage, true)}
            {renderActionButton("phone", "Call", handleCall)}
            {renderActionButton("video", "Video", handleVideoCall)}
          </View>
        )}

        {/* ==================== INFO CARD ==================== */}
        <View style={styles.infoCard}>
          {profile?.phoneNumber && (
            <>
              {renderInfoRow("mobile", profile.phoneNumber)}
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
            renderInfoRow("bio", profile.bio)
          )}
        </View>

        {/* ==================== GIFTS SECTION ==================== */}
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
              scrollEnabled={false}
            />
          )}
        </View>

        {/* ==================== SETTINGS ==================== */}
        <View style={styles.settingsCard}>
          <Pressable style={styles.settingsRow} onPress={handleMute}>
            <View style={styles.settingsIcon}>
              <Feather name="bell-off" size={20} color={COLORS.textSecondary} />
            </View>
            <ThemedText style={styles.settingsText}>Mute</ThemedText>
            <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        {/* ==================== DANGER ZONE ==================== */}
        <View style={styles.dangerCard}>
          <Pressable style={styles.dangerRow} onPress={handleBlock}>
            <Feather name="slash" size={20} color={COLORS.destructive} />
            <ThemedText style={styles.dangerText}>Block User</ThemedText>
          </Pressable>
          <View style={styles.infoDivider} />
          <Pressable style={styles.dangerRow} onPress={handleDeleteChat}>
            <Feather name="trash-2" size={20} color={COLORS.destructive} />
            <ThemedText style={styles.dangerText}>Delete Chat</ThemedText>
          </Pressable>
        </View>
      </ScrollView>

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

      {/* ==================== MORE OPTIONS SHEET ==================== */}
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
            
            <Pressable style={styles.bottomSheetItem} onPress={() => {
              setShowMoreSheet(false);
              Share.share({ message: `Contact: ${displayName}` });
            }}>
              <Feather name="share" size={22} color={COLORS.textPrimary} />
              <ThemedText style={styles.bottomSheetText}>Share Contact</ThemedText>
            </Pressable>
            
            <Pressable style={styles.bottomSheetItem} onPress={handleMute}>
              <Feather name="bell-off" size={22} color={COLORS.textPrimary} />
              <ThemedText style={styles.bottomSheetText}>Mute Notifications</ThemedText>
            </Pressable>
            
            <Pressable style={[styles.bottomSheetItem, styles.bottomSheetDanger]} onPress={handleBlock}>
              <Feather name="slash" size={22} color={COLORS.destructive} />
              <ThemedText style={[styles.bottomSheetText, { color: COLORS.destructive }]}>Block User</ThemedText>
            </Pressable>
            
            <Pressable style={styles.bottomSheetCancel} onPress={() => setShowMoreSheet(false)}>
              <ThemedText style={styles.bottomSheetCancelText}>Cancel</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ==================== USERNAME SHEET ==================== */}
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
            
            <ThemedText style={styles.bottomSheetTitle}>@{normalizedUsername}</ThemedText>
            
            <Pressable style={styles.bottomSheetItem} onPress={handleCopyUsername}>
              <Feather name="copy" size={22} color={COLORS.textPrimary} />
              <ThemedText style={styles.bottomSheetText}>Copy Username</ThemedText>
            </Pressable>
            
            <Pressable style={styles.bottomSheetItem} onPress={handleShareUsername}>
              <Feather name="share" size={22} color={COLORS.textPrimary} />
              <ThemedText style={styles.bottomSheetText}>Share Link</ThemedText>
            </Pressable>
            
            <Pressable style={styles.bottomSheetCancel} onPress={() => setShowUsernameSheet(false)}>
              <ThemedText style={styles.bottomSheetCancelText}>Cancel</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerButton: {
    padding: 8,
  },

  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.online,
    borderWidth: 3,
    borderColor: COLORS.background,
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
    gap: 32,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: "center",
    gap: 8,
  },
  actionIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.cardBg,
    justifyContent: "center",
    alignItems: "center",
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
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
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
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  infoDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginLeft: 16,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Gifts
  giftsContainer: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 120,
  },
  giftsGrid: {
    padding: 12,
  },
  giftItem: {
    width: (SCREEN_WIDTH - 32 - 24 - 24) / 3,
    aspectRatio: 1,
    margin: 4,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  giftSenderAvatar: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.inputBg,
  },
  giftSenderAvatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  giftSenderInitial: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  giftEmojiContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  giftEmoji: {
    fontSize: 36,
  },
  privateIndicator: {
    position: "absolute",
    bottom: 6,
    right: 6,
    padding: 4,
  },
  emptyGifts: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  loader: {
    padding: 32,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  settingsIcon: {
    marginRight: 12,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  // Danger Card
  dangerCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  dangerText: {
    fontSize: 16,
    color: COLORS.destructive,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Gift Detail Card
  giftDetailCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: SCREEN_WIDTH * 0.8,
  },
  giftDetailEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  giftDetailName: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  giftDetailPrice: {
    fontSize: 18,
    color: COLORS.textLink,
    marginBottom: 16,
  },
  giftDetailFrom: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  giftDetailMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },

  // Bottom Sheet
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  bottomSheetItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  bottomSheetDanger: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  bottomSheetText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  bottomSheetCancel: {
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    marginBottom: 8,
  },
  bottomSheetCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textLink,
  },
});
