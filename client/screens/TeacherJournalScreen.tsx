import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";

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

// Моковые данные классов
const CLASSES = [
  { id: 1, name: "1А", grade: 1, students: 25 },
  { id: 2, name: "1Б", grade: 1, students: 24 },
  { id: 3, name: "2А", grade: 2, students: 26 },
  { id: 4, name: "3А", grade: 3, students: 28 },
  { id: 5, name: "4А", grade: 4, students: 27 },
  { id: 6, name: "5А", grade: 5, students: 30 },
  { id: 7, name: "6А", grade: 6, students: 29 },
  { id: 8, name: "7А", grade: 7, students: 28 },
  { id: 9, name: "8А", grade: 8, students: 27 },
  { id: 10, name: "9А", grade: 9, students: 26 },
  { id: 11, name: "10А", grade: 10, students: 25 },
  { id: 12, name: "11А", grade: 11, students: 24 },
];

// Моковые ученики с датами оценок
interface GradeEntry {
  value: number;
  date: string;
  id: number;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  grades: GradeEntry[];
}

const STUDENTS: Record<number, Student[]> = {
  10: [
    { id: 1, firstName: "Саидакбар", lastName: "Зокиров", grades: [
      { id: 1, value: 5, date: "2025-12-15" },
      { id: 2, value: 4, date: "2025-12-17" },
      { id: 3, value: 5, date: "2025-12-19" },
    ]},
    { id: 2, firstName: "Анна", lastName: "Петрова", grades: [
      { id: 4, value: 5, date: "2025-12-15" },
      { id: 5, value: 5, date: "2025-12-18" },
    ]},
    { id: 3, firstName: "Максим", lastName: "Иванов", grades: [
      { id: 6, value: 4, date: "2025-12-16" },
      { id: 7, value: 4, date: "2025-12-19" },
    ]},
    { id: 4, firstName: "Ольга", lastName: "Сидорова", grades: [
      { id: 8, value: 5, date: "2025-12-14" },
      { id: 9, value: 5, date: "2025-12-17" },
      { id: 10, value: 5, date: "2025-12-20" },
    ]},
    { id: 5, firstName: "Дмитрий", lastName: "Козлов", grades: [
      { id: 11, value: 3, date: "2025-12-15" },
      { id: 12, value: 4, date: "2025-12-18" },
    ]},
    { id: 6, firstName: "Мария", lastName: "Новикова", grades: [
      { id: 13, value: 4, date: "2025-12-16" },
      { id: 14, value: 5, date: "2025-12-19" },
    ]},
    { id: 7, firstName: "Александр", lastName: "Морозов", grades: [
      { id: 15, value: 5, date: "2025-12-15" },
      { id: 16, value: 4, date: "2025-12-18" },
    ]},
    { id: 8, firstName: "Екатерина", lastName: "Волкова", grades: [
      { id: 17, value: 4, date: "2025-12-14" },
      { id: 18, value: 4, date: "2025-12-17" },
    ]},
  ],
};

// Заполним остальные классы
for (let i = 1; i <= 12; i++) {
  if (!STUDENTS[i]) {
    STUDENTS[i] = [
      { id: 1, firstName: "Ученик", lastName: "Первый", grades: [
        { id: 100 + i * 10, value: 5, date: "2025-12-15" },
        { id: 101 + i * 10, value: 4, date: "2025-12-18" },
      ]},
      { id: 2, firstName: "Ученик", lastName: "Второй", grades: [
        { id: 102 + i * 10, value: 4, date: "2025-12-16" },
      ]},
      { id: 3, firstName: "Ученик", lastName: "Третий", grades: [
        { id: 103 + i * 10, value: 5, date: "2025-12-17" },
        { id: 104 + i * 10, value: 5, date: "2025-12-19" },
      ]},
    ];
  }
}

const GradeBadge = ({ grade, date, onPress, onLongPress }: { grade: number; date?: string; onPress?: () => void; onLongPress?: () => void }) => {
  const c = GRADE_COLORS[grade] || GRADE_COLORS[3];
  const formatDate = (d: string) => {
    const parts = d.split('-');
    return `${parts[2]}.${parts[1]}`;
  };
  
  return (
    <Pressable 
      onPress={onPress} 
      onLongPress={onLongPress}
      delayLongPress={300}
      style={[styles.gradeBadge, { backgroundColor: c.bg }]}
    >
      <ThemedText style={[styles.gradeText, { color: c.text }]}>{grade}</ThemedText>
      {date && <ThemedText style={[styles.gradeDateText, { color: c.text }]}>{formatDate(date)}</ThemedText>}
    </Pressable>
  );
};

export default function TeacherJournalScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<typeof CLASSES[0] | null>(null);
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);
  const [editGradeModal, setEditGradeModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedGradeEntry, setSelectedGradeEntry] = useState<GradeEntry | null>(null);
  
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [students, setStudents] = useState(STUDENTS);
  
  const filteredClasses = selectedGrade 
    ? CLASSES.filter(c => c.grade === selectedGrade)
    : CLASSES;
  
  const currentStudents = selectedClass ? students[selectedClass.id] || [] : [];
  
  const handleAddStudent = () => {
    if (!newFirstName.trim() || !newLastName.trim() || !selectedClass) {
      Alert.alert("Ошибка", "Заполните имя и фамилию");
      return;
    }
    
    const newStudent: Student = {
      id: Date.now(),
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      grades: [],
    };
    
    setStudents(prev => ({
      ...prev,
      [selectedClass.id]: [...(prev[selectedClass.id] || []), newStudent],
    }));
    
    setNewFirstName("");
    setNewLastName("");
    setAddStudentModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Успех", `${newFirstName} ${newLastName} добавлен в класс ${selectedClass.name}`);
  };
  
  const handleSetGrade = (grade: number) => {
    if (!selectedStudent || !selectedClass) return;
    
    const today = new Date().toISOString().split('T')[0];
    const newGradeEntry: GradeEntry = {
      id: Date.now(),
      value: grade,
      date: today,
    };
    
    setStudents(prev => ({
      ...prev,
      [selectedClass.id]: prev[selectedClass.id].map(s => 
        s.id === selectedStudent.id 
          ? { ...s, grades: [...s.grades, newGradeEntry] }
          : s
      ),
    }));
    
    setGradeModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  const handleEditGrade = (newValue: number) => {
    if (!selectedStudent || !selectedClass || !selectedGradeEntry) return;
    
    setStudents(prev => ({
      ...prev,
      [selectedClass.id]: prev[selectedClass.id].map(s => 
        s.id === selectedStudent.id 
          ? { 
              ...s, 
              grades: s.grades.map(g => 
                g.id === selectedGradeEntry.id ? { ...g, value: newValue } : g
              )
            }
          : s
      ),
    }));
    
    setEditGradeModal(false);
    setSelectedGradeEntry(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  const handleDeleteGrade = () => {
    if (!selectedStudent || !selectedClass || !selectedGradeEntry) return;
    
    Alert.alert(
      "Удалить оценку?",
      `Удалить оценку ${selectedGradeEntry.value} от ${selectedGradeEntry.date}?`,
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Удалить", 
          style: "destructive",
          onPress: () => {
            setStudents(prev => ({
              ...prev,
              [selectedClass.id]: prev[selectedClass.id].map(s => 
                s.id === selectedStudent.id 
                  ? { ...s, grades: s.grades.filter(g => g.id !== selectedGradeEntry.id) }
                  : s
              ),
            }));
            setEditGradeModal(false);
            setSelectedGradeEntry(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        },
      ]
    );
  };
  
  const handleGradeLongPress = (student: Student, gradeEntry: GradeEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedStudent(student);
    setSelectedGradeEntry(gradeEntry);
    setEditGradeModal(true);
  };
  
  const calculateAvg = (grades: GradeEntry[]) => 
    grades.length ? (grades.reduce((a, b) => a + b.value, 0) / grades.length).toFixed(1) : "-";

  // Экран выбора параллели
  if (!selectedGrade) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <LinearGradient colors={[NEON.primary, NEON.secondary]} style={styles.headerGradient}>
            <ThemedText style={styles.headerTitle}>📚 Журнал учителя</ThemedText>
          </LinearGradient>
        </View>
        
        <ScrollView contentContainerStyle={styles.gradesGrid}>
          <ThemedText style={styles.sectionTitle}>Выберите параллель</ThemedText>
          <View style={styles.gradesRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
              <Pressable
                key={g}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSelectedGrade(g); }}
                style={styles.gradeButton}
              >
                <LinearGradient colors={[NEON.primary, NEON.accent]} style={styles.gradeButtonGradient}>
                  <ThemedText style={styles.gradeButtonText}>{g}</ThemedText>
                  <ThemedText style={styles.gradeButtonLabel}>класс</ThemedText>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }
  
  // Экран списка классов
  if (!selectedClass) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => setSelectedGrade(null)} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={NEON.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitleSmall}>{selectedGrade} классы</ThemedText>
        </View>
        
        <ScrollView contentContainerStyle={styles.classesGrid}>
          {filteredClasses.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSelectedClass(c); }}
              style={styles.classCard}
            >
              <LinearGradient colors={[NEON.bgCard, NEON.bgSecondary]} style={styles.classGradient}>
                <ThemedText style={styles.className}>{c.name}</ThemedText>
                <ThemedText style={styles.classStudents}>{c.students} учеников</ThemedText>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }
  
  // Экран списка учеников
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => setSelectedClass(null)} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={NEON.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitleSmall}>Класс {selectedClass.name}</ThemedText>
        <Pressable onPress={() => setAddStudentModal(true)} style={styles.addButton}>
          <LinearGradient colors={[NEON.success, NEON.secondary]} style={styles.addButtonGradient}>
            <Feather name="plus" size={20} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </View>
      
      <FlatList
        data={currentStudents}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.studentsList}
        renderItem={({ item, index }) => (
          <Pressable 
            onPress={() => { setSelectedStudent(item); setGradeModal(true); }}
            style={styles.studentCard}
          >
            <LinearGradient colors={[NEON.bgCard, NEON.bgSecondary]} style={styles.studentGradient}>
              <View style={styles.studentInfo}>
                <View style={styles.studentNumber}>
                  <ThemedText style={styles.studentNumberText}>{index + 1}</ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.studentName}>{item.lastName} {item.firstName}</ThemedText>
                  <ThemedText style={styles.studentAvg}>Средний: {calculateAvg(item.grades)}</ThemedText>
                </View>
              </View>
              <View style={styles.studentGrades}>
                {item.grades.slice(-5).map((g) => (
                  <GradeBadge 
                    key={g.id} 
                    grade={g.value} 
                    date={g.date}
                    onLongPress={() => handleGradeLongPress(item, g)}
                  />
                ))}
                <View style={styles.addGradeButton}>
                  <Feather name="plus" size={16} color={NEON.primary} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        )}
      />
      
      {/* Модалка добавления ученика */}
      <Modal visible={addStudentModal} transparent animationType="slide">
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Добавить ученика</ThemedText>
              <Pressable onPress={() => setAddStudentModal(false)}>
                <Feather name="x" size={24} color={NEON.textPrimary} />
              </Pressable>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Имя"
              placeholderTextColor={NEON.textSecondary}
              value={newFirstName}
              onChangeText={setNewFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Фамилия"
              placeholderTextColor={NEON.textSecondary}
              value={newLastName}
              onChangeText={setNewLastName}
            />
            
            <Pressable onPress={handleAddStudent} style={styles.saveButton}>
              <LinearGradient colors={[NEON.success, NEON.secondary]} style={styles.saveGradient}>
                <Feather name="check" size={20} color="#FFF" />
                <ThemedText style={styles.saveText}>Добавить</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </BlurView>
      </Modal>
      
      {/* Модалка выставления оценки */}
      <Modal visible={gradeModal} transparent animationType="slide">
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Оценка для {selectedStudent?.lastName} {selectedStudent?.firstName}
              </ThemedText>
              <Pressable onPress={() => setGradeModal(false)}>
                <Feather name="x" size={24} color={NEON.textPrimary} />
              </Pressable>
            </View>
            
            <View style={styles.gradeButtons}>
              {[5, 4, 3, 2].map((g) => {
                const c = GRADE_COLORS[g];
                return (
                  <Pressable
                    key={g}
                    onPress={() => handleSetGrade(g)}
                    style={[styles.gradeSelectButton, { borderColor: c.text }]}
                  >
                    <ThemedText style={[styles.gradeSelectText, { color: c.text }]}>{g}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </BlurView>
      </Modal>
      
      {/* Модалка редактирования оценки */}
      <Modal visible={editGradeModal} transparent animationType="slide">
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Редактировать оценку
              </ThemedText>
              <Pressable onPress={() => { setEditGradeModal(false); setSelectedGradeEntry(null); }}>
                <Feather name="x" size={24} color={NEON.textPrimary} />
              </Pressable>
            </View>
            
            {selectedGradeEntry && (
              <View style={styles.editGradeInfo}>
                <ThemedText style={styles.editGradeText}>
                  Текущая оценка: <ThemedText style={{ color: GRADE_COLORS[selectedGradeEntry.value]?.text }}>{selectedGradeEntry.value}</ThemedText>
                </ThemedText>
                <ThemedText style={styles.editGradeDate}>
                  Дата: {selectedGradeEntry.date}
                </ThemedText>
                <ThemedText style={styles.editGradeStudent}>
                  Ученик: {selectedStudent?.lastName} {selectedStudent?.firstName}
                </ThemedText>
              </View>
            )}
            
            <ThemedText style={styles.editGradeLabel}>Изменить на:</ThemedText>
            
            <View style={styles.gradeButtons}>
              {[5, 4, 3, 2].map((g) => {
                const c = GRADE_COLORS[g];
                const isSelected = selectedGradeEntry?.value === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => handleEditGrade(g)}
                    style={[
                      styles.gradeSelectButton, 
                      { borderColor: c.text },
                      isSelected && { backgroundColor: c.bg }
                    ]}
                  >
                    <ThemedText style={[styles.gradeSelectText, { color: c.text }]}>{g}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
            
            <Pressable onPress={handleDeleteGrade} style={styles.deleteButton}>
              <Feather name="trash-2" size={18} color={NEON.error} />
              <ThemedText style={styles.deleteButtonText}>Удалить оценку</ThemedText>
            </Pressable>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEON.bgDark },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  headerGradient: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerTitleSmall: { fontSize: 18, fontWeight: '600', color: NEON.textPrimary, flex: 1 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: NEON.bgCard, alignItems: 'center', justifyContent: 'center' },
  addButton: { borderRadius: 22, overflow: 'hidden' },
  addButtonGradient: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  
  sectionTitle: { fontSize: 16, fontWeight: '600', color: NEON.textPrimary, marginBottom: 16, paddingHorizontal: 16 },
  
  gradesGrid: { padding: 16 },
  gradesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  gradeButton: { width: 80, height: 80, borderRadius: 16, overflow: 'hidden' },
  gradeButtonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gradeButtonText: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  gradeButtonLabel: { fontSize: 12, color: '#FFF', opacity: 0.8 },
  
  classesGrid: { padding: 16 },
  classCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  classGradient: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: NEON.primary + '30' },
  className: { fontSize: 24, fontWeight: '700', color: NEON.textPrimary },
  classStudents: { fontSize: 14, color: NEON.textSecondary, marginTop: 4 },
  
  studentsList: { padding: 16 },
  studentCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  studentGradient: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: NEON.primary + '20' },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  studentNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: NEON.primary + '30', alignItems: 'center', justifyContent: 'center' },
  studentNumberText: { fontSize: 14, fontWeight: '600', color: NEON.primary },
  studentName: { fontSize: 16, fontWeight: '600', color: NEON.textPrimary },
  studentAvg: { fontSize: 12, color: NEON.textSecondary, marginTop: 2 },
  studentGrades: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addGradeButton: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: NEON.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  
  gradeBadge: { minWidth: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  gradeText: { fontSize: 14, fontWeight: '700' },
  gradeDateText: { fontSize: 8, opacity: 0.8, marginTop: -2 },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: NEON.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: NEON.textPrimary },
  
  input: { backgroundColor: NEON.bgSecondary, borderRadius: 12, padding: 16, fontSize: 16, color: NEON.textPrimary, marginBottom: 12, borderWidth: 1, borderColor: NEON.primary + '30' },
  
  saveButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  saveText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  
  gradeButtons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20 },
  gradeSelectButton: { width: 64, height: 64, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: NEON.bgSecondary },
  gradeSelectText: { fontSize: 28, fontWeight: '700' },
  
  editGradeInfo: { backgroundColor: NEON.bgSecondary, borderRadius: 12, padding: 16, marginBottom: 16 },
  editGradeText: { fontSize: 16, color: NEON.textPrimary, marginBottom: 4 },
  editGradeDate: { fontSize: 14, color: NEON.textSecondary, marginBottom: 4 },
  editGradeStudent: { fontSize: 14, color: NEON.textSecondary },
  editGradeLabel: { fontSize: 14, color: NEON.textSecondary, marginBottom: 8, textAlign: 'center' },
  
  deleteButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    marginTop: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: NEON.error + '40',
    gap: 8,
  },
  deleteButtonText: { fontSize: 14, fontWeight: '600', color: NEON.error },
});
