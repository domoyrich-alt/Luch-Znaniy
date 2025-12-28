import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import ChatService, { PrivateChat } from "@/services/ChatService";

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
    });
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
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.primary },
            ]}
          >
            <ThemedText style={styles.avatarText}>
              {(otherUser.firstName || otherUser.username || "?").charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          
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
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* HEADER КАК В TELEGRAM - МИНИМАЛИСТИЧНЫЙ И КРАСИВЫЙ */}
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
          <ThemedText style={styles.headerTitle}>Чаты</ThemedText>
        </View>
        
        <View style={styles.headerRight}>
          {/* SEARCH BUTTON */}
          <Pressable
            style={[styles.headerIconButton]}
            onPress={() => setIsSearchMode(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="search" size={20} color={theme.primary} />
          </Pressable>
          
          {/* NEW CHAT BUTTON */}
          <Pressable
            style={[styles.headerIconButton]}
            onPress={() => navigation.navigate("NewChat" as never)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="edit-3" size={20} color={theme.primary} />
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

      {/* FLOATING ACTION BUTTON - НОВЫЙ ЧАТ */}
      <Pressable
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate("NewChat" as never)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="edit-3" size={24} color="#FFFFFF" />
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
  headerTitle: { 
    fontSize: 32, 
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    gap: 4,
  },
  headerIconButton: {
    padding: 12,
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
  
  // CHAT ITEM (TELEGRAM STYLE)
  chatItem: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
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
