import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

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

interface HomeworkItem {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  createdAt: string;
  subjectName: string;
  teacherFirstName: string;
  teacherLastName: string;
}

interface HomeworkSubmission {
  submissionId: number;
  content: string | null;
  photoUrl: string | null;
  submittedAt: string;
  grade: number | null;
  feedback: string | null;
  studentId: number;
  studentFirstName: string;
  studentLastName: string;
}

interface Subject {
  id: number;
  name: string;
}

interface ClassItem {
  id: number;
  name: string;
  grade: number;
}

const HomeworkCard = ({ 
  hw, 
  index, 
  isTeacher,
  onPress,
  onDelete
}: { 
  hw: HomeworkItem; 
  index: number; 
  isTeacher: boolean;
  onPress: () => void;
  onDelete: () => void;
}) => {
  const dueDate = new Date(hw.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = dueDate < today;
  const isToday = dueDate.toDateString() === today.toDateString();
  
  const getDueDateColor = () => {
    if (isOverdue) return NEON.error;
    if (isToday) return NEON.warning;
    return NEON.secondary;
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
      <Pressable onPress={onPress} style={styles.homeworkCard}>
        <View style={styles.homeworkHeader}>
          <View style={[styles.subjectBadge, { backgroundColor: NEON.primary + '20' }]}>
            <ThemedText style={styles.subjectBadgeText}>{hw.subjectName}</ThemedText>
          </View>
          <View style={[styles.dueDateBadge, { backgroundColor: getDueDateColor() + '20' }]}>
            <ThemedText style={[styles.dueDateText, { color: getDueDateColor() }]}>
              {isToday ? 'Сегодня' : isOverdue ? 'Просрочено' : dueDate.toLocaleDateString('ru-RU')}
            </ThemedText>
          </View>
        </View>
        
        <ThemedText style={styles.homeworkTitle}>{hw.title}</ThemedText>
        
        {hw.description && (
          <ThemedText style={styles.homeworkDescription} numberOfLines={2}>
            {hw.description}
          </ThemedText>
        )}
        
        <View style={styles.homeworkFooter}>
          <ThemedText style={styles.teacherName}>
            👨‍🏫 {hw.teacherFirstName} {hw.teacherLastName}
          </ThemedText>
          
          {isTeacher && (
            <Pressable 
              onPress={(e) => { e.stopPropagation(); onDelete(); }}
              style={styles.deleteButton}
            >
              <Feather name="trash-2" size={16} color={NEON.error} />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function HomeworkScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  
  // Для создания домашки
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);
  const [newClassId, setNewClassId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  
  // Для просмотра домашки
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Для сдачи домашки (ученик)
  const [submitContent, setSubmitContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isTeacher = user?.role === 'teacher' || user?.role === 'director' || user?.role === 'ceo';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    loadInitialData();
  }, [user?.id]);

  useEffect(() => {
    if (selectedClass) {
      loadHomework(selectedClass);
    }
  }, [selectedClass]);

  const loadInitialData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Загружаем классы
      const classData = await apiGet<ClassItem[]>('/api/classes');
      setClasses(classData || []);
      
      // Если ученик - используем его класс
      if (isStudent && user.classId) {
        setSelectedClass(user.classId);
      } else if (classData && classData.length > 0) {
        setSelectedClass(classData[0].id);
      }
      
      // Загружаем предметы для учителя
      if (isTeacher) {
        const subjectData = await apiGet<Subject[]>('/api/subjects');
        setSubjects(subjectData || []);
      }
    } catch (error) {
      console.error("Load initial data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHomework = async (classId: number) => {
    try {
      const data = await apiGet<HomeworkItem[]>(`/api/homework/class/${classId}`);
      setHomeworkList(data || []);
    } catch (error) {
      console.error("Load homework error:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedClass) {
      await loadHomework(selectedClass);
    }
    setRefreshing(false);
  };

  const handleCreateHomework = async () => {
    if (!newTitle.trim() || !newDueDate.trim() || !newSubjectId || !newClassId || !user?.id) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    setCreating(true);
    try {
      await apiPost('/api/homework', {
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        dueDate: newDueDate,
        subjectId: newSubjectId,
        classId: newClassId,
        teacherId: user.id,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Готово!', 'Домашнее задание создано');
      
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setNewSubjectId(null);
      
      // Обновляем список
      if (selectedClass) {
        loadHomework(selectedClass);
      }
    } catch (error) {
      console.error("Create homework error:", error);
      Alert.alert('Ошибка', 'Не удалось создать задание');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteHomework = async (id: number) => {
    Alert.alert(
      'Удалить задание?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDelete(`/api/homework/${id}`);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (selectedClass) {
                loadHomework(selectedClass);
              }
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить');
            }
          },
        },
      ]
    );
  };

  const handleOpenHomework = async (hw: HomeworkItem) => {
    setSelectedHomework(hw);
    setShowDetailModal(true);
    
    if (isTeacher) {
      setLoadingSubmissions(true);
      try {
        const data = await apiGet<HomeworkSubmission[]>(`/api/homework/${hw.id}/submissions`);
        setSubmissions(data || []);
      } catch (error) {
        console.error("Load submissions error:", error);
      } finally {
        setLoadingSubmissions(false);
      }
    }
  };

  const handleSubmitHomework = async () => {
    if (!selectedHomework || !user?.id) return;
    
    setSubmitting(true);
    try {
      await apiPost(`/api/homework/${selectedHomework.id}/submit`, {
        studentId: user.id,
        content: submitContent.trim() || null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Готово!', 'Задание сдано');
      setShowDetailModal(false);
      setSubmitContent('');
    } catch (error: any) {
      Alert.alert('Ошибка', error?.message || 'Не удалось сдать задание');
    } finally {
      setSubmitting(false);
    }
  };

  // Фильтрация: сначала актуальные, потом просроченные
  const sortedHomework = [...homeworkList].sort((a, b) => {
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isOverdueA = dateA < today;
    const isOverdueB = dateB < today;
    
    if (isOverdueA !== isOverdueB) return isOverdueA ? 1 : -1;
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Pressable 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={NEON.textPrimary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>📝 Домашние задания</ThemedText>
        {isTeacher && (
          <Pressable 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCreateModal(true); }}
            style={styles.addButton}
          >
            <Feather name="plus" size={24} color={NEON.primary} />
          </Pressable>
        )}
        {!isTeacher && <View style={{ width: 40 }} />}
      </Animated.View>

      {/* Class Filter (for teachers) */}
      {isTeacher && classes.length > 0 && (
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.classesContainer}
          >
            {classes.map((cls) => (
              <Pressable
                key={cls.id}
                onPress={() => { Haptics.selectionAsync(); setSelectedClass(cls.id); }}
                style={[styles.classChip, selectedClass === cls.id && styles.classChipActive]}
              >
                <ThemedText style={[styles.classChipText, selectedClass === cls.id && styles.classChipTextActive]}>
                  {cls.grade}{cls.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NEON.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.primary} />
          }
        >
          {sortedHomework.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyEmoji}>📚</ThemedText>
              <ThemedText style={styles.emptyText}>
                {isTeacher ? 'Нет домашних заданий для этого класса' : 'Домашних заданий нет'}
              </ThemedText>
              {isTeacher && (
                <ThemedText style={styles.emptySubtext}>
                  Нажмите + чтобы создать новое задание
                </ThemedText>
              )}
            </View>
          ) : (
            sortedHomework.map((hw, index) => (
              <HomeworkCard 
                key={hw.id} 
                hw={hw} 
                index={index}
                isTeacher={isTeacher}
                onPress={() => handleOpenHomework(hw)}
                onDelete={() => handleDeleteHomework(hw.id)}
              />
            ))
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Create Homework Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={[NEON.bgCard, NEON.bgDark]}
                style={styles.modalGradient}
              >
                <ThemedText style={styles.modalTitle}>➕ Новое задание</ThemedText>
                
                {/* Выбор класса */}
                <ThemedText style={styles.inputLabel}>Класс *</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectRow}>
                  {classes.map((cls) => (
                    <Pressable
                      key={cls.id}
                      onPress={() => setNewClassId(cls.id)}
                      style={[styles.selectChip, newClassId === cls.id && styles.selectChipActive]}
                    >
                      <ThemedText style={[styles.selectChipText, newClassId === cls.id && styles.selectChipTextActive]}>
                        {cls.grade}{cls.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
                
                {/* Выбор предмета */}
                <ThemedText style={styles.inputLabel}>Предмет *</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectRow}>
                  {subjects.map((subj) => (
                    <Pressable
                      key={subj.id}
                      onPress={() => setNewSubjectId(subj.id)}
                      style={[styles.selectChip, newSubjectId === subj.id && styles.selectChipActive]}
                    >
                      <ThemedText style={[styles.selectChipText, newSubjectId === subj.id && styles.selectChipTextActive]}>
                        {subj.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
                
                {/* Название */}
                <ThemedText style={styles.inputLabel}>Название *</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="Например: Упражнение 15"
                  placeholderTextColor={NEON.textSecondary}
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
                
                {/* Описание */}
                <ThemedText style={styles.inputLabel}>Описание</ThemedText>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Подробное описание задания..."
                  placeholderTextColor={NEON.textSecondary}
                  value={newDescription}
                  onChangeText={setNewDescription}
                  multiline
                  numberOfLines={4}
                />
                
                {/* Дата сдачи */}
                <ThemedText style={styles.inputLabel}>Дата сдачи * (ГГГГ-ММ-ДД)</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="2025-01-10"
                  placeholderTextColor={NEON.textSecondary}
                  value={newDueDate}
                  onChangeText={setNewDueDate}
                />
                
                <View style={styles.modalButtons}>
                  <Pressable
                    onPress={() => setShowCreateModal(false)}
                    style={styles.cancelButton}
                  >
                    <ThemedText style={styles.cancelButtonText}>Отмена</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateHomework}
                    disabled={creating}
                    style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                  >
                    <LinearGradient
                      colors={[NEON.primary, NEON.accent]}
                      style={styles.submitButtonGradient}
                    >
                      {creating ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <ThemedText style={styles.submitButtonText}>Создать</ThemedText>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Homework Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={[NEON.bgCard, NEON.bgDark]}
                style={styles.modalGradient}
              >
                <Pressable
                  onPress={() => setShowDetailModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Feather name="x" size={24} color={NEON.textSecondary} />
                </Pressable>
                
                {selectedHomework && (
                  <>
                    <View style={[styles.subjectBadge, { backgroundColor: NEON.primary + '20', alignSelf: 'flex-start' }]}>
                      <ThemedText style={styles.subjectBadgeText}>{selectedHomework.subjectName}</ThemedText>
                    </View>
                    
                    <ThemedText style={styles.detailTitle}>{selectedHomework.title}</ThemedText>
                    
                    {selectedHomework.description && (
                      <ThemedText style={styles.detailDescription}>{selectedHomework.description}</ThemedText>
                    )}
                    
                    <View style={styles.detailMeta}>
                      <ThemedText style={styles.detailMetaText}>
                        📅 До: {new Date(selectedHomework.dueDate).toLocaleDateString('ru-RU')}
                      </ThemedText>
                      <ThemedText style={styles.detailMetaText}>
                        👨‍🏫 {selectedHomework.teacherFirstName} {selectedHomework.teacherLastName}
                      </ThemedText>
                    </View>
                    
                    {/* Для ученика - форма сдачи */}
                    {isStudent && (
                      <View style={styles.submitSection}>
                        <ThemedText style={styles.inputLabel}>Ваш ответ</ThemedText>
                        <TextInput
                          style={[styles.textInput, styles.textArea]}
                          placeholder="Напишите ответ или комментарий..."
                          placeholderTextColor={NEON.textSecondary}
                          value={submitContent}
                          onChangeText={setSubmitContent}
                          multiline
                          numberOfLines={4}
                        />
                        <Pressable
                          onPress={handleSubmitHomework}
                          disabled={submitting}
                          style={[styles.submitHomeworkButton, submitting && styles.submitButtonDisabled]}
                        >
                          <LinearGradient
                            colors={[NEON.success, NEON.secondary]}
                            style={styles.submitButtonGradient}
                          >
                            {submitting ? (
                              <ActivityIndicator color="#FFF" />
                            ) : (
                              <ThemedText style={styles.submitButtonText}>✅ Сдать задание</ThemedText>
                            )}
                          </LinearGradient>
                        </Pressable>
                      </View>
                    )}
                    
                    {/* Для учителя - список сданных работ */}
                    {isTeacher && (
                      <View style={styles.submissionsSection}>
                        <ThemedText style={styles.submissionsTitle}>
                          📋 Сданные работы ({submissions.length})
                        </ThemedText>
                        
                        {loadingSubmissions ? (
                          <ActivityIndicator color={NEON.primary} style={{ marginTop: 20 }} />
                        ) : submissions.length === 0 ? (
                          <ThemedText style={styles.noSubmissions}>Пока никто не сдал</ThemedText>
                        ) : (
                          submissions.map((sub) => (
                            <View key={sub.submissionId} style={styles.submissionCard}>
                              <View style={styles.submissionHeader}>
                                <ThemedText style={styles.submissionStudent}>
                                  {sub.studentFirstName} {sub.studentLastName}
                                </ThemedText>
                                <ThemedText style={styles.submissionDate}>
                                  {new Date(sub.submittedAt).toLocaleDateString('ru-RU')}
                                </ThemedText>
                              </View>
                              {sub.content && (
                                <ThemedText style={styles.submissionContent}>{sub.content}</ThemedText>
                              )}
                              {sub.grade && (
                                <View style={styles.submissionGrade}>
                                  <ThemedText style={styles.submissionGradeText}>
                                    Оценка: {sub.grade}
                                  </ThemedText>
                                </View>
                              )}
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </>
                )}
              </LinearGradient>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEON.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NEON.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NEON.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NEON.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Classes
  classesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: NEON.bgCard,
    marginRight: 8,
    borderWidth: 1,
    borderColor: NEON.bgSecondary,
  },
  classChipActive: {
    backgroundColor: NEON.primary + '30',
    borderColor: NEON.primary,
  },
  classChipText: {
    fontSize: 14,
    color: NEON.textSecondary,
  },
  classChipTextActive: {
    color: NEON.textPrimary,
    fontWeight: '600',
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  
  // Homework Card
  homeworkCard: {
    backgroundColor: NEON.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: NEON.bgSecondary,
  },
  homeworkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectBadgeText: {
    fontSize: 12,
    color: NEON.primary,
    fontWeight: '600',
  },
  dueDateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  homeworkTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginBottom: 6,
  },
  homeworkDescription: {
    fontSize: 13,
    color: NEON.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  homeworkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 12,
    color: NEON.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 16,
    color: NEON.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: NEON.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: NEON.primary + '30',
    borderRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NEON.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  
  // Inputs
  inputLabel: {
    fontSize: 13,
    color: NEON.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: NEON.textPrimary,
    borderWidth: 1,
    borderColor: NEON.bgSecondary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: NEON.bgSecondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectChipActive: {
    borderColor: NEON.primary,
    backgroundColor: NEON.primary + '20',
  },
  selectChipText: {
    fontSize: 13,
    color: NEON.textSecondary,
  },
  selectChipTextActive: {
    color: NEON.textPrimary,
    fontWeight: '600',
  },
  
  // Modal Buttons
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    color: NEON.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '700',
  },
  
  // Detail Modal
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 14,
    color: NEON.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  detailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: NEON.bgSecondary,
  },
  detailMetaText: {
    fontSize: 13,
    color: NEON.textSecondary,
  },
  
  // Submit Section (Student)
  submitSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: NEON.bgSecondary,
  },
  submitHomeworkButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  
  // Submissions Section (Teacher)
  submissionsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: NEON.bgSecondary,
  },
  submissionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginBottom: 12,
  },
  noSubmissions: {
    fontSize: 14,
    color: NEON.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  submissionCard: {
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  submissionStudent: {
    fontSize: 14,
    fontWeight: '600',
    color: NEON.textPrimary,
  },
  submissionDate: {
    fontSize: 12,
    color: NEON.textSecondary,
  },
  submissionContent: {
    fontSize: 13,
    color: NEON.textSecondary,
    lineHeight: 18,
  },
  submissionGrade: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: NEON.bgCard,
  },
  submissionGradeText: {
    fontSize: 14,
    color: NEON.success,
    fontWeight: '600',
  },
});
