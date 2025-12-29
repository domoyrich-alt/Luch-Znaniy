import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { NEON_COLORS } from '@/constants/neonTheme';

const { width } = Dimensions.get('window');

// НЕОНОВАЯ ТЕМА (единый источник правды)
const NEON = {
  primary: NEON_COLORS.primary,
  secondary: NEON_COLORS.secondary,
  accent: NEON_COLORS.pink,
  warning: NEON_COLORS.warning,
  success: NEON_COLORS.success,
  error: NEON_COLORS.error,
  bgDark: NEON_COLORS.backgroundDark,
  bgCard: NEON_COLORS.backgroundCard,
  bgSecondary: NEON_COLORS.backgroundSecondary,
  textPrimary: NEON_COLORS.textPrimary,
  textSecondary: NEON_COLORS.textSecondary,
};

// Подарки для отправки (как в Telegram)
const GIFTS = [
  // Обычные (5-20 звёзд)
  { id: 1, name: "Сердце", emoji: "❤️", price: 5, rarity: "common", colors: ['#FF6B6B', '#FF4757'] },
  { id: 2, name: "Поцелуй", emoji: "💋", price: 10, rarity: "common", colors: ['#FF6B9D', '#FF4080'] },
  { id: 3, name: "Роза", emoji: "🌹", price: 15, rarity: "common", colors: ['#FF6B9D', '#FF4080'] },
  { id: 4, name: "Огонь", emoji: "🔥", price: 15, rarity: "common", colors: ['#FF8C42', '#FF6B6B'] },
  { id: 5, name: "Радость", emoji: "😊", price: 10, rarity: "common", colors: ['#FFD93D', '#FFA502'] },
  
  // Редкие (25-50 звёзд)
  { id: 6, name: "Мишка", emoji: "🧸", price: 25, rarity: "rare", colors: ['#FFD93D', '#FFA502'] },
  { id: 7, name: "Торт", emoji: "🎂", price: 30, rarity: "rare", colors: ['#FF6B9D', '#8B5CF6'] },
  { id: 8, name: "Звезда", emoji: "⭐", price: 50, rarity: "rare", colors: ['#FFD93D', '#FF8C42'] },
  { id: 9, name: "Котик", emoji: "🐱", price: 40, rarity: "rare", colors: ['#FFA502', '#FFEAA7'] },
  { id: 10, name: "Подарок", emoji: "🎁", price: 35, rarity: "rare", colors: ['#FF6B6B', '#6BCB77'] },
  { id: 11, name: "Букет", emoji: "💐", price: 45, rarity: "rare", colors: ['#FF6B9D', '#8B5CF6'] },
  { id: 12, name: "Шоколад", emoji: "🍫", price: 25, rarity: "rare", colors: ['#8B4513', '#D2691E'] },
  
  // Легендарные (75-150 звёзд)
  { id: 13, name: "Единорог", emoji: "🦄", price: 100, rarity: "legendary", colors: ['#8B5CF6', '#FF6B9D'] },
  { id: 14, name: "Фейерверк", emoji: "🎆", price: 75, rarity: "legendary", colors: ['#4ECDC4', '#3B82F6'] },
  { id: 15, name: "Корона", emoji: "👑", price: 150, rarity: "legendary", colors: ['#FFD700', '#FFA500'] },
  { id: 16, name: "Шампанское", emoji: "🍾", price: 120, rarity: "legendary", colors: ['#FFD700', '#6BCB77'] },
  { id: 17, name: "Луна", emoji: "🌙", price: 90, rarity: "legendary", colors: ['#8B5CF6', '#4ECDC4'] },
  
  // Эпические (200-500 звёзд)
  { id: 18, name: "Бриллиант", emoji: "💎", price: 300, rarity: "epic", colors: ['#8B5CF6', '#4ECDC4'] },
  { id: 19, name: "Ракета", emoji: "🚀", price: 200, rarity: "epic", colors: ['#FF6B6B', '#FF8C42'] },
  { id: 20, name: "Радуга", emoji: "🌈", price: 500, rarity: "epic", colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4ECDC4', '#8B5CF6'] },
];

const RARITY_LABELS: Record<string, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  legendary: 'Легендарный',
  epic: 'Эпический',
};

interface GiftModalProps {
  visible: boolean;
  onClose: () => void;
  onSendGift: (gift: typeof GIFTS[0], message: string) => void;
  userStars: number;
  recipientName: string;
  isCeo?: boolean;
}

const GiftItem: React.FC<{
  gift: typeof GIFTS[0];
  selected: boolean;
  onSelect: () => void;
  userStars: number;
  isCeo?: boolean;
}> = ({ gift, selected, onSelect, userStars, isCeo }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const canAfford = !!isCeo || userStars >= gift.price;
  
  useEffect(() => {
    if (gift.rarity === 'legendary' || gift.rarity === 'epic') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);
  
  const handlePress = async () => {
    if (!canAfford) {
      Alert.alert('Недостаточно звёзд', `Нужно ещё ${gift.price - userStars} ⭐`);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onSelect();
  };
  
  return (
    <Animated.View style={[styles.giftItem, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={handlePress}>
        {/* Glow effect */}
        {(gift.rarity === 'legendary' || gift.rarity === 'epic') && (
          <Animated.View 
            style={[
              styles.giftGlow, 
              { 
                opacity: glowAnim,
                backgroundColor: gift.colors[0] + '40',
              }
            ]} 
          />
        )}
        
        <LinearGradient
          colors={selected 
            ? [NEON.primary + '50', NEON.primary + '20']
            : [NEON.bgCard, NEON.bgSecondary]}
          style={[
            styles.giftContent,
            selected && styles.giftSelected,
            !canAfford && styles.giftDisabled,
          ]}
        >
          {/* Emoji */}
          <View style={styles.giftEmojiContainer}>
            <LinearGradient
              colors={gift.colors as [string, string, ...string[]]}
              style={styles.giftEmojiBg}
            >
              <ThemedText style={styles.giftEmoji}>{gift.emoji}</ThemedText>
            </LinearGradient>
          </View>
          
          {/* Info */}
          <ThemedText style={styles.giftName} numberOfLines={1}>
            {gift.name}
          </ThemedText>
          
          <View style={styles.giftPriceRow}>
            <ThemedText style={styles.giftPrice}>{gift.price}</ThemedText>
            <ThemedText style={styles.giftPriceStar}>⭐</ThemedText>
          </View>
          
          {/* Rarity badge */}
          <View style={[styles.rarityBadge, { backgroundColor: gift.colors[0] + '30' }]}>
            <ThemedText style={[styles.rarityText, { color: gift.colors[0] }]}>
              {RARITY_LABELS[gift.rarity]}
            </ThemedText>
          </View>
          
          {/* Selected indicator */}
          {selected && (
            <View style={styles.selectedIndicator}>
              <Feather name="check" size={16} color={NEON.primary} />
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default function GiftModal({ 
  visible, 
  onClose, 
  onSendGift, 
  userStars, 
  recipientName,
  isCeo,
}: GiftModalProps) {
  const [selectedGift, setSelectedGift] = useState<typeof GIFTS[0] | null>(null);
  const [message, setMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
      setSelectedGift(null);
      setMessage('');
    }
  }, [visible]);
  
  const handleSend = async () => {
    if (!selectedGift) return;
    
    if (!isCeo && userStars < selectedGift.price) {
      Alert.alert('Недостаточно звёзд', `Нужно ещё ${selectedGift.price - userStars} ⭐`);
      return;
    }
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSendGift(selectedGift, message);
  };
  
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={60} style={StyleSheet.absoluteFill} />
      </Pressable>
      
      <Animated.View 
        style={[
          styles.container, 
          { transform: [{ translateY }] }
        ]}
      >
        <LinearGradient
          colors={[NEON.bgCard, NEON.bgDark]}
          style={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.title}>🎁 Отправить подарок</ThemedText>
              <ThemedText style={styles.subtitle}>для {recipientName}</ThemedText>
            </View>
            
            <View style={styles.balanceContainer}>
              <ThemedText style={styles.balanceLabel}>Баланс:</ThemedText>
              <ThemedText style={styles.balanceValue}>{userStars} ⭐</ThemedText>
            </View>
          </View>
          
          {/* Gifts Grid */}
          <ScrollView 
            horizontal={false}
            showsVerticalScrollIndicator={false}
            style={styles.giftsScroll}
            contentContainerStyle={styles.giftsContainer}
          >
            <View style={styles.giftsGrid}>
              {GIFTS.map((gift) => (
                <GiftItem
                  key={gift.id}
                  gift={gift}
                  selected={selectedGift?.id === gift.id}
                  onSelect={() => setSelectedGift(gift)}
                  userStars={userStars}
                  isCeo={isCeo}
                />
              ))}
            </View>
          </ScrollView>
          
          {/* Message Input */}
          {selectedGift && (
            <View style={styles.messageSection}>
              <TextInput
                style={styles.messageInput}
                placeholder="Добавить сообщение (необязательно)"
                placeholderTextColor={NEON.textSecondary}
                value={message}
                onChangeText={setMessage}
                maxLength={100}
              />
            </View>
          )}
          
          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <ThemedText style={styles.cancelText}>Отмена</ThemedText>
            </Pressable>
            
            <Pressable 
              style={[
                styles.sendButton,
                !selectedGift && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!selectedGift}
            >
              <LinearGradient
                colors={selectedGift ? [NEON.primary, NEON.accent] : [NEON.bgSecondary, NEON.bgSecondary]}
                style={styles.sendGradient}
              >
                <Feather name="gift" size={18} color="#FFF" />
                <ThemedText style={styles.sendText}>
                  {selectedGift ? `Отправить за ${selectedGift.price} ⭐` : 'Выберите подарок'}
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: NEON.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: NEON.textSecondary,
    marginTop: 4,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    color: NEON.textSecondary,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: NEON.warning,
  },
  giftsScroll: {
    maxHeight: 350,
  },
  giftsContainer: {
    paddingHorizontal: 16,
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  giftItem: {
    width: (width - 56) / 3,
    marginBottom: 4,
  },
  giftGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 20,
  },
  giftContent: {
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  giftSelected: {
    borderColor: NEON.primary,
  },
  giftDisabled: {
    opacity: 0.5,
  },
  giftEmojiContainer: {
    marginBottom: 8,
  },
  giftEmojiBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftEmoji: {
    fontSize: 24,
  },
  giftName: {
    fontSize: 12,
    fontWeight: '600',
    color: NEON.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  giftPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  giftPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: NEON.warning,
  },
  giftPriceStar: {
    fontSize: 12,
  },
  rarityBadge: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: NEON.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  messageInput: {
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: NEON.textPrimary,
    borderWidth: 1,
    borderColor: NEON.primary + '30',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: NEON.bgSecondary,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: NEON.textSecondary,
  },
  sendButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
