import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Switch, Modal, TextInput, Platform, ActivityIndicator } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, apiRequest } from "@/lib/query-client";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useThemeContext } from "@/context/ThemeContext";
import { Spacing, BorderRadius, Colors, RoleBadgeColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

interface Achievement {
  id: number;
  userId: number;
  type: string;
  title: string;
  description: string | null;
  progress: number;
  unlockedAt: string | null;
}

const ACHIEVEMENT_CONFIG: Record<string, { icon: string; color: string }> = {
  excellent_grades: { icon: "award", color: Colors.light.yellowAccent },
  good_attendance: { icon: "clock", color: Colors.light.success },
  active_participant: { icon: "star", color: Colors.light.secondary },
  homework_champion: { icon: "book", color: Colors.light.primary },
  top_scorer: { icon: "trending-up", color: Colors.light.error },
  helpful_classmate: { icon: "heart", color: "#EC4899" },
};

export default function ProfileScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { themeMode, setThemeMode, notificationsEnabled, setNotificationsEnabled } = useThemeContext();
  const { user, logout, updateUserProfile, permissions } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: [`/api/achievements/${user?.id}`],
    enabled: !!user?.id,
  });
  
  const queryClient = useQueryClient();
  const isTeacher = user?.role === "teacher" || user?.role === "curator" || user?.role === "psychologist";
  
  const { data: teacherSubjects = [] } = useQuery<{id: number; subjectName: string}[]>({
    queryKey: [`/api/teacher-subjects/${user?.id}`],
    enabled: !!user?.id && isTeacher,
  });
  
  const [subjectsModalVisible, setSubjectsModalVisible] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const ALL_SUBJECTS = [
    "Математика", "Русский язык", "Литература", "Английский язык", "Физика", 
    "Химия", "Биология", "История", "Обществознание", "География", 
    "Информатика", "Физкультура", "Музыка", "ИЗО", "Технология",
    "ОБЖ", "Астрономия", "Экономика", "Право", "Психология"
  ];
  
  useEffect(() => {
    if (teacherSubjects.length > 0) {
      setSelectedSubjects(teacherSubjects.map(s => s.subjectName));
    }
  }, [teacherSubjects]);
  
  const saveSubjectsMutation = useMutation({
    mutationFn: async (subjects: string[]) => {
      const response = await apiRequest("POST", `/api/teacher-subjects/${user?.id}`, { subjects });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teacher-subjects/${user?.id}`] });
      setSubjectsModalVisible(false);
      Alert.alert("Успешно", "Предметы сохранены");
    },
    onError: () => {
      Alert.alert("Ошибка", "Не удалось сохранить предметы");
    },
  });
  
  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject) 
        : [...prev, subject]
    );
  };

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
      ceo: "CEO",
      parent: "Родитель",
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
          
          {isTeacher && (
            <View style={styles.teacherSubjectsRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Предметы: {teacherSubjects.length > 0 ? teacherSubjects.map(s => s.subjectName).join(", ") : "Не выбраны"}
              </ThemedText>
              <Pressable onPress={() => setSubjectsModalVisible(true)}>
                <ThemedText type="small" style={{ color: theme.primary }}>Изменить</ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.achievementsSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Достижения
          </ThemedText>
          {achievements.length > 0 ? (
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => {
                const config = ACHIEVEMENT_CONFIG[achievement.type] || { icon: "star", color: Colors.light.primary };
                return (
                  <View
                    key={achievement.id}
                    style={[styles.achievementCard, { backgroundColor: theme.backgroundDefault }]}
                  >
                    <View
                      style={[
                        styles.achievementIcon,
                        { backgroundColor: config.color + "20" },
                      ]}
                    >
                      <Feather
                        name={config.icon as any}
                        size={24}
                        color={config.color}
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
                            backgroundColor: config.color,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {achievement.progress}%
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          ) : (
            <Card style={{ padding: Spacing.lg, alignItems: "center" }}>
              <Feather name="award" size={32} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: "center" }}>
                Достижения пока не получены
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
                Продолжайте учиться чтобы получить награды
              </ThemedText>
            </Card>
          )}
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
            Быстрый доступ
          </ThemedText>
          <Card style={styles.settingsCard}>
            <SettingsItem
              icon="award"
              label="Таблица лидеров"
              onPress={() => navigation.navigate("Leaderboard")}
            />
            {user?.classId && (
              <SettingsItem
                icon="message-circle"
                label="Чат класса"
                onPress={() => navigation.navigate("ClassChat")}
              />
            )}
            <SettingsItem
              icon="heart"
              label="Написать психологу"
              onPress={() => navigation.navigate("PsychologistChat")}
            />
            <SettingsItem
              icon="video"
              label="Онлайн-уроки"
              onPress={() => navigation.navigate("OnlineLessons")}
            />
            {permissions.canCreateInviteCodes && (
              <SettingsItem
                icon="key"
                label="Управление приглашениями"
                onPress={() => navigation.navigate("Admin")}
              />
            )}
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
      
      <Modal visible={subjectsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Выберите предметы</ThemedText>
              <Pressable onPress={() => setSubjectsModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingBottom: Spacing.lg }}>
              <View style={styles.subjectsGrid}>
                {ALL_SUBJECTS.map((subject) => (
                  <Pressable
                    key={subject}
                    onPress={() => toggleSubject(subject)}
                    style={[
                      styles.subjectChip,
                      {
                        backgroundColor: selectedSubjects.includes(subject) ? theme.primary : theme.backgroundSecondary,
                        borderColor: selectedSubjects.includes(subject) ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemedText type="small" style={{ color: selectedSubjects.includes(subject) ? "#fff" : theme.text }}>
                      {subject}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <Button 
              onPress={() => saveSubjectsMutation.mutate(selectedSubjects)} 
              style={{ marginTop: Spacing.md }}
              disabled={saveSubjectsMutation.isPending}
            >
              {saveSubjectsMutation.isPending ? <ActivityIndicator color="#fff" /> : "Сохранить"}
            </Button>
          </View>
        </View>
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
  teacherSubjectsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  subjectsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  subjectChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});
