import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";

export default function GroupInfoScreen() {
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  
  const { groupId } = route.params || {};

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: headerHeight + 20 }]}>
        <Card style={styles.infoCard}>
          <View style={styles.groupHeader}>
            <View style={[styles.groupAvatar, { backgroundColor: '#FF6B6B' }]}>
              <ThemedText style={styles.groupAvatarText}>11А</ThemedText>
            </View>
            <View style={styles.groupInfo}>
              <ThemedText style={styles.groupTitle}>Класс 11А</ThemedText>
              <ThemedText style={styles.groupSubtitle}>25 участников</ThemedText>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.actionButton, { backgroundColor: theme.primary }]}>
              <Feather name="bell" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Уведомления</ThemedText>
            </Pressable>
            <Pressable style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="users" size={20} color={theme.text} />
              <ThemedText style={[styles.actionButtonText, { color: theme.text }]}>Участники</ThemedText>
            </Pressable>
          </View>
        </Card>

        <Card style={styles.membersCard}>
          <ThemedText style={styles.sectionTitle}>Участники</ThemedText>
          {['Динара (учитель)', 'Анна Петрова', 'Максим Сидоров', 'Елена Козлова'].map((member, index) => (
            <View key={index} style={styles. memberItem}>
              <View style={[styles.memberAvatar, { backgroundColor: '#4ECDC4' }]}>
                <ThemedText style={styles.memberAvatarText}>{member. charAt(0)}</ThemedText>
              </View>
              <ThemedText style={styles.memberName}>{member}</ThemedText>
            </View>
          ))}
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet. create({
  container: { flex: 1 },
  content: { padding: 20 },
  infoCard:  { marginBottom: 20, padding: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  groupAvatar:  { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  groupAvatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  groupInfo: { flex: 1 },
  groupTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  groupSubtitle: { fontSize: 14, opacity: 0.7 },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  actionButtonText: { fontWeight: '600' },
  membersCard: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  memberAvatar:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  memberAvatarText: { color:  '#FFFFFF', fontSize: 16, fontWeight: '600' },
  memberName: { fontSize: 16 },
});