import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useStars } from "@/context/StarsContext";
import { NEON_COLORS } from "@/constants/neonTheme";

const { width } = Dimensions.get("window");

// НЕОНОВАЯ ТЕМА (единый источник правды)
const NEON = {
  primary: NEON_COLORS.primary,
  secondary: NEON_COLORS.secondary,
  accent: NEON_COLORS.pink,
  warning: NEON_COLORS.warning,
  success: NEON_COLORS.success,
  error: NEON_COLORS.error,
  bgDark: NEON_COLORS.backgroundDark,
  bgCard: NEON_COLORS.backgroundCard,
  bgSecondary: NEON_COLORS.backgroundSecondary,
  textPrimary: NEON_COLORS.textPrimary,
  textSecondary: NEON_COLORS.textSecondary,
};

const RARITY_COLORS: Record<string, string> = {
  common: "#22C55E",
  rare: "#3B82F6",
  legendary: "#F59E0B",
  epic: "#8B5CF6",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Обычный",
  rare: "Редкий",
  legendary: "Легендарный",
  epic: "Эпический",
};

interface GiftType {
  id: number;
  name: string;
  emoji: string;
  price: number;
  rarity: string;
  description?: string;
}

interface ReceivedGift {
  id: number;
  senderId: number;
  giftTypeId: number;
  message?: string;
  isAnonymous: boolean;
  isOpened: boolean;
  createdAt: string;
  giftName: string;
  giftEmoji: string;
  giftRarity: string;
  giftPrice: number;
  senderFirstName?: string;
  senderLastName?: string;
}

function getApiUrl(): string {
  const host = process.env.EXPO_PUBLIC_DOMAIN;
  if (!host) return "http://localhost:5000";
  if (/^https?:\/\//i.test(host)) return host;
  const isLocal = host.includes("localhost") || host.startsWith("192.168.");
  return `${isLocal ? "http" : "https"}://${host}`;
}

// Дефолтные подарки для отображения
const DEFAULT_GIFTS: GiftType[] = [
  { id: 1, name: "Плюшевый мишка", emoji: "🧸", price: 10, rarity: "common" },
  { id: 2, name: "Красное сердце", emoji: "❤️", price: 5, rarity: "common" },
  { id: 3, name: "Букет роз", emoji: "🌹", price: 25, rarity: "rare" },
  { id: 4, name: "Торт", emoji: "🎂", price: 30, rarity: "rare" },
  { id: 5, name: "Единорог", emoji: "🦄", price: 150, rarity: "legendary" },
  { id: 6, name: "Фейерверк", emoji: "🎆", price: 75, rarity: "legendary" },
  { id: 7, name: "Бриллиант", emoji: "💎", price: 500, rarity: "epic" },
  { id: 8, name: "Котенок", emoji: "🐱", price: 20, rarity: "rare" },
  { id: 9, name: "Звезда", emoji: "⭐", price: 15, rarity: "common" },
  { id: 10, name: "Радуга", emoji: "🌈", price: 100, rarity: "legendary" },
  { id: 11, name: "Корона", emoji: "👑", price: 300, rarity: "epic" },
  { id: 12, name: "Ракета", emoji: "🚀", price: 50, rarity: "rare" },
];

export default function GiftsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { stars, spendStars, ceoBuyStars } = useStars();

  const [activeTab, setActiveTab] = useState<"shop" | "received" | "sent">("shop");
  const [giftTypes, setGiftTypes] = useState<GiftType[]>(DEFAULT_GIFTS);
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);
  const [sentGifts, setSentGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // CEO-only stars purchase (free / unlimited)
  const [buyStarsModalVisible, setBuyStarsModalVisible] = useState(false);
  const [buyStarsAmount, setBuyStarsAmount] = useState<number>(100);
  
  // Modal state
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);
  const [giftMessage, setGiftMessage] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const API_URL = getApiUrl();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadGiftTypes();
    if (user?.id) {
      loadReceivedGifts();
      loadSentGifts();
    }
  }, [user?.id]);

  const loadGiftTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/gifts/types`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setGiftTypes(data);
        }
      }
    } catch (error) {
      console.error("Load gift types error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadReceivedGifts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/gifts/received/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setReceivedGifts(data);
      }
    } catch (error) {
      console.error("Load received gifts error:", error);
    }
  };

  const loadSentGifts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/gifts/sent/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setSentGifts(data);
      }
    } catch (error) {
      console.error("Load sent gifts error:", error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/users/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.filter((u: any) => u.userId !== user?.id));
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const openSendModal = (gift: GiftType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedGift(gift);
    setSendModalVisible(true);
    setRecipientSearch("");
    setSearchResults([]);
    setSelectedRecipient(null);
    setGiftMessage("");
    setIsAnonymous(false);
  };

  const handleBuyStars = async () => {
    if (user?.role !== 'ceo') return;

    const amount = Math.floor(buyStarsAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const success = await ceoBuyStars(amount);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✨ Успешно!', `Вы получили ${amount} ⭐`);
    } else {
      Alert.alert('Ошибка', 'Не удалось купить звёзды');
    }
    setBuyStarsModalVisible(false);
  };

  const sendGift = async () => {
    if (!selectedGift || !selectedRecipient || !user?.id) {
      Alert.alert("Ошибка", "Выберите получателя");
      return;
    }

    // Сначала списываем звёзды через сервер
    const canSpend = await spendStars(selectedGift.price, 'gift_purchase', `Подарок: ${selectedGift.name}`);
    if (!canSpend) {
      Alert.alert("⭐ Недостаточно звёзд", `Нужно ${selectedGift.price} ⭐, у вас ${stars} ⭐`);
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const response = await fetch(`${API_URL}/api/gifts/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedRecipient.userId,
          giftTypeId: selectedGift.id,
          message: giftMessage,
          isAnonymous,
        }),
      });

      if (response.ok) {
        setSendModalVisible(false);
        Alert.alert(
          "🎁 Подарок отправлен!",
          `${selectedGift.emoji} ${selectedGift.name} отправлен пользователю ${selectedRecipient.firstName || selectedRecipient.username}!`
        );
        loadSentGifts();
      } else {
        Alert.alert("Ошибка", "Не удалось отправить подарок");
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось отправить подарок");
    }
  };

  const openGift = async (giftId: number) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const response = await fetch(`${API_URL}/api/gifts/${giftId}/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (response.ok) {
        loadReceivedGifts();
      }
    } catch (error) {
      console.error("Open gift error:", error);
    }
  };

  const renderGiftShop = ({ item }: { item: GiftType }) => (
    <Pressable
      style={[styles.giftCard, { borderColor: RARITY_COLORS[item.rarity] + "40" }]}
      onPress={() => openSendModal(item)}
    >
      <LinearGradient
        colors={[RARITY_COLORS[item.rarity] + "20", "transparent"]}
        style={styles.giftGradient}
      >
        <ThemedText style={styles.giftEmoji}>{item.emoji}</ThemedText>
        <ThemedText style={styles.giftName}>{item.name}</ThemedText>
        <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[item.rarity] + "30" }]}>
          <ThemedText style={[styles.rarityText, { color: RARITY_COLORS[item.rarity] }]}>
            {RARITY_LABELS[item.rarity]}
          </ThemedText>
        </View>
        <View style={styles.priceContainer}>
          <ThemedText style={styles.priceText}>⭐ {item.price}</ThemedText>
        </View>
      </LinearGradient>
    </Pressable>
  );

  const renderReceivedGift = ({ item }: { item: ReceivedGift }) => (
    <Pressable
      style={[styles.receivedCard, !item.isOpened && styles.unopenedGift]}
      onPress={() => !item.isOpened && openGift(item.id)}
    >
      <View style={styles.receivedContent}>
        <ThemedText style={styles.receivedEmoji}>
          {item.isOpened ? item.giftEmoji : "🎁"}
        </ThemedText>
        <View style={styles.receivedInfo}>
          {item.isOpened ? (
            <>
              <ThemedText style={styles.receivedName}>{item.giftName}</ThemedText>
              <ThemedText style={styles.receivedFrom}>
                {item.isAnonymous
                  ? "От: Аноним 🎭"
                  : `От: ${item.senderFirstName || "Кто-то"} ${item.senderLastName || ""}`}
              </ThemedText>
              {item.message && (
                <ThemedText style={styles.receivedMessage}>💬 {item.message}</ThemedText>
              )}
            </>
          ) : (
            <>
              <ThemedText style={styles.receivedName}>Новый подарок!</ThemedText>
              <ThemedText style={styles.receivedFrom}>Нажмите, чтобы открыть</ThemedText>
            </>
          )}
        </View>
      </View>
      <ThemedText style={styles.receivedDate}>
        {new Date(item.createdAt).toLocaleDateString("ru")}
      </ThemedText>
    </Pressable>
  );

  const renderSentGift = ({ item }: { item: any }) => (
    <View style={styles.receivedCard}>
      <View style={styles.receivedContent}>
        <ThemedText style={styles.receivedEmoji}>{item.giftEmoji}</ThemedText>
        <View style={styles.receivedInfo}>
          <ThemedText style={styles.receivedName}>{item.giftName}</ThemedText>
          <ThemedText style={styles.receivedFrom}>
            Кому: {item.receiverFirstName || "Пользователь"} {item.receiverLastName || ""}
          </ThemedText>
          {item.message && (
            <ThemedText style={styles.receivedMessage}>💬 {item.message}</ThemedText>
          )}
        </View>
      </View>
      <View style={styles.sentStatus}>
        <ThemedText style={[styles.statusText, { color: item.isOpened ? NEON.success : NEON.warning }]}>
          {item.isOpened ? "✓ Открыт" : "⏳ Не открыт"}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={NEON.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>🎁 Подарки</ThemedText>
        <View style={styles.starsBalance}>
          <ThemedText style={styles.starsText}>⭐ {stars}</ThemedText>
        </View>
      </View>

      {/* CEO ONLY: BUY STARS */}
      {user?.role === 'ceo' && (
        <View style={styles.buyStarsRow}>
          <Pressable
            onPress={() => setBuyStarsModalVisible(true)}
            style={styles.buyStarsButton}
          >
            <LinearGradient
              colors={[NEON.warning, NEON.accent]}
              style={styles.buyStarsGradient}
            >
              <Feather name="plus-circle" size={18} color={NEON.bgDark} />
              <ThemedText style={styles.buyStarsText}>Купить звёзды</ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === "shop" && styles.activeTab]}
          onPress={() => setActiveTab("shop")}
        >
          <Feather name="shopping-bag" size={18} color={activeTab === "shop" ? NEON.accent : NEON.textSecondary} />
          <ThemedText style={[styles.tabText, activeTab === "shop" && styles.activeTabText]}>
            Магазин
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "received" && styles.activeTab]}
          onPress={() => setActiveTab("received")}
        >
          <Feather name="gift" size={18} color={activeTab === "received" ? NEON.success : NEON.textSecondary} />
          <ThemedText style={[styles.tabText, activeTab === "received" && styles.activeTabText]}>
            Полученные ({receivedGifts.length})
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "sent" && styles.activeTab]}
          onPress={() => setActiveTab("sent")}
        >
          <Feather name="send" size={18} color={activeTab === "sent" ? NEON.primary : NEON.textSecondary} />
          <ThemedText style={[styles.tabText, activeTab === "sent" && styles.activeTabText]}>
            Отправленные
          </ThemedText>
        </Pressable>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NEON.primary} />
        </View>
      ) : (
        <>
          {activeTab === "shop" && (
            <FlatList
              data={giftTypes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderGiftShop}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); loadGiftTypes(); }}
                  tintColor={NEON.primary}
                />
              }
            />
          )}

          {activeTab === "received" && (
            <FlatList
              data={receivedGifts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderReceivedGift}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyEmoji}>📭</ThemedText>
                  <ThemedText style={styles.emptyTitle}>Пока нет подарков</ThemedText>
                  <ThemedText style={styles.emptySubtitle}>
                    Подарки от друзей появятся здесь
                  </ThemedText>
                </View>
              }
            />
          )}

          {activeTab === "sent" && (
            <FlatList
              data={sentGifts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSentGift}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyEmoji}>🎁</ThemedText>
                  <ThemedText style={styles.emptyTitle}>Вы ещё не отправляли подарки</ThemedText>
                  <ThemedText style={styles.emptySubtitle}>
                    Отправьте подарок другу!
                  </ThemedText>
                </View>
              }
            />
          )}
        </>
      )}

      {/* SEND GIFT MODAL */}
      {/* BUY STARS MODAL (CEO ONLY) */}
      <Modal
        visible={buyStarsModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setBuyStarsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.buyStarsModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>⭐ Купить звёзды</ThemedText>
              <Pressable onPress={() => setBuyStarsModalVisible(false)} style={styles.closeButton}>
                <Feather name="x" size={22} color={NEON.textSecondary} />
              </Pressable>
            </View>

            <ThemedText style={styles.buyStarsHint}>
              Только для CEO. Добавляет звёзды бесплатно.
            </ThemedText>

            <View style={styles.packagesGrid}>
              {[100, 250, 500, 1000, 2000].map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => setBuyStarsAmount(amount)}
                  style={[
                    styles.packageCard,
                    buyStarsAmount === amount && styles.packageCardActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.packageText,
                      buyStarsAmount === amount && styles.packageTextActive,
                    ]}
                  >
                    ⭐ {amount}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={handleBuyStars}>
              <LinearGradient colors={[NEON.warning, NEON.accent]} style={styles.buyStarsConfirmGradient}>
                <ThemedText style={styles.buyStarsConfirmText}>Купить ⭐ {buyStarsAmount}</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={sendModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSendModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {selectedGift?.emoji} Отправить {selectedGift?.name}
              </ThemedText>
              <Pressable onPress={() => setSendModalVisible(false)}>
                <Feather name="x" size={24} color={NEON.textSecondary} />
              </Pressable>
            </View>

            {/* ПОИСК ПОЛУЧАТЕЛЯ */}
            <ThemedText style={styles.modalLabel}>Кому отправить:</ThemedText>
            <View style={styles.searchContainer}>
              <Feather name="search" size={18} color={NEON.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Поиск по имени..."
                placeholderTextColor={NEON.textSecondary}
                value={recipientSearch}
                onChangeText={(text) => {
                  setRecipientSearch(text);
                  searchUsers(text);
                }}
              />
            </View>

            {/* РЕЗУЛЬТАТЫ ПОИСКА */}
            {searchResults.length > 0 && !selectedRecipient && (
              <View style={styles.searchResults}>
                {searchResults.slice(0, 5).map((u) => (
                  <Pressable
                    key={u.userId || u.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setSelectedRecipient(u);
                      setRecipientSearch(u.firstName ? `${u.firstName} ${u.lastName || ""}` : `@${u.username}`);
                      setSearchResults([]);
                    }}
                  >
                    <ThemedText style={styles.searchResultText}>
                      {u.firstName ? `${u.firstName} ${u.lastName || ""}` : `@${u.username}`}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            )}

            {selectedRecipient && (
              <View style={styles.selectedRecipient}>
                <ThemedText style={styles.selectedText}>
                  ✓ {selectedRecipient.firstName || selectedRecipient.username}
                </ThemedText>
                <Pressable onPress={() => { setSelectedRecipient(null); setRecipientSearch(""); }}>
                  <Feather name="x" size={18} color={NEON.textSecondary} />
                </Pressable>
              </View>
            )}

            {/* СООБЩЕНИЕ */}
            <ThemedText style={styles.modalLabel}>Сообщение (необязательно):</ThemedText>
            <TextInput
              style={styles.messageInput}
              placeholder="Напишите что-нибудь приятное..."
              placeholderTextColor={NEON.textSecondary}
              value={giftMessage}
              onChangeText={setGiftMessage}
              multiline
              maxLength={200}
            />

            {/* АНОНИМНО */}
            <Pressable
              style={styles.anonymousToggle}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                {isAnonymous && <Feather name="check" size={14} color="#FFF" />}
              </View>
              <ThemedText style={styles.anonymousText}>Отправить анонимно 🎭</ThemedText>
            </Pressable>

            {/* ЦЕНА */}
            <View style={styles.priceRow}>
              <ThemedText style={styles.priceLabel}>Стоимость:</ThemedText>
              <ThemedText style={styles.modalPrice}>⭐ {selectedGift?.price}</ThemedText>
            </View>

            {/* КНОПКА ОТПРАВКИ */}
            <Pressable
              style={[styles.sendButton, !selectedRecipient && styles.sendButtonDisabled]}
              onPress={sendGift}
              disabled={!selectedRecipient}
            >
              <LinearGradient
                colors={selectedRecipient ? [NEON.accent, NEON.primary] : [NEON.bgSecondary, NEON.bgSecondary]}
                style={styles.sendButtonGradient}
              >
                <Feather name="send" size={20} color="#FFF" />
                <ThemedText style={styles.sendButtonText}>Отправить подарок</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEON.bgDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: NEON.bgDark,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NEON.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: NEON.textPrimary,
  },
  starsBalance: {
    backgroundColor: NEON.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NEON.warning + "40",
  },
  starsText: {
    fontSize: 14,
    fontWeight: "600",
    color: NEON.warning,
  },
  buyStarsRow: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  buyStarsButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buyStarsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  buyStarsText: {
    fontSize: 14,
    fontWeight: '700',
    color: NEON.bgDark,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: NEON.bgCard,
    gap: 4,
  },
  activeTab: {
    backgroundColor: NEON.bgSecondary,
    borderWidth: 1,
    borderColor: NEON.primary + "40",
  },
  tabText: {
    fontSize: 12,
    color: NEON.textSecondary,
    fontWeight: "500",
  },
  activeTabText: {
    color: NEON.textPrimary,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  giftCard: {
    width: (width - 36) / 2,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: NEON.bgCard,
  },
  giftGradient: {
    padding: 16,
    alignItems: "center",
  },
  giftEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  giftName: {
    fontSize: 14,
    fontWeight: "600",
    color: NEON.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "600",
  },
  priceContainer: {
    backgroundColor: NEON.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "600",
    color: NEON.warning,
  },
  receivedCard: {
    backgroundColor: NEON.bgCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unopenedGift: {
    borderWidth: 2,
    borderColor: NEON.accent,
    borderStyle: "dashed",
  },
  receivedContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  receivedEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  receivedInfo: {
    flex: 1,
  },
  receivedName: {
    fontSize: 15,
    fontWeight: "600",
    color: NEON.textPrimary,
    marginBottom: 2,
  },
  receivedFrom: {
    fontSize: 13,
    color: NEON.textSecondary,
  },
  receivedMessage: {
    fontSize: 12,
    color: NEON.secondary,
    marginTop: 4,
    fontStyle: "italic",
  },
  receivedDate: {
    fontSize: 11,
    color: NEON.textSecondary,
  },
  sentStatus: {
    alignItems: "flex-end",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: NEON.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: NEON.textSecondary,
    textAlign: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: NEON.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: NEON.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: NEON.textPrimary,
  },
  buyStarsModalContent: {
    backgroundColor: NEON.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  buyStarsHint: {
    fontSize: 13,
    color: NEON.textSecondary,
    marginBottom: 12,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  packageCard: {
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: NEON.primary + '20',
    minWidth: 110,
    alignItems: 'center',
  },
  packageCardActive: {
    borderColor: NEON.warning + '70',
    backgroundColor: NEON.bgSecondary,
  },
  packageText: {
    fontSize: 14,
    fontWeight: '800',
    color: NEON.textPrimary,
  },
  packageTextActive: {
    color: NEON.warning,
  },
  buyStarsConfirmGradient: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyStarsConfirmText: {
    fontSize: 15,
    fontWeight: '800',
    color: NEON.bgDark,
  },
  modalLabel: {
    fontSize: 14,
    color: NEON.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: NEON.textPrimary,
  },
  searchResults: {
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },
  searchResultItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: NEON.bgCard,
  },
  searchResultText: {
    fontSize: 14,
    color: NEON.textPrimary,
  },
  selectedRecipient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: NEON.success + "20",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  selectedText: {
    fontSize: 14,
    color: NEON.success,
    fontWeight: "500",
  },
  messageInput: {
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: NEON.textPrimary,
    minHeight: 60,
    textAlignVertical: "top",
  },
  anonymousToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: NEON.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: NEON.primary,
    borderColor: NEON.primary,
  },
  anonymousText: {
    fontSize: 14,
    color: NEON.textPrimary,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: NEON.bgSecondary,
  },
  priceLabel: {
    fontSize: 14,
    color: NEON.textSecondary,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: NEON.warning,
  },
  sendButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});
