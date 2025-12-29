import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useApp, Event } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

type EventType = "school" | "class" | "optional" | "event";

export default function EventsModal() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { events, toggleEventConfirmation, addEvent, updateEvent, deleteEvent } = useApp();
  const { permissions } = useAuth();
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    type: "school" as EventType,
  });

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

  const openAddModal = () => {
    setEditingItem(null);
    const today = new Date().toISOString().split("T")[0];
    setFormData({ title: "", description: "", date: today, type: "school" });
    setEditModalVisible(true);
  };

  const openEditModal = (item: Event) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      date: item.date,
      type: item.type,
    });
    setEditModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.date) {
      Alert.alert("Ошибка", "Заполните название и дату");
      return;
    }
    if (editingItem) {
      updateEvent(editingItem.id, formData);
    } else {
      addEvent(formData);
    }
    setEditModalVisible(false);
  };

  const handleDelete = () => {
    if (editingItem) {
      Alert.alert("Удалить мероприятие?", "Это действие нельзя отменить", [
        { text: "Отмена", style: "cancel" },
        { text: "Удалить", style: "destructive", onPress: () => {
          deleteEvent(editingItem.id);
          setEditModalVisible(false);
        }},
      ]);
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
        {permissions.canManageEvents ? (
          <View style={styles.addButtonRow}>
            <Pressable onPress={openAddModal} style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Добавить мероприятие
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

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
                <View style={styles.headerRight}>
                  <View style={styles.dateRow}>
                    <Feather name="calendar" size={14} color={theme.textSecondary} />
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {event.date}
                    </ThemedText>
                  </View>
                  {permissions.canManageEvents ? (
                    <Pressable onPress={() => openEditModal(event)} style={styles.editButton}>
                      <Feather name="edit-2" size={16} color={theme.textSecondary} />
                    </Pressable>
                  ) : null}
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

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">{editingItem ? "Редактировать" : "Новое мероприятие"}</ThemedText>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <KeyboardAwareScrollViewCompat contentContainerStyle={styles.modalForm}>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Название</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={formData.title}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
                  placeholder="День знаний"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Описание</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={formData.description}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                  placeholder="Описание мероприятия..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Дата (ГГГГ-ММ-ДД)</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={formData.date}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, date: text }))}
                  placeholder="2024-12-15"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Тип</ThemedText>
                <View style={styles.typeButtons}>
                  {(["school", "class", "optional"] as EventType[]).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setFormData((prev) => ({ ...prev, type }))}
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: formData.type === type ? getTypeColor(type) : theme.backgroundDefault,
                          borderColor: formData.type === type ? getTypeColor(type) : theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        type="caption"
                        style={{ color: formData.type === type ? "#FFFFFF" : theme.text }}
                      >
                        {getTypeLabel(type)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Button onPress={handleSave} style={{ marginTop: Spacing.lg }}>
                {editingItem ? "Сохранить" : "Добавить"}
              </Button>
              {editingItem ? (
                <Button onPress={handleDelete} style={{ marginTop: Spacing.md, backgroundColor: theme.error }}>
                  Удалить
                </Button>
              ) : null}
            </KeyboardAwareScrollViewCompat>
          </View>
        </View>
      </Modal>
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
  addButtonRow: {
    marginBottom: Spacing.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
  },
  editButton: {
    padding: Spacing.xs,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalForm: {
    gap: Spacing.md,
  },
  formGroup: {
    gap: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  typeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  typeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
