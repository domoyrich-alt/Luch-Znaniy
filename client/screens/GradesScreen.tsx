import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useStars } from "@/context/StarsContext";

const { width } = Dimensions.get("window");

// НЕОНОВЫЕ ЦВЕТА
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
};

// Цвета для оценок
const GRADE_COLORS: Record<number, { bg: string; text: string }> = {
  5: { bg: '#22C55E20', text: '#22C55E' },
  4: { bg: '#3B82F620', text: '#3B82F6' },
  3: { bg: '#F59E0B20', text: '#F59E0B' },
  2: { bg: '#EF444420', text: '#EF4444' },
};

// Звёзды за оценки
const STARS_FOR_GRADE: Record<number, number> = { 5: 10, 4: 5, 3: 2, 2: 0 };

// Моковые данные оценок
const SUBJECTS_GRADES = [
  { id: 1, name: "Математика", emoji: "📐", grades: [5, 4, 5, 5, 4, 5, 3, 5, 4, 5], teacher: "Иванова А.П." },
  { id: 2, name: "Русский язык", emoji: "📝", grades: [4, 4, 5, 4, 4, 3, 4, 5, 4, 4], teacher: "Петрова М.И." },
  { id: 3, name: "Литература", emoji: "📚", grades: [5, 5, 5, 4, 5, 5, 5, 4, 5, 5], teacher: "Петрова М.И." },
  { id: 4, name: "История", emoji: "🏛️", grades: [4, 5, 4, 4, 5, 4, 4, 5, 4, 4], teacher: "Сидоров В.А." },
  { id: 5, name: "Физика", emoji: "⚡", grades: [5, 4, 4, 5, 4, 5, 4, 4, 5, 4], teacher: "Козлов Д.Н." },
  { id: 6, name: "Химия", emoji: "🧪", grades: [4, 3, 4, 4, 5, 4, 3, 4, 4, 4], teacher: "Новикова Е.С." },
  { id: 7, name: "Биология", emoji: "🌿", grades: [5, 5, 4, 5, 5, 4, 5, 5, 4, 5], teacher: "Волкова Т.И." },
  { id: 8, name: "География", emoji: "🌍", grades: [4, 4, 5, 4, 4, 5, 4, 4, 5, 4], teacher: "Морозов А.С." },
];

const calculateAverage = (grades: number[]) => grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
const getQuarterGrade = (avg: number) => avg >= 4.5 ? 5 : avg >= 3.5 ? 4 : avg >= 2.5 ? 3 : 2;

const GradeBadge = ({ grade, large }: { grade: number; large?: boolean }) => {
  const c = GRADE_COLORS[grade] || GRADE_COLORS[3];
  return (
    <View style={[styles.gradeBadge, { backgroundColor: c.bg }, large && styles.gradeBadgeLarge]}>
      <ThemedText style={[styles.gradeText, { color: c.text }, large && styles.gradeTextLarge]}>{grade}</ThemedText>
    </View>
  );
};

const SubjectCard = ({ subject }: { subject: typeof SUBJECTS_GRADES[0] }) => {
  const avg = calculateAverage(subject.grades);
  const qGrade = getQuarterGrade(avg);
  
  return (
    <View style={styles.subjectCard}>
      <LinearGradient colors={[NEON.bgCard, NEON.bgSecondary]} style={styles.subjectGradient}>
        <View style={styles.subjectHeader}>
          <View style={styles.subjectInfo}>
            <ThemedText style={styles.subjectEmoji}>{subject.emoji}</ThemedText>
            <View>
              <ThemedText style={styles.subjectName}>{subject.name}</ThemedText>
              <ThemedText style={styles.subjectTeacher}>{subject.teacher}</ThemedText>
            </View>
          </View>
          <View style={styles.quarterBadge}>
            <GradeBadge grade={qGrade} large />
            <ThemedText style={styles.quarterLabel}>Четверть</ThemedText>
          </View>
        </View>
        
        <View style={styles.gradesRow}>
          <ThemedText style={styles.gradesLabel}>Оценки:</ThemedText>
          <View style={styles.gradesContainer}>
            {subject.grades.slice(-6).map((g, i) => <GradeBadge key={i} grade={g} />)}
          </View>
        </View>
        
        <View style={styles.averageRow}>
          <ThemedText style={styles.averageLabel}>Средний балл:</ThemedText>
          <ThemedText style={[styles.averageValue, { color: GRADE_COLORS[qGrade].text }]}>{avg.toFixed(2)}</ThemedText>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function GradesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  
  const allGrades = SUBJECTS_GRADES.flatMap(s => s.grades);
  const totalAvg = calculateAverage(allGrades);
  const fives = allGrades.filter(g => g === 5).length;
  const totalStars = allGrades.reduce((sum, g) => sum + (STARS_FOR_GRADE[g] || 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <LinearGradient colors={[NEON.primary, NEON.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerGradient}>
          <ThemedText style={styles.headerTitle}>📊 Журнал оценок</ThemedText>
        </LinearGradient>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* СТАТИСТИКА */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <LinearGradient colors={[NEON.success + '30', NEON.success + '10']} style={styles.statGradient}>
              <ThemedText style={styles.statValue}>{totalAvg.toFixed(2)}</ThemedText>
              <ThemedText style={styles.statLabel}>Средний балл</ThemedText>
            </LinearGradient>
          </View>
          <View style={styles.statItem}>
            <LinearGradient colors={[NEON.warning + '30', NEON.warning + '10']} style={styles.statGradient}>
              <ThemedText style={styles.statValue}>{fives}</ThemedText>
              <ThemedText style={styles.statLabel}>Пятёрок</ThemedText>
            </LinearGradient>
          </View>
          <View style={styles.statItem}>
            <LinearGradient colors={[NEON.primary + '30', NEON.primary + '10']} style={styles.statGradient}>
              <ThemedText style={styles.statValue}>{totalStars} ⭐</ThemedText>
              <ThemedText style={styles.statLabel}>Заработано</ThemedText>
            </LinearGradient>
          </View>
        </View>
        
        {/* ЧЕТВЕРТИ */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Четверть</ThemedText>
          <View style={styles.quartersRow}>
            {[1, 2, 3, 4].map((q) => (
              <Pressable key={q} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedQuarter(q); }}
                style={[styles.quarterButton, selectedQuarter === q && styles.quarterButtonActive]}>
                <ThemedText style={[styles.quarterButtonText, selectedQuarter === q && styles.quarterButtonTextActive]}>{q} четв.</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* ПРЕДМЕТЫ */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Предметы</ThemedText>
          {SUBJECTS_GRADES.map((s) => <SubjectCard key={s.id} subject={s} />)}
        </View>
        
        {/* ИНФО О ЗВЁЗДАХ */}
        <LinearGradient colors={[NEON.warning + '20', NEON.warning + '05']} style={styles.starsInfo}>
          <ThemedText style={styles.starsInfoTitle}>⭐ Звёзды за оценки</ThemedText>
          <View style={styles.starsInfoRow}>
            <ThemedText style={styles.starsInfoItem}>5 = +10 ⭐</ThemedText>
            <ThemedText style={styles.starsInfoItem}>4 = +5 ⭐</ThemedText>
            <ThemedText style={styles.starsInfoItem}>3 = +2 ⭐</ThemedText>
          </View>
        </LinearGradient>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEON.bgDark },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerGradient: { borderRadius: 16, padding: 16, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  scrollContent: { paddingHorizontal: 16 },
  
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statItem: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  statGradient: { padding: 16, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: NEON.primary + '20' },
  statValue: { fontSize: 20, fontWeight: '700', color: NEON.textPrimary, marginBottom: 4 },
  statLabel: { fontSize: 11, color: NEON.textSecondary },
  
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: NEON.textPrimary, marginBottom: 12 },
  quartersRow: { flexDirection: 'row', gap: 8 },
  quarterButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: NEON.bgCard, alignItems: 'center', borderWidth: 1, borderColor: NEON.bgSecondary },
  quarterButtonActive: { backgroundColor: NEON.primary + '30', borderColor: NEON.primary },
  quarterButtonText: { fontSize: 12, color: NEON.textSecondary, fontWeight: '500' },
  quarterButtonTextActive: { color: NEON.primary, fontWeight: '600' },
  
  subjectCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  subjectGradient: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: NEON.primary + '20' },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subjectInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subjectEmoji: { fontSize: 32 },
  subjectName: { fontSize: 16, fontWeight: '600', color: NEON.textPrimary },
  subjectTeacher: { fontSize: 12, color: NEON.textSecondary, marginTop: 2 },
  quarterBadge: { alignItems: 'center' },
  quarterLabel: { fontSize: 10, color: NEON.textSecondary, marginTop: 4 },
  gradesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  gradesLabel: { fontSize: 12, color: NEON.textSecondary, marginRight: 8 },
  gradesContainer: { flexDirection: 'row', gap: 6 },
  averageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: NEON.bgSecondary },
  averageLabel: { fontSize: 12, color: NEON.textSecondary },
  averageValue: { fontSize: 16, fontWeight: '700' },
  
  gradeBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  gradeBadgeLarge: { width: 44, height: 44, borderRadius: 12 },
  gradeText: { fontSize: 14, fontWeight: '700' },
  gradeTextLarge: { fontSize: 20 },
  
  starsInfo: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: NEON.warning + '30' },
  starsInfoTitle: { fontSize: 14, fontWeight: '600', color: NEON.warning, marginBottom: 8, textAlign: 'center' },
  starsInfoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  starsInfoItem: { fontSize: 12, color: NEON.textSecondary },
});