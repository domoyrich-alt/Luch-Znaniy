import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Switch, 
  Alert, 
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiFetch } from "@/lib/api";

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SettingItem {
  icon: string;
  iconFamily?: 'feather' | 'material';
  title: string;
  description?: string;
  type: "switch" | "button" | "info";
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  color?: string;
  isDestructive?: boolean;
}

const StudentCodeCard = ({ 
  code, 
  loading, 
  onCopy 
}: { 
  code: string | null; 
  loading: boolean;
  onCopy: () => void;
}) => {
  const [revealed, setRevealed] = useState(false);
  const pulse = useSharedValue(1);
  
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleReveal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRevealed(true);
  };

  const handleCopy = () => {
    if (code) {
      onCopy();
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={pulseStyle}>
      <LinearGradient
        colors={[NEON.warning + '30', NEON.warning + '10', NEON.bgCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.studentCodeCard}
      >
        <View style={styles.studentCodeHeader}>
          <View style={styles.studentCodeIcon}>
            <MaterialCommunityIcons name="key-variant" size={24} color={NEON.warning} />
          </View>
          <View style={styles.studentCodeTitleContainer}>
            <ThemedText style={styles.studentCodeTitle}>Код для родителей</ThemedText>
            <ThemedText style={styles.studentCodeSubtitle}>
              Передайте код родителю для отслеживания
            </ThemedText>
          </View>
        </View>

        <View style={styles.studentCodeBody}>
          {loading ? (
            <ThemedText style={styles.studentCodeLoading}>Загрузка...</ThemedText>
          ) : revealed ? (
            <View style={styles.studentCodeRevealed}>
              <ThemedText style={styles.studentCodeText}>
                {code || "Код не найден"}
              </ThemedText>
              <Pressable 
                style={styles.copyButton} 
                onPress={handleCopy}
              >
                <Feather name="copy" size={18} color={NEON.warning} />
                <ThemedText style={styles.copyButtonText}>Копировать</ThemedText>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.revealButton} onPress={handleReveal}>
              <Feather name="eye" size={20} color={NEON.warning} />
              <ThemedText style={styles.revealButtonText}>Нажмите, чтобы показать код</ThemedText>
            </Pressable>
          )}
        </View>

        <View style={styles.studentCodeHint}>
          <Feather name="info" size={14} color={NEON.textSecondary} />
          <ThemedText style={styles.studentCodeHintText}>
            Родитель сможет видеть ваши оценки и расписание
          </ThemedText>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const SettingItemComponent = ({ 
  item, 
  isLast, 
  index 
}: { 
  item: SettingItem; 
  isLast: boolean;
  index: number;
}) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    item.onPress?.();
  };

  const IconComponent = item.iconFamily === 'material' ? MaterialCommunityIcons : Feather;
  const iconColor = item.isDestructive ? NEON.error : (item.color || NEON.primary);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <AnimatedPressable
        onPress={item.type === "button" ? handlePress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.settingItem, animatedStyle]}
      >
        <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
          <IconComponent name={item.icon as any} size={20} color={iconColor} />
        </View>
        
        <View style={styles.settingContent}>
          <ThemedText style={[
            styles.settingTitle,
            item.isDestructive && { color: NEON.error }
          ]}>
            {item.title}
          </ThemedText>
          {item.description && (
            <ThemedText style={styles.settingDescription}>
              {item.description}
            </ThemedText>
          )}
        </View>

        {item.type === "switch" && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: NEON.border, true: NEON.primary + '60' }}
            thumbColor={item.value ? NEON.primary : NEON.textSecondary}
          />
        )}

        {item.type === "button" && (
          <Feather 
            name="chevron-right" 
            size={20} 
            color={item.isDestructive ? NEON.error : NEON.textSecondary} 
          />
        )}
      </AnimatedPressable>
      
      {!isLast && <View style={styles.separator} />}
    </Animated.View>
  );
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dataUsage, setDataUsage] = useState(false);
  const [studentCode, setStudentCode] = useState<string | null>(null);
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
    {
      title: "Внешний вид",
      items: [
        {
          icon: "moon",
          title: "Тема и цвета",
          description: "Настройка внешнего вида",
          type: "button",
          color: NEON.secondary,
          onPress: () => navigation.navigate('AppearanceSettings'),
        },
      ],
    },
    {
      title: "Уведомления",
      items: [
        {
          icon: "bell",
          title: "Push-уведомления",
          description: "Получать уведомления",
          type: "switch",
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: "volume-2",
          title: "Звуки",
          description: "Звуковые уведомления",
          type: "switch",
          value: soundEnabled,
          onToggle: setSoundEnabled,
        },
      ],
    },
    {
      title: "Аккаунт",
      items: [
        {
          icon: "user",
          title: "Редактировать профиль",
          description: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Профиль',
          type: "button",
          onPress: () => navigation.navigate('EditProfile'),
        },
        {
          icon: "gift",
          iconFamily: "material" as const,
          title: "Мои подарки",
          description: "Полученные и скрытые подарки",
          type: "button",
          color: NEON.accent,
          onPress: () => navigation.navigate('MyGifts'),
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
      title: "Данные",
      items: [
        {
          icon: "database",
          title: "Экономия трафика",
          description: "Сжатие изображений",
          type: "switch",
          value: dataUsage,
          onToggle: setDataUsage,
        },
        {
          icon: "trash-2",
          title: "Очистить кэш",
          description: "~254 МБ",
          type: "button",
          onPress: () => Alert.alert("Кэш", "Кэш очищен"),
        },
      ],
    },
    {
      title: "Информация",
      items: [
        {
          icon: "help-circle",
          title: "Справка",
          type: "button",
          onPress: () => Alert.alert("Справка", "Обратитесь к администрации школы"),
        },
        {
          icon: "info",
          title: "О приложении",
          description: "Версия 1.0.0",
          type: "button",
          onPress: () => Alert.alert("Луч Знаний", "Версия 1.0.0\nЦифровое будущее образования"),
        },
      ],
    },
    {
      title: "",
      items: [
        {
          icon: "log-out",
          title: "Выйти из аккаунта",
          type: "button",
          isDestructive: true,
          onPress: handleLogout,
        },
      ],
    },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: NEON.bgDark }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.springify()}>
          <ThemedText style={styles.screenTitle}>Настройки</ThemedText>
        </Animated.View>

        {user?.role === "student" && (
          <StudentCodeCard
            code={studentCode}
            loading={loadingCode}
            onCopy={copyCodeToClipboard}
          />
        )}

        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title || `section-${sectionIndex}`} style={styles.section}>
            {section.title && (
              <Animated.View entering={FadeInDown.delay(sectionIndex * 30)}>
                <ThemedText style={styles.sectionTitle}>
                  {section.title.toUpperCase()}
                </ThemedText>
              </Animated.View>
            )}
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <SettingItemComponent
                  key={item.title}
                  item={item}
                  isLast={index === section.items.length - 1}
                  index={sectionIndex * 10 + index}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: NEON.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: NEON.bgCard,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: NEON.border,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
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
    fontSize: 16,
    fontWeight: '500',
    color: NEON.textPrimary,
  },
  settingDescription: {
    fontSize: 13,
    color: NEON.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: NEON.border,
    marginLeft: 40 + Spacing.md * 2,
  },
  studentCodeCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: NEON.warning + '40',
  },
  studentCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  studentCodeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: NEON.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  studentCodeTitleContainer: {
    flex: 1,
  },
  studentCodeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NEON.warning,
  },
  studentCodeSubtitle: {
    fontSize: 13,
    color: NEON.textSecondary,
    marginTop: 2,
  },
  studentCodeBody: {
    backgroundColor: NEON.bgDark,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  studentCodeLoading: {
    fontSize: 14,
    color: NEON.textSecondary,
    textAlign: 'center',
  },
  studentCodeRevealed: {
    alignItems: 'center',
  },
  studentCodeText: {
    fontSize: 24,
    fontWeight: '700',
    color: NEON.warning,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON.warning + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: NEON.warning,
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.sm,
  },
  revealButtonText: {
    fontSize: 14,
    color: NEON.warning,
  },
  studentCodeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentCodeHintText: {
    fontSize: 12,
    color: NEON.textSecondary,
    flex: 1,
  },
});
