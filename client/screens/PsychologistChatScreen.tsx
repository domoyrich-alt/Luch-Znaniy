import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { getApiUrl } from "@/lib/query-client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

interface Message {
  id: number;
  studentId: number;
  psychologistId: number | null;
  senderId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatPreview {
  studentId: number;
  studentName: string;
  lastMessage: string;
  unreadCount: number;
}

export default function PsychologistChatScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const isPsychologist = user?.role === "psychologist";
  
  useEffect(() => {
    if (isPsychologist) {
      fetchChats();
    } else if (user?.id) {
      setSelectedStudentId(user.id);
      fetchMessages(user.id);
    }
  }, [user?.id, isPsychologist]);
  
  const fetchChats = async () => {
    try {
      const response = await fetch(new URL("/api/psychologist/chats", getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (e) {
      console.error("Failed to fetch chats:", e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMessages = async (studentId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(new URL(`/api/psychologist/messages/${studentId}`, getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        if (isPsychologist) {
          await fetch(new URL(`/api/psychologist/messages/${studentId}/read`, getApiUrl()).toString(), { method: "POST" });
        }
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedStudentId || !user?.id) return;
    
    try {
      const response = await fetch(new URL("/api/psychologist/messages", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          psychologistId: isPsychologist ? user.id : null,
          senderId: user.id,
          message: newMessage.trim(),
        }),
      });
      
      if (response.ok) {
        const msg = await response.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage("");
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  };
  
  const selectChat = (studentId: number) => {
    setSelectedStudentId(studentId);
    fetchMessages(studentId);
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage, { backgroundColor: isMe ? colors.primary : colors.card }]}>
        <ThemedText style={[styles.messageText, isMe && { color: "#fff" }]}>{item.message}</ThemedText>
        <ThemedText style={[styles.messageTime, isMe && { color: "rgba(255,255,255,0.7)" }]}>
          {new Date(item.createdAt).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
        </ThemedText>
      </View>
    );
  };
  
  const renderChatPreview = ({ item }: { item: ChatPreview }) => (
    <Pressable style={[styles.chatPreview, { backgroundColor: colors.card }]} onPress={() => selectChat(item.studentId)}>
      <View style={styles.chatInfo}>
        <ThemedText style={styles.chatName}>{item.studentName}</ThemedText>
        <ThemedText style={styles.lastMessage} numberOfLines={1}>{item.lastMessage || "Нет сообщений"}</ThemedText>
      </View>
      {item.unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <ThemedText style={styles.badgeText}>{item.unreadCount}</ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
  
  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }
  
  if (isPsychologist && !selectedStudentId) {
    return (
      <ThemedView style={[styles.container, { paddingTop: headerHeight }]}>
        <ThemedText style={styles.title}>Обращения учеников</ThemedText>
        {chats.length === 0 ? (
          <View style={styles.centered}>
            <Feather name="inbox" size={48} color={colors.textSecondary} />
            <ThemedText style={styles.emptyText}>Пока нет обращений</ThemedText>
          </View>
        ) : (
          <FlatList data={chats} renderItem={renderChatPreview} keyExtractor={item => item.studentId.toString()} contentContainerStyle={{ padding: Spacing.md }} />
        )}
      </ThemedView>
    );
  }
  
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={headerHeight}>
      <ThemedView style={[styles.chatContainer, { paddingTop: headerHeight }]}>
        {isPsychologist ? (
          <Pressable style={styles.backButton} onPress={() => setSelectedStudentId(null)}>
            <Feather name="arrow-left" size={20} color={colors.primary} />
            <ThemedText style={{ color: colors.primary, marginLeft: 4 }}>Назад к списку</ThemedText>
          </Pressable>
        ) : (
          <View style={styles.header}>
            <ThemedText style={styles.title}>Психолог</ThemedText>
            <ThemedText style={styles.subtitle}>Напишите о своих переживаниях</ThemedText>
          </View>
        )}
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[styles.messagesList, { paddingBottom: insets.bottom + 70 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        
        <View style={[styles.inputContainer, { backgroundColor: colors.card, paddingBottom: insets.bottom || Spacing.md }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Написать сообщение..."
            placeholderTextColor={colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <Pressable style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={sendMessage}>
            <Feather name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatContainer: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "600", paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  subtitle: { fontSize: 14, opacity: 0.6, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  header: { paddingBottom: Spacing.sm },
  backButton: { flexDirection: "row", alignItems: "center", padding: Spacing.md },
  messagesList: { padding: Spacing.md },
  messageBubble: { maxWidth: "80%", padding: Spacing.sm, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm },
  myMessage: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  otherMessage: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15 },
  messageTime: { fontSize: 11, opacity: 0.7, marginTop: 4, alignSelf: "flex-end" },
  inputContainer: { flexDirection: "row", padding: Spacing.md, alignItems: "flex-end" },
  input: { flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.sm, maxHeight: 100, marginRight: Spacing.sm },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  chatPreview: { flexDirection: "row", padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm, alignItems: "center" },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: "600" },
  lastMessage: { fontSize: 14, opacity: 0.6, marginTop: 4 },
  badge: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  emptyText: { marginTop: Spacing.md, opacity: 0.6 },
});
