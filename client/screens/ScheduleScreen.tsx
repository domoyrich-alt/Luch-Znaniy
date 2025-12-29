import React, { useEffect, useMemo, useState } from "react";
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
import { getApiUrl } from "@/lib/query-client";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export default function ScheduleScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { schedule, isEvenWeek, addScheduleItem, deleteScheduleItem } = useApp();
  const { permissions, user } = useAuth();
  
  const [selectedDay, setSelectedDay] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ subject: "", teacher: "", startTime: "08:30", endTime: "09:15" });

  const [classOverride, setClassOverride] = useState<number>(user?.classId || 1);
  const [localSchedule, setLocalSchedule] = useState<ScheduleItem[]>([]);

  const isUsingOverride = !user?.classId && permissions.canEditSchedule;
  const effectiveClassId = user?.classId || classOverride;

  useEffect(() => {
    if (user?.classId) {
      setClassOverride(user.classId);
    }
  }, [user?.classId]);

  useEffect(() => {
    if (!isUsingOverride) return;
    let cancelled = false;

    const load = async () => {
      try {
        const url = new URL(`/api/schedule/${effectiveClassId}`, getApiUrl()).toString();
        const response = await fetch(url);
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        setLocalSchedule(
          (data || []).map((item: any) => ({
            id: item.id.toString(),
            day: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            subject: item.subjectName || "Предмет",
            subjectId: item.subjectId,
            room: item.room || "",
            teacher: item.teacherName || "",
            isEvenWeek: item.isEvenWeek,
          }))
        );
      } catch {
        // ignore
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [effectiveClassId, isUsingOverride]);

  const scheduleSource = isUsingOverride ? localSchedule : schedule;

  const todaySchedule = useMemo(() => {
    return scheduleSource
      .filter((item) => item.day === selectedDay + 1)
      .filter((item) => item.isEvenWeek == null || item.isEvenWeek === isEvenWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [scheduleSource, selectedDay, isEvenWeek]);

  const handleSave = async () => {
    if (!formData.subject) {
      Alert.alert("Ошибка", "Заполните предмет");
      return;
    }
    
    // ВАЖНО: Фикс ошибки 400. Обязательно передаем classId.
    // Если у юзера нет класса (CEO), шлем 1.
    const classIdToUse = effectiveClassId;

    if (isUsingOverride) {
      try {
        const url = new URL("/api/schedule", getApiUrl()).toString();
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId: classIdToUse,
            subjectName: formData.subject,
            teacherId: user?.id,
            dayOfWeek: selectedDay + 1,
            startTime: formData.startTime,
            endTime: formData.endTime,
            room: "",
            // По умолчанию повторяется каждую неделю
            isEvenWeek: null,
          }),
        });
        if (response.ok) {
          const refreshUrl = new URL(`/api/schedule/${classIdToUse}`, getApiUrl()).toString();
          const refreshed = await fetch(refreshUrl);
          if (refreshed.ok) {
            const data = await refreshed.json();
            setLocalSchedule(
              (data || []).map((item: any) => ({
                id: item.id.toString(),
                day: item.dayOfWeek,
                startTime: item.startTime,
                endTime: item.endTime,
                subject: item.subjectName || "Предмет",
                subjectId: item.subjectId,
                room: item.room || "",
                teacher: item.teacherName || "",
                isEvenWeek: item.isEvenWeek,
              }))
            );
          }
        }
      } catch {
        // ignore
      }
    } else {
      await addScheduleItem({
        classId: classIdToUse as any,
        subject: formData.subject,
        teacher: formData.teacher || "—", // Учитель необязателен
        startTime: formData.startTime,
        endTime: formData.endTime,
        day: selectedDay + 1,
        room: "",
        // По умолчанию повторяется каждую неделю
        isEvenWeek: null,
        subjectId: 0,
      } as any);
    }
    setModalVisible(false);
    setFormData({ subject: "", teacher: "", startTime: "08:30", endTime: "09:15" });
  };

  const confirmDelete = (item: ScheduleItem) => {
    Alert.alert("Удалить урок?", `${item.subject} (${item.startTime}–${item.endTime})`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          if (!item.id) return;
          if (isUsingOverride) {
            try {
              const url = new URL(`/api/schedule/${item.id}`, getApiUrl()).toString();
              const response = await fetch(url, { method: "DELETE" });
              if (response.ok) {
                setLocalSchedule((prev) => prev.filter((x) => x.id !== item.id));
              }
            } catch {
              // ignore
            }
          } else {
            await deleteScheduleItem(item.id);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView contentContainerStyle={{ paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + 50 }}>
        {/* Выбор класса (если у пользователя нет classId) */}
        {isUsingOverride && (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <ThemedText style={{ color: theme.textSecondary, marginBottom: 8 }}>Класс</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setClassOverride(n)}
                  style={[
                    styles.classChip,
                    {
                      backgroundColor: classOverride === n ? Colors.light.primary : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <ThemedText style={{ color: classOverride === n ? "#FFF" : theme.text }}>{n}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Дни недели */}
        <ScrollView horizontal style={{ marginBottom: 20, paddingHorizontal: 16 }}>
          {DAYS.map((day, idx) => (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(idx)}
              style={[
                styles.dayBtn, 
                { backgroundColor: selectedDay === idx ? Colors.light.primary : theme.backgroundSecondary }
              ]}
            >
              <ThemedText style={{ color: selectedDay === idx ? "#FFF" : theme.text }}>{day}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Кнопка добавить (только для админов/учителей) */}
        {permissions.canEditSchedule && (
          <Button onPress={() => setModalVisible(true)} style={{ marginHorizontal: 16, marginBottom: 16 }}>
            Добавить урок
          </Button>
        )}

        {/* Список уроков */}
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {/* Заголовок с классом */}
          {effectiveClassId && (
            <View style={[styles.classHeader, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="users" size={18} color={Colors.light.primary} />
              <ThemedText style={[styles.classHeaderText, { color: theme.text }]}>
                {effectiveClassId} класс
              </ThemedText>
            </View>
          )}
          
          {todaySchedule.length === 0 ? (
            <ThemedText style={{ textAlign: "center", color: theme.textSecondary, marginTop: 20 }}>
              Нет уроков на этот день
            </ThemedText>
          ) : (
            todaySchedule.map((item, index) => (
              <View key={item.id} style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={[styles.lessonNumber, { backgroundColor: Colors.light.primary + '20' }]}>
                  <ThemedText style={[styles.lessonNumberText, { color: Colors.light.primary }]}>{index + 1}</ThemedText>
                </View>
                <View style={{ width: 60, alignItems: "center", borderRightWidth: 1, borderRightColor: theme.border, paddingRight: 10 }}>
                  <ThemedText style={{ fontWeight: "bold" }}>{item.startTime}</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{item.endTime}</ThemedText>
                </View>
                <View style={{ flex: 1, paddingLeft: 10 }}>
                  <ThemedText type="h4">{item.subject}</ThemedText>
                  <ThemedText style={{ color: theme.textSecondary }}>{item.teacher}</ThemedText>
                  {item.room && (
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Каб. {item.room}</ThemedText>
                  )}
                </View>

                {permissions.canEditSchedule && (
                  <Pressable
                    onPress={() => confirmDelete(item)}
                    hitSlop={10}
                    style={{ paddingLeft: 10, paddingVertical: 6 }}
                  >
                    <Feather name="trash-2" size={18} color={theme.textSecondary} />
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Модалка */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="h3" style={{ marginBottom: 20 }}>Добавить урок</ThemedText>
            
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder="Предмет"
              placeholderTextColor={theme.textSecondary}
              value={formData.subject}
              onChangeText={t => setFormData(prev => ({...prev, subject: t}))}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
               <TextInput
                style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.text }]}
                placeholder="Начало (08:30)"
                placeholderTextColor={theme.textSecondary}
                value={formData.startTime}
                onChangeText={t => setFormData(prev => ({...prev, startTime: t}))}
              />
               <TextInput
                style={[styles.input, { flex: 1, borderColor: theme.border, color: theme.text }]}
                placeholder="Конец (09:15)"
                placeholderTextColor={theme.textSecondary}
                value={formData.endTime}
                onChangeText={t => setFormData(prev => ({...prev, endTime: t}))}
              />
            </View>

            <Button onPress={handleSave} style={{ marginTop: 20 }}>Сохранить</Button>
            <Button onPress={() => setModalVisible(false)} style={{ marginTop: 10, backgroundColor: "transparent" }} textStyle={{ color: theme.text }}>Отмена</Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dayBtn: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", marginRight: 10 },
  classChip: { width: 44, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 10 },
  card: { flexDirection: "row", padding: 16, borderRadius: 12, alignItems: "center" },
  classHeader: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, gap: 8, marginBottom: 8 },
  classHeaderText: { fontSize: 16, fontWeight: "600" },
  lessonNumber: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 10 },
  lessonNumberText: { fontSize: 14, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { padding: 20, borderRadius: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 }
});