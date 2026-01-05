import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, Animated } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: { backgroundColor: string; text: string };
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
  isRead?: boolean;
  isDelivered?: boolean;
  isEdited?: boolean;
  fileName?: string;
  fileSize?: string;
  duration?: string;
}

interface TelegramMessageBubbleProps {
  message: Message;
  onLongPress: (msg: Message) => void;
  showAvatar?: boolean;
}

export function TelegramMessageBubble({
  message,
  onLongPress,
  showAvatar = false,
}: TelegramMessageBubbleProps) {
  const { theme } = useTheme();
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

  // System message
  if (message.type === 'system') {
    return (
      <Animated.View style={[styles.systemMessage, { opacity: fadeAnim }]}>
        <View style={[styles.systemMessageBg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <ThemedText style={[styles.systemText, { color: theme.textSecondary }]}>
            {message.text}
          </ThemedText>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        message.isOwn && styles.ownMessage,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => onLongPress(message)}
        style={styles.messageWrapper}
      >
        {showAvatar && !message.isOwn && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[
                message.senderAvatar?.backgroundColor || '#8B5CF6',
                (message.senderAvatar?.backgroundColor || '#8B5CF6') + 'CC',
              ]}
              style={styles.avatar}
            >
              <ThemedText style={styles.avatarText}>
                {message.senderAvatar?.text || 'U'}
              </ThemedText>
            </LinearGradient>
          </View>
        )}

        <View style={[styles.messageContent, message.isOwn && styles.ownMessageContent]}>
          {showAvatar && !message.isOwn && (
            <ThemedText
              style={[
                styles.senderName,
                { color: message.senderAvatar?.backgroundColor || '#8B5CF6' },
              ]}
            >
              {message.senderName}
            </ThemedText>
          )}

          {message.replyTo && (
            <View
              style={[
                styles.replyContainer,
                {
                  borderLeftColor: message.isOwn
                    ? '#FFFFFF'
                    : message.senderAvatar?.backgroundColor || '#8B5CF6',
                  backgroundColor: message.isOwn
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(139,92,246,0.15)',
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.replyAuthor,
                  { color: message.isOwn ? '#FFFFFF' : '#8B5CF6' },
                ]}
              >
                {message.replyTo.senderName}
              </ThemedText>
              <ThemedText
                style={[styles.replyText, { color: message.isOwn ? '#FFFFFF' : theme.text }]}
                numberOfLines={1}
              >
                {message.replyTo.text}
              </ThemedText>
            </View>
          )}

          {message.type === 'text' && (
            <View
              style={[
                styles.messageBubble,
                message.isOwn && styles.ownMessageBubble,
                {
                  backgroundColor: message.isOwn ? theme.chatBubbleOwn || '#8B5CF6' : theme.chatBubbleIncoming || '#2A2A2A',
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.messageText,
                  { color: message.isOwn ? '#FFFFFF' : theme.text },
                ]}
              >
                {message.text}
              </ThemedText>

              {message.reactions && message.reactions.length > 0 && (
                <View style={styles.reactionsContainer}>
                  {message.reactions.map((reaction, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.reactionBubble,
                        { backgroundColor: 'rgba(0,0,0,0.3)' },
                      ]}
                    >
                      <ThemedText style={styles.reactionEmoji}>{reaction.emoji}</ThemedText>
                      <ThemedText style={styles.reactionCount}>{reaction.count}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.messageFooter}>
                {message.isEdited && (
                  <ThemedText
                    style={[
                      styles.editedText,
                      { color: message.isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
                    ]}
                  >
                    edited
                  </ThemedText>
                )}
                <ThemedText
                  style={[
                    styles.messageTime,
                    { color: message.isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
                  ]}
                >
                  {message.timestamp}
                </ThemedText>
                {message.isOwn && (
                  <View style={styles.messageStatus}>
                    {message.isRead ? (
                      <MaterialIcons name="done-all" size={16} color={theme.primaryLight || '#A855F7'} />
                    ) : message.isDelivered ? (
                      <MaterialIcons name="done-all" size={16} color="rgba(255,255,255,0.5)" />
                    ) : (
                      <MaterialIcons name="done" size={16} color="rgba(255,255,255,0.5)" />
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          {message.type === 'file' && (
            <View
              style={[
                styles.fileBubble,
                {
                  backgroundColor: message.isOwn ? theme.chatBubbleOwn || '#8B5CF6' : theme.chatBubbleIncoming || '#2A2A2A',
                },
              ]}
            >
              <View style={styles.fileContent}>
                <View style={styles.fileIcon}>
                  <Feather
                    name="file-text"
                    size={24}
                    color={message.isOwn ? '#FFFFFF' : '#8B5CF6'}
                  />
                </View>
                <View style={styles.fileInfo}>
                  <ThemedText
                    style={[
                      styles.fileName,
                      { color: message.isOwn ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    {message.fileName}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.fileSize,
                      { color: message.isOwn ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
                    ]}
                  >
                    {message.fileSize}
                  </ThemedText>
                </View>
                <Pressable style={styles.downloadButton}>
                  <Feather
                    name="download"
                    size={20}
                    color={message.isOwn ? '#FFFFFF' : '#8B5CF6'}
                  />
                </Pressable>
              </View>
            </View>
          )}

          {message.type === 'voice' && (
            <View
              style={[
                styles.voiceBubble,
                {
                  backgroundColor: message.isOwn ? theme.chatBubbleOwn || '#8B5CF6' : theme.chatBubbleIncoming || '#2A2A2A',
                },
              ]}
            >
              <View style={styles.voiceContent}>
                <Pressable
                  style={[
                    styles.voicePlayButton,
                    {
                      backgroundColor: message.isOwn
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(139,92,246,0.3)',
                    },
                  ]}
                >
                  <Feather name="play" size={16} color={message.isOwn ? '#FFFFFF' : '#8B5CF6'} />
                </Pressable>
                <View style={styles.voiceWaveform}>
                  {[...Array(20)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveformBar,
                        {
                          height: Math.random() * 20 + 5,
                          backgroundColor: message.isOwn
                            ? 'rgba(255,255,255,0.7)'
                            : 'rgba(139,92,246,0.7)',
                        },
                      ]}
                    />
                  ))}
                </View>
                <ThemedText
                  style={[
                    styles.voiceDuration,
                    { color: message.isOwn ? 'rgba(255,255,255,0.9)' : '#8B5CF6' },
                  ]}
                >
                  {message.duration}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  systemMessage: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  systemMessageBg: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  systemText: {
    fontSize: 13,
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: 2,
    marginHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  messageWrapper: {
    flexDirection: 'row',
    maxWidth: '75%',
    alignItems: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageContent: {
    flex: 1,
  },
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 12,
  },
  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 6,
    marginBottom: 6,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    opacity: 0.8,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
  },
  ownMessageBubble: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  editedText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  messageTime: {
    fontSize: 11,
  },
  messageStatus: {
    marginLeft: 2,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    color: '#FFFFFF',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  fileBubble: {
    padding: 12,
    borderRadius: 16,
    minWidth: 200,
  },
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
  },
  downloadButton: {
    padding: 8,
  },
  voiceBubble: {
    padding: 12,
    borderRadius: 16,
    minWidth: 200,
  },
  voiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voicePlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  voiceWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: 12,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  voiceDuration: {
    fontSize: 12,
    fontWeight: '600',
  },
});
