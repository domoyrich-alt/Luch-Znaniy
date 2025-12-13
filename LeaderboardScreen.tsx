import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

type LeaderboardLevel = "junior" | "middle" | "senior";

const LEVELS: { key: LeaderboardLevel; label: string; grades: string }[] = [
  { key: "junior", label: "Младшие", grades: "1-4 класс" },
  { key: "middle", label: "Средние", grades: "5-8 класс" },
  { key: "senior", label: "Старшие", grades: "9-11 класс" },
];

interface LeaderboardEntry {
  studentId: number;
  name: string;
  classId: number;
  className: string;
  averageGrade: number;
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<LeaderboardLevel>("senior");

  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard", selectedLevel],
  });

  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0:
        return "#FFD700";
      case 1:
        return "#C0C0C0";
      case 2:
        return "#CD7F32";
      default:
        return theme.textSecondary;
    }
  };

  const getMedalIcon = (position: number): string => {
    if (position < 3) return "award";
    return "star";
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <Card style={[styles.itemCard, index < 3 && { borderLeftColor: getMedalColor(index), borderLeftWidth: 4 }]}>
      <View style={styles.itemContent}>
        <View style={[styles.positionBadge, { backgroundColor: getMedalColor(index) + "20" }]}>
          <Feather name={getMedalIcon(index) as any} size={16} color={getMedalColor(index)} />
          <ThemedText type="caption" style={{ color: getMedalColor(index), fontWeight: "700" }}>
            {index + 1}
          </ThemedText>
        </View>
        <View style={styles.studentInfo}>
          <ThemedText type="body" style={styles.studentName}>
            {item.name || "Ученик"}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {item.className}
          </ThemedText>
        </View>
        <View style={styles.gradeContainer}>
          <ThemedText type="h3" style={{ color: Colors.light.success }}>
            {item.averageGrade.toFixed(2)}
          </ThemedText>
        </View>
      </View>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.levelSelector, { paddingTop: headerHeight + Spacing.md }]}>
        {LEVELS.map((level) => (
          <Pressable
            key={level.key}
            onPress={() => setSelectedLevel(level.key)}
            style={[
              styles.levelButton,
              {
                backgroundColor: selectedLevel === level.key ? Colors.light.primary : theme.backgroundSecondary,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{
                color: selectedLevel === level.key ? "#FFFFFF" : theme.text,
                fontWeight: "600",
              }}
            >
              {level.label}
            </ThemedText>
            <ThemedText
              type="caption"
              style={{
                color: selectedLevel === level.key ? "#FFFFFF99" : theme.textSecondary,
              }}
            >
              {level.grades}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Загрузка...
          </ThemedText>
        </View>
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="award" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Пока нет данных об оценках
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.studentId.toString()}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  levelSelector: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  levelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  itemCard: {
    padding: 0,
    overflow: "hidden",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  positionBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontWeight: "600",
  },
  gradeContainer: {
    marginLeft: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
});
