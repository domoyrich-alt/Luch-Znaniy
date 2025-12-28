import React, { useState, useEffect, useRef } from "react";
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
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

// НЕОНОВЫЕ ЦВЕТА
const NEON = {
  primary: "#8B5CF6",
  secondary: "#4ECDC4",
  accent: "#FF6B9D",
  warning: "#FFD93D",
  success: "#6BCB77",
  error: "#FF6B6B",
  bgDark: "#0A0A0F",
  bgCard: "#141420",
  bgSecondary: "#1A1A2E",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0B0",
};

interface Friend {
  friendshipId: number;
  friendId: number;
  firstName: string;
  lastName: string;
  username?: string;
  avatarUrl?: string;
  isOnline?: boolean;
  status?: string;
}

interface FriendRequest {
  friendshipId: number;
  fromUserId: number;
  firstName: string;
  lastName: string;
  createdAt: string;
}

function getApiUrl(): string {
  const host = process.env.EXPO_PUBLIC_DOMAIN;
  if (!host) return "http://localhost:5000";
  if (/^https?:\/\//i.test(host)) return host;
  const isLocal = host.includes("localhost") || host.startsWith("192.168.");
  return `${isLocal ? "http" : "https"}://${host}`;
}

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const API_URL = getApiUrl();
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.id) {
      loadFriends();
      loadRequests();
    }
  }, [user?.id]);

  const loadFriends = async () => {
    try {
      const response = await fetch(`${API_URL}/api/friends/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error("Load friends error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/friends/${user?.id}/requests`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Load requests error:", error);
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
        // Фильтруем себя из результатов
        setSearchResults(data.filter((u: any) => u.userId !== user?.id));
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const sendFriendRequest = async (friendId: number) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await fetch(`${API_URL}/api/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, friendId }),
      });
      if (response.ok) {
        Alert.alert("✅ Успех", "Заявка отправлена!");
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось отправить заявку");
    }
  };

  const acceptRequest = async (friendshipId: number) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await fetch(`${API_URL}/api/friends/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });
      if (response.ok) {
        loadFriends();
        loadRequests();
        Alert.alert("✅", "Теперь вы друзья!");
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось принять заявку");
    }
  };

  const declineRequest = async (friendshipId: number) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const response = await fetch(`${API_URL}/api/friends/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });
      if (response.ok) {
        loadRequests();
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось отклонить заявку");
    }
  };

  const removeFriend = async (friendId: number) => {
    Alert.alert(
      "Удалить из друзей?",
      "Вы уверены, что хотите удалить этого человека из друзей?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/friends/${user?.id}/${friendId}`, {
                method: "DELETE",
              });
              if (response.ok) {
                loadFriends();
              }
            } catch (error) {
              Alert.alert("Ошибка", "Не удалось удалить из друзей");
            }
          },
        },
      ]
    );
  };

  const switchTab = (tab: "friends" | "requests" | "search") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === "friends" ? 0 : tab === "requests" ? 1 : 2,
      friction: 10,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const openChat = (friendId: number, friendName: string) => {
    (navigation as any).navigate("ChatsTab", {
      screen: "ChatNew",
      params: {
        otherUserId: friendId,
        otherUserName: friendName,
      },
    });
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <Pressable
      style={styles.friendCard}
      onPress={() => openChat(item.friendId, `${item.firstName} ${item.lastName}`)}
      onLongPress={() => removeFriend(item.friendId)}
    >
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={[NEON.secondary, NEON.primary]}
          style={styles.avatarGradient}
        >
          <ThemedText style={styles.avatarText}>
            {(item.firstName || "?").charAt(0).toUpperCase()}
          </ThemedText>
        </LinearGradient>
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.friendInfo}>
        <ThemedText style={styles.friendName}>
          {item.firstName} {item.lastName}
        </ThemedText>
        <ThemedText style={styles.friendStatus}>
          {item.isOnline ? "🟢 онлайн" : item.status || "Друг"}
        </ThemedText>
      </View>
      <Pressable style={styles.chatButton} onPress={() => openChat(item.friendId, `${item.firstName} ${item.lastName}`)}>
        <Feather name="message-circle" size={20} color={NEON.secondary} />
      </Pressable>
    </Pressable>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={[NEON.accent, NEON.warning]}
          style={styles.avatarGradient}
        >
          <ThemedText style={styles.avatarText}>
            {(item.firstName || "?").charAt(0).toUpperCase()}
          </ThemedText>
        </LinearGradient>
      </View>
      <View style={styles.friendInfo}>
        <ThemedText style={styles.friendName}>
          {item.firstName} {item.lastName}
        </ThemedText>
        <ThemedText style={styles.friendStatus}>
          Хочет добавить вас в друзья
        </ThemedText>
      </View>
      <View style={styles.requestActions}>
        <Pressable
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => acceptRequest(item.friendshipId)}
        >
          <Feather name="check" size={18} color="#FFF" />
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => declineRequest(item.friendshipId)}
        >
          <Feather name="x" size={18} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }: { item: any }) => (
    <Pressable style={styles.friendCard} onPress={() => sendFriendRequest(item.userId)}>
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={[NEON.primary, NEON.secondary]}
          style={styles.avatarGradient}
        >
          <ThemedText style={styles.avatarText}>
            {(item.firstName || item.username || "?").charAt(0).toUpperCase()}
          </ThemedText>
        </LinearGradient>
      </View>
      <View style={styles.friendInfo}>
        <ThemedText style={styles.friendName}>
          {item.firstName ? `${item.firstName} ${item.lastName || ""}` : `@${item.username}`}
        </ThemedText>
        <ThemedText style={styles.friendStatus}>
          {item.bio || "Нажмите, чтобы добавить в друзья"}
        </ThemedText>
      </View>
      <View style={[styles.actionButton, { backgroundColor: NEON.primary }]}>
        <Feather name="user-plus" size={18} color="#FFF" />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={NEON.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>👥 Друзья</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === "friends" && styles.activeTab]}
          onPress={() => switchTab("friends")}
        >
          <Feather name="users" size={18} color={activeTab === "friends" ? NEON.secondary : NEON.textSecondary} />
          <ThemedText style={[styles.tabText, activeTab === "friends" && styles.activeTabText]}>
            Друзья ({friends.length})
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "requests" && styles.activeTab]}
          onPress={() => switchTab("requests")}
        >
          <Feather name="user-plus" size={18} color={activeTab === "requests" ? NEON.accent : NEON.textSecondary} />
          <ThemedText style={[styles.tabText, activeTab === "requests" && styles.activeTabText]}>
            Заявки ({requests.length})
          </ThemedText>
          {requests.length > 0 && <View style={styles.badge}><ThemedText style={styles.badgeText}>{requests.length}</ThemedText></View>}
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "search" && styles.activeTab]}
          onPress={() => switchTab("search")}
        >
          <Feather name="search" size={18} color={activeTab === "search" ? NEON.primary : NEON.textSecondary} />
          <ThemedText style={[styles.tabText, activeTab === "search" && styles.activeTabText]}>
            Поиск
          </ThemedText>
        </Pressable>
      </View>

      {/* SEARCH INPUT */}
      {activeTab === "search" && (
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={NEON.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по имени или @username..."
            placeholderTextColor={NEON.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchUsers(text);
            }}
            autoCapitalize="none"
          />
          {searchQuery && (
            <Pressable onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
              <Feather name="x" size={18} color={NEON.textSecondary} />
            </Pressable>
          )}
        </View>
      )}

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NEON.primary} />
        </View>
      ) : (
        <>
          {activeTab === "friends" && (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.friendshipId.toString()}
              renderItem={renderFriend}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); loadFriends(); }}
                  tintColor={NEON.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyEmoji}>🤝</ThemedText>
                  <ThemedText style={styles.emptyTitle}>Пока нет друзей</ThemedText>
                  <ThemedText style={styles.emptySubtitle}>
                    Найдите друзей через поиск!
                  </ThemedText>
                </View>
              }
            />
          )}

          {activeTab === "requests" && (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.friendshipId.toString()}
              renderItem={renderRequest}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyEmoji}>📭</ThemedText>
                  <ThemedText style={styles.emptyTitle}>Нет заявок</ThemedText>
                  <ThemedText style={styles.emptySubtitle}>
                    Новые заявки появятся здесь
                  </ThemedText>
                </View>
              }
            />
          )}

          {activeTab === "search" && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.userId?.toString() || item.id?.toString()}
              renderItem={renderSearchResult}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                searchQuery ? (
                  <View style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyEmoji}>🔍</ThemedText>
                    <ThemedText style={styles.emptyTitle}>Никого не нашли</ThemedText>
                    <ThemedText style={styles.emptySubtitle}>
                      Попробуйте другой запрос
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyEmoji}>👆</ThemedText>
                    <ThemedText style={styles.emptyTitle}>Введите запрос</ThemedText>
                    <ThemedText style={styles.emptySubtitle}>
                      Найдите людей по имени или @username
                    </ThemedText>
                  </View>
                )
              }
            />
          )}
        </>
      )}
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
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: NEON.bgCard,
    gap: 6,
  },
  activeTab: {
    backgroundColor: NEON.bgSecondary,
    borderWidth: 1,
    borderColor: NEON.primary + "40",
  },
  tabText: {
    fontSize: 13,
    color: NEON.textSecondary,
    fontWeight: "500",
  },
  activeTabText: {
    color: NEON.textPrimary,
  },
  badge: {
    backgroundColor: NEON.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: NEON.bgCard,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: NEON.textPrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NEON.bgCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NEON.bgCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: NEON.accent + "30",
  },
  avatarContainer: {
    position: "relative",
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: NEON.success,
    borderWidth: 2,
    borderColor: NEON.bgCard,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: NEON.textPrimary,
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 13,
    color: NEON.textSecondary,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NEON.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: NEON.success,
  },
  declineButton: {
    backgroundColor: NEON.error,
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
});
