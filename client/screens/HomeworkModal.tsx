import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function HomeworkModal() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { homework } = useApp();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return Colors.light.warning;
      case "submitted":
        return Colors.light.secondary;
      case "graded":
        return Colors.light.success;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Ожидает";
      case "submitted":
        return "Сдано";
      case "graded":
        return "Оценено";
      default:
        return status;
    }
  };

  const getDaysUntil = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Просрочено";
    if (diff === 0) return "Сегодня";
    if (diff === 1) return "Завтра";
    return `${diff} дней`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.homeworkList}>
          {homework.map((item) => (
            <Card key={item.id} style={styles.homeworkCard}>
              <View style={styles.homeworkHeader}>
                <View style={styles.subjectBadge}>
                  <Feather name="book-open" size={16} color={theme.primary} />
                  <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                    {item.subject}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) + "20" },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{ color: getStatusColor(item.status), fontWeight: "600" }}
                  >
                    {getStatusLabel(item.status)}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="body" style={styles.homeworkTitle}>
                {item.title}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.description}
              </ThemedText>

              <View style={styles.deadlineRow}>
                <Feather name="clock" size={14} color={theme.textSecondary} />
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Срок: {item.deadline}
                </ThemedText>
                <View
                  style={[
                    styles.daysUntilBadge,
                    {
                      backgroundColor:
                        getDaysUntil(item.deadline) === "Просрочено"
                          ? Colors.light.error + "20"
                          : Colors.light.warning + "20",
                    },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{
                      color:
                        getDaysUntil(item.deadline) === "Просрочено"
                          ? Colors.light.error
                          : Colors.light.warning,
                      fontWeight: "600",
                    }}
                  >
                    {getDaysUntil(item.deadline)}
                  </ThemedText>
                </View>
              </View>

              {item.status === "pending" ? (
                <Pressable
                  style={[styles.submitButton, { backgroundColor: theme.primary }]}
                >
                  <Feather name="upload" size={16} color="#FFFFFF" />
                  <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Сдать работу
                  </ThemedText>
                </Pressable>
              ) : null}
            </Card>
          ))}
        </View>
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
  homeworkList: {
    gap: Spacing.lg,
  },
  homeworkCard: {
    padding: Spacing.lg,
  },
  homeworkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  subjectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  homeworkTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  daysUntilBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: "auto",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
});
