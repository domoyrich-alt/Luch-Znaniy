import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, GradeColors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function GradesScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { grades } = useApp();

  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const subjects = Array.from(new Set(grades.map((g) => g.subject)));

  const getSubjectGrades = (subject: string) =>
    grades.filter((g) => g.subject === subject);

  const getSubjectAverage = (subject: string) => {
    const subjectGrades = getSubjectGrades(subject);
    if (subjectGrades.length === 0) return 0;
    return subjectGrades.reduce((acc, g) => acc + g.value, 0) / subjectGrades.length;
  };

  const getGradeColor = (value: number) => {
    if (value >= 4.5) return GradeColors.excellent;
    if (value >= 3.5) return GradeColors.good;
    if (value >= 2.5) return GradeColors.average;
    return GradeColors.poor;
  };

  const overallAverage =
    grades.length > 0
      ? (grades.reduce((acc, g) => acc + g.value, 0) / grades.length).toFixed(2)
      : "0.00";

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
        <View style={styles.summaryCard}>
          <View
            style={[
              styles.averageCircle,
              { backgroundColor: getGradeColor(parseFloat(overallAverage)) + "20" },
            ]}
          >
            <ThemedText
              type="h1"
              style={{ color: getGradeColor(parseFloat(overallAverage)) }}
            >
              {overallAverage}
            </ThemedText>
          </View>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Средний балл
          </ThemedText>
          <View style={styles.summaryStats}>
            <View style={styles.statBadge}>
              <ThemedText type="h4" style={{ color: GradeColors.excellent }}>
                {grades.filter((g) => g.value === 5).length}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                пятерок
              </ThemedText>
            </View>
            <View style={styles.statBadge}>
              <ThemedText type="h4" style={{ color: GradeColors.good }}>
                {grades.filter((g) => g.value === 4).length}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                четверок
              </ThemedText>
            </View>
            <View style={styles.statBadge}>
              <ThemedText type="h4" style={{ color: GradeColors.average }}>
                {grades.filter((g) => g.value === 3).length}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                троек
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>
          По предметам
        </ThemedText>

        <View style={styles.subjectsList}>
          {subjects.map((subject) => {
            const avg = getSubjectAverage(subject);
            const subjectGrades = getSubjectGrades(subject);
            const isExpanded = expandedSubject === subject;

            return (
              <Card key={subject} style={styles.subjectCard}>
                <Pressable
                  onPress={() =>
                    setExpandedSubject(isExpanded ? null : subject)
                  }
                  style={styles.subjectHeader}
                >
                  <View style={styles.subjectInfo}>
                    <ThemedText type="body" style={styles.subjectName}>
                      {subject}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {subjectGrades.length} оценок
                    </ThemedText>
                  </View>
                  <View style={styles.subjectRight}>
                    <View
                      style={[
                        styles.averageBadge,
                        { backgroundColor: getGradeColor(avg) + "20" },
                      ]}
                    >
                      <ThemedText
                        type="body"
                        style={{ color: getGradeColor(avg), fontWeight: "700" }}
                      >
                        {avg.toFixed(1)}
                      </ThemedText>
                    </View>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </View>
                </Pressable>

                {isExpanded ? (
                  <View style={styles.gradesExpanded}>
                    {subjectGrades.map((grade) => (
                      <View key={grade.id} style={styles.gradeRow}>
                        <View
                          style={[
                            styles.gradeBadge,
                            { backgroundColor: getGradeColor(grade.value) },
                          ]}
                        >
                          <ThemedText type="body" style={styles.gradeValue}>
                            {grade.value}
                          </ThemedText>
                        </View>
                        <View style={styles.gradeInfo}>
                          <ThemedText type="small">{grade.date}</ThemedText>
                          {grade.comment ? (
                            <ThemedText
                              type="caption"
                              style={{ color: theme.textSecondary }}
                            >
                              {grade.comment}
                            </ThemedText>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
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
  },
  summaryCard: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    padding: Spacing.xl,
  },
  averageCircle: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  summaryStats: {
    flexDirection: "row",
    gap: Spacing["2xl"],
    marginTop: Spacing.lg,
  },
  statBadge: {
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  subjectsList: {
    gap: Spacing.md,
  },
  subjectCard: {
    padding: 0,
    overflow: "hidden",
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  subjectRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  averageBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  gradesExpanded: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  gradeBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeValue: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  gradeInfo: {
    flex: 1,
  },
});
