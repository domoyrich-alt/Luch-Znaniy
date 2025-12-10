import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function EventsModal() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { events, toggleEventConfirmation } = useApp();

  const getTypeColor = (type: string) => {
    switch (type) {
      case "school":
        return Colors.light.primary;
      case "class":
        return Colors.light.secondary;
      case "optional":
        return Colors.light.success;
      default:
        return theme.textSecondary;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "school":
        return "Школьное";
      case "class":
        return "Классное";
      case "optional":
        return "По желанию";
      default:
        return type;
    }
  };

  const handleToggle = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleEventConfirmation(id);
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
        <View style={styles.eventsList}>
          {events.map((event) => (
            <Card key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: getTypeColor(event.type) + "20" },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{ color: getTypeColor(event.type), fontWeight: "600" }}
                  >
                    {getTypeLabel(event.type)}
                  </ThemedText>
                </View>
                <View style={styles.dateRow}>
                  <Feather name="calendar" size={14} color={theme.textSecondary} />
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {event.date}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="h4" style={styles.eventTitle}>
                {event.title}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {event.description}
              </ThemedText>

              <View style={styles.eventFooter}>
                <View style={styles.participantsRow}>
                  <Feather name="users" size={14} color={theme.textSecondary} />
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {event.participantCount} участников
                  </ThemedText>
                </View>

                <Pressable
                  onPress={() => handleToggle(event.id)}
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor: event.confirmed
                        ? Colors.light.success
                        : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <Feather
                    name={event.confirmed ? "check" : "plus"}
                    size={16}
                    color={event.confirmed ? "#FFFFFF" : theme.text}
                  />
                  <ThemedText
                    type="small"
                    style={{
                      color: event.confirmed ? "#FFFFFF" : theme.text,
                      fontWeight: "600",
                    }}
                  >
                    {event.confirmed ? "Участвую" : "Записаться"}
                  </ThemedText>
                </Pressable>
              </View>
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
  eventsList: {
    gap: Spacing.lg,
  },
  eventCard: {
    padding: Spacing.lg,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  eventTitle: {
    marginBottom: Spacing.xs,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  participantsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
});
