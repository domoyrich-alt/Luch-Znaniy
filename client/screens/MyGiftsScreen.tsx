import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  border: '#2A2A3E',
};

interface ReceivedGift {
  id: number;
  senderId: number | null;
  receiverId: number;
  giftTypeId: number;
  message: string | null;
  isAnonymous: boolean;
  isOpened: boolean;
  isHidden?: boolean;
  sentAt: string;
  giftType?: {
    id: number;
    name: string;
    emoji: string;
    price: number;
    rarity: string;
    description: string;
  };
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  };
}

type TabType = 'visible' | 'hidden';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getRarityColors = (rarity: string): [string, string] => {
  switch (rarity) {
    case 'legendary': return [NEON.warning + '40', NEON.warning + '20'];
    case 'epic': return [NEON.accent + '40', NEON.accent + '20'];
    case 'rare': return [NEON.primary + '40', NEON.primary + '20'];
    default: return [NEON.bgCard, NEON.bgSecondary];
  }
};

const getRarityBorder = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return NEON.warning + '70';
    case 'epic': return NEON.accent + '50';
    case 'rare': return NEON.primary + '40';
    default: return NEON.border;
  }
};

const GiftCard = ({ 
  gift, 
  index, 
  isHidden,
  onToggleVisibility,
  onPress,
}: { 
  gift: ReceivedGift; 
  index: number;
  isHidden: boolean;
  onToggleVisibility: () => void;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const rarity = gift.giftType?.rarity || 'common';
  const colors = getRarityColors(rarity);
  const borderColor = getRarityBorder(rarity);

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 80).springify()}
      style={[styles.giftCardWrapper, animatedStyle]}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.giftCard, { borderColor }]}
        >
          <View style={styles.giftEmoji}>
            <ThemedText style={styles.giftEmojiText}>
              {gift.giftType?.emoji || '🎁'}
            </ThemedText>
          </View>

          <View style={styles.giftInfo}>
            <ThemedText style={styles.giftName}>
              {gift.giftType?.name || 'Подарок'}
            </ThemedText>
            <ThemedText style={styles.giftFrom}>
              {gift.isAnonymous 
                ? 'От анонима'
                : gift.sender 
                  ? `От ${gift.sender.firstName}`
                  : 'Неизвестно'}
            </ThemedText>
            {gift.message && (
              <ThemedText style={styles.giftMessage} numberOfLines={1}>
                "{gift.message}"
              </ThemedText>
            )}
          </View>

          <Pressable 
            style={styles.visibilityButton}
            onPress={onToggleVisibility}
            hitSlop={10}
          >
            <Feather 
              name={isHidden ? "eye-off" : "eye"} 
              size={18} 
              color={isHidden ? NEON.textSecondary : NEON.success} 
            />
          </Pressable>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
};

const TabButton = ({ 
  title, 
  count, 
  isActive, 
  onPress 
}: { 
  title: string; 
  count: number;
  isActive: boolean; 
  onPress: () => void;
}) => (
  <Pressable 
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
    onPress={onPress}
  >
    <ThemedText style={[
      styles.tabButtonText, 
      isActive && styles.tabButtonTextActive
    ]}>
      {title}
    </ThemedText>
    <View style={[
      styles.tabBadge,
      isActive && styles.tabBadgeActive
    ]}>
      <ThemedText style={[
        styles.tabBadgeText,
        isActive && styles.tabBadgeTextActive
      ]}>
        {count}
      </ThemedText>
    </View>
  </Pressable>
);

export default function MyGiftsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('visible');
  const [gifts, setGifts] = useState<ReceivedGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGifts = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const data = await apiGet<ReceivedGift[]>(`/api/users/${user.id}/gifts`);
      if (data) {
        setGifts(data);
      }
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadGifts();
  };

  const toggleGiftVisibility = async (giftId: number, currentlyHidden: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await apiPost(`/api/gifts/${giftId}/toggle-visibility`, {
        isHidden: !currentlyHidden,
      });
      
      if (result) {
        setGifts(prev => prev.map(g => 
          g.id === giftId ? { ...g, isHidden: !currentlyHidden } : g
        ));
        
        Alert.alert(
          currentlyHidden ? "Подарок показан" : "Подарок скрыт",
          currentlyHidden 
            ? "Подарок теперь виден в вашем профиле"
            : "Подарок скрыт из вашего профиля"
        );
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось изменить видимость подарка");
    }
  };

  const visibleGifts = gifts.filter(g => !g.isHidden);
  const hiddenGifts = gifts.filter(g => g.isHidden);
  const displayedGifts = activeTab === 'visible' ? visibleGifts : hiddenGifts;

  const renderGift = ({ item, index }: { item: ReceivedGift; index: number }) => (
    <GiftCard
      gift={item}
      index={index}
      isHidden={!!item.isHidden}
      onToggleVisibility={() => toggleGiftVisibility(item.id, !!item.isHidden)}
      onPress={() => {
        if (item.sender && !item.isAnonymous) {
          navigation.navigate('UserProfile', {
            userId: item.sender.id,
            firstName: item.sender.firstName,
            lastName: item.sender.lastName,
            username: item.sender.username,
          });
        }
      }}
    />
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: NEON.bgDark }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NEON.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: NEON.bgDark }]}>
      <Animated.View entering={FadeInUp.springify()}>
        <ThemedText style={styles.screenTitle}>Мои подарки</ThemedText>
        <ThemedText style={styles.screenSubtitle}>
          Управляйте отображением подарков в профиле
        </ThemedText>
      </Animated.View>

      <View style={styles.tabsContainer}>
        <TabButton
          title="В профиле"
          count={visibleGifts.length}
          isActive={activeTab === 'visible'}
          onPress={() => setActiveTab('visible')}
        />
        <TabButton
          title="Скрытые"
          count={hiddenGifts.length}
          isActive={activeTab === 'hidden'}
          onPress={() => setActiveTab('hidden')}
        />
      </View>

      <FlatList
        data={displayedGifts}
        renderItem={renderGift}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={NEON.primary}
          />
        }
        ListEmptyComponent={
          <Animated.View 
            entering={FadeInDown.delay(100)}
            style={styles.emptyContainer}
          >
            <MaterialCommunityIcons 
              name={activeTab === 'visible' ? "gift-outline" : "eye-off-outline"} 
              size={64} 
              color={NEON.textSecondary} 
            />
            <ThemedText style={styles.emptyText}>
              {activeTab === 'visible' 
                ? 'Нет подарков в профиле'
                : 'Нет скрытых подарков'}
            </ThemedText>
            <ThemedText style={styles.emptyHint}>
              {activeTab === 'visible' 
                ? 'Полученные подарки появятся здесь'
                : 'Скрытые подарки не видны другим пользователям'}
            </ThemedText>
          </Animated.View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: NEON.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  screenSubtitle: {
    fontSize: 14,
    color: NEON.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: NEON.bgCard,
    borderRadius: BorderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: NEON.border,
  },
  tabButtonActive: {
    backgroundColor: NEON.primary + '30',
    borderColor: NEON.primary + '60',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: NEON.textSecondary,
  },
  tabButtonTextActive: {
    color: NEON.primary,
  },
  tabBadge: {
    backgroundColor: NEON.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: NEON.primary + '40',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: NEON.textSecondary,
  },
  tabBadgeTextActive: {
    color: NEON.primary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  giftCardWrapper: {
    marginBottom: Spacing.md,
  },
  giftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  giftEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: NEON.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  giftEmojiText: {
    fontSize: 28,
  },
  giftInfo: {
    flex: 1,
  },
  giftName: {
    fontSize: 16,
    fontWeight: '600',
    color: NEON.textPrimary,
    marginBottom: 2,
  },
  giftFrom: {
    fontSize: 13,
    color: NEON.textSecondary,
  },
  giftMessage: {
    fontSize: 12,
    color: NEON.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  visibilityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NEON.bgDark + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: NEON.textSecondary,
    marginTop: Spacing.md,
  },
  emptyHint: {
    fontSize: 14,
    color: NEON.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    opacity: 0.7,
  },
});
