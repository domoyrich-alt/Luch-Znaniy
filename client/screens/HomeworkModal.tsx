import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, Image, Alert, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useApp, Homework } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

interface ChatMessage {
  id: string;
  text: string;
  imageUri?: string;
  isTeacher: boolean;
  timestamp: string;
}

const TEACHERS: Record<string, { name: string; avatar?: string }> = {
  "Математика": { name: "Иванова Мария Петровна" },
  "Русский язык": { name: "Сидорова Анна Ивановна" },
  "Физика": { name: "Козлов Дмитрий Сергеевич" },
  "История": { name: "Новикова Елена Викторовна" },
  "Английский": { name: "Смирнова Ольга Андреевна" },
  "Химия": { name: "Волков Андрей Николаевич" },
  "Биология": { name: "Морозова Татьяна Владимировна" },
};

export default function HomeworkModal() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { homework, submitHomework, addHomework, subjects } = useApp();
  const { permissions } = useAuth();
  
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newHomework, setNewHomework] = useState({
    title: "",
    description: "",
    subjectId: 0,
    dueDate: "",
  });
  
  const canManage = permissions.canManageHomework;

  const openAddModal = () => {
    setNewHomework({ title: "", description: "", subjectId: subjects[0]?.id || 0, dueDate: "" });
    setAddModalVisible(true);
  };

  const handleAddHomework = async () => {
    if (!newHomework.title || !newHomework.subjectId) {
      Alert.alert("Ошибка", "Заполните название и выберите предмет");
      return;
    }
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      await addHomework({
        title: newHomework.title,
        description: newHomework.description,
        subjectId: newHomework.subjectId,
        dueDate: newHomework.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      setAddModalVisible(false);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось добавить домашнее задание. Попробуйте еще раз.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return Colors.light.warning;
      case "submitted":
        return Colors.light.secondary;
      case "graded":
        return Colors.light.success;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Ожидает";
      case "submitted":
        return "Сдано";
      case "graded":
        return "Оценено";
      default:
        return status;
    }
  };

  const getDaysUntil = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Просрочено";
    if (diff === 0) return "Сегодня";
    if (diff === 1) return "Завтра";
    return `${diff} дней`;
  };

  const openSubmitChat = (item: Homework) => {
    setSelectedHomework(item);
    setMessages([
      {
        id: "1",
        text: `Здравствуйте! Вы можете отправить свою работу по заданию "${item.title}". Прикрепите фото или напишите сообщение.`,
        isTeacher: true,
        timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setMessageText("");
    setAttachedImages([]);
    setChatModalVisible(true);
  };

  const pickImage = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Недоступно", "Добавление фото доступно только в мобильном приложении Expo Go");
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAttachedImages([...attachedImages, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(attachedImages.filter((_, i) => i !== index));
  };

  const sendMessage = () => {
    if (!messageText.trim() && attachedImages.length === 0) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      imageUri: attachedImages.length > 0 ? attachedImages[0] : undefined,
      isTeacher: false,
      timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    };
    
    setMessages([...messages, newMessage]);
    setMessageText("");
    setAttachedImages([]);
    
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Работа получена! Проверю и поставлю оценку в ближайшее время.",
          isTeacher: true,
          timestamp: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      
      if (selectedHomework && submitHomework) {
        submitHomework(selectedHomework.id);
      }
    }, 1500);
  };

  const teacherName = selectedHomework ? TEACHERS[selectedHomework.subject]?.name || "Учитель" : "Учитель";

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
        {canManage ? (
          <View style={styles.headerRow}>
            <ThemedText type="h4">Домашние задания</ThemedText>
            <Pressable onPress={openAddModal} style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <Feather name="plus" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}
        
        <View style={styles.homeworkList}>
          {homework.map((item) => (
            <Card key={item.id} style={styles.homeworkCard}>
              <View style={styles.homeworkHeader}>
                <View style={styles.subjectBadge}>
                  <Feather name="book-open" size={16} color={theme.primary} />
                  <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                    {item.subject}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) + "20" },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{ color: getStatusColor(item.status), fontWeight: "600" }}
                  >
                    {getStatusLabel(item.status)}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="body" style={styles.homeworkTitle}>
                {item.title}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.description}
              </ThemedText>

              <View style={[styles.deadlineRow, { borderTopColor: theme.border }]}>
                <Feather name="clock" size={14} color={theme.textSecondary} />
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Срок: {item.deadline}
                </ThemedText>
                <View
                  style={[
                    styles.daysUntilBadge,
                    {
                      backgroundColor:
                        getDaysUntil(item.deadline) === "Просрочено"
                          ? Colors.light.error + "20"
                          : Colors.light.warning + "20",
                    },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{
                      color:
                        getDaysUntil(item.deadline) === "Просрочено"
                          ? Colors.light.error
                          : Colors.light.warning,
                      fontWeight: "600",
                    }}
                  >
                    {getDaysUntil(item.deadline)}
                  </ThemedText>
                </View>
              </View>

              {item.status === "pending" ? (
                <Pressable
                  onPress={() => openSubmitChat(item)}
                  style={[styles.submitButton, { backgroundColor: theme.primary }]}
                >
                  <Feather name="upload" size={16} color="#FFFFFF" />
                  <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Сдать работу
                  </ThemedText>
                </Pressable>
              ) : null}

              {item.status === "graded" && item.grade ? (
                <View style={[styles.gradeRow, { backgroundColor: Colors.light.success + "15" }]}>
                  <Feather name="check-circle" size={16} color={Colors.light.success} />
                  <ThemedText type="small" style={{ color: Colors.light.success, fontWeight: "600" }}>
                    Оценка: {item.grade}
                  </ThemedText>
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      </ScrollView>

      <Modal visible={chatModalVisible} animationType="slide">
        <ThemedView style={styles.chatContainer}>
          <View style={[styles.chatHeader, { backgroundColor: theme.backgroundRoot, borderBottomColor: theme.border }]}>
            <View style={styles.chatHeaderContent}>
              <Pressable onPress={() => setChatModalVisible(false)} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color={theme.text} />
              </Pressable>
              <View style={[styles.teacherAvatar, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="user" size={20} color={theme.primary} />
              </View>
              <View style={styles.teacherInfo}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {teacherName}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {selectedHomework?.subject}
                </ThemedText>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={[styles.messagesContent, { paddingBottom: insets.bottom + 100 }]}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.isTeacher ? styles.teacherMessage : styles.studentMessage,
                  { backgroundColor: msg.isTeacher ? theme.backgroundDefault : theme.primary },
                ]}
              >
                {msg.imageUri ? (
                  <Image source={{ uri: msg.imageUri }} style={styles.messageImage} />
                ) : null}
                {msg.text ? (
                  <ThemedText
                    type="small"
                    style={{ color: msg.isTeacher ? theme.text : "#FFFFFF" }}
                  >
                    {msg.text}
                  </ThemedText>
                ) : null}
                <ThemedText
                  type="caption"
                  style={{
                    color: msg.isTeacher ? theme.textSecondary : "rgba(255,255,255,0.7)",
                    alignSelf: "flex-end",
                    marginTop: Spacing.xs,
                  }}
                >
                  {msg.timestamp}
                </ThemedText>
              </View>
            ))}
          </ScrollView>

          <KeyboardAwareScrollViewCompat>
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundRoot, borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.md }]}>
              {attachedImages.length > 0 ? (
                <View style={styles.attachedImagesRow}>
                  {attachedImages.map((uri, index) => (
                    <View key={index} style={styles.attachedImageContainer}>
                      <Image source={{ uri }} style={styles.attachedImage} />
                      <Pressable
                        onPress={() => removeImage(index)}
                        style={[styles.removeImageButton, { backgroundColor: Colors.light.error }]}
                      >
                        <Feather name="x" size={12} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.inputRow}>
                <Pressable onPress={pickImage} style={styles.attachButton}>
                  <Feather name="image" size={24} color={theme.primary} />
                </Pressable>
                <TextInput
                  style={[styles.messageInput, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder="Сообщение..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                />
                <Pressable
                  onPress={sendMessage}
                  style={[styles.sendButton, { backgroundColor: theme.primary }]}
                >
                  <Feather name="send" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </KeyboardAwareScrollViewCompat>
        </ThemedView>
      </Modal>

      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Добавить домашнее задание</ThemedText>
              <Pressable onPress={() => setAddModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <KeyboardAwareScrollViewCompat contentContainerStyle={styles.modalForm}>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Предмет</ThemedText>
                <View style={styles.subjectButtons}>
                  {subjects.slice(0, 8).map((subject) => (
                    <Pressable
                      key={subject.id}
                      onPress={() => setNewHomework((prev) => ({ ...prev, subjectId: subject.id }))}
                      style={[
                        styles.subjectButton,
                        {
                          backgroundColor: newHomework.subjectId === subject.id ? theme.primary : theme.backgroundDefault,
                          borderColor: newHomework.subjectId === subject.id ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        type="caption"
                        style={{ color: newHomework.subjectId === subject.id ? "#FFFFFF" : theme.text }}
                      >
                        {subject.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Название задания</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={newHomework.title}
                  onChangeText={(text) => setNewHomework((prev) => ({ ...prev, title: text }))}
                  placeholder="Упражнение 42"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Описание</ThemedText>
                <TextInput
                  style={[styles.input, styles.multilineInput, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={newHomework.description}
                  onChangeText={(text) => setNewHomework((prev) => ({ ...prev, description: text }))}
                  placeholder="Решить все задачи..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Срок сдачи (ГГГГ-ММ-ДД)</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={newHomework.dueDate}
                  onChangeText={(text) => setNewHomework((prev) => ({ ...prev, dueDate: text }))}
                  placeholder="2024-12-20"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <Button onPress={handleAddHomework} style={{ marginTop: Spacing.lg }}>
                Добавить
              </Button>
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
  homeworkList: {
    gap: Spacing.lg,
  },
  homeworkCard: {
    padding: Spacing.lg,
  },
  homeworkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  subjectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  homeworkTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  daysUntilBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: "auto",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    paddingTop: 50,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  chatHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  teacherInfo: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  teacherMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: Spacing.xs,
  },
  studentMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: Spacing.xs,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  attachedImagesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  attachedImageContainer: {
    position: "relative",
  },
  attachedImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  attachButton: {
    padding: Spacing.sm,
  },
  messageInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
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
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalForm: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
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
  multilineInput: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  subjectButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  subjectButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
