import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";

const CUTOFF_HOUR = 9;
const CUTOFF_MINUTE = 5;

export default function CheckInScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { todayAttendance, markAttendance } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isAfterCutoff = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return hours > CUTOFF_HOUR || (hours === CUTOFF_HOUR && minutes >= CUTOFF_MINUTE);
  };

  const handleCheckIn = async () => {
    const isLate = isAfterCutoff();
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1.05),
      withSpring(1)
    );
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAttendance(isLate ? "late" : "present");
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const isTeacherOrHigher = user?.role === "teacher" || user?.role === "director" || user?.role === "curator";

  if (isTeacherOrHigher) {
    return <TeacherCheckInView />;
  }

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
        <View style={styles.timeSection}>
          <ThemedText type="h1" style={styles.timeText}>
            {formatTime(currentTime)}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {currentTime.toLocaleDateString("ru-RU", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </ThemedText>
        </View>

        {todayAttendance ? (
          <View style={styles.statusSection}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    todayAttendance.status === "present"
                      ? Colors.light.success + "20"
                      : Colors.light.warning + "20",
                },
              ]}
            >
              <Feather
                name={todayAttendance.status === "present" ? "check-circle" : "clock"}
                size={48}
                color={
                  todayAttendance.status === "present"
                    ? Colors.light.success
                    : Colors.light.warning
                }
              />
            </View>
            <ThemedText type="h3" style={styles.statusTitle}>
              {todayAttendance.status === "present" ? "Вы отмечены!" : "Опоздание"}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Отмечено в{" "}
              {new Date(todayAttendance.markedAt || "").toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.checkInSection}>
            <Animated.View style={animatedButtonStyle}>
              <Pressable
                onPress={handleCheckIn}
                disabled={isAfterCutoff() && !todayAttendance}
                style={[
                  styles.checkInButton,
                  {
                    backgroundColor: isAfterCutoff()
                      ? Colors.light.warning
                      : Colors.light.success,
                    opacity: isAfterCutoff() ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="check" size={48} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
            <ThemedText type="h4" style={styles.checkInLabel}>
              {isAfterCutoff() ? "Отметиться (опоздание)" : "Отметиться"}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              {isAfterCutoff()
                ? "Время отметки прошло. Отметка будет как опоздание"
                : `До ${CUTOFF_HOUR}:0${CUTOFF_MINUTE} отметка будет вовремя`}
            </ThemedText>
          </View>
        )}

        <View style={styles.infoSection}>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="info" size={20} color={theme.primary} />
              <ThemedText type="small">
                Отметка доступна до изъятия телефонов. После 9:05 попросите учителя отметить вас.
              </ThemedText>
            </View>
          </Card>
        </View>

        <View style={styles.statsSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Статистика посещаемости
          </ThemedText>
          <View style={styles.statsRow}>
            <StatItem label="Всего дней" value="42" color={theme.primary} />
            <StatItem label="Присутствий" value="40" color={Colors.light.success} />
            <StatItem label="Опозданий" value="2" color={Colors.light.warning} />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function TeacherCheckInView() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [students, setStudents] = useState([
    { id: "1", name: "Иванов Алексей", status: "present" as const },
    { id: "2", name: "Петрова Мария", status: "present" as const },
    { id: "3", name: "Сидоров Дмитрий", status: "absent" as const },
    { id: "4", name: "Козлова Анна", status: "present" as const },
    { id: "5", name: "Новиков Павел", status: "late" as const },
    { id: "6", name: "Федорова Елена", status: "present" as const },
  ]);

  const toggleStatus = (id: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status:
                s.status === "present"
                  ? "late"
                  : s.status === "late"
                  ? "absent"
                  : "present",
            }
          : s
      )
    );
  };

  const markAllPresent = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStudents((prev) => prev.map((s) => ({ ...s, status: "present" })));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return Colors.light.success;
      case "late":
        return Colors.light.warning;
      case "absent":
        return Colors.light.error;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return "check-circle";
      case "late":
        return "clock";
      case "absent":
        return "x-circle";
      default:
        return "circle";
    }
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
        <View style={styles.teacherHeader}>
          <ThemedText type="h4">9А класс</ThemedText>
          <Button onPress={markAllPresent} style={styles.markAllButton}>
            Все присутствуют
          </Button>
        </View>

        <View style={styles.studentsList}>
          {students.map((student) => (
            <Pressable
              key={student.id}
              onPress={() => toggleStatus(student.id)}
              style={[styles.studentRow, { backgroundColor: theme.backgroundDefault }]}
            >
              <ThemedText type="body">{student.name}</ThemedText>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(student.status) + "20" },
                ]}
              >
                <Feather
                  name={getStatusIcon(student.status) as any}
                  size={20}
                  color={getStatusColor(student.status)}
                />
              </View>
            </Pressable>
          ))}
        </View>

        <ThemedText type="caption" style={[styles.hint, { color: theme.textSecondary }]}>
          Нажмите на ученика чтобы изменить статус
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
      <ThemedText type="h3" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  timeSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  timeText: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  statusSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  statusBadge: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  statusTitle: {
    marginBottom: Spacing.sm,
  },
  checkInSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  checkInButton: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  checkInLabel: {
    marginBottom: Spacing.sm,
  },
  infoSection: {
    marginBottom: Spacing["2xl"],
  },
  infoCard: {
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  statsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  teacherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  markAllButton: {
    paddingHorizontal: Spacing.lg,
    height: 40,
  },
  studentsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    textAlign: "center",
  },
});
