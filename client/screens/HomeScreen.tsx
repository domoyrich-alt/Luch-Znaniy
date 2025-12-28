/**
 * HOME SCREEN - Современный дизайн с плавными анимациями
 * 
 * Новые анимации:
 * - Fade In + Scale для приветствия
 * - Cascade (каскад) для статистики
 * - Slide Up для новостей и действий
 * - Smooth rotate для иконок
 */

import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Animated, Easing, Dimensions, StatusBar } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { Skeleton, GlassCard, Avatar, useHaptics } from "@/design-system";

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user } = useAuth();
  const { homework, events, announcements, grades, averageGrade } = useApp();
  const navigation = useNavigation();
  const haptics = useHaptics();
  
  // Loading state for skeleton
  const [isLoading, setIsLoading] = useState(true);

  // ========== НОВЫЕ АНИМАЦИИ ==========
  // Основные анимации для секций
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Каскадные анимации для карточек статистики
  const stat1Anim = useRef(new Animated.Value(0)).current;
  const stat2Anim = useRef(new Animated.Value(0)).current;
  const stat3Anim = useRef(new Animated.Value(0)).current;
  const stat4Anim = useRef(new Animated.Value(0)).current;
  
  // Анимации для секций
  const newsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  // Запускаем анимации при фокусе
  useFocusEffect(
    React.useCallback(() => {
      // Симулируем загрузку данных
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
      
      // Сбрасываем все анимации
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
      rotateAnim.setValue(0);
      stat1Anim.setValue(0);
      stat2Anim.setValue(0);
      stat3Anim.setValue(0);
      stat4Anim.setValue(0);
      newsAnim.setValue(0);
      actionsAnim.setValue(0);

      // 1. Приветствие - Fade + Scale + небольшой поворот
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Каскадная анимация для статистики (с задержкой)
      const statDelay = 150;
      setTimeout(() => {
        Animated.stagger(100, [
          Animated.spring(stat1Anim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
          Animated.spring(stat2Anim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
          Animated.spring(stat3Anim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
          Animated.spring(stat4Anim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        ]).start();
      }, 300);

      // 3. Новости - Slide up
      setTimeout(() => {
        Animated.spring(newsAnim, {
          toValue: 1,
          friction: 7,
          tension: 35,
          useNativeDriver: true,
        }).start();
      }, 500);

      // 4. Действия - Slide up
      setTimeout(() => {
        Animated.spring(actionsAnim, {
          toValue: 1,
          friction: 7,
          tension: 35,
          useNativeDriver: true,
        }).start();
      }, 650);

    }, [])
  );

  // Статистика только для учеников
  const showStats = user?.role === "student";
  
  // Вычисляем статистику
  const homeworkCount = homework.filter(hw => hw.status === "pending").length;
  const eventsCount = events.filter(e => !e.confirmed).length;
  const avgGrade = averageGrade > 0 ? averageGrade.toFixed(1) : "---";

  // Быстрые действия
  const nav: any = navigation;
  const navigateRoot = (screen: string, params?: any) => {
    const rootNav = nav.getParent?.()?.getParent?.();
    if (rootNav?.navigate) {
      rootNav.navigate(screen, params);
      return;
    }

    const parentNav = nav.getParent?.();
    if (parentNav?.navigate) {
      parentNav.navigate(screen, params);
      return;
    }

    nav.navigate?.(screen, params);
  };

  const quickActions = [
    {
      icon: "book" as const,
      label: "Мои оценки",
      color: "#22C55E",
      emoji: "📊",
      onPress: () => navigation.navigate("Grades" as never),
    },
    {
      icon: "message-circle" as const,
      label: "Написать психологу", 
      color: Colors.light.secondary,
      emoji: "💬",
      onPress: () => nav.navigate("ChatsTab", { screen: "PsychologistChat" }),
    },
    {
      icon: "video" as const,
      label: "Онлайн уроки",
      color: Colors.light.error,
      emoji: "📹",
      onPress: () => navigateRoot("OnlineLessons"),
    },
    {
      icon: "users" as const,
      label: "Чат класса",
      color: Colors.light.success,
      emoji: "👥",
      onPress: () => nav.navigate("ChatsTab"),
    },
    {
      icon: "gift" as const,
      label: "Подарки",
      color: "#FF6B9D",
      emoji: "🎁",
      onPress: () => navigateRoot("Gifts"),
    },
    {
      icon: "heart" as const,
      label: "Друзья",
      color: "#4ECDC4",
      emoji: "💚",
      onPress: () => navigateRoot("Friends"),
    },
    {
      icon: "award" as const,
      label: "Рейтинг учеников",
      color: Colors.light.warning,
      emoji: "🏆",
      onPress: () => navigateRoot("Leaderboard"),
    },
    {
      icon: "heart" as const,
      label: "Кружки",
      color: Colors.light.error,
      emoji: "❤️",
      onPress: () => navigateRoot("Clubs"),
    },
    {
      icon: "pie-chart" as const,
      label: "Аналитика",
      color: Colors.light.primary,
      emoji: "📊",
      onPress: () => navigateRoot("Analytics"),
    },
    {
      icon: "users" as const,
      label: "Форум",
      color: "#9C27B0",
      emoji: "💭",
      onPress: () => navigateRoot("Forum"),
    },
    {
      icon: "star" as const,
      label: "Достижения",
      color: "#FFD93D",
      emoji: "🏆",
      onPress: () => navigateRoot("Achievements"),
    },
    {
      icon: "file-text" as const,
      label: "Домашние задания",
      color: "#6BCB77",
      emoji: "📝",
      onPress: () => navigateRoot("Homework"),
    },
  ];

  // Журнал учителя - только для учителей и выше
  if (user?.role === "teacher" || user?.role === "director" || user?.role === "ceo") {
    quickActions.splice(0, 0, {
      icon: "book-open" as any,
      label: "Журнал класса",
      color: "#8B5CF6",
      emoji: "📚",
      onPress: () => navigation.navigate("TeacherJournal" as never),
    });
  }

  // Список класса - только для учеников
  if (user?.role === "student") {
    quickActions.splice(1, 0, {
      icon: "users" as any,
      label: "Мой класс",
      color: "#8B5CF6",
      emoji: "📋",
      onPress: () => navigation.navigate("ClassList" as never),
    });
  }

  // УПРАВЛЕНИЕ - только для учителей и выше (НЕ для учеников)
  if (user?.role === "ceo" || user?.role === "director" || user?.role === "teacher") {
    quickActions.push({
      icon: "shield" as any,
      label: "Управление",
      color: "#FF6B35",
      emoji: "🛡️",
      onPress: () => navigateRoot("Admin"),
    });
  }

  // Родительский портал - для родителей и учеников
  if (user?.role === "parent" || user?.role === "student") {
    quickActions.splice(2, 0, {
      icon: "users" as any,
      label: user?.role === "parent" ? "Мои дети" : "Родительский портал",
      color: "#8B5CF6",
      emoji: "👨‍👩‍👧",
      onPress: () => navigateRoot("ParentPortal"),
    });
  }

  // Интерполяции для анимации приветствия
  const greetingRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '0deg'],
  });

  // Функция для создания стиля анимированной карточки статистики
  const getStatStyle = (anim: Animated.Value, index: number) => {
    const translateX = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [index % 2 === 0 ? -30 : 30, 0],
    });
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });
    return {
      opacity: anim,
      transform: [{ translateX }, { translateY }, { scale: anim }],
    };
  };

  return (
    <View style={styles.neonContainer}>
      <StatusBar barStyle="light-content" />

      {/* КНОПКА СМЕНЫ ТЕМЫ */}
      <Pressable 
        onPress={toggleTheme}
        style={styles.neonThemeButton}
      >
        <LinearGradient
          colors={[NEON.primary, NEON.secondary]}
          style={styles.themeButtonGradient}
        >
          <Feather name={isDark ? "sun" : "moon"} size={20} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== ПРИВЕТСТВИЕ - GLASSMORPHISM STYLE ========== */}
        <Animated.View 
          style={[
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: greetingRotate },
              ],
            },
          ]}
        >
          <GlassCard style={styles.greetingGlassCard} withGlow>
            <View style={styles.greetingContent}>
              <Avatar 
                size="lg"
                fallback={user?.firstName || "👤"}
                gradientColors={[NEON.primary, NEON.accent, NEON.secondary]}
                showOnline
              />
              <View style={styles.greetingInfo}>
                <ThemedText style={styles.neonGreetingTitle}>
                  Привет, {user?.firstName || "Пользователь"}! 👋
                </ThemedText>
                <View style={[styles.neonRoleBadge, { backgroundColor: getRoleColor(user?.role) + '30', borderColor: getRoleColor(user?.role) }]}>
                  <ThemedText style={[styles.neonRoleText, { color: getRoleColor(user?.role) }]}>
                    {getRoleEmoji(user?.role)} {getRoleLabel(user?.role)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* ========== СТАТИСТИКА - С SKELETON LOADERS ========== */}
        {showStats && (
          <View style={styles.statsSection}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <ThemedText style={styles.neonSectionTitle}>📈 Статистика</ThemedText>
            </Animated.View>
            {isLoading ? (
              // Skeleton loaders while loading
              <View style={styles.statsGrid}>
                {[0, 1, 2, 3].map((index) => (
                  <View key={index} style={{ width: "47%", marginBottom: Spacing.md }}>
                    <View style={[styles.neonStatCard, { borderColor: 'transparent' }]}>
                      <Skeleton height={24} width={24} variant="circle" style={{ marginBottom: Spacing.sm }} />
                      <Skeleton height={32} width={60} style={{ marginBottom: Spacing.xs }} />
                      <Skeleton height={14} width="100%" variant="text" />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.statsGrid}>
                {/* Средний балл */}
                <Animated.View style={[{ width: "47%" }, getStatStyle(stat1Anim, 0)]}>
                  <View style={[styles.neonStatCard, { borderColor: NEON.primary + '40' }]}>
                    <LinearGradient
                      colors={[NEON.primary + '20', 'transparent']}
                      style={styles.neonStatGradient}
                    >
                      <ThemedText style={styles.statEmoji}>📚</ThemedText>
                      <ThemedText style={[styles.neonStatNumber, { color: NEON.primary }]}>
                        {avgGrade}
                      </ThemedText>
                      <ThemedText style={styles.neonStatLabel}>Средний балл</ThemedText>
                    </LinearGradient>
                  </View>
                </Animated.View>

                {/* Домашние задания */}
                <Animated.View style={[{ width: "47%" }, getStatStyle(stat2Anim, 1)]}>
                  <View style={[styles.neonStatCard, { borderColor: NEON.warning + '40' }]}>
                    <LinearGradient
                      colors={[NEON.warning + '20', 'transparent']}
                      style={styles.neonStatGradient}
                    >
                      <ThemedText style={styles.statEmoji}>📝</ThemedText>
                      <ThemedText style={[styles.neonStatNumber, { color: NEON.warning }]}>
                        {homeworkCount}
                      </ThemedText>
                      <ThemedText style={styles.neonStatLabel}>Домашних заданий</ThemedText>
                    </LinearGradient>
                  </View>
                </Animated.View>

                {/* События */}
                <Animated.View style={[{ width: "47%" }, getStatStyle(stat3Anim, 2)]}>
                  <View style={[styles.neonStatCard, { borderColor: NEON.secondary + '40' }]}>
                    <LinearGradient
                      colors={[NEON.secondary + '20', 'transparent']}
                      style={styles.neonStatGradient}
                    >
                      <ThemedText style={styles.statEmoji}>🎉</ThemedText>
                      <ThemedText style={[styles.neonStatNumber, { color: NEON.secondary }]}>
                        {eventsCount}
                      </ThemedText>
                      <ThemedText style={styles.neonStatLabel}>Активных событий</ThemedText>
                    </LinearGradient>
                  </View>
                </Animated.View>

                {/* Посещаемость */}
                <Animated.View style={[{ width: "47%" }, getStatStyle(stat4Anim, 3)]}>
                  <View style={[styles.neonStatCard, { borderColor: NEON.success + '40' }]}>
                    <LinearGradient
                      colors={[NEON.success + '20', 'transparent']}
                      style={styles.neonStatGradient}
                    >
                      <ThemedText style={styles.statEmoji}>✅</ThemedText>
                      <ThemedText style={[styles.neonStatNumber, { color: NEON.success }]}>
                        87%
                      </ThemedText>
                      <ThemedText style={styles.neonStatLabel}>Посещаемость</ThemedText>
                    </LinearGradient>
                  </View>
                </Animated.View>
              </View>
            )}
          </View>
        )}

        {/* ========== НОВОСТИ - SLIDE UP ========== */}
        <Animated.View 
          style={[
            styles.newsSection,
            {
              opacity: newsAnim,
              transform: [{
                translateY: newsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">📰 Новости</ThemedText>
            <Pressable onPress={() => navigation.navigate("AnnouncementsModal" as never)}>
              <ThemedText type="small" style={{ color: theme.primary }}>Все</ThemedText>
            </Pressable>
          </View>
          {announcements.length === 0 ? (
            <Card style={styles.emptyCard}>
              <ThemedText style={styles.emptyEmoji}>📢</ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Нет новых новостей
              </ThemedText>
            </Card>
          ) : (
            announcements.slice(0, 2).map((news) => (
              <Card key={news.id} style={styles.newsCard}>
                <View style={styles.newsHeader}>
                  <View style={[styles.newsIcon, { backgroundColor: news.isImportant ? Colors.light.error + "20" : theme.primary + "20" }]}>
                    <ThemedText style={styles.newsEmoji}>
                      {news.isImportant ? "🚨" : "📢"}
                    </ThemedText>
                  </View>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {news.date} | {news.author}
                  </ThemedText>
                </View>
                <ThemedText type="body" style={styles.newsTitle}>
                  {news.title}
                </ThemedText>
                <ThemedText 
                  type="small" 
                  style={{ color: theme.textSecondary }} 
                  numberOfLines={2}
                >
                  {news.content}
                </ThemedText>
              </Card>
            ))
          )}
        </Animated.View>

        {/* ========== БЫСТРЫЕ ДЕЙСТВИЯ - SLIDE UP ========== */}
        <Animated.View 
          style={[
            styles.actionsSection,
            {
              opacity: actionsAnim,
              transform: [{
                translateY: actionsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              }],
            },
          ]}
        >
          <ThemedText type="h4" style={styles.sectionTitle}>⚡ Быстрые действия</ThemedText>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <AnimatedActionCard 
                key={index}
                action={action}
                index={index}
                theme={theme}
                delay={index * 50}
                haptics={haptics}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ========== АНИМИРОВАННАЯ КАРТОЧКА ДЕЙСТВИЯ ==========
const AnimatedActionCard = ({ action, index, theme, delay, haptics }: { 
  action: any; 
  index: number; 
  theme: any;
  delay: number;
  haptics: ReturnType<typeof useHaptics>;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  const handlePressIn = () => {
    // Trigger haptic feedback
    haptics.light();
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const iconRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });
  
  return (
    <Animated.View style={{ 
      width: "47%", 
      transform: [{ scale: scaleAnim }],
    }}>
      <Pressable
        onPress={action.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.actionCard, { backgroundColor: theme.backgroundDefault, width: "100%" }]}
      >
        <Animated.View 
          style={[
            styles.actionIcon, 
            { 
              backgroundColor: action.color + "20",
              transform: [{ rotate: iconRotate }],
            }
          ]}
        >
          <ThemedText style={styles.actionEmoji}>{action.emoji}</ThemedText>
        </Animated.View>
        <ThemedText style={styles.actionLabel} numberOfLines={2}>
          {action.label}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
};

// ========== HELPER FUNCTIONS ==========
function getRoleColor(role?: string) {
  switch (role) {
    case "ceo": return Colors.light.error;
    case "director": return Colors.light.warning;
    case "teacher": return Colors.light.success;
    case "student": return Colors.light.secondary;
    case "parent": return Colors.light.primary;
    default: return Colors.light.secondary;
  }
}

function getRoleLabel(role?: string) {
  switch (role) {
    case "ceo": return "CEO";
    case "director": return "Директор";
    case "teacher": return "Учитель";
    case "student": return "Ученик";
    case "parent": return "Родитель";
    case "curator": return "Куратор";
    case "cook": return "Повар";
    default: return "Пользователь";
  }
}

function getRoleEmoji(role?: string) {
  switch (role) {
    case "ceo": return "👑";
    case "director": return "🎯";
    case "teacher": return "🏫";
    case "student": return "🎓";
    case "parent": return "👨‍👩‍👧‍👦";
    case "curator": return "🛡️";
    case "cook": return "👨‍🍳";
    default: return "👤";
  }
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  greetingSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 28,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    alignSelf: "flex-start",
  },
  statsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
    fontSize: 22,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    width: "100%",
    padding: Spacing.lg,
    minHeight: 120,
  },
  gradientCard: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    marginBottom: Spacing.md,
  },
  statIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statContent: {
    flex: 1,
    justifyContent: "flex-end",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
  },
  newsSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  newsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  newsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  newsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  newsEmoji: {
    fontSize: 16,
  },
  newsTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
    fontSize: 16,
  },
  actionsSection: {
    marginBottom: Spacing.xl,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  actionCard: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    minHeight: 70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionLabel: {
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
  },
  
  // ========== НЕОНОВЫЕ СТИЛИ ==========
  neonContainer: {
    flex: 1,
    backgroundColor: NEON.bgDark,
  },
  neonThemeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    borderRadius: 22,
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: NEON.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  themeButtonGradient: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  neonGreeting: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: NEON.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NEON.primary + '30',
  },
  neonAvatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 3,
    shadowColor: NEON.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  neonAvatarGradient: {
    flex: 1,
    borderRadius: 27,
    padding: 3,
  },
  neonAvatarInner: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: NEON.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingGlassCard: {
    marginBottom: 24,
  },
  greetingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  greetingInfo: {
    flex: 1,
  },
  neonGreetingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginBottom: 6,
  },
  neonRoleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  neonRoleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  neonSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginBottom: 16,
  },
  neonStatCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: NEON.bgCard,
  },
  neonStatGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
  },
  neonStatNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  neonStatLabel: {
    fontSize: 12,
    color: NEON.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
