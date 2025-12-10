import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const DAY_NAMES = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

export default function ScheduleScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { schedule, isEvenWeek, toggleWeekType } = useApp();
  const [selectedDay, setSelectedDay] = useState(0);

  const todaySchedule = schedule.filter((item) => {
    if (item.day !== selectedDay + 1) return false;
    if (item.isEvenWeek === null) return true;
    return item.isEvenWeek === isEvenWeek;
  });

  const yellowBg = isDark ? Colors.dark.yellowLight : Colors.light.yellowLight;
  const yellowMedium = isDark ? Colors.dark.yellowMedium : Colors.light.yellowMedium;
  const yellowAccent = Colors.light.yellowAccent;

  return (
    <View style={[styles.container, { backgroundColor: yellowBg }]}>
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
        <View style={styles.weekToggle}>
          <Pressable
            onPress={toggleWeekType}
            style={[styles.weekButton, { backgroundColor: yellowMedium }]}
          >
            <Feather name="repeat" size={16} color={yellowAccent} />
            <ThemedText type="small" style={{ fontWeight: "600" }}>
              {isEvenWeek ? "Четная неделя" : "Нечетная неделя"}
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daySelector}
          contentContainerStyle={styles.daySelectorContent}
        >
          {DAYS.map((day, index) => (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(index)}
              style={[
                styles.dayButton,
                {
                  backgroundColor:
                    selectedDay === index ? yellowAccent : yellowMedium,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={[
                  styles.dayText,
                  { color: selectedDay === index ? "#000000" : theme.text },
                ]}
              >
                {day}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        <ThemedText type="h4" style={styles.dayTitle}>
          {DAY_NAMES[selectedDay]}
        </ThemedText>

        {todaySchedule.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: yellowMedium }]}>
            <Feather name="sun" size={40} color={yellowAccent} />
            <ThemedText type="body" style={styles.emptyText}>
              Нет уроков
            </ThemedText>
          </View>
        ) : (
          <View style={styles.lessonsList}>
            {todaySchedule
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((lesson, index) => (
                <View
                  key={lesson.id}
                  style={[
                    styles.lessonCard,
                    {
                      backgroundColor: theme.backgroundRoot,
                      borderLeftColor: yellowAccent,
                    },
                  ]}
                >
                  <View style={styles.lessonTime}>
                    <ThemedText type="body" style={styles.timeText}>
                      {lesson.startTime}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {lesson.endTime}
                    </ThemedText>
                  </View>
                  <View style={styles.lessonDivider} />
                  <View style={styles.lessonInfo}>
                    <ThemedText type="body" style={styles.subjectText}>
                      {lesson.subject}
                    </ThemedText>
                    <View style={styles.lessonDetails}>
                      <View style={styles.detailRow}>
                        <Feather name="map-pin" size={12} color={theme.textSecondary} />
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {lesson.room}
                        </ThemedText>
                      </View>
                      <View style={styles.detailRow}>
                        <Feather name="user" size={12} color={theme.textSecondary} />
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {lesson.teacher}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <View style={styles.lessonNumber}>
                    <ThemedText type="caption" style={{ color: yellowAccent, fontWeight: "700" }}>
                      {index + 1}
                    </ThemedText>
                  </View>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
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
  weekToggle: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  weekButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  daySelector: {
    marginBottom: Spacing.lg,
  },
  daySelectorContent: {
    gap: Spacing.sm,
  },
  dayButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontWeight: "600",
  },
  dayTitle: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["4xl"],
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  emptyText: {
    opacity: 0.7,
  },
  lessonsList: {
    gap: Spacing.md,
  },
  lessonCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    alignItems: "center",
    gap: Spacing.md,
  },
  lessonTime: {
    alignItems: "center",
    width: 50,
  },
  timeText: {
    fontWeight: "600",
  },
  lessonDivider: {
    width: 1,
    height: "100%",
    backgroundColor: Colors.light.border,
    marginHorizontal: Spacing.sm,
  },
  lessonInfo: {
    flex: 1,
  },
  subjectText: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  lessonDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  lessonNumber: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.yellowLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
