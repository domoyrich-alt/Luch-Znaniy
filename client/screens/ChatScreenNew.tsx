import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  StatusBar,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useStars } from "@/context/StarsContext";
import ChatService, { PrivateMessage } from "@/services/ChatService";
import GiftModal from "@/components/chat/GiftModal";
import ImageViewer from "@/components/ImageViewer";

// НЕОНОВЫЕ ЦВЕТА
const NEON = {
  primary: '#8B5CF6',
  secondary: '#4ECDC4',
  accent: '#FF6B9D',
  warning: '#FFD93D',
  success: '#6BCB77',
  error: '#FF6B6B',
  bgDark: '#0A0A0F',
  bgCard: '#141420',
  bgSecondary: '#1A1A2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  glowPurple: 'rgba(139, 92, 246, 0.5)',
  glowCyan: 'rgba(78, 205, 196, 0.5)',
};

interface ChatParams {
  chatId: number;
  otherUserId: number;
  otherUserName: string;
}

export default function ChatScreenNew() {
  const headerHeight = useHeaderHeight();
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { stars, spendStars, earnStars } = useStars();
  const insets = useSafeAreaInsets();

  const params = route.params as ChatParams;
  const chatId = params?.chatId;
  const otherUserId = params?.otherUserId;
  const otherUserName = params?.otherUserName || "Чат";

  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const flatListRef = useRef<FlatList>(null);

  // Загружаем сообщения при открытии чата
  useEffect(() => {
    if (chatId && user?.id) {
      loadMessages();
      // Отмечаем как прочитанные
      ChatService.markMessagesAsRead(chatId, user.id).catch(console.error);
    }
  }, [chatId, user?.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      if (chatId) {
        const msgs = await ChatService.getChatMessages(chatId, 100);
        setMessages(msgs);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось загрузить сообщения");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !user?.id) return;

    setSending(true);
    try {
      const msg = await ChatService.sendMessage(chatId, user.id, newMessage);
      setMessages([...messages, msg]);
      setNewMessage("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось отправить сообщение");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleSendPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0] && chatId && user?.id) {
        setSending(true);
        const asset = result.assets[0];
        const fileName = asset.uri.split("/").pop() || "photo.jpg";

        // Загружаем файл
        const { fileUrl, mimeType, fileSize } = await ChatService.uploadFile(
          asset.uri,
          fileName
        );

        // Отправляем сообщение с фото
        const msg = await ChatService.sendMediaMessage(
          chatId,
          user.id,
          fileUrl,
          "photo",
          fileName,
          fileSize
        );

        setMessages([...messages, msg]);
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось отправить фото");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleSendVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos as any,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.[0] && chatId && user?.id) {
        setSending(true);
        const asset = result.assets[0];
        const fileName = asset.uri.split("/").pop() || "video.mp4";

        // Загружаем файл
        const { fileUrl, mimeType, fileSize } = await ChatService.uploadFile(
          asset.uri,
          fileName
        );

        // Отправляем сообщение с видео
        const msg = await ChatService.sendMediaMessage(
          chatId,
          user.id,
          fileUrl,
          "video",
          fileName,
          fileSize
        );

        setMessages([...messages, msg]);
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось отправить видео");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  // Отправка подарка
  const handleSendGift = async (gift: any, giftMessage: string) => {
    if (!chatId || !user?.id) return;
    
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Формируем сообщение о подарке
      const giftText = `🎁 Подарок: ${gift.emoji} ${gift.name}${giftMessage ? `\n💬 ${giftMessage}` : ''}`;
      
      // Сначала списываем звёзды через сервер
      const canSpend = await spendStars(gift.price, 'chat_gift', `Подарок в чате: ${gift.name}`);
      if (!canSpend) {
        Alert.alert('⭐ Недостаточно звёзд', `Нужно ${gift.price} ⭐`);
        return;
      }
      
      const msg = await ChatService.sendMessage(chatId, user.id, giftText);
      setMessages([...messages, msg]);
      
      setGiftModalVisible(false);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      Alert.alert('🎁 Подарок отправлен!', `${gift.emoji} ${gift.name} для ${otherUserName}`);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось отправить подарок");
      console.error(error);
    }
  };

  const renderMessage = ({ item }: { item: PrivateMessage }) => {
    const isOwn = item.senderId === user?.id;
    const isGift = item.message?.startsWith('🎁 Подарок:');

    // Специальный рендер для подарков
    if (isGift) {
      return (
        <Animated.View
          style={[
            styles.messageContainer,
            isOwn && styles.ownMessageContainer,
          ]}
        >
          <LinearGradient
            colors={isOwn ? [NEON.primary, NEON.accent] : [NEON.bgCard, NEON.bgSecondary]}
            style={styles.giftBubble}
          >
            <ThemedText style={styles.giftText}>{item.message}</ThemedText>
          </LinearGradient>
          <ThemedText
            style={[
              styles.messageTime,
              isOwn && { color: NEON.textSecondary, textAlign: "right" },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString("ru", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </ThemedText>
        </Animated.View>
      );
    }

    if (item.mediaType === "photo") {
      return (
        <View
          style={[
            styles.messageContainer,
            isOwn && styles.ownMessageContainer,
          ]}
        >
          <Pressable
            onPress={() => {
              if (item.mediaUrl) {
                setSelectedImageUrl(item.mediaUrl);
                setImageViewerVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Image
              source={{ uri: item.mediaUrl }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          </Pressable>
          <ThemedText
            style={[
              styles.messageTime,
              isOwn && { color: "#fff", textAlign: "right" },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString("ru", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </ThemedText>
        </View>
      );
    }

    if (item.mediaType === "video") {
      return (
        <View
          style={[
            styles.messageContainer,
            isOwn && styles.ownMessageContainer,
          ]}
        >
          <View style={styles.videoContainer}>
            <MaterialIcons name="play-circle-fill" size={48} color="#fff" />
            <Image
              source={{ uri: `${item.mediaUrl}?thumb=1` }}
              style={StyleSheet.absoluteFillObject}
              blurRadius={2}
            />
          </View>
          <ThemedText
            style={[
              styles.messageTime,
              isOwn && { color: "#fff", textAlign: "right" },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString("ru", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </ThemedText>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn && styles.ownMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn
              ? { backgroundColor: theme.primary }
              : { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              isOwn && { color: "#fff" },
            ]}
          >
            {item.message}
          </ThemedText>
        </View>
        <ThemedText
          style={[
            styles.messageTime,
            isOwn && { color: "#fff", textAlign: "right" },
          ]}
        >
          {new Date(item.createdAt).toLocaleTimeString("ru", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </ThemedText>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: NEON.bgDark }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={NEON.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: NEON.bgDark }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
    >
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 8),
            backgroundColor: NEON.bgDark,
            borderBottomColor: NEON.primary + '30',
          },
        ]}
      >
        <Pressable 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={NEON.primary} />
          <ThemedText style={[styles.headerTitle, { color: NEON.textPrimary }]}>
            {otherUserName}
          </ThemedText>
        </Pressable>
        
        {/* Кнопка подарка в header */}
        <Pressable 
          style={styles.giftHeaderButton}
          onPress={() => setGiftModalVisible(true)}
        >
          <LinearGradient
            colors={[NEON.accent, NEON.primary]}
            style={styles.giftHeaderGradient}
          >
            <ThemedText style={styles.giftHeaderEmoji}>🎁</ThemedText>
          </LinearGradient>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        style={{ backgroundColor: NEON.bgDark }}
      />

      {/* INPUT CONTAINER С НЕОНОМ */}
      <View style={[styles.inputContainer, { backgroundColor: NEON.bgCard }]}>
        <Pressable 
          onPress={() => setGiftModalVisible(true)} 
          disabled={sending}
          style={styles.actionButton}
        >
          <ThemedText style={styles.actionEmoji}>🎁</ThemedText>
        </Pressable>

        <Pressable onPress={handleSendPhoto} disabled={sending} style={styles.actionButton}>
          <MaterialIcons name="image" size={22} color={NEON.secondary} />
        </Pressable>

        <Pressable 
          onPress={handleSendVideo} 
          disabled={sending} 
          style={styles.videoRecordButton}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            // Здесь можно добавить запись видеосообщения
          }}
        >
          <LinearGradient
            colors={[NEON.accent, '#FF4757']}
            style={styles.videoRecordGradient}
          >
            <MaterialIcons name="videocam" size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        <TextInput
          style={styles.neonInput}
          placeholder="Сообщение..."
          placeholderTextColor={NEON.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
          editable={!sending}
        />

        <Pressable
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          style={styles.sendButtonWrapper}
        >
          <LinearGradient
            colors={newMessage.trim() ? [NEON.primary, NEON.accent] : [NEON.bgSecondary, NEON.bgSecondary]}
            style={styles.sendGradient}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={18} color="#fff" />
            )}
          </LinearGradient>
        </Pressable>
      </View>
      
      {/* МОДАЛКА ПОДАРКОВ */}
      <GiftModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        onSendGift={handleSendGift}
        userStars={stars || 0}
        recipientName={otherUserName}
        isCeo={user?.role === 'ceo'}
      />
      
      {/* ПРОСМОТР ФОТО */}
      <ImageViewer
        visible={imageViewerVisible}
        imageUrl={selectedImageUrl}
        onClose={() => setImageViewerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  giftHeaderButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  giftHeaderGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  giftHeaderEmoji: {
    fontSize: 20,
  },
  
  messagesList: {
    padding: 12,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  ownMessageContainer: {
    alignSelf: "flex-end",
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: NEON.bgCard,
  },
  messageText: {
    fontSize: 15,
    color: NEON.textPrimary,
  },
  
  // Подарок
  giftBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  giftText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  videoContainer: {
    width: 200,
    height: 200,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  messageTime: {
    fontSize: 11,
    color: NEON.textSecondary,
    marginTop: 4,
  },
  
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: NEON.primary + '20',
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoRecordButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  videoRecordGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 22,
  },
  neonInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    backgroundColor: NEON.bgSecondary,
    color: NEON.textPrimary,
    borderWidth: 1,
    borderColor: NEON.primary + '30',
  },
  sendButtonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendGradient: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Старые стили для совместимости
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
