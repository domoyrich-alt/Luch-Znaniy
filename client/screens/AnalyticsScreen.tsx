import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

const { width } = Dimensions.get("window");

type Period = "week" | "month" | "quarter" | "year";

export default function AnalyticsScreen() {
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { grades, homework, averageGrade } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("month");

  // Вычисляем реальную аналитику (ИСПРАВЛЕНО)
  const totalGrades = grades.length;
  const excellentGrades = grades.filter((g:  any) => g.value >= 4.5).length;
  const goodGrades = grades.filter((g: any) => g.value >= 3.5 && g.value < 4.5).length;
  const satisfactoryGrades = grades.filter((g: any) => g.value >= 2.5 && g. value < 3.5).length;
  const unsatisfactoryGrades = grades.filter((g: any) => g.value < 2.5).length;

  const homeworkCompleted = homework.filter((hw: any) => hw.isCompleted === true).length;
  const homeworkPending = homework.filter((hw: any) => hw.isCompleted === false).length;
  const homeworkOverdue = 0; // Заглушка

  const completionRate = homework.length > 0 ? Math.round((homeworkCompleted / homework.length) * 100) : 0;
  const attendanceRate = 87; // Моковые данные
  
  const periods = [
    { key: "week" as Period, label: "Неделя" },
    { key: "month" as Period, label: "Месяц" },
    { key: "quarter" as Period, label: "Четверть" },
    { key: "year" as Period, label: "Год" },
  ];

  const subjects = [
    { name: "Математика", grade: 4.2, trend: "up", color: "#FF6B6B" },
    { name: "Русский язык", grade: 4.5, trend: "up", color:  "#4ECDC4" },
    { name: "История", grade: 3.8, trend: "down", color: "#45B7D1" },
    { name: "Физика", grade: 4.0, trend: "stable", color: "#96CEB4" },
    { name: "Химия", grade: 3.9, trend: "up", color: "#FFEAA7" },
    { name:  "Биология", grade: 4.3, trend: "up", color: "#DDA0DD" },
  ];

  const achievements = [
    { title: "Отличник месяца", description: "Средний балл выше 4.5", achieved: averageGrade >= 4.5, progress: Math.min(100, (averageGrade / 4.5) * 100) },
    { title: "Исполнительный", description: "Все домашние задания сданы вовремя", achieved: completionRate >= 90, progress: completionRate },
    { title:  "Активный участник", description: "Участие в школьных мероприятиях", achieved:  false, progress: 60 },
    { title: "Лидер класса", description: "Входит в топ-5 по успеваемости", achieved: false, progress: 75 },
  ];

  const renderProgressBar = (progress: number, color: string) => (
    <View style={[styles.progressBar, { backgroundColor: color + "20" }]}>
      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop:  headerHeight + Spacing.xl, paddingBottom: Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Период */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <Pressable
              key={period.key}
              onPress={() => setSelectedPeriod(period.key)}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period.key ? theme.primary : theme.backgroundSecondary,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{ 
                  color: selectedPeriod === period.key ? "#FFFFFF" : theme.text,
                  fontWeight: "600" 
                }}
              >
                {period.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Основные показатели */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: Colors.light.primary + "20" }]}>
              <Feather name="trending-up" size={24} color={Colors.light.primary} />
            </View>
            <ThemedText type="h2" style={{ color: Colors.light.primary }}>
              {averageGrade.toFixed(1)}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Средний балл
            </ThemedText>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: Colors. light.success + "20" }]}>
              <Feather name="check-circle" size={24} color={Colors.light.success} />
            </View>
            <ThemedText type="h2" style={{ color: Colors.light. success }}>
              {completionRate}%
            </ThemedText>
            <ThemedText type="caption" style={{ color:  theme.textSecondary }}>
              Выполнение ДЗ
            </ThemedText>
          </Card>

          <Card style={styles. metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: Colors.light. warning + "20" }]}>
              <Feather name="calendar" size={24} color={Colors.light.warning} />
            </View>
            <ThemedText type="h2" style={{ color: Colors.light.warning }}>
              {attendanceRate}%
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Посещаемость
            </ThemedText>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: Colors.light.error + "20" }]}>
              <Feather name="book" size={24} color={Colors.light.error} />
            </View>
            <ThemedText type="h2" style={{ color: Colors.light.error }}>
              {totalGrades}
            </ThemedText>
            <ThemedText type="caption" style={{ color:  theme.textSecondary }}>
              Всего оценок
            </ThemedText>
          </Card>
        </View>

        {/* Распределение оценок */}
        <Card style={styles.chartCard}>
          <ThemedText type="h4" style={styles.cardTitle}>Распределение оценок</ThemedText>
          <View style={styles.gradeDistribution}>
            <View style={styles.gradeItem}>
              <View style={[styles.gradeDot, { backgroundColor: Colors.light.success }]} />
              <ThemedText type="small">Отлично:  {excellentGrades}</ThemedText>
            </View>
            <View style={styles.gradeItem}>
              <View style={[styles.gradeDot, { backgroundColor: Colors.light.primary }]} />
              <ThemedText type="small">Хорошо: {goodGrades}</ThemedText>
            </View>
            <View style={styles.gradeItem}>
              <View style={[styles.gradeDot, { backgroundColor: Colors.light.warning }]} />
              <ThemedText type="small">Удовлетв.: {satisfactoryGrades}</ThemedText>
            </View>
            <View style={styles.gradeItem}>
              <View style={[styles.gradeDot, { backgroundColor: Colors.light.error }]} />
              <ThemedText type="small">Неудовлетв.: {unsatisfactoryGrades}</ThemedText>
            </View>
          </View>
        </Card>

        {/* Предметы */}
        <Card style={styles.subjectsCard}>
          <ThemedText type="h4" style={styles.cardTitle}>Успеваемость по предметам</ThemedText>
          {subjects.map((subject, index) => (
            <View key={index} style={styles. subjectRow}>
              <View style={styles.subjectInfo}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {subject.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme. textSecondary }}>
                  {subject.grade. toFixed(1)}
                </ThemedText>
              </View>
              {renderProgressBar((subject.grade / 5) * 100, subject.color)}
              <Feather 
                name={subject.trend === "up" ?  "trending-up" : subject.trend === "down" ? "trending-down" : "minus"} 
                size={16} 
                color={subject.trend === "up" ? Colors.light.success : subject.trend === "down" ? Colors.light.error : theme.textSecondary} 
              />
            </View>
          ))}
        </Card>

        {/* Достижения */}
        <Card style={styles.achievementsCard}>
          <ThemedText type="h4" style={styles.cardTitle}>Достижения</ThemedText>
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementRow}>
              <View style={[
                styles.achievementIcon,
                { backgroundColor: achievement.achieved ?  Colors.light.success + "20" : theme.backgroundSecondary }
              ]}>
                <Feather 
                  name={achievement.achieved ? "check" : "clock"} 
                  size={16} 
                  color={achievement.achieved ? Colors.light.success : theme.textSecondary} 
                />
              </View>
              <View style={styles.achievementInfo}>
                <ThemedText type="body" style={{ fontWeight:  "600" }}>
                  {achievement.title}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {achievement.description}
                </ThemedText>
                {renderProgressBar(achievement.progress, achievement.achieved ? Colors.light.success : Colors.light.primary)}
              </View>
            </View>
          ))}
        </Card>

        {/* Рекомендации */}
        <Card style={styles.recommendationsCard}>
          <ThemedText type="h4" style={styles. cardTitle}>Рекомендации</ThemedText>
          <View style={styles.recommendation}>
            <Feather name="info" size={16} color={Colors.light.primary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1 }}>
              Обратите внимание на историю - оценка снизилась.  Рекомендуем дополнительные занятия.
            </ThemedText>
          </View>
          <View style={styles. recommendation}>
            <Feather name="star" size={16} color={Colors.light.success} />
            <ThemedText type="small" style={{ color:  theme.textSecondary, flex: 1 }}>
              Отличные результаты по русскому языку!  Продолжайте в том же духе.
            </ThemedText>
          </View>
        </Card>
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
  periodSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  periodButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical:  Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  metricsGrid:  {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    width: "47%",
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  chartCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom:  Spacing.lg,
  },
  gradeDistribution:  {
    gap: Spacing.md,
  },
  gradeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  gradeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subjectsCard:  {
    padding: Spacing. lg,
    marginBottom: Spacing.lg,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  subjectInfo: {
    width: 120,
  },
  progressBar: {
    flex: 1,
    height:  8,
    borderRadius:  4,
    overflow: "hidden",
  },
  progressFill: {
    height:  "100%",
    borderRadius: 4,
  },
  achievementsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  achievementRow: {
    flexDirection:  "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  recommendationsCard: {
    padding:  Spacing.lg,
  },
  recommendation: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});