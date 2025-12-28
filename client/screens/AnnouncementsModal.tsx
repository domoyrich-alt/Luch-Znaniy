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
  const { announcements, addAnnouncement, deleteAnnouncement, refreshData } = useApp();
  const { user, permissions } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Управление новостями для "высоких ролей" и тех, у кого есть права
  const canManageNews = !!user && (permissions.canManageAnnouncements || ["teacher", "curator", "director", "ceo"].includes(user.role));
  // Добавление оставляем тем, у кого явно есть права управления новостями
  const canAddNews = canManageNews;

  const handleDelete = (id: string) => {
    Alert.alert(
      "Удалить новость?",
      "Это действие нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAnnouncement(id);
              refreshData();
            } catch (e) {
              Alert.alert("Ошибка", "Не удалось удалить новость");
            }
          },
        },
      ]
    );
  };
  
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return Alert.alert("Ошибка", "Заполните поля");
    setIsSubmitting(true);
    try {
      await addAnnouncement({ title: title.trim(), content: content.trim(), isImportant });
      setTitle(""); setContent(""); setShowAddForm(false); refreshData();
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось добавить");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: headerHeight + 20, paddingBottom: insets.bottom + 20, paddingHorizontal: 20 }}>
        {canAddNews && (
            <Pressable onPress={() => setShowAddForm(!showAddForm)} style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                <Feather name={showAddForm ? "x" : "plus"} size={24} color={theme.primary} />
                <ThemedText style={{ marginLeft: 10, color: theme.primary, fontWeight: "bold" }}>
                    {showAddForm ? "Отмена" : "Добавить новость"}
                </ThemedText>
            </Pressable>
        )}

        {showAddForm && (
            <Card style={{ marginBottom: 20, padding: 15 }}>
                <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Заголовок" placeholderTextColor="gray" value={title} onChangeText={setTitle} />
                <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, marginTop: 10, height: 80 }]} multiline placeholder="Текст новости" placeholderTextColor="gray" value={content} onChangeText={setContent} />
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                    <Switch value={isImportant} onValueChange={setIsImportant} />
                    <ThemedText style={{ marginLeft: 10 }}>Важная новость</ThemedText>
                </View>
                <Pressable onPress={handleSubmit} style={{ backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: "center", marginTop: 15 }}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={{ color: "#fff" }}>Опубликовать</ThemedText>}
                </Pressable>
            </Card>
        )}

        {announcements.map((a) => (
          <Card
            key={a.id}
            style={{
              marginBottom: 15,
              padding: 15,
              borderLeftWidth: a.isImportant ? 4 : 0,
              borderLeftColor: theme.error,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <ThemedText type="h4" style={{ marginBottom: 5 }}>
                  {a.title}
                </ThemedText>
              </View>
              {canManageNews && (
                <Pressable
                  onPress={() => handleDelete(a.id)}
                  hitSlop={10}
                  style={{ padding: 6 }}
                >
                  <Feather name="trash-2" size={18} color={theme.error} />
                </Pressable>
              )}
            </View>
            <ThemedText>{a.content}</ThemedText>
          </Card>
        ))}
        {announcements.length === 0 && <ThemedText style={{ textAlign: "center", color: "gray" }}>Нет новостей</ThemedText>}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16 },
});