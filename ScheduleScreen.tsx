import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useApp, ScheduleItem } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const DAY_NAMES = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

export default function ScheduleScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { schedule, isEvenWeek, toggleWeekType, addScheduleItem, updateScheduleItem, deleteScheduleItem } = useApp();
  const { permissions } = useAuth();
  const [selectedDay, setSelectedDay] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    room: "",
    teacher: "",
    startTime: "",
    endTime: "",
  });

  const todaySchedule = schedule.filter((item) => {
    if (item.day !== selectedDay + 1) return false;
    if (item.isEvenWeek === null) return true;
    return item.isEvenWeek === isEvenWeek;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ subject: "", room: "", teacher: "", startTime: "08:30", endTime: "09:15" });
    setEditModalVisible(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      subject: item.subject,
      room: item.room,
      teacher: item.teacher,
      startTime: item.startTime,
      endTime: item.endTime,
    });
    setEditModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.subject || !formData.room || !formData.teacher) {
      Alert.alert("Ошибка", "Заполните все поля");
      return;
    }
    if (editingItem) {
      updateScheduleItem(editingItem.id, formData);
    } else {
      addScheduleItem({
        ...formData,
        day: selectedDay + 1,
        isEvenWeek: null,
      });
    }
    setEditModalVisible(false);
  };

  const handleDelete = () => {
    if (editingItem) {
      Alert.alert("Удалить урок?", "Это действие нельзя отменить", [
        { text: "Отмена", style: "cancel" },
        { text: "Удалить", style: "destructive", onPress: () => {
          deleteScheduleItem(editingItem.id);
          setEditModalVisible(false);
        }},
      ]);
    }
  };

  const yellowBg = isDark ? Colors.dark.yellowLight : Colors.light.yellowLight;
  const yellowMedium = isDark ? Colors.dark.yellowMedium : Colors.light.yellowMedium;
  const yellowAccent = Colors.light.yellowAccent;

  return (
    <View style={[styles.container, { backgroundColor: yellowBg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.weekToggle}>
          <Pressable
            onPress={toggleWeekType}
            style={[styles.weekButton, { backgroundColor: yellowMedium }]}
          >
            <Feather name="repeat" size={16} color={yellowAccent} />
            <ThemedText type="small" style={{ fontWeight: "600" }}>
              {isEvenWeek ? "Четная неделя" : "Нечетная неделя"}
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daySelector}
          contentContainerStyle={styles.daySelectorContent}
        >
          {DAYS.map((day, index) => (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(index)}
              style={[
                styles.dayButton,
                {
                  backgroundColor:
                    selectedDay === index ? yellowAccent : yellowMedium,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={[
                  styles.dayText,
                  { color: selectedDay === index ? "#000000" : theme.text },
                ]}
              >
                {day}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.dayHeader}>
          <ThemedText type="h4" style={styles.dayTitle}>
            {DAY_NAMES[selectedDay]}
          </ThemedText>
          {permissions.canEditSchedule ? (
            <Pressable onPress={openAddModal} style={[styles.addButton, { backgroundColor: yellowAccent }]}>
              <Feather name="plus" size={20} color="#000000" />
            </Pressable>
          ) : null}
        </View>

        {todaySchedule.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: yellowMedium }]}>
            <Feather name="sun" size={40} color={yellowAccent} />
            <ThemedText type="body" style={styles.emptyText}>
              Нет уроков
            </ThemedText>
          </View>
        ) : (
          <View style={styles.lessonsList}>
            {todaySchedule
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((lesson, index) => (
                <Pressable
                  key={lesson.id}
                  onPress={() => permissions.canEditSchedule ? openEditModal(lesson) : null}
                  style={[
                    styles.lessonCard,
                    {
                      backgroundColor: theme.backgroundRoot,
                      borderLeftColor: yellowAccent,
                    },
                  ]}
                >
                  <View style={styles.lessonTime}>
                    <ThemedText type="body" style={styles.timeText}>
                      {lesson.startTime}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {lesson.endTime}
                    </ThemedText>
                  </View>
                  <View style={styles.lessonDivider} />
                  <View style={styles.lessonInfo}>
                    <ThemedText type="body" style={styles.subjectText}>
                      {lesson.subject}
                    </ThemedText>
                    <View style={styles.lessonDetails}>
                      <View style={styles.detailRow}>
                        <Feather name="map-pin" size={12} color={theme.textSecondary} />
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {lesson.room}
                        </ThemedText>
                      </View>
                      <View style={styles.detailRow}>
                        <Feather name="user" size={12} color={theme.textSecondary} />
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {lesson.teacher}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <View style={styles.lessonNumber}>
                    <ThemedText type="caption" style={{ color: yellowAccent, fontWeight: "700" }}>
                      {index + 1}
                    </ThemedText>
                  </View>
                  {permissions.canEditSchedule ? (
                    <Feather name="edit-2" size={16} color={theme.textSecondary} style={{ marginLeft: Spacing.sm }} />
                  ) : null}
                </Pressable>
              ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">{editingItem ? "Редактировать урок" : "Добавить урок"}</ThemedText>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <KeyboardAwareScrollViewCompat contentContainerStyle={styles.modalForm}>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Предмет</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={formData.subject}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, subject: text }))}
                  placeholder="Математика"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Кабинет</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={formData.room}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, room: text }))}
                  placeholder="201"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Учитель</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={formData.teacher}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, teacher: text }))}
                  placeholder="Иванова А.П."
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>Начало</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                    value={formData.startTime}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, startTime: text }))}
                    placeholder="08:30"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>Конец</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                    value={formData.endTime}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, endTime: text }))}
                    placeholder="09:15"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>
              <Button onPress={handleSave} style={{ marginTop: Spacing.lg }}>
                {editingItem ? "Сохранить" : "Добавить"}
              </Button>
              {editingItem ? (
                <Button onPress={handleDelete} style={{ marginTop: Spacing.md, backgroundColor: theme.error }}>
                  Удалить урок
                </Button>
              ) : null}
            </KeyboardAwareScrollViewCompat>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  weekToggle: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  weekButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  daySelector: {
    marginBottom: Spacing.lg,
  },
  daySelectorContent: {
    gap: Spacing.sm,
  },
  dayButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontWeight: "600",
  },
  dayTitle: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["4xl"],
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  emptyText: {
    opacity: 0.7,
  },
  lessonsList: {
    gap: Spacing.md,
  },
  lessonCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    alignItems: "center",
    gap: Spacing.md,
  },
  lessonTime: {
    alignItems: "center",
    width: 50,
  },
  timeText: {
    fontWeight: "600",
  },
  lessonDivider: {
    width: 1,
    height: "100%",
    backgroundColor: Colors.light.border,
    marginHorizontal: Spacing.sm,
  },
  lessonInfo: {
    flex: 1,
  },
  subjectText: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  lessonDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  lessonNumber: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.yellowLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
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
  formRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
});
