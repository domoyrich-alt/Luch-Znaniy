import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  TextInput, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  Animated,
  StatusBar
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { TelegramChatHeader } from "@/components/chat/TelegramChatHeader";
import { TelegramMessageBubble } from "@/components/chat/TelegramMessageBubble";
import { TelegramInputBar } from "@/components/chat/TelegramInputBar";

const { width } = Dimensions.get('window');

type ScreenMode = 'list' | 'chat';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?:  { backgroundColor: string; text: string };
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'system' | 'file' | 'voice';
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
  };
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  isRead?:  boolean;
  isDelivered?: boolean;
  isEdited?: boolean;
  fileName?: string;
  fileSize?: string;
  duration?: string;
}

interface Chat {
  id: string;
  type: 'private' | 'group' | 'channel';
  title: string;
  lastMessage: string;
  time:  string;
  unreadCount:  number;
  avatar: {
    backgroundColor: string;
    text: string;
  };
  isOnline?:  boolean;
  members?:  number;
  isPinned?: boolean;
}

// Компонент типинга
const TypingIndicator = ({ users }: { users: string[] }) => {
  const { theme } = useTheme();
  const dotAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true })
      ])
    ).start();
  }, []);
  return (
    <View style={styles.typingContainer}>
      <View style={[styles.typingBubble, { backgroundColor: '#2A2A2A' }]}>
        <ThemedText style={[styles.typingText, { color: theme.textSecondary }]}>
          {users.join(', ')} {users.length === 1 ? 'печатает' : 'печатают'}
        </ThemedText>
        <Animated.View style={[styles.typingDots, { opacity: dotAnim }]}>
          <View style={[styles.typingDot, { backgroundColor: '#8B5CF6' }]} />
          <View style={[styles.typingDot, { backgroundColor: '#8B5CF6' }]} />
          <View style={[styles.typingDot, { backgroundColor: '#8B5CF6' }]} />
        </Animated.View>
      </View>
    </View>
  );
};

// Keep legacy component for list view compatibility
const AnimatedMessage = ({ message, onLongPress, chatType, theme }: { message: Message; onLongPress: (msg: Message) => void; chatType: Chat["type"]; theme: any }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  if (message.type === 'system') {
    return (
      <Animated.View style={[styles.systemMessage, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.systemMessageBg}
        >
          <ThemedText style={styles.systemText}>{message.text}</ThemedText>
        </LinearGradient>
      </Animated.View>
    );
  }

  const isGroup = chatType === 'group';
  const showAvatar = !message.isOwn && isGroup;

  return (
    <Animated.View
      style={[
        styles. messageContainer,
        message.isOwn && styles.ownMessage,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => onLongPress(message)}
        style={styles.messageWrapper}
      >
        {showAvatar && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[message.senderAvatar?.backgroundColor || '#4ECDC4', (message.senderAvatar?.backgroundColor || '#4ECDC4') + 'CC']}
              style={styles. avatar}
            >
              <ThemedText style={styles.avatarText}>{message.senderAvatar?.text || 'U'}</ThemedText>
            </LinearGradient>
          </View>
        )}
        
        <View style={[styles.messageContent, message.isOwn && styles. ownMessageContent]}>
          {showAvatar && (
            <ThemedText style={[styles.senderName, { color: message.senderAvatar?.backgroundColor || '#4ECDC4' }]}>
              {message. senderName}
            </ThemedText>
          )}
          
          {message.replyTo && (
            <View style={[styles.replyContainer, { borderLeftColor: message.senderAvatar?.backgroundColor || '#4ECDC4' }]}>
              <LinearGradient
                colors={[(message.senderAvatar?.backgroundColor || '#4ECDC4') + '20', 'transparent']}
                style={styles. replyBg}
              >
                <ThemedText style={styles.replyAuthor}>{message.replyTo.senderName}</ThemedText>
                <ThemedText style={styles.replyText} numberOfLines={1}>{message.replyTo.text}</ThemedText>
              </LinearGradient>
            </View>
          )}
          
          {message.type === 'text' && (
            <LinearGradient
              colors={message.isOwn 
                ? [theme.primary || '#007AFF', (theme.primary || '#007AFF') + 'DD']
                : [theme.backgroundSecondary || '#2A2A2A', theme.backgroundSecondary || '#2A2A2A']
              }
              style={[styles.messageBubble, message.isOwn && styles. ownMessageBubble]}
            >
              <ThemedText style={[
                styles.messageText,
                { color: message.isOwn ? '#FFFFFF' : (theme.text || '#FFFFFF') }
              ]}>
                {message.text}
              </ThemedText>
              
              {message.reactions && (
                <View style={styles. reactionsContainer}>
                  {message.reactions.map((reaction, index) => (
                    <Pressable key={index} style={styles.reactionBubble}>
                      <ThemedText style={styles.reactionEmoji}>{reaction.emoji}</ThemedText>
                      <ThemedText style={styles.reactionCount}>{reaction.count}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
              
              <View style={styles.messageFooter}>
                <ThemedText style={[styles.messageTime, message.isOwn && styles.ownMessageTime]}>
                  {message.timestamp}
                </ThemedText>
                {message.isOwn && (
                  <View style={styles.messageStatus}>
                    {message.isRead ?  (
                      <MaterialIcons name="done-all" size={16} color="#4ECDC4" />
                    ) : message.isDelivered ? (
                      <MaterialIcons name="done-all" size={16} color="#CCCCCC" />
                    ) : (
                      <MaterialIcons name="done" size={16} color="#CCCCCC" />
                    )}
                  </View>
                )}
                {message.isEdited && (
                  <ThemedText style={styles.editedText}>edited</ThemedText>
                )}
              </View>
            </LinearGradient>
          )}

          {message.type === 'file' && (
            <LinearGradient
              colors={['#FF6B6B20', '#FF6B6B10']}
              style={styles. fileBubble}
            >
              <View style={styles.fileContent}>
                <View style={styles.fileIcon}>
                  <Feather name="file-text" size={24} color="#FF6B6B" />
                </View>
                <View style={styles.fileInfo}>
                  <ThemedText style={styles.fileName}>{message.fileName}</ThemedText>
                  <ThemedText style={styles.fileSize}>{message.fileSize}</ThemedText>
                </View>
                <Pressable style={styles.downloadButton}>
                  <Feather name="download" size={20} color={theme.primary} />
                </Pressable>
              </View>
            </LinearGradient>
          )}

          {message.type === 'voice' && (
            <LinearGradient
              colors={['#8B5CF620', '#8B5CF610']}
              style={styles. voiceBubble}
            >
              <View style={styles.voiceContent}>
                <Pressable style={styles.voicePlayButton}>
                  <Feather name="play" size={16} color="#8B5CF6" />
                </Pressable>
                <View style={styles.voiceWaveform}>
                  {[...Array(20)].map((_, i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.waveformBar, 
                        { height: Math.random() * 20 + 5, backgroundColor: '#8B5CF6' }
                      ]} 
                    />
                  ))}
                </View>
                <ThemedText style={styles.voiceDuration}>{message.duration}</ThemedText>
              </View>
            </LinearGradient>
          )}
        </View>
      </Pressable>
    </Animated. View>
  );
};

// Компонент типинга - removed duplicate, kept above

// Основной компонент
export default function ChatsScreen() {
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  
  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [searchText, setSearchText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // СПИСОК ЧАТОВ
  const [chats] = useState<Chat[]>([
    {
      id: "class_11a",
      type: "group",
      title: "Класс 11А",
      lastMessage: "Мария Ивановна:  Формулы_для_контрольной. pdf",
      time: "14:40",
      unreadCount: 3,
      avatar: { backgroundColor: "#FF6B6B", text: "11А" },
      members: 25,
      isPinned: true
    },
    {
      id: "english_group",
      type: "group", 
      title: "English Advanced",
      lastMessage: "John:  Today we're learning about Present Perfect",
      time: "10:15",
      unreadCount: 0,
      avatar: { backgroundColor:  "#10B981", text: "EN" },
      members: 15
    },
    {
      id: "anna_private",
      type: "private",
      title: "Анна Петрова",
      lastMessage: "Встретимся в 13:30 в библиотеке? ",
      time: "18:37",
      unreadCount: 0,
      avatar: { backgroundColor:  "#4ECDC4", text: "А" },
      isOnline: true
    },
    {
      id: "teacher_maria",
      type: "private",
      title: "Мария Ивановна",
      lastMessage: "Спасибо большое!  Очень старался 😊",
      time: "16:20",
      unreadCount: 0,
      avatar:  { backgroundColor: "#8B5CF6", text: "М" },
      isOnline:  false
    }
  ]);

  // Данные чата
  const getChatData = () => {
    if (!currentChat) return { messages: [] };
    
    switch (currentChat.id) {
      case "class_11a":
        return {
          pinnedMessage: {
            type: "text",
            text: "Расписание на неделю",
            sender: "Классный руководитель"
          },
          messages: [
            {
              id: "1",
              type: "system",
              text: "Анна П.  присоединилась к чату",
              timestamp: "09:15",
              isOwn: false
            },
            {
              id: "2",
              type:  "text",
              text: "Добрый день, класс!  Напоминаю о контрольной по алгебре завтра во вторник.",
              senderId: "teacher_math",
              senderName: "Мария Ивановна",
              senderAvatar: { backgroundColor: "#3B82F6", text: "М" },
              timestamp: "14:20",
              isOwn: false
            },
            {
              id: "3",
              type: "text",
              text:  "Мария Ивановна, какие темы будут? ",
              senderId: "student_alex",
              senderName: "Александр",
              senderAvatar: { backgroundColor: "#22C55E", text: "А" },
              timestamp: "14:25",
              isOwn: false,
              replyTo: {
                messageId: "2",
                senderName: "Мария Ивановна",
                text:  "Добрый день, класс! Напоминаю о контрольной..."
              }
            },
            {
              id: "4",
              type: "text",
              text: "Квадратные уравнения и системы уравнений.  Повторите параграфы 15-18.",
              senderId: "teacher_math",
              senderName: "Мария Ивановна",
              senderAvatar: { backgroundColor: "#3B82F6", text: "М" },
              timestamp: "14:27",
              isOwn: false,
              reactions: [
                { emoji: "👍", count: 8, users: ["user1", "user2", "user3"] },
                { emoji: "📚", count: 3, users: ["user4", "user5"] }
              ]
            },
            {
              id: "5",
              type: "text",
              text: "Спасибо! Буду готовиться 📖",
              senderId: "student_current",
              senderName: user?.firstName || "Вы",
              senderAvatar:  { backgroundColor: "#8B5CF6", text: user?.firstName?. charAt(0) || "Я" },
              timestamp: "14:30",
              isOwn: true,
              isDelivered: true,
              isRead: true
            },
            {
              id: "8",
              type: "file",
              text: "Формулы_для_контрольной.pdf",
              fileName: "Формулы_для_контрольной.pdf",
              fileSize: "2.1 MB",
              senderId:  "teacher_math",
              senderName: "Мария Ивановна",
              senderAvatar: { backgroundColor: "#3B82F6", text:  "М" },
              timestamp:  "14:40",
              isOwn: false
            }
          ]
        };

      case "anna_private":
        return {
          messages: [
            {
              id: "1",
              type:  "text",
              text: "Привет! Ты готов к контрольной завтра?",
              senderId: "anna_petrov",
              senderName:  "Анна",
              senderAvatar: { backgroundColor: "#4ECDC4", text: "А" },
              timestamp: "18:30",
              isOwn: false
            },
            {
              id: "2",
              type: "text",
              text:  "Привет! Да, повторяю формулы.  А ты? ",
              senderId: "current_user",
              senderName: user?.firstName || "Вы",
              senderAvatar: { backgroundColor: "#007AFF", text: user?.firstName?.charAt(0) || "Я" },
              timestamp: "18:32",
              isOwn: true
            },
            {
              id: "4",
              type: "text",
              text: "Отличная идея! Встретимся в 13:30 в библиотеке?",
              senderId: "current_user",
              senderName: user?.firstName || "Вы",
              senderAvatar: { backgroundColor: "#007AFF", text: user?.firstName?.charAt(0) || "Я" },
              timestamp: "18:37",
              isOwn: true
            }
          ]
        };
      
      default:
        return { messages: [] };
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const chatData = getChatData();

  // Восстановить функцию openChat и backToList:
  const openChat = (chat: Chat) => {
    setCurrentChat(chat);
    const data = getChatData();
    // Преобразуем сообщения, чтобы senderId всегда был string
    const fixedMessages = (data.messages || []).map((msg: any) => ({
      ...msg,
      senderId: msg.senderId ? String(msg.senderId) : '',
    }));
    setMessages(fixedMessages);
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setScreenMode('chat');
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  const backToList = () => {
    setCurrentChat(null);
    setMessages([]);
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setScreenMode('list');
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  // Исправленный useEffect для перехода между режимами:
  useEffect(() => {
    if (screenMode === 'chat') {
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      if (currentChat?.type === 'group') {
        const timer = setTimeout(() => {
          setTypingUsers(['Анна', 'Максим']);
          setTimeout(() => setTypingUsers([]), 3000);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [screenMode, currentChat]);

  // Исправленный sendMessage:
  const sendMessage = () => {
    if (!messageText.trim() && !isRecording) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      type: isRecording ? 'voice' : 'text',
      text: isRecording ? 'Голосовое сообщение' : messageText,
      duration: isRecording ? `0:${recordingDuration.toString().padStart(2, '0')}` : undefined,
      senderId: String(user?.id || 'current_user'),
      senderName: user?.firstName || 'Вы',
      senderAvatar: { backgroundColor: '#007AFF', text: user?.firstName?.charAt(0) || 'Я' },
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      isOwn: true,
      isDelivered: false,
      replyTo: replyToMessage ? {
        messageId: replyToMessage.id,
        senderName: replyToMessage.senderName,
        text: replyToMessage.text.slice(0, 50) + (replyToMessage.text.length > 50 ? '...' : '')
      } : undefined
    };
    setMessages(prev => [newMessage, ...prev]);
    setMessageText("");
    setReplyToMessage(null);
    setIsRecording(false);
    setRecordingDuration(0);
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id ? { ...msg, isDelivered: true } : msg
      ));
    }, 1000);
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id ? { ...msg, isRead: true } : msg
      ));
    }, 3000);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    recordingTimer.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }
    sendMessage();
  };

  const handleLongPress = (message: Message) => {
    if (message.type === 'system') return;
    
    Alert.alert(
      message.senderName,
      "Выберите действие:",
      [
        { text: "Ответить", onPress: () => setReplyToMessage(message) },
        { text: "Копировать", onPress: () => console.log("Copy") },
        { text: "Удалить", style: "destructive", onPress: () => console.log("Delete") },
        { text: "Отмена", style: "cancel" }
      ]
    );
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setShowScrollToBottom(false);
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent. contentOffset.y;
    setShowScrollToBottom(offsetY > 500);
  };

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchText. toLowerCase())
  );

  const renderChatItem = ({ item }: { item: Chat }) => (
    <Pressable 
      style={[styles.chatItem, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => openChat(item)}
    >
      <View style={styles. listAvatarContainer}>
        <View style={[styles.listChatAvatar, { backgroundColor: item.avatar.backgroundColor }]}>
          <ThemedText style={styles.listAvatarText}>{item.avatar.text}</ThemedText>
        </View>
        {item.isOnline && <View style={styles.listOnlineIndicator} />}
        {item.isPinned && <View style={styles.listPinnedIndicator} />}
      </View>

      <View style={styles.listChatContent}>
        <View style={styles.listChatHeader}>
          <ThemedText style={styles.listChatTitle} numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText style={styles.listChatTime}>{item.time}</ThemedText>
        </View>
        
        <View style={styles. listChatFooter}>
          <ThemedText style={styles.listLastMessage} numberOfLines={1}>
            {item.lastMessage}
          </ThemedText>
          {item.unreadCount > 0 && (
            <View style={[styles.listUnreadBadge, { backgroundColor: theme. primary }]}>
              <ThemedText style={styles.listUnreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </ThemedText>
            </View>
          )}
        </View>

        {item.type === 'group' && item.members && (
          <ThemedText style={styles.listMembersCount}>
            {item.members} участников
          </ThemedText>
        )}
      </View>
    </Pressable>
  );

  if (screenMode === 'chat' && currentChat) {
    const chatStatus = currentChat.type === 'private'
      ? (currentChat.isOnline ? 'online' : 'last seen recently')
      : `${currentChat.members} members`;

    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <StatusBar barStyle="light-content" />
        
        {/* Telegram-style Header */}
        <Animated.View style={[{ opacity: fadeAnim }, { paddingTop: headerHeight }]}>
          <TelegramChatHeader
            title={currentChat.title}
            status={chatStatus}
            avatar={currentChat.avatar}
            onBackPress={backToList}
            onAvatarPress={() => console.log('Avatar pressed')}
          />
        </Animated.View>

        {/* Chat Background with Telegram-style pattern */}
        <View style={[styles.messagesBackground, { backgroundColor: isDark ? '#0E0E0E' : '#E5DDD5' }]}>
          {/* Background pattern overlay */}
          <View style={styles.chatWallpaper} />
          
          <FlatList
            ref={flatListRef}
            data={messages} 
            renderItem={({ item }) => (
              <TelegramMessageBubble
                message={item}
                onLongPress={handleLongPress}
                showAvatar={currentChat.type === 'group' && !item.isOwn}
              />
            )}
            keyExtractor={(item) => item.id} 
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            inverted
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          {typingUsers.length > 0 && (
            <TypingIndicator users={typingUsers} />
          )}
        </View>

        {showScrollToBottom && (
          <Pressable onPress={scrollToBottom} style={styles.scrollToBottomButton}>
            <View style={[styles.scrollToBottomCircle, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="chevron-down" size={24} color={theme.text} />
            </View>
          </Pressable>
        )}

        {/* Telegram-style Input Bar */}
        <TelegramInputBar
          messageText={messageText}
          onMessageTextChange={setMessageText}
          onSend={sendMessage}
          onAttach={() => console.log('Attach')}
          onEmoji={() => console.log('Emoji')}
          onVoiceStart={startRecording}
          onVoiceStop={stopRecording}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          replyTo={replyToMessage ? {
            messageId: replyToMessage.id,
            senderName: replyToMessage.senderName,
            text: replyToMessage.text
          } : null}
          onCancelReply={() => setReplyToMessage(null)}
        />
      </KeyboardAvoidingView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles. container, { opacity: fadeAnim }]}>
        <View style={[styles.listHeader, { paddingTop: headerHeight }]}>
          <View style={styles.listHeaderContent}>
            <ThemedText style={styles.listHeaderTitle}>Чаты</ThemedText>
            <View style={styles.listHeaderActions}>
              <Pressable style={styles.listHeaderButton}>
                <Feather name="search" size={24} color={theme.text} />
              </Pressable>
              <Pressable style={styles.listHeaderButton}>
                <Feather name="edit" size={24} color={theme.text} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.listSearchContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.listSearchInput, { color: theme.text }]}
              placeholder="Поиск"
              placeholderTextColor={theme.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <View style={styles.listQuickActions}>
            <Pressable 
              style={[styles.listQuickAction, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="users" size={20} color={theme.primary} />
              <ThemedText style={styles.listQuickActionText}>Создать группу</ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.listQuickAction, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="user-plus" size={20} color={theme.primary} />
              <ThemedText style={styles.listQuickActionText}>Контакты</ThemedText>
            </Pressable>
          </View>
        </View>

        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          style={styles.listChatsList}
          showsVerticalScrollIndicator={false}
        />

        <Pressable 
          style={[styles.listFab, { backgroundColor: theme.primary }]}
        >
          <Feather name="edit-3" size={24} color="#FFFFFF" />
        </Pressable>
      </Animated. View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  listHeader: { paddingHorizontal: 20, paddingBottom: 15 },
  listHeaderContent:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginBottom: 15 },
  listHeaderTitle:  { fontSize: 32, fontWeight: '700' },
  listHeaderActions: { flexDirection: 'row', gap: 8 },
  listHeaderButton:  { padding: 8 },
  
  listSearchContainer: { flexDirection: 'row', alignItems:  'center', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, gap: 10, marginBottom: 15 },
  listSearchInput:  { flex: 1, fontSize: 16 },
  
  listQuickActions: { flexDirection: 'row', gap:  12 },
  listQuickAction: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  listQuickActionText: { marginLeft: 8, fontSize: 14, fontWeight: '500' },
  
  listChatsList: { flex: 1 },
  chatItem: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  
  listAvatarContainer: { position: 'relative', marginRight: 16 },
  listChatAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  listAvatarText: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  listOnlineIndicator: { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22C55E', borderWidth: 2, borderColor:  '#FFFFFF' },
  listPinnedIndicator: { position: 'absolute', top: -2, left: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFD700' },
  
  listChatContent: { flex: 1 },
  listChatHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  listChatTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  listChatTime: { fontSize: 14, opacity: 0.7 },
  
  listChatFooter: { flexDirection:  'row', justifyContent:  'space-between', alignItems: 'center' },
  listLastMessage: { fontSize: 15, opacity: 0.8, flex: 1 },
  
  listUnreadBadge:  { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  listUnreadText:  { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  
  listMembersCount: { fontSize: 13, opacity: 0.6, marginTop: 4 },
  
  listFab: { position: 'absolute', bottom: 24, right: 24, width: 56, height:  56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset:  { width: 0, height:  4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  
  header: { paddingHorizontal: 16, paddingBottom: 12, position: 'relative', zIndex: 100 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingTop: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  backButtonGradient: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#4ECDC4', fontSize: 17, marginLeft: 8, fontWeight: '500' },
  
  chatInfo: { flex: 1 },
  chatTitleContainer: { flex: 1 },
  chatTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  chatStatus: { color: '#CCCCCC', fontSize: 13 },
  
  headerAvatar: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity:  0.3,
    shadowRadius: 4,
    elevation: 5
  },
  headerAvatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionButton:  { 
    padding: 8, 
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  
  pinnedMessage: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 12, 
    padding: 12, 
    borderRadius: 16
  },
  pinnedIcon: { marginRight: 12 },
  pinnedContent:  { flex: 1 },
  pinnedLabel: { color: '#4ECDC4', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  pinnedText: { color: '#CCCCCC', fontSize: 14, marginTop: 2 },
  pinnedClose: { padding: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  messagesBackground: { flex: 1, position: 'relative' },
  messagesList: { flex: 1, paddingHorizontal: 16 },
  messagesContent: { paddingVertical: 16 },
  
  systemMessage: { alignItems: 'center', marginVertical: 12 },
  systemMessageBg: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  systemText: { color: '#CCCCCC', fontSize: 13, opacity: 0.8, textAlign: 'center', fontWeight: '500' },
  
  messageContainer: { flexDirection: 'row', marginVertical: 6, alignItems: 'flex-start' },
  ownMessage: { justifyContent: 'flex-end' },
  messageWrapper: { maxWidth: width * 0.8 },
  
  avatarContainer: { marginRight: 12 },
  avatar: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  
  messageContent: { flex: 1 },
  ownMessageContent: { alignItems: 'flex-end' },
  senderName: { fontSize: 14, fontWeight: '700', marginBottom: 4, letterSpacing: 0.3 },
  
  replyContainer: { borderLeftWidth: 4, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  replyBg: { paddingHorizontal: 12, paddingVertical: 8 },
  replyAuthor: { fontSize: 12, fontWeight: '700', color: '#4ECDC4', marginBottom: 2 },
  replyText:  { fontSize: 12, color: '#CCCCCC', opacity: 0.8 },
  
  messageBubble: { 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity:  0.2,
    shadowRadius: 3,
    elevation: 2,
    minWidth: 80
  },
  ownMessageBubble: { borderBottomRightRadius: 6 },
  messageText: { fontSize: 16, lineHeight: 22, letterSpacing: 0.2 },
  
  messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  messageTime: { fontSize: 12, color: '#CCCCCC', opacity: 0.7 },
  ownMessageTime: { color: 'rgba(255,255,255,0.7)' },
  messageStatus: { marginLeft: 4 },
  editedText: { fontSize: 11, fontStyle: 'italic', opacity: 0.6, marginLeft: 4 },
  
  fileBubble: { padding: 16, borderRadius: 20, marginBottom: 6 },
  fileContent: { flexDirection: 'row', alignItems: 'center' },
  fileIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: 'rgba(255,107,107,0.2)',
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  fileSize: { fontSize: 13, opacity: 0.7 },
  downloadButton: { padding: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  voiceBubble: { padding: 16, borderRadius: 20, marginBottom: 6, minWidth: 200 },
  voiceContent: { flexDirection: 'row', alignItems: 'center' },
  voicePlayButton: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#8B5CF6',
    alignItems: 'center', 
    justifyContent:  'center',
    marginRight: 12
  },
  voiceWaveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 12 },
  waveformBar: { width: 3, borderRadius: 1.5, backgroundColor: '#8B5CF6' },
  voiceDuration: { fontSize: 12, fontWeight: '600', color: '#8B5CF6' },
  
  reactionsContainer: { flexDirection: 'row', marginTop: 8, gap: 6 },
  reactionBubble: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 16
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { color: '#FFFFFF', fontSize: 12, marginLeft: 4, fontWeight: '600' },
  
  typingContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  typingBubble: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  typingText: { fontSize: 14, marginRight: 8 },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3 },
  
  scrollToBottomButton: { position: 'absolute', bottom: 100, right: 24, zIndex: 100 },
  scrollToBottomCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  
  chatWallpaper: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  
  replyPreview: { marginHorizontal: 16, marginBottom: 8, borderRadius: 16, overflow: 'hidden' },
  replyPreviewBg: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  replyPreviewLine: { width: 4, height: '100%', borderRadius: 2, marginRight: 12 },
  replyPreviewContent: { flex: 1 },
  replyPreviewAuthor: { fontSize: 12, fontWeight: '700', marginBottom: 2, opacity: 0.9 },
  replyPreviewText: { fontSize: 14, opacity: 0.7 },
  replyPreviewClose: { padding: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  inputContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  inputRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  
  attachmentButtons: { flexDirection: 'row', gap: 8 },
  attachButton: { overflow: 'hidden', borderRadius:  20 },
  attachButtonGradient: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  
  inputWrapper: { 
    flex: 1, 
    borderRadius: 24, 
    paddingHorizontal: 16, 
    paddingVertical:  12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    maxHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  messageInput: { flex: 1, fontSize: 16, textAlignVertical: 'center', letterSpacing: 0.2 },
  emojiButton: { padding: 4, marginLeft: 8 },
  
  recordingContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordingBg: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical:  12,
    borderRadius: 24,
    gap: 8
  },
  recordingText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  recordingIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  stopRecordingButton: { overflow: 'hidden', borderRadius:  24 },
  stopRecordingGradient: { width: 48, height: 48, borderRadius: 24, alignItems:  'center', justifyContent:  'center' },
  
  sendButtons: { flexDirection: 'row', gap: 8 },
  sendButton: { overflow: 'hidden', borderRadius: 24 },
  sendButtonGradient: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems:  'center', 
    justifyContent: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity:  0.3,
    shadowRadius: 8,
    elevation: 8
  },
  voiceButton: { overflow: 'hidden', borderRadius: 24 },
  voiceButtonGradient: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  clockButton: { overflow: 'hidden', borderRadius: 20 },
  clockButtonGradient: { width: 40, height: 40, borderRadius:  20, alignItems: 'center', justifyContent: 'center' }
});