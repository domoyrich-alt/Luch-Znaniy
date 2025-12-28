import React from "react";
import { View, StyleSheet } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export default function ForumScreen() {
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.xl }]}>
        <Card style={styles.devCard}>
          <View style={styles.iconContainer}>
            <Feather name="users" size={64} color={theme.primary} />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Школьный форум
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Раздел находится в разработке
          </ThemedText>
          <ThemedText type="small" style={[styles.description, { color: theme.textSecondary }]}>
            Здесь будет форум для общения учеников, обсуждения школьных тем, обмена опытом и создания сообществ по интересам.  
          </ThemedText>
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Feather name="message-square" size={16} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Тематические обсуждения
              </ThemedText>
            </View>
            <View style={styles. featureItem}>
              <Feather name="help-circle" size={16} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Вопросы и ответы
              </ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="star" size={16} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Рейтинг участников
              </ThemedText>
            </View>
          </View>
        </Card>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing. xl,
  },
  devCard: {
    padding: Spacing["2xl"],
    alignItems: "center",
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: Spacing. xl,
  },
  title:  {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  description:  {
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  features:  {
    gap: Spacing.md,
    alignSelf: "stretch",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});