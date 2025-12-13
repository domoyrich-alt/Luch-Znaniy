import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput, Alert, Linking, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { getApiUrl } from "@/lib/query-client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

interface OnlineLesson {
  id: number;
  classId: number;
  teacherId: number;
  subjectId: number | null;
  title: string;
  meetingUrl: string | null;
  meetingCode: string | null;
  scheduledAt: string;
  duration: number;
  status: string;
}

export default function OnlineLessonsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  
  const [lessons, setLessons] = useState<OnlineLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [meetingCode, setMeetingCode] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  
  const canCreate = user?.role === "teacher" || user?.role === "director" || user?.role === "ceo";
  
  useEffect(() => {
    fetchLessons();
  }, [user?.classId]);
  
  const fetchLessons = async () => {
    if (!user?.classId) return;
    try {
      const response = await fetch(new URL(`/api/online-lessons/${user.classId}`, getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
      }
    } catch (e) {
      console.error("Failed to fetch lessons:", e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const createLesson = async () => {
    if (!title.trim() || !scheduledAt.trim()) {
      Alert.alert("Ошибка", "Заполните название и время урока");
      return;
    }
    
    try {
      const response = await fetch(new URL("/api/online-lessons", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: user?.classId,
          teacherId: user?.id,
          title: title.trim(),
          meetingUrl: meetingUrl.trim() || null,
          meetingCode: meetingCode.trim() || null,
          scheduledAt: new Date(scheduledAt).toISOString(),
          duration: 45,
        }),
      });
      
      if (response.ok) {
        const lesson = await response.json();
        setLessons(prev => [...prev, lesson]);
        setShowCreate(false);
        setTitle("");
        setMeetingUrl("");
        setMeetingCode("");
        setScheduledAt("");
        Alert.alert("Успешно", "Онлайн-урок создан");
      }
    } catch (e) {
      console.error("Failed to create lesson:", e);
      Alert.alert("Ошибка", "Не удалось создать урок");
    }
  };
  
  const joinLesson = async (lesson: OnlineLesson) => {
    if (lesson.meetingUrl) {
      try {
        await Linking.openURL(lesson.meetingUrl);
      } catch (e) {
        Alert.alert("Ошибка", "Не удалось открыть ссылку");
      }
    } else if (lesson.meetingCode) {
      Alert.alert("Код подключения", lesson.meetingCode);
    } else {
      Alert.alert("Информация", "Ссылка на урок ещё не добавлена");
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };
  
  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();
  
  const renderLesson = ({ item }: { item: OnlineLesson }) => {
    const upcoming = isUpcoming(item.scheduledAt);
    return (
      <Card style={styles.lessonCard}>
        <View style={styles.lessonHeader}>
          <View style={[styles.statusBadge, { backgroundColor: upcoming ? colors.primary : colors.textSecondary }]}>
            <ThemedText style={styles.statusText}>{upcoming ? "Скоро" : "Прошёл"}</ThemedText>
          </View>
          <ThemedText style={styles.lessonTime}>{formatDate(item.scheduledAt)}</ThemedText>
        </View>
        <ThemedText style={styles.lessonTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.lessonDuration}>{item.duration} мин</ThemedText>
        
        {upcoming ? (
          <Pressable style={[styles.joinButton, { backgroundColor: colors.primary }]} onPress={() => joinLesson(item)}>
            <Feather name="video" size={18} color="#fff" />
            <ThemedText style={styles.joinButtonText}>Подключиться</ThemedText>
          </Pressable>
        ) : null}
      </Card>
    );
  };
  
  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={[styles.container, { paddingTop: headerHeight }]}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.title}>Онлайн-уроки</ThemedText>
        {canCreate ? (
          <Pressable style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(!showCreate)}>
            <Feather name={showCreate ? "x" : "plus"} size={20} color="#fff" />
          </Pressable>
        ) : null}
      </View>
      
      {showCreate ? (
        <Card style={styles.createForm}>
          <ThemedText style={styles.formTitle}>Создать онлайн-урок</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Название урока"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Дата и время (2024-12-15 10:00)"
            placeholderTextColor={colors.textSecondary}
            value={scheduledAt}
            onChangeText={setScheduledAt}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Ссылка на Zoom/Meet (необязательно)"
            placeholderTextColor={colors.textSecondary}
            value={meetingUrl}
            onChangeText={setMeetingUrl}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Код подключения (необязательно)"
            placeholderTextColor={colors.textSecondary}
            value={meetingCode}
            onChangeText={setMeetingCode}
          />
          <Pressable style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={createLesson}>
            <ThemedText style={styles.submitText}>Создать урок</ThemedText>
          </Pressable>
        </Card>
      ) : null}
      
      {lessons.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="video-off" size={48} color={colors.textSecondary} />
          <ThemedText style={styles.emptyText}>Нет запланированных уроков</ThemedText>
        </View>
      ) : (
        <FlatList
          data={lessons.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())}
          renderItem={renderLesson}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + Spacing.xl }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  title: { fontSize: 20, fontWeight: "600" },
  addButton: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  createForm: { margin: Spacing.md },
  formTitle: { fontSize: 16, fontWeight: "600", marginBottom: Spacing.md },
  input: { borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  submitButton: { borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: "center", marginTop: Spacing.sm },
  submitText: { color: "#fff", fontWeight: "600" },
  lessonCard: { marginBottom: Spacing.md },
  lessonHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  lessonTime: { fontSize: 12, opacity: 0.6 },
  lessonTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  lessonDuration: { fontSize: 13, opacity: 0.6, marginBottom: Spacing.sm },
  joinButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: Spacing.sm, borderRadius: BorderRadius.md },
  joinButtonText: { color: "#fff", fontWeight: "600", marginLeft: Spacing.sm },
  emptyText: { marginTop: Spacing.md, opacity: 0.6 },
});
