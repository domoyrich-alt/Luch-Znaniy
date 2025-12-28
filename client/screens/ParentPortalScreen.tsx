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
import { apiGet, apiPost } from "@/lib/api";

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

interface Child {
  linkId: number;
  status: string;
  childId: number;
  firstName: string;
  lastName: string;
  classId: number;
  role: string;
}

interface ChildGrade {
  gradeId: number;
  grade: number;
  date: string;
  comment: string | null;
  subjectName: string;
  teacherFirstName: string;
  teacherLastName: string;
}

interface ParentRequest {
  linkId: number;
  parentId: number;
  parentFirstName: string;
  parentLastName: string;
  verificationCode: string;
  createdAt: string;
}

const GradeCard = ({ grade, index }: { grade: ChildGrade; index: number }) => {
  const getGradeColor = (g: number) => {
    if (g >= 5) return NEON.success;
    if (g >= 4) return NEON.secondary;
    if (g >= 3) return NEON.warning;
    return NEON.error;
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
      <View style={styles.gradeCard}>
        <View style={styles.gradeLeft}>
          <ThemedText style={styles.subjectName}>{grade.subjectName}</ThemedText>
          <ThemedText style={styles.gradeDate}>
            {new Date(grade.date).toLocaleDateString('ru-RU')}
          </ThemedText>
          {grade.comment && (
            <ThemedText style={styles.gradeComment}>{grade.comment}</ThemedText>
          )}
        </View>
        <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(grade.grade) + '20' }]}>
          <ThemedText style={[styles.gradeValue, { color: getGradeColor(grade.grade) }]}>
            {grade.grade}
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
};

export default function ParentPortalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childGrades, setChildGrades] = useState<ChildGrade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  
  // Для студентов - запросы от родителей
  const [parentRequests, setParentRequests] = useState<ParentRequest[]>([]);
  
  // Для привязки ребёнка
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [childCode, setChildCode] = useState('');
  const [linking, setLinking] = useState(false);

  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedChild) {
      loadChildGrades(selectedChild.childId);
    }
  }, [selectedChild]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      if (isParent) {
        const data = await apiGet<Child[]>(`/api/parent/children/${user.id}`);
        setChildren(data || []);
        if (data && data.length > 0 && !selectedChild) {
          setSelectedChild(data[0]);
        }
      } else if (isStudent) {
        const data = await apiGet<ParentRequest[]>(`/api/parent/requests/${user.id}`);
        setParentRequests(data || []);
      }
    } catch (error) {
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildGrades = async (childId: number) => {
    setLoadingGrades(true);
    try {
      const data = await apiGet<ChildGrade[]>(`/api/parent/grades/${childId}`);
      setChildGrades(data || []);
    } catch (error) {
      console.error("Load grades error:", error);
    } finally {
      setLoadingGrades(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedChild) {
      await loadChildGrades(selectedChild.childId);
    }
    setRefreshing(false);
  };

  const handleLinkChild = async () => {
    if (!childCode.trim() || !user?.id) return;
    
    setLinking(true);
    try {
      const result = await apiPost<any>('/api/parent/link', {
        parentId: user.id,
        childCode: childCode.trim(),
      });
      
      if (result?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '✅ Запрос отправлен!',
          `Код подтверждения: ${result.verificationCode}\n\nСообщите этот код вашему ребёнку (${result.childName}) для подтверждения.`
        );
        setShowLinkModal(false);
        setChildCode('');
      } else {
        Alert.alert('Ошибка', result?.error || 'Не удалось отправить запрос');
      }
    } catch (error) {
      console.error("Link child error:", error);
      Alert.alert('Ошибка', 'Не удалось отправить запрос');
    } finally {
      setLinking(false);
    }
  };

  const handleApproveRequest = async (linkId: number, parentName: string) => {
    Alert.alert(
      'Подтвердить привязку?',
      `Разрешить ${parentName} просматривать ваши оценки?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          onPress: async () => {
            try {
              await apiPost('/api/parent/approve', { linkId });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Готово!', 'Родитель теперь может видеть ваши оценки');
              loadData();
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось подтвердить');
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = async (linkId: number) => {
    try {
      await apiPost('/api/parent/reject', { linkId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      loadData();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отклонить');
    }
  };

  // Вычисление статистики
  const avgGrade = childGrades.length > 0
    ? (childGrades.reduce((sum, g) => sum + g.grade, 0) / childGrades.length).toFixed(1)
    : '—';

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
        <ThemedText style={styles.headerTitle}>
          {isParent ? '👨‍👩‍👧 Родительский портал' : '📋 Запросы родителей'}
        </ThemedText>
        <View style={{ width: 40 }} />
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NEON.primary} />
        </View>
      ) : isParent ? (
        // РОДИТЕЛЬСКИЙ РЕЖИМ
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.primary} />
          }
        >
          {/* Add Child Button */}
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowLinkModal(true); }}
              style={styles.addChildButton}
            >
              <LinearGradient
                colors={[NEON.primary, NEON.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addChildGradient}
              >
                <Feather name="plus" size={20} color="#FFF" />
                <ThemedText style={styles.addChildText}>Добавить ребёнка</ThemedText>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {children.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyEmoji}>👨‍👩‍👧</ThemedText>
              <ThemedText style={styles.emptyText}>У вас пока нет привязанных детей</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Нажмите "Добавить ребёнка" и введите код приглашения вашего ребёнка
              </ThemedText>
            </View>
          ) : (
            <>
              {/* Children Tabs */}
              {children.length > 1 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.childrenTabs}
                >
                  {children.map((child) => (
                    <Pressable
                      key={child.childId}
                      onPress={() => { Haptics.selectionAsync(); setSelectedChild(child); }}
                      style={[
                        styles.childTab,
                        selectedChild?.childId === child.childId && styles.childTabActive
                      ]}
                    >
                      <ThemedText style={[
                        styles.childTabText,
                        selectedChild?.childId === child.childId && styles.childTabTextActive
                      ]}>
                        {child.firstName} {child.lastName}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {selectedChild && (
                <>
                  {/* Child Info */}
                  <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.childInfoCard}>
                    <LinearGradient
                      colors={[NEON.bgCard, NEON.bgSecondary]}
                      style={styles.childInfoGradient}
                    >
                      <View style={styles.childAvatar}>
                        <ThemedText style={styles.childAvatarText}>
                          {selectedChild.firstName.charAt(0)}{selectedChild.lastName.charAt(0)}
                        </ThemedText>
                      </View>
                      <View style={styles.childInfoText}>
                        <ThemedText style={styles.childName}>
                          {selectedChild.firstName} {selectedChild.lastName}
                        </ThemedText>
                        <ThemedText style={styles.childClass}>Класс ID: {selectedChild.classId}</ThemedText>
                      </View>
                      <View style={styles.avgGradeContainer}>
                        <ThemedText style={styles.avgGradeLabel}>Средний</ThemedText>
                        <ThemedText style={styles.avgGradeValue}>{avgGrade}</ThemedText>
                      </View>
                    </LinearGradient>
                  </Animated.View>

                  {/* Grades */}
                  <ThemedText style={styles.sectionTitle}>📊 Последние оценки</ThemedText>
                  
                  {loadingGrades ? (
                    <ActivityIndicator color={NEON.primary} style={{ marginTop: 20 }} />
                  ) : childGrades.length > 0 ? (
                    childGrades.slice(0, 20).map((grade, index) => (
                      <GradeCard key={grade.gradeId} grade={grade} index={index} />
                    ))
                  ) : (
                    <View style={styles.noGradesContainer}>
                      <ThemedText style={styles.noGradesText}>Оценок пока нет</ThemedText>
                    </View>
                  )}
                </>
              )}
            </>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : isStudent ? (
        // РЕЖИМ УЧЕНИКА - запросы от родителей
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NEON.primary} />
          }
        >
          <Animated.View entering={FadeInUp.springify()} style={styles.infoBox}>
            <Feather name="info" size={20} color={NEON.secondary} />
            <ThemedText style={styles.infoText}>
              Ваш код для родителей: <ThemedText style={styles.inviteCode}>{(user as any)?.inviteCode || 'N/A'}</ThemedText>
            </ThemedText>
          </Animated.View>

          {parentRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyEmoji}>✉️</ThemedText>
              <ThemedText style={styles.emptyText}>Нет запросов от родителей</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Сообщите свой код родителю, чтобы он мог отслеживать ваши оценки
              </ThemedText>
            </View>
          ) : (
            <>
              <ThemedText style={styles.sectionTitle}>📬 Запросы на привязку</ThemedText>
              {parentRequests.map((req, index) => (
                <Animated.View 
                  key={req.linkId} 
                  entering={FadeInUp.delay(index * 100).springify()}
                  style={styles.requestCard}
                >
                  <View style={styles.requestInfo}>
                    <ThemedText style={styles.requestName}>
                      {req.parentFirstName} {req.parentLastName}
                    </ThemedText>
                    <ThemedText style={styles.requestCode}>
                      Код: {req.verificationCode}
                    </ThemedText>
                  </View>
                  <View style={styles.requestActions}>
                    <Pressable
                      onPress={() => handleApproveRequest(req.linkId, `${req.parentFirstName} ${req.parentLastName}`)}
                      style={styles.approveButton}
                    >
                      <Feather name="check" size={20} color={NEON.success} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleRejectRequest(req.linkId)}
                      style={styles.rejectButton}
                    >
                      <Feather name="x" size={20} color={NEON.error} />
                    </Pressable>
                  </View>
                </Animated.View>
              ))}
            </>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyEmoji}>🚫</ThemedText>
          <ThemedText style={styles.emptyText}>Эта функция доступна только для родителей и учеников</ThemedText>
        </View>
      )}

      {/* Link Child Modal */}
      <Modal
        visible={showLinkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[NEON.bgCard, NEON.bgDark]}
              style={styles.modalGradient}
            >
              <ThemedText style={styles.modalTitle}>👶 Добавить ребёнка</ThemedText>
              <ThemedText style={styles.modalSubtitle}>
                Введите код приглашения вашего ребёнка
              </ThemedText>
              
              <TextInput
                style={styles.codeInput}
                placeholder="Код приглашения"
                placeholderTextColor={NEON.textSecondary}
                value={childCode}
                onChangeText={setChildCode}
                autoCapitalize="characters"
              />
              
              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => setShowLinkModal(false)}
                  style={styles.cancelButton}
                >
                  <ThemedText style={styles.cancelButtonText}>Отмена</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleLinkChild}
                  disabled={!childCode.trim() || linking}
                  style={[styles.submitButton, (!childCode.trim() || linking) && styles.submitButtonDisabled]}
                >
                  <LinearGradient
                    colors={[NEON.primary, NEON.accent]}
                    style={styles.submitButtonGradient}
                  >
                    {linking ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <ThemedText style={styles.submitButtonText}>Отправить запрос</ThemedText>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  
  // Add Child Button
  addChildButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  addChildGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  addChildText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  
  // Children Tabs
  childrenTabs: {
    paddingBottom: 16,
    gap: 8,
  },
  childTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: NEON.bgCard,
    marginRight: 8,
  },
  childTabActive: {
    backgroundColor: NEON.primary + '30',
  },
  childTabText: {
    fontSize: 14,
    color: NEON.textSecondary,
  },
  childTabTextActive: {
    color: NEON.textPrimary,
    fontWeight: '600',
  },
  
  // Child Info
  childInfoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  childInfoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: NEON.primary + '30',
    borderRadius: 16,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: NEON.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: NEON.primary,
  },
  childInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  childName: {
    fontSize: 18,
    fontWeight: '700',
    color: NEON.textPrimary,
  },
  childClass: {
    fontSize: 13,
    color: NEON.textSecondary,
    marginTop: 2,
  },
  avgGradeContainer: {
    alignItems: 'center',
  },
  avgGradeLabel: {
    fontSize: 11,
    color: NEON.textSecondary,
  },
  avgGradeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: NEON.success,
  },
  
  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginBottom: 12,
  },
  
  // Grade Card
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  gradeLeft: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: NEON.textPrimary,
  },
  gradeDate: {
    fontSize: 12,
    color: NEON.textSecondary,
    marginTop: 2,
  },
  gradeComment: {
    fontSize: 11,
    color: NEON.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  gradeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  
  // No Grades
  noGradesContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noGradesText: {
    fontSize: 14,
    color: NEON.textSecondary,
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
    paddingHorizontal: 40,
    opacity: 0.7,
  },
  
  // Info Box (Student)
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON.secondary + '20',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: NEON.textPrimary,
  },
  inviteCode: {
    fontWeight: '700',
    color: NEON.secondary,
  },
  
  // Request Card
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: NEON.textPrimary,
  },
  requestCode: {
    fontSize: 12,
    color: NEON.textSecondary,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NEON.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NEON.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: NEON.primary + '30',
    borderRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NEON.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: NEON.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: NEON.textPrimary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: NEON.bgSecondary,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
});
