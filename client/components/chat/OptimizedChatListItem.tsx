import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  Animated, 
  PanResponder, 
  TextInput, 
  RefreshControl, 
  Dimensions 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_HEIGHT = 76;
const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 75;

const NEON = {
  primary: '#8B5CF6',
  secondary: '#4ECDC4',
  accent: '#FF6B9D',
  bgDark: '#0A0A0F',
  bgCard: '#141420',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
};

// -------------------- SwipeableChatItem --------------------
interface Chat {
  id: string;
  name: string;
  lastMessage?: { text: string; senderName?: string; createdAt: number };
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  type: 'group' | 'private';
}

interface SwipeableChatItemProps {
  chat: Chat;
  index: number;
  onPress: (chat: Chat) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onMute: (id: string, muted: boolean) => void;
}

const SwipeableChatItem = React.memo(({ chat, index, onPress, onDelete, onPin, onMute }: SwipeableChatItemProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isOpen, setIsOpen] = useState(false);
  const gestureStartX = useRef(0);

  const CLOSE_X = 0;
  const LEFT_X = -ACTION_WIDTH; // Удалить
  const RIGHT_X = ACTION_WIDTH * 2; // Pin + Mute

  // Fade-in с stagger
  useEffect(() => {
    const delay = Math.min(index * 50, 400);
    setTimeout(() => {
      Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, stiffness: 100, damping: 15 }).start();
    }, delay);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy) * 2 && Math.abs(gs.dx) > 10,
      onPanResponderGrant: () => translateX.stopAnimation((v) => (gestureStartX.current = v)),
      onPanResponderMove: (_, gs) => {
        const clamped = Math.max(LEFT_X, Math.min(RIGHT_X, gestureStartX.current + gs.dx));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        const velocity = gs.vx;
        let toValue = CLOSE_X;
        translateX.stopAnimation((v) => {
          if (v <= -SWIPE_THRESHOLD || velocity < -0.5) toValue = LEFT_X;
          else if (v >= SWIPE_THRESHOLD || velocity > 0.5) toValue = RIGHT_X;
          Animated.spring(translateX, { toValue, useNativeDriver: true, friction: 10, tension: 100 }).start();
          setIsOpen(toValue !== CLOSE_X);
        });
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: CLOSE_X, useNativeDriver: true }).start();
        setIsOpen(false);
      },
    })
  ).current;

  const handlePress = () => {
    if (isOpen) {
      Animated.spring(translateX, { toValue: CLOSE_X, useNativeDriver: true }).start();
      setIsOpen(false);
    } else {
      Haptics.selectionAsync();
      onPress(chat);
    }
  };

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const getAvatarColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFB347', '#DDA0DD', '#8B5CF6', '#F093FB'];
    return colors[chat.name.charCodeAt(0) % colors.length];
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - ts;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Вчера';
    if (days < 7) return date.toLocaleDateString('ru', { weekday: 'short' });
    return date.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0,1], outputRange: [0.95,1] }) }] }}>
      {/* Actions */}
      <View style={styles.leftActions}>
        <Pressable style={[styles.actionBtn, { backgroundColor: chat.isPinned ? '#8E8E93' : NEON.primary }]} onPress={() => onPin(chat.id, !chat.isPinned)}>
          <Feather name="bookmark" size={22} color="#fff" />
          <Text style={styles.actionText}>{chat.isPinned ? 'Открепить' : 'Закрепить'}</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, { backgroundColor: chat.isMuted ? '#4ECDC4' : '#FFB347' }]} onPress={() => onMute(chat.id, !chat.isMuted)}>
          <Feather name={chat.isMuted ? 'bell' : 'bell-off'} size={22} color="#fff" />
          <Text style={styles.actionText}>{chat.isMuted ? 'Со звуком' : 'Без звука'}</Text>
        </Pressable>
      </View>
      <View style={styles.rightActions}>
        <Pressable style={[styles.actionBtn, { backgroundColor: '#FF6B6B' }]} onPress={() => onDelete(chat.id)}>
          <Feather name="trash-2" size={22} color="#fff" />
          <Text style={styles.actionText}>Удалить</Text>
        </Pressable>
      </View>

      {/* Chat */}
      <Animated.View
        style={[styles.chatItem, { transform: [{ translateX }, { scale: scaleAnim }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.chatContent}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor() }]}>
            <Text style={styles.avatarText}>{chat.name.charAt(0).toUpperCase()}</Text>
            {chat.type === 'group' && <View style={styles.groupIndicator}><Feather name="users" size={8} color="#fff" /></View>}
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.topRow}>
              <Text style={styles.chatName}>{chat.name}</Text>
              <Text style={{ color: chat.unreadCount > 0 ? NEON.primary : '#8E8E93' }}>{formatTime(chat.lastMessage?.createdAt || Date.now())}</Text>
            </View>
            <View style={styles.bottomRow}>
              <Text style={styles.lastMessage} numberOfLines={1}>{chat.lastMessage?.text || ''}</Text>
              {chat.unreadCount > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadText}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</Text></View>}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

// -------------------- Стили --------------------
const styles = StyleSheet.create({
  chatItem: { flexDirection: 'row', alignItems: 'center', height: ITEM_HEIGHT, paddingHorizontal: 20, backgroundColor: NEON.bgDark },
  chatContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  groupIndicator: { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: NEON.primary, justifyContent: 'center', alignItems: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 17, fontWeight: '600', color: '#fff' },
  lastMessage: { fontSize: 15, color: 'rgba(255,255,255,0.5)', flex: 1 },
  unreadBadge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: NEON.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  leftActions: { position: 'absolute', left: 0, top: 0, bottom: 0, flexDirection: 'row' },
  rightActions: { position: 'absolute', right: 0, top: 0, bottom: 0, flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { width: ACTION_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 2 },
});

export default SwipeableChatItem;
