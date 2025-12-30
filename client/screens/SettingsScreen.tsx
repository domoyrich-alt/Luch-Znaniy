import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch, Alert, TextInput, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { apiFetch } from "@/lib/api";

interface SettingItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  type: "switch" | "button" | "info" | "code";
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  codeValue?: string;
  hidden?: boolean;
}

export default function SettingsScreen() {
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [language, setLanguage] = useState("ru");
  const [dataUsage, setDataUsage] = useState(false);
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [studentCode, setStudentCode] = useState<string | null>(null);
  const [showStudentCode, setShowStudentCode] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  useEffect(() => {
    if (user?.role === "student" && user?.id) {
      loadStudentCode();
    }
  }, [user?.id, user?.role]);

  const loadStudentCode = async () => {
    if (!user?.id) return;
    setLoadingCode(true);
    try {
      const response = await apiFetch(`/api/student-code/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setStudentCode(data.code);
      }
    } catch (error) {
      console.error("Load student code error:", error);
    } finally {
      setLoadingCode(false);
    }
  };

  const copyCodeToClipboard = async () => {
    if (studentCode) {
      await Clipboard.setStringAsync(studentCode);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Скопировано", "Код скопирован в буфер обмена");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Выход из аккаунта",
      "Вы уверены, что хотите выйти?",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Выйти", style: "destructive", onPress: logout },
      ]
    );
  };

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    ...(user?.role === "student" ? [{
      title: "Код для родителей",
      items: [
        {
          icon: "key" as const,
          title: "Код привязки",
          description: showStudentCode 
            ? (studentCode || "Загрузка...") 
            : "Нажмите чтобы показать код",
          type: "code" as const,
          codeValue: studentCode || undefined,
          hidden: !showStudentCode,
          onPress: () => {
            if (!showStudentCode) {
              setShowStudentCode(true);
            } else if (studentCode) {
              copyCodeToClipboard();
            }
          },
        },
      ],
    }] : []),
    {
      title: "Внешний вид",
      items: [
        {
          icon: "moon",
          title: "Тема и цвета",
          description: "Настройка внешнего вида приложения",
          type: "button",
          onPress: () => navigation.navigate('AppearanceSettings'),
        },
      ],
    },
    {
      title: "Уведомления",
      items: [
        {
          icon: "bell",
          title: "Настройки уведомлений",
          description: "Push-уведомления и звуки",
          type: "button",
          onPress: () => navigation.navigate('NotificationSettings'),
        },
      ],
    },
    {
      title: "Аккаунт",
      items: [
        {
          icon: "user",
          title: "Редактировать профиль",
          description: `${user?.firstName} ${user?.lastName}`,
          type: "button",
          onPress: () => navigation.navigate('EditProfile'),
        },
        {
          icon: "shield",
          title: "Конфиденциальность",
          description: "Настройки приватности",
          type: "button",
          onPress: () => navigation.navigate('PrivacySettings'),
        },
        {
          icon: "slash",
          title: "Заблокированные",
          description: "Управление блокировками",
          type: "button",
          onPress: () => navigation.navigate('BlockedUsers'),
        },
      ],
    },
    {
      title: "Поддержка",
      items: [
        {
          icon: "help-circle",
          title: "Справка",
          type: "button",
          onPress: () => Alert.alert("Справка", "Обратитесь к администрации школы за помощью"),
        },
        {
          icon: "message-circle",
          title: "Обратная связь",
          type: "button",
          onPress: () => Alert.alert("Обратная связь", "Напишите психологу или администрации"),
        },
        {
          icon: "info",
          title: "О приложении",
          type: "button",
          onPress: () => Alert.alert("Luch Znaniy", "Версия 1.0.0\nЦифровое будущее образования"),
        },
      ],
    },
    {
      title: "Язык и регион",
      items: [
        {
          icon: "globe",
          title: "Язык приложения",
          description: language === "ru" ? "Русский" : "English",
          type: "button",
          onPress: () => {
            Alert.alert(
              "Выбор языка",
              "Выберите язык приложения",
              [
                { text: "Русский", onPress: () => setLanguage("ru") },
                { text: "English", onPress: () => setLanguage("en") },
                { text: "Отмена", style: "cancel" },
              ]
            );
          },
        },
        {
          icon: "map-pin",
          title: "Часовой пояс",
          description: "UTC+3 (Москва)",
          type: "info",
        },
      ],
    },
    {
      title: "Данные и хранилище",
      items: [
        {
          icon: "database",
          title: "Экономия трафика",
          description: "Загружать фото в меньшем качестве",
          type: "switch",
          value: dataUsage,
          onToggle: setDataUsage,
        },
        {
          icon: "download",
          title: "Размер кэша",
          description: "~254 МБ",
          type: "button",
          onPress: () => Alert.alert("Кэш", "Кэш был очищен"),
        },
        {
          icon: "activity",
          title: "Использование памяти",
          description: "~120 МБ",
          type: "info",
        },
      ],
    },
    {
      title: "Действия",
      items: [
        {
          icon: "log-out",
          title: "Выйти из аккаунта",
          type: "button",
          onPress: handleLogout,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem, isLast: boolean) => {
    const handlePress = async () => {
      if (hapticEnabled && Platform.OS !== 'web') {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }
      item.onPress?.();
    };

    const isCodeItem = item.type === "code";

    return (
      <View key={item.title}>
        <Pressable
          onPress={item.type === "button" || item.type === "code" ? handlePress : undefined}
          style={({ pressed }) => [
            styles.settingItem,
            { opacity: pressed ? 0.7 : 1 },
            isCodeItem && styles.codeItem,
          ]}
        >
          <View style={[
            styles.settingIcon, 
            { backgroundColor: isCodeItem ? Colors.light.warning + "20" : theme.primary + "15" }
          ]}>
            <Feather 
              name={item.icon} 
              size={20} 
              color={isCodeItem ? Colors.light.warning : theme.primary} 
            />
          </View>
          
          <View style={styles.settingContent}>
            <ThemedText type="body" style={styles.settingTitle}>
              {item.title}
            </ThemedText>
            {item.description && (
              <ThemedText 
                type="caption" 
                style={[
                  { color: theme.textSecondary },
                  isCodeItem && showStudentCode && styles.codeText,
                ]}
              >
                {item.hidden ? "••••••••" : item.description}
              </ThemedText>
            )}
          </View>

          {item.type === "switch" && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: theme.border, true: theme.primary + "60" }}
              thumbColor={item.value ? theme.primary : theme.textSecondary}
            />
          )}

          {item.type === "button" && (
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          )}

          {item.type === "code" && (
            <View style={styles.codeActions}>
              {showStudentCode ? (
                <Pressable onPress={copyCodeToClipboard} style={styles.copyButton}>
                  <Feather name="copy" size={18} color={Colors.light.warning} />
                </Pressable>
              ) : (
                <Feather name="eye" size={20} color={theme.textSecondary} />
              )}
            </View>
          )}
        </Pressable>
        
        {!isLast && <View style={[styles.separator, { backgroundColor: theme.border }]} />}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Spacing.lg,
            paddingBottom: Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title.toUpperCase()}
            </ThemedText>
            <Card style={styles.sectionCard}>
              {section.items.map((item, index) => 
                renderSettingItem(item, index === section.items.length - 1)
              )}
            </Card>
            {section.title === "Код для родителей" && (
              <ThemedText type="caption" style={[styles.codeHint, { color: theme.textSecondary }]}>
                Передайте этот код родителю, чтобы он мог отслеживать ваши оценки и расписание
              </ThemedText>
            )}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  sectionCard: {
    padding: 0,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  codeItem: {
    backgroundColor: Colors.light.warning + "08",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    marginBottom: Spacing.xs,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    letterSpacing: 1,
    color: Colors.light.warning,
  },
  separator: {
    height: 1,
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
  codeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.warning + "20",
  },
  codeHint: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: 12,
    lineHeight: 16,
  },
});
