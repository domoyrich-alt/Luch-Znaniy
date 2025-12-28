import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

export default function HomeworkModal() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { homework, addHomework } = useApp();
  const { user } = useAuth();
  
  // Получаем классы для выбора (если мы CEO или учитель)
  const { data: classes = [] } = useQuery<any[]>({ queryKey: ["/api/classes"] });

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newHomework, setNewHomework] = useState({
    title: "",
    description: "",
    subjectName: "Математика",
    dueDate: "",
    targetClassId: user?.classId || null,
  });

  const canManage = user?.role === "teacher" || user?.role === "ceo" || user?.role === "director";

  const handleAdd = async () => {
    if (!newHomework.title || !newHomework.targetClassId) {
      return Alert.alert("Ошибка", "Заполните название и выберите класс");
    }
    try {
      await addHomework({
        title: newHomework.title,
        description: newHomework.description,
        subjectName: newHomework.subjectName,
        classId: newHomework.targetClassId,
        dueDate: newHomework.dueDate || new Date().toISOString().split("T")[0],
      });
      setAddModalVisible(false);
      setNewHomework({ title: "", description: "", subjectName: "Математика", dueDate: "", targetClassId: null });
      Alert.alert("Успешно", "ДЗ добавлено");
    } catch (e) {
      Alert.alert("Ошибка", "Сбой добавления");
    }
  };

  const subjects = ["Математика", "Русский", "Литература", "Физика", "Химия", "Биология", "История", "География", "Английский"];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: headerHeight + 20, paddingBottom: insets.bottom + 20, paddingHorizontal: 20 }}>
        {canManage && (
          <Button onPress={() => setAddModalVisible(true)} style={{ marginBottom: 20 }}>
            + Добавить ДЗ
          </Button>
        )}

        {homework.length === 0 ? (
           <ThemedText style={{ textAlign: "center", marginTop: 40, color: "gray" }}>Нет домашнего задания</ThemedText>
        ) : (
           homework.map((hw) => (
             <Card key={hw.id} style={{ marginBottom: 15, padding: 15 }}>
               <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <ThemedText style={{ fontWeight: "bold", color: theme.primary }}>{hw.subject || "Предмет"}</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: "gray" }}>{hw.deadline}</ThemedText>
               </View>
               <ThemedText type="h4" style={{ marginVertical: 8 }}>{hw.title}</ThemedText>
               <ThemedText>{hw.description}</ThemedText>
             </Card>
           ))
        )}
      </ScrollView>

      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
              <ThemedText type="h3" style={{ marginBottom: 20 }}>Новое задание</ThemedText>
              
              <ThemedText style={{marginBottom: 5}}>Предмет:</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15, maxHeight: 50 }}>
                {subjects.map(s => (
                   <Pressable key={s} onPress={() => setNewHomework({...newHomework, subjectName: s})} style={{ padding: 10, backgroundColor: newHomework.subjectName === s ? theme.primary : "#eee", borderRadius: 8, marginRight: 8 }}>
                      <ThemedText style={{ color: newHomework.subjectName === s ? "#fff" : "#000" }}>{s}</ThemedText>
                   </Pressable>
                ))}
              </ScrollView>

              <ThemedText style={{marginBottom: 5}}>Класс:</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15, maxHeight: 50 }}>
                {classes.map((c: any) => (
                   <Pressable key={c.id} onPress={() => setNewHomework({...newHomework, targetClassId: c.id})} style={{ padding: 10, backgroundColor: newHomework.targetClassId === c.id ? theme.primary : "#eee", borderRadius: 8, marginRight: 8 }}>
                      <ThemedText style={{ color: newHomework.targetClassId === c.id ? "#fff" : "#000" }}>{c.grade}{c.name}</ThemedText>
                   </Pressable>
                ))}
              </ScrollView>

              <TextInput 
                 style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
                 placeholder="Название задания" 
                 placeholderTextColor="gray"
                 value={newHomework.title}
                 onChangeText={t => setNewHomework({...newHomework, title: t})}
              />
               <TextInput 
                 style={[styles.input, { color: theme.text, borderColor: theme.border, marginTop: 10 }]} 
                 placeholder="Описание" 
                 placeholderTextColor="gray"
                 value={newHomework.description}
                 onChangeText={t => setNewHomework({...newHomework, description: t})}
              />

              <Button style={{ marginTop: 20 }} onPress={handleAdd}>Сохранить</Button>
              <Button style={{ marginTop: 10, backgroundColor: "transparent" }} textStyle={{color: theme.text}} onPress={() => setAddModalVisible(false)}>Отмена</Button>
           </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { padding: 20, borderRadius: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
});