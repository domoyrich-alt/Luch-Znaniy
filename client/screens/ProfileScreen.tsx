import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Switch, Modal, TextInput, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useThemeContext } from "@/context/ThemeContext";
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
  const { themeMode, setThemeMode, notificationsEnabled, setNotificationsEnabled } = useThemeContext();
  const { user, logout, updateUserProfile } = useAuth();
  
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === "web") {
      setLogoutModalVisible(true);
    } else {
      Alert.alert("Выход", "Вы уверены, что хотите выйти?", [
        { text: "Отмена", style: "cancel" },
        { text: "Выйти", style: "destructive", onPress: logout },
      ]);
    }
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  const handleSaveProfile = () => {
    if (updateUserProfile) {
      updateUserProfile({ firstName, lastName });
    }
    setEditProfileVisible(false);
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

  const getRoleBadgeColor = () => {
    if (!user) return Colors.light.primary;
    return RoleBadgeColors[user.role] || Colors.light.primary;
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case "light": return "Светлая";
      case "dark": return "Тёмная";
      case "system": return "Системная";
      default: return "Системная";
    }
  };

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.name || "Пользователь";

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
            {displayName}
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
          <Pressable 
            onPress={() => {
              setFirstName(user?.firstName || "");
              setLastName(user?.lastName || "");
              setEditProfileVisible(true);
            }}
            style={[styles.editProfileButton, { borderColor: theme.border }]}
          >
            <Feather name="edit-2" size={14} color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.primary }}>
              Редактировать профиль
            </ThemedText>
          </Pressable>
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
            <View style={[styles.settingsItem, { borderBottomColor: theme.border }]}>
              <Feather name="bell" size={20} color={theme.textSecondary} />
              <ThemedText type="body" style={styles.settingsLabel}>
                Уведомления
              </ThemedText>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.border, true: theme.primary + "60" }}
                thumbColor={notificationsEnabled ? theme.primary : theme.textSecondary}
              />
            </View>
            <Pressable
              onPress={() => setThemeModalVisible(true)}
              style={({ pressed }) => [
                styles.settingsItem,
                { opacity: pressed ? 0.7 : 1, borderBottomColor: theme.border },
              ]}
            >
              <Feather name="moon" size={20} color={theme.textSecondary} />
              <ThemedText type="body" style={styles.settingsLabel}>
                Тема оформления
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {getThemeLabel()}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
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

      <Modal visible={editProfileVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Редактировать профиль</ThemedText>
              <Pressable onPress={() => setEditProfileVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <KeyboardAwareScrollViewCompat contentContainerStyle={styles.modalForm}>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Имя</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Введите имя"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Фамилия</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Введите фамилию"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <Button onPress={handleSaveProfile} style={{ marginTop: Spacing.lg }}>
                Сохранить
              </Button>
            </KeyboardAwareScrollViewCompat>
          </View>
        </View>
      </Modal>

      <Modal visible={themeModalVisible} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setThemeModalVisible(false)}>
          <View style={[styles.themeModalContent, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="h4" style={styles.themeModalTitle}>Тема оформления</ThemedText>
            {([
              { mode: "light", label: "Светлая", icon: "sun" },
              { mode: "dark", label: "Тёмная", icon: "moon" },
              { mode: "system", label: "Системная", icon: "smartphone" },
            ] as const).map((item) => (
              <Pressable
                key={item.mode}
                onPress={() => {
                  setThemeMode(item.mode);
                  setThemeModalVisible(false);
                }}
                style={[
                  styles.themeOption,
                  { 
                    backgroundColor: themeMode === item.mode ? theme.primary + "15" : "transparent",
                    borderColor: themeMode === item.mode ? theme.primary : theme.border,
                  }
                ]}
              >
                <Feather name={item.icon as any} size={20} color={themeMode === item.mode ? theme.primary : theme.textSecondary} />
                <ThemedText type="body" style={{ color: themeMode === item.mode ? theme.primary : theme.text }}>
                  {item.label}
                </ThemedText>
                {themeMode === item.mode ? (
                  <Feather name="check" size={20} color={theme.primary} style={{ marginLeft: "auto" }} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={logoutModalVisible} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setLogoutModalVisible(false)}>
          <View style={[styles.themeModalContent, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="h4" style={styles.themeModalTitle}>Выход</ThemedText>
            <ThemedText type="body" style={{ textAlign: "center", marginBottom: Spacing.lg }}>
              Вы уверены, что хотите выйти?
            </ThemedText>
            <View style={{ flexDirection: "row", gap: Spacing.md }}>
              <Pressable
                onPress={() => setLogoutModalVisible(false)}
                style={[styles.themeOption, { flex: 1, justifyContent: "center", borderColor: theme.border }]}
              >
                <ThemedText type="body">Отмена</ThemedText>
              </Pressable>
              <Pressable
                onPress={confirmLogout}
                style={[styles.themeOption, { flex: 1, justifyContent: "center", backgroundColor: Colors.light.error, borderColor: Colors.light.error }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>Выйти</ThemedText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
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
    marginBottom: Spacing.md,
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
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalForm: {
    gap: Spacing.md,
  },
  formGroup: {
    gap: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  themeModalContent: {
    position: "absolute",
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  themeModalTitle: {
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
});
