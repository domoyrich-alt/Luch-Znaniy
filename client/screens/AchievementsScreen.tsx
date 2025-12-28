import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPost } from "@/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
};

interface AchievementProgress {
  progressId: number;
  currentProgress: number;
  isCompleted: boolean;
  completedAt: string | null;
  achievementId: number;
  code: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  requirement: number;
  xpReward: number;
  rarity: string;
}

const categoryLabels: Record<string, string> = {
  academic: "🎓 Учёба",
  social: "👥 Общение",
  attendance: "📅 Посещаемость",
  special: "✨ Особые",
  general: "📋 Общие",
};

const rarityColors: Record<string, [string, string]> = {
  common: [NEON.bgCard, NEON.bgSecondary],
  rare: [NEON.primary + '40', NEON.primary + '20'],
  epic: [NEON.accent + '40', NEON.accent + '20'],
  legendary: [NEON.warning + '40', NEON.warning + '20'],
};

const rarityBorders: Record<string, string> = {
  common: NEON.textSecondary + '30',
  rare: NEON.primary + '60',
  epic: NEON.accent + '60',
  legendary: NEON.warning + '80',
};

const AchievementBadge = ({ achievement, index }: { achievement: AchievementProgress; index: number }) => {
  const scale = useSharedValue(1);
  const progress = achievement.currentProgress / achievement.requirement;
  const isCompleted = achievement.isCompleted;
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View 
      entering={ZoomIn.delay(index * 50).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.achievementCard}
      >
        <LinearGradient
          colors={isCompleted ? rarityColors[achievement.rarity] : [NEON.bgCard, NEON.bgSecondary]}
          style={[
            styles.achievementGradient,
            { borderColor: isCompleted ? rarityBorders[achievement.rarity] : NEON.bgSecondary }
          ]}
        >
          {/* Emoji */}
          <View style={[styles.emojiContainer, !isCompleted && styles.emojiLocked]}>
            <ThemedText style={styles.achievementEmoji}>
              {isCompleted ? achievement.emoji : '🔒'}
            </ThemedText>
          </View>
          
          {/* Info */}
          <View style={styles.achievementInfo}>
            <ThemedText style={styles.achievementName} numberOfLines={1}>
              {achievement.name}
            </ThemedText>
            <ThemedText style={styles.achievementDesc} numberOfLines={2}>
              {achievement.description}
            </ThemedText>
            
            {/* Progress Bar */}
            {!isCompleted && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <Animated.View 
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(progress * 100, 100)}%` }
                    ]} 
                  />
                </View>
                <ThemedText style={styles.progressText}>
                  {achievement.currentProgress}/{achievement.requirement}
                </ThemedText>
              </View>
            )}
            
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Feather name="check-circle" size={12} color={NEON.success} />
                <ThemedText style={styles.completedText}>Получено!</ThemedText>
              </View>
            )}
          </View>
          
          {/* XP Reward */}
          <View style={styles.xpBadge}>
            <ThemedText style={styles.xpText}>+{achievement.xpReward} ⭐</ThemedText>
          </View>
          
          {/* Rarity indicator */}
          {isCompleted && (
            <View style={[styles.rarityDot, { backgroundColor: rarityBorders[achievement.rarity] }]} />
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadAchievements();
      initAchievements();
    }
  }, [user?.id]);

  const initAchievements = async () => {
    if (!user?.id) return;
    try {
      await apiPost(`/api/achievements/init/${user.id}`, {});
    } catch (error) {
      console.error("Init achievements error:", error);
    }
  };

  const loadAchievements = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await apiGet<AchievementProgress[]>(`/api/achievements/progress/${user.id}`);
      setAchievements(data || []);
    } catch (error) {
      console.error("Load achievements error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  };

  const completedCount = achievements.filter(a => a.isCompleted).length;
  const totalXP = achievements.filter(a => a.isCompleted).reduce((sum, a) => sum + a.xpReward, 0);
  
  const categories = [...new Set(achievements.map(a => a.category))];
  const filteredAchievements = selectedCategory 
    ? achievements.filter(a => a.category === selectedCategory)
    : achievements;

  // Сортировка: сначала завершенные, потом по прогрессу
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? -1 : 1;
    const progressA = a.currentProgress / a.requirement;
    const progressB = b.currentProgress / b.requirement;
    return progressB - progressA;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={NEON.textPrimary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>🏆 Достижения</ThemedText>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statsContainer}>
        <LinearGradient
          colors={[NEON.bgCard, NEON.bgSecondary]}
          style={styles.statsGradient}
        >
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{completedCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Получено</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{achievements.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Всего</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: NEON.warning }]}>⭐ {totalXP}</ThemedText>
            <ThemedText style={styles.statLabel}>Заработано</ThemedText>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Category Filter */}
      <Animated.View entering={FadeInUp.delay(150).springify()}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setSelectedCategory(null); }}
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          >
            <ThemedText style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
              Все
            </ThemedText>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat); }}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            >
              <ThemedText style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {categoryLabels[cat] || cat}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Achievements List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NEON.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.achievementsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={NEON.primary}
            />
          }
        >
          {sortedAchievements.map((achievement, index) => (
            <AchievementBadge 
              key={achievement.achievementId} 
              achievement={achievement} 
              index={index}
            />
          ))}
          
          {sortedAchievements.length === 0 && (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyEmoji}>🏆</ThemedText>
              <ThemedText style={styles.emptyText}>Нет достижений в этой категории</ThemedText>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEON.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NEON.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NEON.textPrimary,
  },
  
  // Stats
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGradient: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: NEON.primary + '30',
    borderRadius: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: NEON.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: NEON.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: NEON.bgSecondary,
    marginHorizontal: 8,
  },
  
  // Categories
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: NEON.bgCard,
    marginRight: 8,
    borderWidth: 1,
    borderColor: NEON.bgSecondary,
  },
  categoryChipActive: {
    backgroundColor: NEON.primary + '30',
    borderColor: NEON.primary,
  },
  categoryText: {
    fontSize: 14,
    color: NEON.textSecondary,
  },
  categoryTextActive: {
    color: NEON.textPrimary,
    fontWeight: '600',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Achievements List
  achievementsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  achievementCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  achievementGradient: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
    alignItems: 'center',
  },
  emojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: NEON.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiLocked: {
    opacity: 0.5,
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 12,
    color: NEON.textSecondary,
    lineHeight: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: NEON.bgSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: NEON.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: NEON.textSecondary,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: NEON.success,
    fontWeight: '600',
  },
  xpBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: NEON.bgDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  xpText: {
    fontSize: 11,
    color: NEON.warning,
    fontWeight: '700',
  },
  rarityDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: NEON.textSecondary,
  },
});
