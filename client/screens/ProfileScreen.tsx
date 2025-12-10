import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, RoleBadgeColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

const ACHIEVEMENTS = [
  { id: "1", title: "Отличник", icon: "award", color: Colors.light.yellowAccent, progress: 100 },
  { id: "2", title: "Пунктуальный", icon: "clock", color: Colors.light.success, progress: 85 },
  { id: "3", title: "Активист", icon: "star", color: Colors.light.secondary, progress: 60 },
  { id: "4", title: "Книжный червь", icon: "book", color: Colors.light.primary, progress: 40 },
];

export default function ProfileScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Выход", "Вы уверены, что хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      { text: "Выйти", style: "destructive", onPress: logout },
    ]);
  };

  const getRoleLabel = () => {
    if (!user) return "";
    const labels = {
      student: "Ученик",
      teacher: "Учитель",
      director: "Директор",
      curator: "Куратор",
    };
    return labels[user.role];
  };

  const getRoleBadgeColor = () => {
    if (!user) return Colors.light.primary;
    return RoleBadgeColors[user.role];
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
        <View style={styles.profileSection}>
          <View style={[styles.avatarLarge, { backgroundColor: theme.primary + "15" }]}>
            <Feather name="user" size={48} color={theme.primary} />
          </View>
          <ThemedText type="h3" style={styles.userName}>
            {user?.name || "Пользователь"}
          </ThemedText>
          <View style={styles.roleRow}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor() }]}>
              <ThemedText type="caption" style={styles.roleBadgeText}>
                {getRoleLabel()}
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {user?.className}
            </ThemedText>
          </View>
        </View>

        <View style={styles.achievementsSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Достижения
          </ThemedText>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((achievement) => (
              <View
                key={achievement.id}
                style={[styles.achievementCard, { backgroundColor: theme.backgroundDefault }]}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    { backgroundColor: achievement.color + "20" },
                  ]}
                >
                  <Feather
                    name={achievement.icon as any}
                    size={24}
                    color={achievement.color}
                  />
                </View>
                <ThemedText type="small" style={styles.achievementTitle}>
                  {achievement.title}
                </ThemedText>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${achievement.progress}%`,
                        backgroundColor: achievement.color,
                      },
                    ]}
                  />
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {achievement.progress}%
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.settingsSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Настройки
          </ThemedText>
          <Card style={styles.settingsCard}>
            <SettingsItem
              icon="bell"
              label="Уведомления"
              onPress={() => {}}
            />
            <SettingsItem
              icon="moon"
              label="Тема оформления"
              onPress={() => {}}
            />
            <SettingsItem
              icon="globe"
              label="Язык"
              value="Русский"
              onPress={() => {}}
            />
          </Card>
        </View>

        <View style={styles.accountSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Аккаунт
          </ThemedText>
          <Card style={styles.settingsCard}>
            <SettingsItem
              icon="shield"
              label="Конфиденциальность"
              onPress={() => {}}
            />
            <SettingsItem
              icon="help-circle"
              label="Помощь"
              onPress={() => {}}
            />
            <SettingsItem
              icon="info"
              label="О приложении"
              value="v1.0.0"
              onPress={() => {}}
            />
          </Card>
        </View>

        <Pressable
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: Colors.light.error + "15" }]}
        >
          <Feather name="log-out" size={20} color={Colors.light.error} />
          <ThemedText type="body" style={{ color: Colors.light.error, fontWeight: "600" }}>
            Выйти
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function SettingsItem({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsItem,
        { opacity: pressed ? 0.7 : 1, borderBottomColor: theme.border },
      ]}
    >
      <Feather name={icon as any} size={20} color={theme.textSecondary} />
      <ThemedText type="body" style={styles.settingsLabel}>
        {label}
      </ThemedText>
      {value ? (
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {value}
        </ThemedText>
      ) : null}
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
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
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  userName: {
    marginBottom: Spacing.sm,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  achievementsSection: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  achievementCard: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.sm,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementTitle: {
    fontWeight: "600",
  },
  progressBar: {
    width: "100%",
    height: 4,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  settingsSection: {
    marginBottom: Spacing["2xl"],
  },
  accountSection: {
    marginBottom: Spacing["2xl"],
  },
  settingsCard: {
    padding: 0,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  settingsLabel: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
});
