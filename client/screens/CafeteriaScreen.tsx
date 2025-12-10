import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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
import { useApp, MenuItem } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  first: { label: "Первое блюдо", icon: "droplet" },
  main: { label: "Второе блюдо", icon: "box" },
  salad: { label: "Салат", icon: "feather" },
  drink: { label: "Напиток", icon: "coffee" },
};

type MenuCategory = "first" | "main" | "salad" | "drink";

export default function CafeteriaScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { menuItems, rateMenuItem, addMenuItem, updateMenuItem, deleteMenuItem } = useApp();
  const { permissions } = useAuth();

  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({ name: "", category: "first" as MenuCategory });

  const handleRate = async (id: string, rating: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUserRatings((prev) => ({ ...prev, [id]: rating }));
    rateMenuItem(id, rating);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: "", category: "first" });
    setEditModalVisible(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ name: item.name, category: item.category });
    setEditModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      Alert.alert("Ошибка", "Введите название блюда");
      return;
    }
    if (editingItem) {
      updateMenuItem(editingItem.id, formData);
    } else {
      addMenuItem(formData);
    }
    setEditModalVisible(false);
  };

  const handleDelete = () => {
    if (editingItem) {
      Alert.alert("Удалить блюдо?", "Это действие нельзя отменить", [
        { text: "Отмена", style: "cancel" },
        { text: "Удалить", style: "destructive", onPress: () => {
          deleteMenuItem(editingItem.id);
          setEditModalVisible(false);
        }},
      ]);
    }
  };

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <ThemedView style={styles.container}>
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
        <View style={styles.header}>
          <View>
            <ThemedText type="h3">Меню на сегодня</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {today}
            </ThemedText>
          </View>
          {permissions.canEditCafeteriaMenu ? (
            <Pressable onPress={openAddModal} style={[styles.addButton, { backgroundColor: theme.primary }]}>
              <Feather name="plus" size={20} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <Card key={item.id} style={styles.menuCard}>
              <View style={styles.categoryHeader}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: Colors.light.success + "20" },
                  ]}
                >
                  <Feather
                    name={CATEGORY_LABELS[item.category].icon as any}
                    size={20}
                    color={Colors.light.success}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {CATEGORY_LABELS[item.category].label}
                  </ThemedText>
                  <ThemedText type="body" style={styles.dishName}>
                    {item.name}
                  </ThemedText>
                </View>
                {permissions.canEditCafeteriaMenu ? (
                  <Pressable onPress={() => openEditModal(item)} style={styles.editButton}>
                    <Feather name="edit-2" size={18} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.ratingSection}>
                <View style={styles.averageRating}>
                  <Feather name="star" size={16} color={Colors.light.yellowAccent} />
                  <ThemedText type="body" style={styles.ratingValue}>
                    {item.rating.toFixed(1)}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    ({item.ratingCount} оценок)
                  </ThemedText>
                </View>

                <View style={styles.ratingStars}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Ваша оценка:
                  </ThemedText>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable
                        key={star}
                        onPress={() => handleRate(item.id, star)}
                        style={styles.starButton}
                      >
                        <Feather
                          name={
                            (userRatings[item.id] || 0) >= star
                              ? "star"
                              : "star"
                          }
                          size={28}
                          color={
                            (userRatings[item.id] || 0) >= star
                              ? Colors.light.yellowAccent
                              : theme.textSecondary
                          }
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.leaderboardSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Топ блюд недели
          </ThemedText>
          <View style={styles.leaderboard}>
            {[...menuItems]
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 3)
              .map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.leaderboardItem, { backgroundColor: theme.backgroundDefault }]}
                >
                  <View
                    style={[
                      styles.rankBadge,
                      {
                        backgroundColor:
                          index === 0
                            ? Colors.light.yellowAccent
                            : index === 1
                            ? "#C0C0C0"
                            : "#CD7F32",
                      },
                    ]}
                  >
                    <ThemedText type="caption" style={styles.rankText}>
                      {index + 1}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={styles.leaderboardName}>
                    {item.name}
                  </ThemedText>
                  <View style={styles.leaderboardRating}>
                    <Feather name="star" size={14} color={Colors.light.yellowAccent} />
                    <ThemedText type="small">{item.rating.toFixed(1)}</ThemedText>
                  </View>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">{editingItem ? "Редактировать блюдо" : "Добавить блюдо"}</ThemedText>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <KeyboardAwareScrollViewCompat contentContainerStyle={styles.modalForm}>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Название блюда</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                  placeholder="Борщ со сметаной"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Категория</ThemedText>
                <View style={styles.categoryButtons}>
                  {(["first", "main", "salad", "drink"] as MenuCategory[]).map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setFormData((prev) => ({ ...prev, category: cat }))}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor: formData.category === cat ? theme.primary : theme.backgroundDefault,
                          borderColor: formData.category === cat ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Feather
                        name={CATEGORY_LABELS[cat].icon as any}
                        size={16}
                        color={formData.category === cat ? "#FFFFFF" : theme.textSecondary}
                      />
                      <ThemedText
                        type="caption"
                        style={{ color: formData.category === cat ? "#FFFFFF" : theme.text }}
                      >
                        {CATEGORY_LABELS[cat].label}
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
                  Удалить блюдо
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    padding: Spacing.sm,
  },
  menuList: {
    gap: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  menuCard: {
    padding: Spacing.lg,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  dishName: {
    fontWeight: "600",
  },
  ratingSection: {
    gap: Spacing.md,
  },
  averageRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  ratingValue: {
    fontWeight: "600",
  },
  ratingStars: {
    gap: Spacing.sm,
  },
  starsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  starButton: {
    padding: Spacing.xs,
  },
  leaderboardSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  leaderboard: {
    gap: Spacing.sm,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  leaderboardName: {
    flex: 1,
    fontWeight: "500",
  },
  leaderboardRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
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
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
