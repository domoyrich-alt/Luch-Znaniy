import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
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
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useStars } from "@/context/StarsContext";

const CUTOFF_HOUR = 9;
const CUTOFF_MINUTE = 5;

export default function CheckInScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { todayAttendance, markAttendance, classStudents, markStudentAttendance, markAllStudentsPresent, attendanceStats } = useApp();
  const { earnStars } = useStars();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scale = useSharedValue(1);

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
    setIsSubmitting(true);
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1.05),
      withSpring(1)
    );
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await markAttendance(isLate ? "late" : "present");
      earnStars(isLate ? 2 : 3, "Посещаемость");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось отметить посещаемость");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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
    return (
      <TeacherCheckInView
        classStudents={classStudents}
        markStudentAttendance={markStudentAttendance}
        markAllStudentsPresent={markAllStudentsPresent}
        attendanceStats={attendanceStats}
      />
    );
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
                disabled={isSubmitting}
                style={[
                  styles.checkInButton,
                  {
                    backgroundColor: isAfterCutoff()
                      ? Colors.light.warning
                      : Colors.light.success,
                    opacity: isSubmitting ? 0.6 : 1,
                  },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Feather name="check" size={48} color="#FFFFFF" />
                )}
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
            <StatItem label="Всего дней" value={attendanceStats.total.toString()} color={theme.primary} />
            <StatItem label="Присутствий" value={attendanceStats.present.toString()} color={Colors.light.success} />
            <StatItem label="Опозданий" value={attendanceStats.late.toString()} color={Colors.light.warning} />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function TeacherCheckInView({
  classStudents,
  markStudentAttendance,
  markAllStudentsPresent,
  attendanceStats,
}: {
  classStudents: { id: number; name: string; status: "present" | "late" | "absent" }[];
  markStudentAttendance: (id: number, status: "present" | "late" | "absent") => Promise<void>;
  markAllStudentsPresent: () => Promise<void>;
  attendanceStats: { total: number; present: number; late: number; absent: number };
}) {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const toggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "present" ? "late" : currentStatus === "late" ? "absent" : "present";
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await markStudentAttendance(id, nextStatus as "present" | "late" | "absent");
  };

  const handleMarkAllPresent = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markAllStudentsPresent();
    setIsLoading(false);
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

  const students = classStudents.length > 0 ? classStudents : [
    { id: 1, name: "Иванов Алексей", status: "present" as const },
    { id: 2, name: "Петрова Мария", status: "present" as const },
    { id: 3, name: "Сидоров Дмитрий", status: "absent" as const },
    { id: 4, name: "Козлова Анна", status: "present" as const },
    { id: 5, name: "Новиков Павел", status: "late" as const },
    { id: 6, name: "Федорова Елена", status: "present" as const },
  ];

  const stats = classStudents.length > 0 ? attendanceStats : {
    total: 6,
    present: students.filter(s => s.status === "present").length,
    late: students.filter(s => s.status === "late").length,
    absent: students.filter(s => s.status === "absent").length,
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
          <ThemedText type="h4">{user?.className || "Класс"}</ThemedText>
          <Button onPress={handleMarkAllPresent} style={styles.markAllButton} disabled={isLoading}>
            {isLoading ? "..." : "Все присутствуют"}
          </Button>
        </View>

        <View style={styles.statsRow}>
          <StatItem label="Присутствует" value={stats.present.toString()} color={Colors.light.success} />
          <StatItem label="Опоздало" value={stats.late.toString()} color={Colors.light.warning} />
          <StatItem label="Отсутствует" value={stats.absent.toString()} color={Colors.light.error} />
        </View>

        <View style={styles.studentsList}>
          {students.map((student) => (
            <Pressable
              key={student.id}
              onPress={() => toggleStatus(student.id, student.status)}
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
    marginBottom: Spacing.xl,
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
