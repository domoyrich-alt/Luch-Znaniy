import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, ActivityIndicator } from "react-native";
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
  garnish: { label: "Гарнир", icon: "layers" },
  dessert: { label: "Десерт", icon: "heart" },
  bakery: { label: "Выпечка", icon: "package" },
};

type MenuCategory = "first" | "main" | "salad" | "drink" | "garnish" | "dessert" | "bakery";

export default function CafeteriaScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, isLoading } = useApp();
  const { permissions } = useAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    category: "main" as MenuCategory,
    description: "",
    price: "0",
    isAvailable: true 
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: "", category: "main", description: "", price: "0", isAvailable: true });
    setEditModalVisible(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ 
      name: item.name, 
      category: item.category as MenuCategory,
      description: item.description || "",
      price: item.price.toString(),
      isAvailable: item.isAvailable 
    });
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert("Ошибка", "Введите название блюда");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (editingItem) {
      await updateMenuItem(editingItem.id, {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        isAvailable: formData.isAvailable,
      });
    } else {
      await addMenuItem({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        isAvailable: formData.isAvailable,
      });
    }
    setEditModalVisible(false);
  };

  const handleDelete = () => {
    if (editingItem) {
      Alert.alert("Удалить блюдо?", "Это действие нельзя отменить", [
        { text: "Отмена", style: "cancel" },
        { text: "Удалить", style: "destructive", onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deleteMenuItem(editingItem.id);
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

  const groupedItems = menuItems.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: headerHeight + Spacing.xl }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
            Загрузка меню...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (menuItems.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: headerHeight + Spacing.xl }]}>
          <Feather name="coffee" size={64} color={theme.textSecondary} />
          <ThemedText type="h4" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Меню пока пусто
          </ThemedText>
          {permissions.canEditCafeteriaMenu ? (
            <Button onPress={openAddModal} style={{ marginTop: Spacing.lg }}>
              Добавить блюдо
            </Button>
          ) : null}
        </View>
      </ThemedView>
    );
  }

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

        {Object.entries(groupedItems).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <ThemedText type="h4" style={styles.categoryTitle}>
              {CATEGORY_LABELS[category]?.label || category}
            </ThemedText>
            <View style={styles.menuList}>
              {items.map((item) => (
                <Card key={item.id} style={[styles.menuCard, !item.isAvailable ? styles.unavailableCard : undefined]}>
                  <View style={styles.menuHeader}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: item.isAvailable ? Colors.light.success + "20" : theme.border + "40" },
                      ]}
                    >
                      <Feather
                        name={CATEGORY_LABELS[category]?.icon as any || "circle"}
                        size={20}
                        color={item.isAvailable ? Colors.light.success : theme.textSecondary}
                      />
                    </View>
                    <View style={styles.menuInfo}>
                      <ThemedText type="body" style={[styles.dishName, !item.isAvailable && { color: theme.textSecondary }]}>
                        {item.name}
                      </ThemedText>
                      {item.description ? (
                        <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={2}>
                          {item.description}
                        </ThemedText>
                      ) : null}
                    </View>
                    <View style={styles.priceContainer}>
                      <ThemedText type="body" style={[styles.price, { color: theme.primary }]}>
                        {item.price} Руб
                      </ThemedText>
                      {!item.isAvailable ? (
                        <ThemedText type="caption" style={{ color: theme.error }}>
                          Нет
                        </ThemedText>
                      ) : null}
                    </View>
                    {permissions.canEditCafeteriaMenu ? (
                      <Pressable onPress={() => openEditModal(item)} style={styles.editButton}>
                        <Feather name="edit-2" size={18} color={theme.textSecondary} />
                      </Pressable>
                    ) : null}
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))}
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
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Описание</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={formData.description}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                  placeholder="Описание блюда"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Цена (руб)</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
                  value={formData.price}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, price: text.replace(/[^0-9.]/g, "") }))}
                  placeholder="100"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Категория</ThemedText>
                <View style={styles.categoryButtons}>
                  {(["first", "main", "garnish", "salad", "drink", "dessert", "bakery"] as MenuCategory[]).map((cat) => (
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
                        name={CATEGORY_LABELS[cat]?.icon as any || "circle"}
                        size={16}
                        color={formData.category === cat ? "#FFFFFF" : theme.textSecondary}
                      />
                      <ThemedText
                        type="caption"
                        style={{ color: formData.category === cat ? "#FFFFFF" : theme.text }}
                      >
                        {CATEGORY_LABELS[cat]?.label || cat}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.formGroup}>
                <Pressable 
                  onPress={() => setFormData((prev) => ({ ...prev, isAvailable: !prev.isAvailable }))}
                  style={styles.availabilityRow}
                >
                  <View style={[
                    styles.checkbox,
                    { 
                      backgroundColor: formData.isAvailable ? theme.primary : theme.backgroundDefault,
                      borderColor: formData.isAvailable ? theme.primary : theme.border 
                    }
                  ]}>
                    {formData.isAvailable ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
                  </View>
                  <ThemedText type="body">В наличии</ThemedText>
                </Pressable>
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.lg,
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
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryTitle: {
    marginBottom: Spacing.md,
  },
  menuList: {
    gap: Spacing.md,
  },
  menuCard: {
    padding: Spacing.md,
  },
  unavailableCard: {
    opacity: 0.6,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  menuInfo: {
    flex: 1,
  },
  dishName: {
    fontWeight: "600",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontWeight: "700",
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
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
