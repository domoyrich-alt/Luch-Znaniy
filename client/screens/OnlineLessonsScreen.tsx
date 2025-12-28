import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Linking, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface OnlineLesson {
  id: string;
  title: string;
  teacherName: string;
  meetingUrl: string | null;
  meetingCode: string | null;
  scheduledAt: string;
  duration: number;
  status: "upcoming" | "live" | "ended";
}

const DEMO_LESSONS: OnlineLesson[] = [
  {
    id: "1",
    title: "Математика - Алгебра",
    teacherName: "Иванова М.П.",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    meetingCode: "abc-defg-hij",
    scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    duration: 45,
    status: "upcoming",
  },
  {
    id: "2",
    title: "Русский язык - Сочинение",
    teacherName: "Петрова А.И.",
    meetingUrl: null,
    meetingCode: "xyz-1234-567",
    scheduledAt: new Date(Date.now() + 7200000).toISOString(),
    duration: 45,
    status: "upcoming",
  },
  {
    id: "3",
    title: "Физика - Механика",
    teacherName: "Сидоров Д.С.",
    meetingUrl: "https://zoom.us/j/123456789",
    meetingCode: "123 456 789",
    scheduledAt: new Date(Date.now() - 3600000).toISOString(),
    duration: 45,
    status: "ended",
  },
];

export default function OnlineLessonsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  const [lessons] = useState<OnlineLesson[]>(DEMO_LESSONS);
  const [isLoading] = useState(false);
  
  const joinLesson = async (lesson: OnlineLesson) => {
    if (lesson.meetingUrl) {
      try {
        await Linking.openURL(lesson.meetingUrl);
      } catch (e) {
        Alert.alert("Ошибка", "Не удалось открыть ссылку на урок");
      }
    } else if (lesson.meetingCode) {
      Alert.alert("Код подключения", `Используйте этот код для подключения:\n\n${lesson.meetingCode}`);
    } else {
      Alert.alert("Информация", "Ссылка на урок ещё не добавлена учителем");
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru", { 
      weekday: "short", 
      day: "numeric", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };
  
  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return colors.success;
      case "upcoming": return colors.primary;
      case "ended": return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "live": return "Сейчас";
      case "upcoming": return "Скоро";
      case "ended": return "Завершён";
      default: return status;
    }
  };
  
  const renderLesson = ({ item }: { item: OnlineLesson }) => {
    const upcoming = isUpcoming(item.scheduledAt);
    return (
      <Card style={styles.lessonCard}>
        <View style={styles.lessonHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <ThemedText style={styles.statusText}>{getStatusLabel(item.status)}</ThemedText>
          </View>
          <ThemedText style={[styles.lessonTime, { color: colors.textSecondary }]}>
            {formatDate(item.scheduledAt)}
          </ThemedText>
        </View>
        
        <ThemedText style={styles.lessonTitle}>{item.title}</ThemedText>
        
        <View style={styles.teacherRow}>
          <Feather name="user" size={14} color={colors.textSecondary} />
          <ThemedText style={[styles.teacherName, { color: colors.textSecondary }]}>
            {item.teacherName}
          </ThemedText>
        </View>
        
        <ThemedText style={[styles.lessonDuration, { color: colors.textSecondary }]}>
          {item.duration} мин
        </ThemedText>
        
        {upcoming ? (
          <Pressable 
            style={({ pressed }) => [
              styles.joinButton, 
              { backgroundColor: colors.error, opacity: pressed ? 0.7 : 1 }
            ]} 
            onPress={() => joinLesson(item)}
          >
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
      {lessons.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="video-off" size={48} color={colors.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            Нет запланированных уроков
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={lessons.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())}
          renderItem={renderLesson}
          keyExtractor={item => item.id}
          contentContainerStyle={{ 
            padding: Spacing.lg, 
            paddingBottom: insets.bottom + Spacing.xl 
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  lessonCard: { 
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  lessonHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: Spacing.sm,
  },
  statusBadge: { 
    paddingHorizontal: Spacing.sm, 
    paddingVertical: 2, 
    borderRadius: BorderRadius.sm,
  },
  statusText: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "600",
  },
  lessonTime: { 
    fontSize: 12,
  },
  lessonTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    marginBottom: Spacing.xs,
  },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  teacherName: {
    fontSize: 13,
  },
  lessonDuration: { 
    fontSize: 13, 
    marginBottom: Spacing.md,
  },
  joinButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: Spacing.md, 
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  joinButtonText: { 
    color: "#fff", 
    fontWeight: "600",
    fontSize: 15,
  },
  emptyText: { 
    marginTop: Spacing.md,
  },
});
