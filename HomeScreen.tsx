import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, RoleBadgeColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";

export default function HomeScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { grades, averageGrade, homework, todayAttendance, announcements, events } = useApp();
  const navigation = useNavigation<any>();

  const displayAverage = averageGrade > 0 ? averageGrade.toFixed(1) : 
    (grades.length > 0 
      ? (grades.reduce((acc, g) => acc + g.value, 0) / grades.length).toFixed(1)
      : "---");

  const pendingHomework = homework.filter((h) => h.status === "pending").length;
  const upcomingEvents = events.length;

  const getRoleBadgeColor = () => {
    if (!user) return Colors.light.primary;
    return RoleBadgeColors[user.role];
  };

  const getRoleLabel = () => {
    if (!user) return "";
    const labels: Record<string, string> = {
      student: "Ученик",
      teacher: "Учитель",
      director: "Директор",
      curator: "Куратор",
      cook: "Повар",
    };
    return labels[user.role] || user.role;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="user" size={24} color={theme.primary} />
            </View>
            <View style={styles.welcomeText}>
              <ThemedText type="h4">
                Привет, {user?.name?.split(" ")[0] || "Пользователь"}!
              </ThemedText>
              <View style={styles.roleRow}>
                <View
                  style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor() }]}
                >
                  <ThemedText type="caption" style={styles.roleBadgeText}>
                    {getRoleLabel()}
                  </ThemedText>
                </View>
                {user?.className ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {user.className}
                  </ThemedText>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Статистика
          </ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              icon="bar-chart-2"
              label="Средний балл"
              value={displayAverage}
              color={theme.primary}
              onPress={() => navigation.navigate("GradesTab")}
            />
            <StatCard
              icon="book-open"
              label="Домашка"
              value={`${pendingHomework}`}
              subtext="заданий"
              color={theme.warning}
              onPress={() => navigation.navigate("HomeworkModal")}
            />
            <StatCard
              icon="check-circle"
              label="Сегодня"
              value={todayAttendance ? "OK" : "---"}
              subtext={todayAttendance?.status === "late" ? "Опоздал" : ""}
              color={todayAttendance ? theme.success : theme.textSecondary}
              onPress={() => navigation.navigate("CheckInTab")}
            />
            <StatCard
              icon="star"
              label="События"
              value={`${upcomingEvents}`}
              subtext="активных"
              color={theme.secondary}
              onPress={() => navigation.navigate("EventsModal")}
            />
          </View>
        </View>

        <View style={styles.announcementsSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Новости</ThemedText>
            <Pressable onPress={() => navigation.navigate("AnnouncementsModal")}>
              <ThemedText type="link">Все</ThemedText>
            </Pressable>
          </View>
          {announcements.length > 0 ? (
            announcements.slice(0, 2).map((announcement) => (
              <Card key={announcement.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <ThemedText type="body" style={styles.announcementTitle}>
                    {announcement.title}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {announcement.date}
                  </ThemedText>
                </View>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {announcement.content}
                </ThemedText>
              </Card>
            ))
          ) : (
            <Card style={styles.announcementCard}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Нет новых новостей
              </ThemedText>
            </Card>
          )}
        </View>

        <View style={styles.quickActionsSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Быстрые действия
          </ThemedText>
          <View style={styles.actionsGrid}>
            <QuickActionButton
              icon="calendar"
              label="Расписание"
              onPress={() => navigation.navigate("ScheduleTab")}
              color={Colors.light.yellowAccent}
            />
            <QuickActionButton
              icon="coffee"
              label="Столовая"
              onPress={() => navigation.navigate("CafeteriaTab")}
              color={Colors.light.success}
            />
            <QuickActionButton
              icon="award"
              label="Достижения"
              onPress={() => navigation.navigate("ProfileTab")}
              color={Colors.light.warning}
            />
            <QuickActionButton
              icon="users"
              label="Мероприятия"
              onPress={() => navigation.navigate("EventsModal")}
              color={Colors.light.secondary}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  onPress?: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon as any} size={20} color={color} />
      <ThemedText type="h3" style={{ color }}>
        {value}
      </ThemedText>
      {subtext ? (
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {subtext}
        </ThemedText>
      ) : null}
      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function QuickActionButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={22} color={color} />
      </View>
      <ThemedText type="small" style={styles.actionLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  welcomeSection: {
    marginBottom: Spacing["2xl"],
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: {
    flex: 1,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  roleBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  statsSection: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  announcementsSection: {
    marginBottom: Spacing["2xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  announcementCard: {
    marginBottom: Spacing.md,
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  announcementTitle: {
    fontWeight: "600",
    flex: 1,
  },
  quickActionsSection: {
    marginBottom: Spacing.xl,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  actionButton: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontWeight: "500",
  },
});
