import React, { useMemo } from "react";
import { View, StyleSheet, Pressable, ScrollView, Dimensions, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type QuickAction = {
  key: string;
  label: string;
  shortLabel: string;
  emoji: string;
  color: string;
  onPress: () => void;
};

export default function QuickActionsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();

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

  const actions = useMemo<QuickAction[]>(() => {
    const base: QuickAction[] = [
      {
        key: "grades",
        label: "Мои оценки",
        shortLabel: "Оценки",
        emoji: "📊",
        color: "#22C55E",
        onPress: () => nav.navigate("Grades"),
      },
      {
        key: "psychologist",
        label: "Написать психологу",
        shortLabel: "Психолог",
        emoji: "💬",
        color: Colors.light.secondary,
        onPress: () => nav.navigate("ChatsTab", { screen: "PsychologistChat" }),
      },
      {
        key: "onlineLessons",
        label: "Онлайн уроки",
        shortLabel: "Уроки",
        emoji: "📹",
        color: Colors.light.error,
        onPress: () => navigateRoot("OnlineLessons"),
      },
      {
        key: "classChat",
        label: "Чат класса",
        shortLabel: "Класс",
        emoji: "👥",
        color: Colors.light.success,
        onPress: () => nav.navigate("ChatsTab"),
      },
      {
        key: "gifts",
        label: "Подарки",
        shortLabel: "Подарки",
        emoji: "🎁",
        color: Colors.light.primary,
        onPress: () => navigateRoot("Gifts"),
      },
      {
        key: "friends",
        label: "Друзья",
        shortLabel: "Друзья",
        emoji: "💚",
        color: Colors.light.success,
        onPress: () => navigateRoot("Friends"),
      },
      {
        key: "leaderboard",
        label: "Рейтинг учеников",
        shortLabel: "Рейтинг",
        emoji: "🏆",
        color: Colors.light.warning,
        onPress: () => navigateRoot("Leaderboard"),
      },
      {
        key: "clubs",
        label: "Кружки",
        shortLabel: "Кружки",
        emoji: "❤️",
        color: Colors.light.error,
        onPress: () => navigateRoot("Clubs"),
      },
      {
        key: "analytics",
        label: "Аналитика",
        shortLabel: "Аналитика",
        emoji: "📈",
        color: Colors.light.primary,
        onPress: () => navigateRoot("Analytics"),
      },
      {
        key: "forum",
        label: "Форум",
        shortLabel: "Форум",
        emoji: "💭",
        color: "#9C27B0",
        onPress: () => navigateRoot("Forum"),
      },
      {
        key: "achievements",
        label: "Достижения",
        shortLabel: "Достижения",
        emoji: "⭐",
        color: "#FFD93D",
        onPress: () => navigateRoot("Achievements"),
      },
      {
        key: "homework",
        label: "Домашние задания",
        shortLabel: "Домашние\nзадания",
        emoji: "📝",
        color: "#6BCB77",
        onPress: () => navigateRoot("Homework"),
      },
    ];

    // Role-based insertions
    const list = [...base];

    if (user?.role === "teacher" || user?.role === "director" || user?.role === "ceo") {
      list.splice(0, 0, {
        key: "teacherJournal",
        label: "Журнал класса",
        shortLabel: "Журнал",
        emoji: "📚",
        color: Colors.light.primary,
        onPress: () => nav.navigate("TeacherJournal"),
      });
    }

    if (user?.role === "student") {
      list.splice(1, 0, {
        key: "classList",
        label: "Мой класс",
        shortLabel: "Мой класс",
        emoji: "📋",
        color: Colors.light.primary,
        onPress: () => nav.navigate("ClassList"),
      });
    }

    if (user?.role === "parent" || user?.role === "student") {
      list.splice(2, 0, {
        key: "parentPortal",
        label: user?.role === "parent" ? "Мои дети" : "Родительский портал",
        shortLabel: user?.role === "parent" ? "Мои дети" : "Родительский\nпортал",
        emoji: "👨‍👩‍👧",
        color: Colors.light.primary,
        onPress: () => navigateRoot("ParentPortal"),
      });
    }

    if (user?.role === "ceo" || user?.role === "director" || user?.role === "teacher") {
      list.push({
        key: "admin",
        label: "Управление",
        shortLabel: "Управление",
        emoji: "🛡️",
        color: "#FF6B35",
        onPress: () => navigateRoot("Admin"),
      });
    }

    return list;
  }, [nav, user?.role]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}> 
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {actions.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.tile,
                {
                  opacity: pressed ? 0.92 : 1,
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={[styles.iconRing, { borderColor: theme.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: theme.backgroundTertiary }]}>
                  <ThemedText style={styles.emoji}>{action.emoji}</ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.label, { color: theme.text }]} numberOfLines={2}>
                {action.shortLabel || action.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const TILE_GAP = Spacing.md;
const COLUMNS = 3;
const TILE_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - TILE_GAP * (COLUMNS - 1)) / COLUMNS;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TILE_GAP,
  },
  tile: {
    width: TILE_WIDTH,
    minHeight: 110,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  iconRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 15,
  },
});
