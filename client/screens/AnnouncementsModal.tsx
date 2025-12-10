import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function AnnouncementsModal() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { announcements } = useApp();

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
        <View style={styles.announcementsList}>
          {announcements.map((announcement) => (
            <Card key={announcement.id} style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <View style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}>
                  <Feather name="bell" size={20} color={theme.primary} />
                </View>
                <View style={styles.headerInfo}>
                  <ThemedText type="body" style={styles.announcementTitle}>
                    {announcement.title}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {announcement.date} | {announcement.author}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="body" style={styles.announcementContent}>
                {announcement.content}
              </ThemedText>
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
  announcementsList: {
    gap: Spacing.lg,
  },
  announcementCard: {
    padding: Spacing.lg,
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  announcementTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  announcementContent: {
    lineHeight: 24,
  },
});
