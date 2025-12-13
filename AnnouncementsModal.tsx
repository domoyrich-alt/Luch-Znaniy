import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput, Switch, Alert, ActivityIndicator } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

export default function AnnouncementsModal() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { announcements, addAnnouncement, refreshData } = useApp();
  const { user, permissions } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canAddNews = permissions.canEditAnnouncements;
  
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Ошибка", "Заполните заголовок и содержание");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addAnnouncement({ title: title.trim(), content: content.trim(), isImportant });
      setTitle("");
      setContent("");
      setIsImportant(false);
      setShowAddForm(false);
      refreshData();
      Alert.alert("Успешно", "Новость добавлена");
    } catch (e) {
      console.error("Failed to add announcement:", e);
      Alert.alert("Ошибка", "Не удалось добавить новость");
    } finally {
      setIsSubmitting(false);
    }
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
        {canAddNews ? (
          <Card style={styles.addSection}>
            <Pressable style={styles.addButton} onPress={() => setShowAddForm(!showAddForm)}>
              <Feather name={showAddForm ? "x" : "plus"} size={20} color={theme.primary} />
              <ThemedText style={{ color: theme.primary, fontWeight: "600", marginLeft: Spacing.sm }}>
                {showAddForm ? "Отмена" : "Добавить новость"}
              </ThemedText>
            </Pressable>
            
            {showAddForm ? (
              <View style={styles.form}>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  placeholder="Заголовок"
                  placeholderTextColor={theme.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  placeholder="Содержание новости"
                  placeholderTextColor={theme.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.switchRow}>
                  <ThemedText>Важная новость</ThemedText>
                  <Switch
                    value={isImportant}
                    onValueChange={setIsImportant}
                    trackColor={{ false: theme.border, true: theme.primary + "60" }}
                    thumbColor={isImportant ? theme.primary : theme.textSecondary}
                  />
                </View>
                <Pressable 
                  style={[styles.submitButton, { backgroundColor: theme.primary }]} 
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "600" }}>Опубликовать</ThemedText>
                  )}
                </Pressable>
              </View>
            ) : null}
          </Card>
        ) : null}
        
        <View style={styles.announcementsList}>
          {announcements.length === 0 ? (
            <Card style={[styles.announcementCard, { alignItems: "center" }]}>
              <Feather name="bell-off" size={32} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>Нет новостей</ThemedText>
            </Card>
          ) : null}
          {announcements.map((announcement) => (
            <Card key={announcement.id} style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <View style={[styles.iconContainer, { backgroundColor: announcement.isImportant ? theme.error + "15" : theme.primary + "15" }]}>
                  <Feather name={announcement.isImportant ? "alert-circle" : "bell"} size={20} color={announcement.isImportant ? theme.error : theme.primary} />
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
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  addSection: { marginBottom: Spacing.lg, padding: Spacing.md },
  addButton: { flexDirection: "row", alignItems: "center" },
  form: { marginTop: Spacing.md },
  input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  textArea: { height: 100, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  submitButton: { padding: Spacing.sm, borderRadius: BorderRadius.md, alignItems: "center" },
  announcementsList: { gap: Spacing.lg },
  announcementCard: { padding: Spacing.lg },
  announcementHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.md },
  iconContainer: { width: 44, height: 44, borderRadius: BorderRadius.full, alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1 },
  announcementTitle: { fontWeight: "600", marginBottom: Spacing.xs },
  announcementContent: { lineHeight: 24 },
});
