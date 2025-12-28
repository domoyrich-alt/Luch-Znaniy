import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, BackHandler } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface Message {
  id: string;
  senderId: string;
  message: string;
  isFromPsychologist: boolean;
  createdAt: string;
}

export default function PsychologistChatScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);
  const colors = isDark ? Colors.dark : Colors.light;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "psychologist",
      message: "Здравствуйте! Я школьный психолог. Вы можете рассказать мне о том, что вас беспокоит. Все наши разговоры конфиденциальны.",
      isFromPsychologist: true,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  // Обработка кнопки назад
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Если нельзя вернуться (например, экран открыт как стартовый), уходим в список чатов
      navigation.navigate('ChatsList');
    }
  };

  // Android hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleGoBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );
  
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      senderId: "user",
      message: newMessage.trim(),
      isFromPsychologist: false,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setNewMessage("");
    
    setTimeout(() => {
      const responseMsg: Message = {
        id: (Date.now() + 1).toString(),
        senderId: "psychologist",
        message: "Спасибо, что поделились. Я внимательно вас слушаю. Расскажите подробнее о ваших чувствах.",
        isFromPsychologist: true,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, responseMsg]);
    }, 1500);
  };
  
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = !item.isFromPsychologist;
    return (
      <View style={[
        styles.messageBubble,
        isMe ?  styles.myMessage : styles.otherMessage,
        { backgroundColor: isMe ?  colors.primary : theme.backgroundSecondary }
      ]}>
        <ThemedText style={[styles.messageText, isMe && { color: "#fff" }]}>
          {item.message}
        </ThemedText>
        <ThemedText style={[styles.messageTime, isMe && { color:  "rgba(255,255,255,0.7)" }]}>
          {new Date(item.createdAt).toLocaleTimeString("ru", { hour: "2-digit", minute:  "2-digit" })}
        </ThemedText>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight + insets.top : 0}
    >
      <ThemedView style={styles.chatContainer}>
        <View style={styles.header}>
          <Pressable 
            onPress={handleGoBack}
            style={[styles.headerButton, { padding: 12, marginLeft: -12 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={22} color={theme.primary} />
          </Pressable>
          
          <View style={[styles.avatarContainer, { backgroundColor: colors.secondary + "20" }]}>
            <Feather name="heart" size={24} color={colors.secondary} />
          </View>
          <View style={styles.headerInfo}>
            <ThemedText style={styles.headerTitle}>Школьный психолог</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Конфиденциальная поддержка
            </ThemedText>
          </View>
        </View>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.messagesList]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={[
          styles.inputContainer, 
          {
            backgroundColor: theme.backgroundDefault,
            paddingBottom: Math.max(insets.bottom, Spacing.md),
          }
        ]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme. backgroundSecondary, color: theme.text }]}
            placeholder="Напишите сообщение..."
            placeholderTextColor={colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <Pressable 
            style={[styles.sendButton, { backgroundColor: colors.secondary }]} 
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerButton: {
    borderRadius: 8,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle:  {
    fontSize: 13,
  },
  messagesList: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    flexGrow: 1,
  },
  messageBubble:  {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  myMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    padding: Spacing.md,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    gap: Spacing.sm,
    paddingBottom: Spacing["2xl"], // ИСПРАВЛЕНО: фиксированный отступ
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    paddingHorizontal: Spacing. md,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});