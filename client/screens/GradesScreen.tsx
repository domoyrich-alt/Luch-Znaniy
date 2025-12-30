import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Dimensions, 
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  Layout,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useStars } from "@/context/StarsContext";
import { apiFetch } from "@/lib/api";

const { width } = Dimensions.get("window");

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

const GRADE_COLORS: Record<number, { bg: string; text: string }> = {
  5: { bg: '#22C55E20', text: '#22C55E' },
  4: { bg: '#3B82F620', text: '#3B82F6' },
  3: { bg: '#F59E0B20', text: '#F59E0B' },
  2: { bg: '#EF444420', text: '#EF4444' },
  1: { bg: '#EF444420', text: '#EF4444' },
};

const STARS_FOR_GRADE: Record<number, number> = { 5: 10, 4: 5, 3: 2, 2: 0, 1: 0 };

const SUBJECT_EMOJIS: Record<string, string> = {
  "Математика": "📐",
  "Алгебра": "📐",
  "Геометрия": "📐",
  "Русский язык": "📝",
  "Литература": "📚",
  "История": "🏛️",
  "Обществознание": "🏛️",
  "Физика": "⚡",
  "Химия": "🧪",
  "Биология": "🌿",
  "География": "🌍",
  "Информатика": "💻",
  "Английский язык": "🇬🇧",
  "Немецкий язык": "🇩🇪",
  "Французский язык": "🇫🇷",
  "Физкультура": "⚽",
  "Музыка": "🎵",
  "ИЗО": "🎨",
  "Технология": "🔧",
  "ОБЖ": "🛡️",
};

const getCurrentSchoolYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return month >= 8 ? year : year - 1;
};

const getQuarterDates = (quarter: number) => {
  const schoolYear = getCurrentSchoolYear();
  const quarters: Record<number, { start: Date; end: Date }> = {
    1: { start: new Date(schoolYear, 8, 1), end: new Date(schoolYear, 10, 1) },
    2: { start: new Date(schoolYear, 10, 1), end: new Date(schoolYear, 11, 31) },
    3: { start: new Date(schoolYear + 1, 0, 10), end: new Date(schoolYear + 1, 2, 25) },
    4: { start: new Date(schoolYear + 1, 3, 1), end: new Date(schoolYear + 1, 4, 31) },
  };
  return quarters[quarter];
};

interface GradeData {
  id: number;
  grade: number;
  date: string;
  comment?: string;
  subjectId: number;
  subjectName?: string;
  teacherFirstName?: string;
  teacherLastName?: string;
}

interface SubjectGrades {
  id: number;
  name: string;
  emoji: string;
  grades: GradeData[];
  teacher: string;
}

const calculateAverage = (grades: GradeData[]) => {
  if (!grades.length) return 0;
  return grades.reduce((sum, g) => sum + g.grade, 0) / grades.length;
};

const getQuarterGrade = (avg: number) => {
  if (avg === 0) return 0;
  if (avg >= 4.5) return 5;
  if (avg >= 3.5) return 4;
  if (avg >= 2.5) return 3;
  return 2;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GradeBadge = ({ grade, large, onPress, date }: { grade: number; large?: boolean; onPress?: () => void; date?: string }) => {
  const c = GRADE_COLORS[grade] || GRADE_COLORS[3];
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[styles.gradeBadge, { backgroundColor: c.bg }, large && styles.gradeBadgeLarge, animatedStyle]}
    >
      <ThemedText style={[styles.gradeText, { color: c.text }, large && styles.gradeTextLarge]}>{grade || '-'}</ThemedText>
    </AnimatedPressable>
  );
};

const SubjectCard = ({ 
  subject, 
  index, 
  onAddGrade 
}: { 
  subject: SubjectGrades; 
  index: number;
  onAddGrade?: (subjectId: number, subjectName: string) => void;
}) => {
  const avg = calculateAverage(subject.grades);
  const qGrade = getQuarterGrade(avg);
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).springify()}
      layout={Layout.springify()}
      style={styles.subjectCard}
    >
      <LinearGradient colors={[NEON.bgCard, NEON.bgSecondary]} style={styles.subjectGradient}>
        <View style={styles.subjectHeader}>
          <View style={styles.subjectInfo}>
            <ThemedText style={styles.subjectEmoji}>{subject.emoji}</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.subjectName}>{subject.name}</ThemedText>
              <ThemedText style={styles.subjectTeacher}>{subject.teacher || 'Учитель не указан'}</ThemedText>
            </View>
          </View>
          <View style={styles.quarterBadge}>
            <GradeBadge grade={qGrade} large />
            <ThemedText style={styles.quarterLabel}>Четверть</ThemedText>
          </View>
        </View>
        
        <View style={styles.gradesRow}>
          <ThemedText style={styles.gradesLabel}>Оценки:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={styles.gradesContainer}>
              {subject.grades.length > 0 ? (
                subject.grades.slice(-8).map((g, i) => (
                  <GradeBadge 
                    key={g.id || i} 
                    grade={g.grade} 
                    date={g.date}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      Alert.alert(
                        `Оценка: ${g.grade}`,
                        `Дата: ${new Date(g.date).toLocaleDateString('ru')}\n${g.comment ? `Комментарий: ${g.comment}` : ''}`
                      );
                    }}
                  />
                ))
              ) : (
                <ThemedText style={{ color: NEON.textSecondary, fontSize: 12 }}>Нет оценок</ThemedText>
              )}
            </View>
          </ScrollView>
          {onAddGrade && (
            <Pressable 
              onPress={() => onAddGrade(subject.id, subject.name)}
              style={styles.addGradeButton}
            >
              <Feather name="plus" size={16} color={NEON.primary} />
            </Pressable>
          )}
        </View>
        
        <View style={styles.averageRow}>
          <ThemedText style={styles.averageLabel}>Средний балл:</ThemedText>
          <ThemedText style={[styles.averageValue, { color: qGrade > 0 ? GRADE_COLORS[qGrade].text : NEON.textSecondary }]}>
            {avg > 0 ? avg.toFixed(2) : '—'}
          </ThemedText>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function GradesScreen() {
  const insets = useSafeAreaInsets();
  const { user, permissions } = useAuth();
  const { stars } = useStars();
  
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const month = new Date().getMonth();
    if (month >= 8 && month <= 10) return 1;
    if (month >= 10 || month === 0) return 2;
    if (month >= 1 && month <= 2) return 3;
    return 4;
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [subjects, setSubjects] = useState<SubjectGrades[]>([]);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');
  const [newGrade, setNewGrade] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  
  const isTeacher = user?.role === 'teacher' || user?.role === 'director' || user?.role === 'ceo';

  const loadGrades = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await apiFetch(`/api/grades/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data.grades || []);
      }
    } catch (error) {
      console.error('Load grades error:', error);
    }
  }, [user?.id]);

  const loadSubjects = useCallback(async () => {
    if (!user?.classId) return;
    
    try {
      const response = await apiFetch(`/api/subjects/${user.classId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Load subjects error:', error);
    }
    return [];
  }, [user?.classId]);

  const loadStudents = useCallback(async () => {
    if (!isTeacher) return;
    
    try {
      const response = await apiFetch(`/api/users/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Load students error:', error);
    }
  }, [isTeacher]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadGrades(), loadStudents()]);
      const subjectsData = await loadSubjects();
      
      const quarterDates = getQuarterDates(selectedQuarter);
      const filteredGrades = grades.filter(g => {
        const gradeDate = new Date(g.date);
        return gradeDate >= quarterDates.start && gradeDate <= quarterDates.end;
      });
      
      const subjectMap = new Map<number, SubjectGrades>();
      
      if (subjectsData && subjectsData.length > 0) {
        subjectsData.forEach((s: any) => {
          subjectMap.set(s.id, {
            id: s.id,
            name: s.name,
            emoji: SUBJECT_EMOJIS[s.name] || '📖',
            grades: [],
            teacher: s.teacherFirstName ? `${s.teacherFirstName} ${s.teacherLastName || ''}` : '',
          });
        });
      }
      
      filteredGrades.forEach(g => {
        const subjectId = g.subjectId;
        if (subjectMap.has(subjectId)) {
          subjectMap.get(subjectId)!.grades.push(g);
        } else if (g.subjectName) {
          subjectMap.set(subjectId, {
            id: subjectId,
            name: g.subjectName,
            emoji: SUBJECT_EMOJIS[g.subjectName] || '📖',
            grades: [g],
            teacher: g.teacherFirstName ? `${g.teacherFirstName} ${g.teacherLastName || ''}` : '',
          });
        }
      });
      
      setSubjects(Array.from(subjectMap.values()));
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadGrades, loadSubjects, loadStudents, selectedQuarter, grades]);

  useEffect(() => {
    loadData();
  }, [user?.id, selectedQuarter]);

  useEffect(() => {
    if (grades.length > 0) {
      const quarterDates = getQuarterDates(selectedQuarter);
      const filteredGrades = grades.filter(g => {
        const gradeDate = new Date(g.date);
        return gradeDate >= quarterDates.start && gradeDate <= quarterDates.end;
      });
      
      const subjectMap = new Map<number, SubjectGrades>();
      
      filteredGrades.forEach(g => {
        const subjectId = g.subjectId;
        if (subjectMap.has(subjectId)) {
          subjectMap.get(subjectId)!.grades.push(g);
        } else if (g.subjectName) {
          subjectMap.set(subjectId, {
            id: subjectId,
            name: g.subjectName,
            emoji: SUBJECT_EMOJIS[g.subjectName] || '📖',
            grades: [g],
            teacher: g.teacherFirstName ? `${g.teacherFirstName} ${g.teacherLastName || ''}` : '',
          });
        }
      });
      
      setSubjects(Array.from(subjectMap.values()));
    }
  }, [selectedQuarter, grades]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGrades().finally(() => setRefreshing(false));
  };

  const handleAddGrade = (subjectId: number, subjectName: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedSubjectName(subjectName);
    setNewGrade('');
    setNewComment('');
    setSelectedStudentId(null);
    setAddModalVisible(true);
  };

  const submitGrade = async () => {
    if (!selectedSubjectId || !newGrade || !selectedStudentId) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    const gradeNum = parseInt(newGrade);
    if (gradeNum < 1 || gradeNum > 5) {
      Alert.alert('Ошибка', 'Оценка должна быть от 1 до 5');
      return;
    }

    try {
      const response = await apiFetch(`/api/grades`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudentId,
          subjectId: selectedSubjectId,
          grade: gradeNum,
          date: new Date().toISOString().split('T')[0],
          comment: newComment || undefined,
          teacherId: user?.id,
        }),
      });

      if (response.ok) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert('Успешно', 'Оценка добавлена');
        setAddModalVisible(false);
        loadGrades();
      } else {
        Alert.alert('Ошибка', 'Не удалось добавить оценку');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить оценку');
    }
  };

  const allGrades = subjects.flatMap(s => s.grades);
  const totalAvg = allGrades.length > 0 
    ? allGrades.reduce((sum, g) => sum + g.grade, 0) / allGrades.length 
    : 0;
  const fives = allGrades.filter(g => g.grade === 5).length;
  const totalGradesCount = allGrades.length;
  const totalStars = allGrades.reduce((sum, g) => sum + (STARS_FOR_GRADE[g.grade] || 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <LinearGradient colors={[NEON.primary, NEON.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerGradient}>
          <ThemedText style={styles.headerTitle}>📊 Журнал оценок</ThemedText>
        </LinearGradient>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.primary} />
        }
      >
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statsRow}>
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
              <ThemedText style={styles.statValue}>{totalGradesCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Всего оценок</ThemedText>
            </LinearGradient>
          </View>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Четверть</ThemedText>
          <View style={styles.quartersRow}>
            {[1, 2, 3, 4].map((q) => (
              <Pressable 
                key={q} 
                onPress={() => { 
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                  }
                  setSelectedQuarter(q); 
                }}
                style={[styles.quarterButton, selectedQuarter === q && styles.quarterButtonActive]}
              >
                <ThemedText style={[styles.quarterButtonText, selectedQuarter === q && styles.quarterButtonTextActive]}>
                  {q} четв.
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Animated.View>
        
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Предметы</ThemedText>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={NEON.primary} />
              <ThemedText style={{ color: NEON.textSecondary, marginTop: 12 }}>Загрузка оценок...</ThemedText>
            </View>
          ) : subjects.length > 0 ? (
            subjects.map((s, index) => (
              <SubjectCard 
                key={s.id} 
                subject={s} 
                index={index}
                onAddGrade={isTeacher ? handleAddGrade : undefined}
              />
            ))
          ) : (
            <Animated.View entering={FadeInDown} style={styles.emptyState}>
              <ThemedText style={styles.emptyEmoji}>📚</ThemedText>
              <ThemedText style={styles.emptyTitle}>Нет оценок за эту четверть</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Оценки появятся здесь, когда учителя их выставят
              </ThemedText>
            </Animated.View>
          )}
        </View>
        
        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <LinearGradient colors={[NEON.warning + '20', NEON.warning + '05']} style={styles.starsInfo}>
            <ThemedText style={styles.starsInfoTitle}>⭐ Звёзды за оценки</ThemedText>
            <View style={styles.starsInfoRow}>
              <ThemedText style={styles.starsInfoItem}>5 = +10 ⭐</ThemedText>
              <ThemedText style={styles.starsInfoItem}>4 = +5 ⭐</ThemedText>
              <ThemedText style={styles.starsInfoItem}>3 = +2 ⭐</ThemedText>
            </View>
            <ThemedText style={[styles.starsInfoItem, { textAlign: 'center', marginTop: 8 }]}>
              За эту четверть заработано: {totalStars} ⭐
            </ThemedText>
          </LinearGradient>
        </Animated.View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Добавить оценку</ThemedText>
              <Pressable onPress={() => setAddModalVisible(false)}>
                <Feather name="x" size={24} color={NEON.textSecondary} />
              </Pressable>
            </View>

            <ThemedText style={styles.modalLabel}>Предмет: {selectedSubjectName}</ThemedText>

            <ThemedText style={styles.modalLabel}>Ученик:</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.studentsScroll}>
              {students.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setSelectedStudentId(s.id)}
                  style={[
                    styles.studentChip,
                    selectedStudentId === s.id && styles.studentChipActive,
                  ]}
                >
                  <ThemedText style={[
                    styles.studentChipText,
                    selectedStudentId === s.id && styles.studentChipTextActive,
                  ]}>
                    {s.firstName} {s.lastName}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <ThemedText style={styles.modalLabel}>Оценка:</ThemedText>
            <View style={styles.gradeButtons}>
              {[5, 4, 3, 2].map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setNewGrade(String(g))}
                  style={[
                    styles.gradeButton,
                    { backgroundColor: GRADE_COLORS[g].bg },
                    newGrade === String(g) && { borderColor: GRADE_COLORS[g].text, borderWidth: 2 },
                  ]}
                >
                  <ThemedText style={[styles.gradeButtonText, { color: GRADE_COLORS[g].text }]}>
                    {g}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText style={styles.modalLabel}>Комментарий (необязательно):</ThemedText>
            <TextInput
              style={styles.commentInput}
              placeholder="Комментарий к оценке..."
              placeholderTextColor={NEON.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />

            <Pressable onPress={submitGrade} style={styles.submitButton}>
              <LinearGradient colors={[NEON.primary, NEON.accent]} style={styles.submitGradient}>
                <ThemedText style={styles.submitText}>Добавить оценку</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  subjectInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
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
  
  addGradeButton: { 
    width: 28, 
    height: 28, 
    borderRadius: 8, 
    backgroundColor: NEON.primary + '20', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginLeft: 8,
  },
  
  starsInfo: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: NEON.warning + '30' },
  starsInfoTitle: { fontSize: 14, fontWeight: '600', color: NEON.warning, marginBottom: 8, textAlign: 'center' },
  starsInfoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  starsInfoItem: { fontSize: 12, color: NEON.textSecondary },
  
  loadingContainer: { padding: 40, alignItems: 'center' },
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: NEON.textPrimary, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: NEON.textSecondary, textAlign: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: NEON.bgCard, borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: NEON.textPrimary },
  modalLabel: { fontSize: 14, color: NEON.textSecondary, marginBottom: 8, marginTop: 12 },
  
  studentsScroll: { marginBottom: 8 },
  studentChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 16, 
    backgroundColor: NEON.bgSecondary, 
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  studentChipActive: { backgroundColor: NEON.primary + '30', borderColor: NEON.primary },
  studentChipText: { fontSize: 13, color: NEON.textSecondary },
  studentChipTextActive: { color: NEON.primary, fontWeight: '600' },
  
  gradeButtons: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gradeButton: { 
    flex: 1, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gradeButtonText: { fontSize: 20, fontWeight: '700' },
  
  commentInput: { 
    backgroundColor: NEON.bgSecondary, 
    borderRadius: 12, 
    padding: 12, 
    color: NEON.textPrimary,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  
  submitButton: { marginTop: 20, borderRadius: 12, overflow: 'hidden' },
  submitGradient: { padding: 16, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
