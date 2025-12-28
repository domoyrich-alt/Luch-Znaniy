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

export default function ScheduleScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { schedule, isEvenWeek, toggleWeekType, addScheduleItem } = useApp();
  const { permissions, user } = useAuth();
  
  const [selectedDay, setSelectedDay] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ subject: "", teacher: "", startTime: "08:30", endTime: "09:15" });

  const todaySchedule = schedule.filter((item) => item.day === selectedDay + 1);

  const handleSave = async () => {
    if (!formData.subject) {
      Alert.alert("Ошибка", "Заполните предмет");
      return;
    }
    
    // ВАЖНО: Фикс ошибки 400. Обязательно передаем classId.
    // Если у юзера нет класса (CEO), шлем 1.
    const classIdToUse = user?.classId || 1;

    await addScheduleItem({
      subject: formData.subject,
      teacher: formData.teacher || "—", // Учитель необязателен
      startTime: formData.startTime,
      endTime: formData.endTime,
      day: selectedDay + 1,
      room: "",
      isEvenWeek: null,
      subjectId: 0,
    } as any);
    setModalVisible(false);
    setFormData({ subject: "", teacher: "", startTime: "08:30", endTime: "09:15" });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView contentContainerStyle={{ paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + 50 }}>
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
          {todaySchedule.length === 0 ? (
            <ThemedText style={{ textAlign: "center", color: theme.textSecondary, marginTop: 20 }}>
              Нет уроков на этот день
            </ThemedText>
          ) : (
            todaySchedule.map((item, idx) => (
              <View key={idx} style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={{ width: 60, alignItems: "center", borderRightWidth: 1, borderRightColor: theme.border, paddingRight: 10 }}>
                  <ThemedText style={{ fontWeight: "bold" }}>{item.startTime}</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>{item.endTime}</ThemedText>
                </View>
                <View style={{ flex: 1, paddingLeft: 10 }}>
                  <ThemedText type="h4">{item.subject}</ThemedText>
                  <ThemedText style={{ color: theme.textSecondary }}>{item.teacher}</ThemedText>
                </View>
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
  card: { flexDirection: "row", padding: 16, borderRadius: 12, alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { padding: 20, borderRadius: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 }
});