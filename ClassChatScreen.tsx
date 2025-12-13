import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ChatMessage {
  id: number;
  classId: number;
  senderId: number;
  senderName: string;
  message: string;
  createdAt: string;
}

export default function ClassChatScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [messageText, setMessageText] = useState("");

  const classId = user?.classId || 11;

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/class-chat", classId],
    refetchInterval: 5000,
  });

  const { data: students = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/class", classId, "students"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest(`/api/class-chat/${classId}`, {
        method: "POST",
        body: JSON.stringify({
          senderId: user?.id,
          message,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-chat", classId] });
      setMessageText("");
    },
  });

  const handleSend = () => {
    if (messageText.trim() && user) {
      sendMessageMutation.mutate(messageText.trim());
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderId === user?.id;
    
    return (
      <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        {!isOwnMessage && (
          <ThemedText type="caption" style={[styles.senderName, { color: Colors.light.primary }]}>
            {item.senderName}
          </ThemedText>
        )}
        <ThemedText type="body" style={isOwnMessage ? styles.ownMessageText : {}}>
          {item.message}
        </ThemedText>
        <ThemedText type="caption" style={[styles.messageTime, { color: isOwnMessage ? "#FFFFFF99" : theme.textSecondary }]}>
          {formatTime(item.createdAt)}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: headerHeight + Spacing.sm }]}>
        <View style={styles.classInfo}>
          <ThemedText type="h3">Чат класса</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {students.length} участников
          </ThemedText>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="message-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Начните общение с одноклассниками
          </ThemedText>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm, backgroundColor: theme.backgroundDefault }]}>
        <TextInput
          style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
          placeholder="Написать сообщение..."
          placeholderTextColor={theme.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={handleSend}
          disabled={!messageText.trim() || sendMessageMutation.isPending}
          style={[
            styles.sendButton,
            { backgroundColor: messageText.trim() ? Colors.light.primary : theme.backgroundSecondary },
          ]}
        >
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="send" size={20} color={messageText.trim() ? "#FFFFFF" : theme.textSecondary} />
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  classInfo: {
    gap: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: Colors.light.primary,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  ownMessageText: {
    color: "#FFFFFF",
  },
  senderName: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  messageTime: {
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
