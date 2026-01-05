import React, { useRef, useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface ReplyMessage {
  messageId: string;
  senderName: string;
  text: string;
}

interface TelegramInputBarProps {
  messageText: string;
  onMessageTextChange: (text: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onEmoji?: () => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isRecording?: boolean;
  recordingDuration?: number;
  replyTo?: ReplyMessage | null;
  onCancelReply?: () => void;
}

export function TelegramInputBar({
  messageText,
  onMessageTextChange,
  onSend,
  onAttach,
  onEmoji,
  onVoiceStart,
  onVoiceStop,
  isRecording = false,
  recordingDuration = 0,
  replyTo,
  onCancelReply,
}: TelegramInputBarProps) {
  const { theme, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { borderTopColor: theme.border }]}>
      {/* Reply Preview */}
      {replyTo && (
        <View style={[styles.replyPreview, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={[styles.replyLine, { backgroundColor: theme.primary }]} />
          <View style={styles.replyContent}>
            <ThemedText style={[styles.replyAuthor, { color: theme.primary }]}>
              {replyTo.senderName}
            </ThemedText>
            <ThemedText style={[styles.replyText, { color: theme.textSecondary }]} numberOfLines={1}>
              {replyTo.text}
            </ThemedText>
          </View>
          <Pressable onPress={onCancelReply} style={styles.replyClose}>
            <Feather name="x" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputRow}>
        {!isRecording ? (
          <>
            {/* Attach Button */}
            <Pressable onPress={onAttach} style={styles.iconButton}>
              <Feather name="paperclip" size={24} color={theme.textSecondary} />
            </Pressable>

            {/* Message Input */}
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: isDark ? theme.backgroundSecondary : theme.backgroundTertiary },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[
                  styles.messageInput,
                  { color: theme.text },
                ]}
                placeholder="Message"
                placeholderTextColor={theme.textSecondary}
                value={messageText}
                onChangeText={onMessageTextChange}
                multiline
                maxLength={4096}
              />
              <Pressable onPress={onEmoji} style={styles.emojiButton}>
                <Feather name="smile" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Send or Voice Button */}
            {messageText.trim() ? (
              <Pressable onPress={onSend} style={styles.iconButton}>
                <View style={[styles.sendButton, { backgroundColor: theme.primary }]}>
                  <Feather name="send" size={20} color="#FFFFFF" />
                </View>
              </Pressable>
            ) : (
              <Pressable onPress={onVoiceStart} style={styles.iconButton}>
                <Feather name="mic" size={24} color={theme.textSecondary} />
              </Pressable>
            )}
          </>
        ) : (
          <>
            {/* Recording UI */}
            <Pressable onPress={onVoiceStop} style={styles.cancelButton}>
              <ThemedText style={[styles.cancelText, { color: '#EF4444' }]}>Cancel</ThemedText>
            </Pressable>

            <View style={[styles.recordingContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Animated.View
                style={[
                  styles.recordingDot,
                  { transform: [{ scale: pulseAnim }], backgroundColor: '#EF4444' },
                ]}
              />
              <ThemedText style={[styles.recordingDuration, { color: theme.text }]}>
                {formatDuration(recordingDuration)}
              </ThemedText>
            </View>

            <Pressable onPress={onVoiceStop} style={styles.iconButton}>
              <View style={[styles.sendButton, { backgroundColor: theme.primary }]}>
                <Feather name="check" size={20} color="#FFFFFF" />
              </View>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyLine: {
    width: 3,
    height: '100%',
    borderRadius: 1.5,
    marginRight: 12,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
  },
  replyClose: {
    padding: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 40,
    maxHeight: 120,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
  },
  emojiButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 12,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordingDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
});
