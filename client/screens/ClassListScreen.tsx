import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";

const NEON = {
  primary: "#8B5CF6",
  secondary: "#4ECDC4",
  accent: "#FF6B9D",
  warning: "#FFD93D",
  success: "#6BCB77",
  error: "#FF6B6B",
  bgDark: "#0A0A0F",
  bgCard: "#141420",
  bgSecondary: "#1A1A2E",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0B0",
};

interface Classmate {
  id: number;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
  isOnline: boolean;
  avgGrade: number;
}

const ClassmateCard = ({ item, index, onPress }: { item: Classmate; index: number; onPress: () => void }) => {
  const getGradeColor = (grade: number) => {
    if (grade >= 4.5) return NEON.success;
    if (grade >= 4.0) return NEON.secondary;
    if (grade >= 3.5) return NEON.warning;
    return NEON.error;
  };

  return (
    <Pressable onPress={onPress} style={styles.classmateCard}>
      <LinearGradient colors={[NEON.bgCard, NEON.bgSecondary]} style={styles.classmateGradient}>
        <View style={styles.classmateNumber}>
          <ThemedText style={styles.numberText}>{index + 1}</ThemedText>
        </View>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={item.isOnline ? [NEON.success, NEON.secondary] : [NEON.bgSecondary, NEON.bgCard]}
            style={styles.avatarGradient}
          >
            <View style={styles.avatarInner}>
              <ThemedText style={styles.avatarEmoji}>
                {(item.firstName || "").charAt(0)}{(item.lastName || "").charAt(0)}
              </ThemedText>
            </View>
          </LinearGradient>
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.classmateInfo}>
          <ThemedText style={styles.classmateName}>
            {item.lastName || ""} {item.firstName || ""}
          </ThemedText>
          <ThemedText style={styles.classmateUsername}>
            {item.username || "Нет username"}
          </ThemedText>
        </View>
        {item.avgGrade > 0 && (
          <View style={[styles.avgBadge, { backgroundColor: getGradeColor(item.avgGrade) + "20" }]}>
            <ThemedText style={[styles.avgText, { color: getGradeColor(item.avgGrade) }]}>
              {item.avgGrade.toFixed(1)}
            </ThemedText>
          </View>
        )}
        <Feather name="chevron-right" size={20} color={NEON.textSecondary} />
      </LinearGradient>
    </Pressable>
  );
};

export default function ClassListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [sortBy, setSortBy] = useState<"name" | "grade">("name");
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadClassmates = async () => {
      if (!user?.classId) {
        setError("Класс не указан");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.110:5000";
        const response = await fetch(`${API_URL}/api/classmates/${user.classId}`);
        if (response.ok) {
          const data = await response.json();
          setClassmates(data);
        } else {
          setError("Не удалось загрузить список одноклассников");
        }
      } catch (err) {
        console.error("Load classmates error:", err);
        setError("Ошибка сети");
      } finally {
        setLoading(false);
      }
    };
    loadClassmates();
  }, [user?.classId]);
  
  const sortedClassmates = [...classmates].sort((a, b) => {
    if (sortBy === "name") {
      return (a.lastName || "").localeCompare(b.lastName || "");
    }
    return (b.avgGrade || 0) - (a.avgGrade || 0);
  });
  
  const onlineCount = classmates.filter(c => c.isOnline).length;
  const classAvg = classmates.length > 0 
    ? (classmates.reduce((acc, c) => acc + (c.avgGrade || 0), 0) / classmates.length).toFixed(2)
    : "0.00";
  const className = user?.classId ? `${user.classId} класс` : "Класс";

  const handleClassmatePress = (classmate: Classmate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as any).navigate("UserProfile", {
      userId: classmate.id,
      firstName: classmate.firstName,
      lastName: classmate.lastName,
      username: classmate.username || "Нет username",
      avgGrade: classmate.avgGrade,
    });
  };

  const retryLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.110:5000";
      const response = await fetch(`${API_URL}/api/classmates/${user?.classId}`);
      if (response.ok) {
        const data = await response.json();
        setClassmates(data);
      } else {
        setError("Не удалось загрузить список одноклассников");
      }
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={NEON.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Мой класс</ThemedText>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.classInfo}>
        <LinearGradient colors={[NEON.primary, NEON.secondary]} style={styles.classInfoGradient}>
          <View style={styles.classInfoRow}>
            <View style={styles.classInfoItem}>
              <ThemedText style={styles.classInfoValue}>{className}</ThemedText>
              <ThemedText style={styles.classInfoLabel}>Класс</ThemedText>
            </View>
            <View style={styles.classInfoDivider} />
            <View style={styles.classInfoItem}>
              <ThemedText style={styles.classInfoValue}>{classmates.length}</ThemedText>
              <ThemedText style={styles.classInfoLabel}>Ученики</ThemedText>
            </View>
            <View style={styles.classInfoDivider} />
            <View style={styles.classInfoItem}>
              <ThemedText style={styles.classInfoValue}>{onlineCount}</ThemedText>
              <ThemedText style={styles.classInfoLabel}>Онлайн</ThemedText>
            </View>
            <View style={styles.classInfoDivider} />
            <View style={styles.classInfoItem}>
              <ThemedText style={styles.classInfoValue}>{classAvg}</ThemedText>
              <ThemedText style={styles.classInfoLabel}>Средний</ThemedText>
            </View>
          </View>
        </LinearGradient>
      </View>
      <View style={styles.sortContainer}>
        <Pressable 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSortBy("name"); }}
          style={[styles.sortButton, sortBy === "name" && styles.sortButtonActive]}
        >
          <Feather name="user" size={16} color={sortBy === "name" ? NEON.primary : NEON.textSecondary} />
          <ThemedText style={[styles.sortText, sortBy === "name" && styles.sortTextActive]}>По имени</ThemedText>
        </Pressable>
        <Pressable 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSortBy("grade"); }}
          style={[styles.sortButton, sortBy === "grade" && styles.sortButtonActive]}
        >
          <Feather name="award" size={16} color={sortBy === "grade" ? NEON.primary : NEON.textSecondary} />
          <ThemedText style={[styles.sortText, sortBy === "grade" && styles.sortTextActive]}>По оценке</ThemedText>
        </Pressable>
      </View>
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={NEON.primary} />
          <ThemedText style={styles.loadingText}>Загрузка одноклассников...</ThemedText>
        </View>
      )}
      {error && !loading && (
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color={NEON.error} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryButton} onPress={retryLoad}>
            <ThemedText style={styles.retryText}>Повторить</ThemedText>
          </Pressable>
        </View>
      )}
      {!loading && !error && classmates.length === 0 && (
        <View style={styles.centerContainer}>
          <Feather name="users" size={48} color={NEON.textSecondary} />
          <ThemedText style={styles.emptyText}>Одноклассников пока нет</ThemedText>
        </View>
      )}
      {!loading && !error && classmates.length > 0 && (
        <FlatList
          data={sortedClassmates}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <ClassmateCard item={item} index={index} onPress={() => handleClassmatePress(item)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEON.bgDark },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: NEON.bgCard, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: NEON.textPrimary },
  headerRight: { width: 44 },
  classInfo: { paddingHorizontal: 16, marginBottom: 16 },
  classInfoGradient: { borderRadius: 16, padding: 16 },
  classInfoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  classInfoItem: { alignItems: "center", flex: 1 },
  classInfoValue: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  classInfoLabel: { fontSize: 11, color: "#FFF", opacity: 0.8, marginTop: 2 },
  classInfoDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.3)" },
  sortContainer: { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  sortButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: NEON.bgCard, borderWidth: 1, borderColor: NEON.bgSecondary },
  sortButtonActive: { backgroundColor: NEON.primary + "20", borderColor: NEON.primary },
  sortText: { fontSize: 14, color: NEON.textSecondary },
  sortTextActive: { color: NEON.primary, fontWeight: "600" },
  listContent: { padding: 16, paddingTop: 0 },
  classmateCard: { marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  classmateGradient: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: NEON.primary + "20" },
  classmateNumber: { width: 28, height: 28, borderRadius: 8, backgroundColor: NEON.primary + "20", alignItems: "center", justifyContent: "center", marginRight: 12 },
  numberText: { fontSize: 12, fontWeight: "600", color: NEON.primary },
  avatarContainer: { position: "relative", marginRight: 12 },
  avatarGradient: { width: 48, height: 48, borderRadius: 24, padding: 2 },
  avatarInner: { flex: 1, borderRadius: 22, backgroundColor: NEON.bgDark, alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 16, fontWeight: "700", color: NEON.textPrimary },
  onlineIndicator: { position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: NEON.success, borderWidth: 2, borderColor: NEON.bgDark },
  classmateInfo: { flex: 1 },
  classmateName: { fontSize: 15, fontWeight: "600", color: NEON.textPrimary },
  classmateUsername: { fontSize: 12, color: NEON.textSecondary, marginTop: 2 },
  avgBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  avgText: { fontSize: 14, fontWeight: "700" },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  loadingText: { fontSize: 14, color: NEON.textSecondary, marginTop: 12 },
  errorText: { fontSize: 14, color: NEON.error, marginTop: 12, textAlign: "center" },
  emptyText: { fontSize: 14, color: NEON.textSecondary, marginTop: 12 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: NEON.primary, borderRadius: 12 },
  retryText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
});
