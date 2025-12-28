import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import ChatService, { UserProfile } from "@/services/ChatService";
import { wsClient } from "@/lib/websocket";

export default function NewChatScreen() {
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Поиск в реальном времени как в Telegram
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const foundUsers = await ChatService.searchUsers(searchQuery);
        // Исключаем самого себя
        const filtered = foundUsers.filter((u: any) => u.userId !== user?.id);
        setResults(filtered);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300); // Дебаунс 300мс

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleSelectUser = async (userProfile: any) => {
    if (!user?.id) return;

    try {
      // Создаём или получаем чат
      const chat = await ChatService.getOrCreatePrivateChat(
        user.id,
        userProfile.userId
      );

      // ВАЖНО: Подписываемся на новый чат через WebSocket
      wsClient.addChat(chat.id.toString());

      // Переходим в чат (используем TelegramChat для красивого дизайна)
      (navigation as any).navigate("TelegramChat", {
        chatId: chat.id,
        otherUserId: userProfile.userId,
        otherUserName: userProfile.firstName 
          ? `${userProfile.firstName} ${userProfile.lastName || ""}`.trim()
          : userProfile.username,
        chatType: 'private',
      });
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось создать чат");
      console.error(error);
    }
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.userItem, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => handleSelectUser(item)}
    >
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <ThemedText style={styles.avatarText}>
          {(item.firstName || item.username || "?").charAt(0).toUpperCase()}
        </ThemedText>
      </View>

      <View style={styles.userInfo}>
        {/* Показываем имя если есть */}
        {item.firstName && (
          <ThemedText style={styles.userName}>
            {item.firstName} {item.lastName || ""}
          </ThemedText>
        )}
        <ThemedText style={[styles.username, { color: item.firstName ? theme.textSecondary : theme.text }]}>
          @{String(item.username || '').replace(/^@+/, '')}
        </ThemedText>
        {item.bio && (
          <ThemedText
            style={[styles.bio, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.bio}
          </ThemedText>
        )}
        {item.status && (
          <ThemedText
            style={[styles.status, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            📌 {item.status}
          </ThemedText>
        )}
      </View>

      <View
        style={[
          styles.onlineIndicator,
          { backgroundColor: item.isOnline ? "#22C55E" : "#9CA3AF" },
        ]}
      />
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: headerHeight }]}>
        <View
          style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Поиск по имени или username..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {loading && (
            <ActivityIndicator size="small" color={theme.primary} />
          )}
          {searchQuery.length > 0 && !loading && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {searchQuery.trim() ? (
        <>
          {results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.userId?.toString() || item.id?.toString()}
              contentContainerStyle={styles.listContent}
            />
          ) : !loading ? (
            <View style={styles.emptyState}>
              <Feather name="user-x" size={48} color={theme.textSecondary} />
              <ThemedText style={styles.emptyText}>
                Пользователь не найден
              </ThemedText>
              <ThemedText style={[styles.emptyHint, { color: theme.textSecondary }]}>
                Попробуйте другой запрос
              </ThemedText>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Feather name="users" size={48} color={theme.textSecondary} />
          <ThemedText style={styles.emptyText}>
            Найти пользователя
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: theme.textSecondary }]}>
            Введите имя или username
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  header: {
    padding: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.15)',
    flexDirection: "row",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderRadius: 26,
    gap: 12,
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    padding: 16,
    marginBottom: 10,
    borderRadius: 20,
    alignItems: "center",
    gap: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 3,
    color: '#FFFFFF',
  },
  username: {
    fontSize: 14,
    marginBottom: 3,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  bio: {
    fontSize: 13,
    marginBottom: 3,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  status: {
    fontSize: 13,
    color: '#4ECDC4',
  },
  onlineIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#08080C',
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 50,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: '#FFFFFF',
  },
  emptyHint: {
    fontSize: 15,
    textAlign: "center",
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 22,
  },
});