import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface InviteCode {
  id: number;
  code: string;
  role: string;
  classId: number | null;
  isActive: boolean;
  usedCount: number;
  maxUses: number | null;
  createdById: number | null;
  createdAt: string;
}

interface ClassData {
  id: number;
  name: string;
  grade: number;
}

const CREATABLE_ROLES = [
  { key: "director", label: "Директор", icon: "briefcase", color: Colors.light.warning },
  { key: "teacher", label: "Учитель", icon: "book", color: Colors.light.success },
  { key: "curator", label: "Куратор", icon: "shield", color: Colors.light.error },
  { key: "student", label: "Ученик", icon: "user", color: Colors.light.secondary },
  { key: "cook", label: "Повар", icon: "coffee", color: "#8B5CF6" },
];

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user, permissions } = useAuth();
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const { data: inviteCodes = [] } = useQuery<InviteCode[]>({
    queryKey: ["/api/invite-codes"],
    enabled: permissions.canCreateInviteCodes,
  });

  const { data: classes = [] } = useQuery<ClassData[]>({
    queryKey: ["/api/classes"],
  });

  const createCodeMutation = useMutation({
    mutationFn: async ({ role, classId }: { role: string; classId?: number }) => {
      const response = await apiRequest("/api/invite-codes", {
        method: "POST",
        body: JSON.stringify({
          role,
          classId,
          createdById: user?.id,
          maxUses: role === "student" ? null : 1,
        }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invite-codes"] });
      setGeneratedCode(data.code);
      setSelectedRole(null);
      setSelectedClassId(null);
    },
    onError: () => {
      Alert.alert("Ошибка", "Не удалось создать код приглашения");
    },
  });

  const handleCreateCode = () => {
    if (!selectedRole) {
      Alert.alert("Ошибка", "Выберите роль");
      return;
    }
    if (selectedRole === "student" && !selectedClassId) {
      Alert.alert("Ошибка", "Для ученика выберите класс");
      return;
    }
    createCodeMutation.mutate({ role: selectedRole, classId: selectedClassId ?? undefined });
  };

  const getAvailableRoles = () => {
    if (user?.role === "ceo") {
      return CREATABLE_ROLES;
    }
    if (user?.role === "director") {
      return CREATABLE_ROLES.filter((r) => ["teacher", "curator", "cook"].includes(r.key));
    }
    if (user?.role === "teacher" || user?.role === "curator") {
      return CREATABLE_ROLES.filter((r) => r.key === "student");
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  const myCreatedCodes = inviteCodes.filter((c) => c.createdById === user?.id);

  if (!permissions.canCreateInviteCodes) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.emptyContainer, { paddingTop: headerHeight }]}>
          <Feather name="lock" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
            У вас нет доступа к управлению приглашениями
          </ThemedText>
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
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <ThemedText type="h2" style={styles.sectionTitle}>
          Создать код приглашения
        </ThemedText>

        {generatedCode && (
          <Card style={[styles.generatedCodeCard, { backgroundColor: Colors.light.success + "15" }]}>
            <View style={styles.generatedCodeHeader}>
              <Feather name="check-circle" size={24} color={Colors.light.success} />
              <ThemedText type="body" style={{ color: Colors.light.success }}>
                Код создан
              </ThemedText>
            </View>
            <ThemedText type="h2" style={styles.generatedCode}>
              {generatedCode}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Передайте этот код новому пользователю
            </ThemedText>
          </Card>
        )}

        <Card style={styles.createCard}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Выберите роль
          </ThemedText>
          <View style={styles.rolesGrid}>
            {availableRoles.map((role) => (
              <Pressable
                key={role.key}
                onPress={() => {
                  setSelectedRole(role.key);
                  setGeneratedCode(null);
                }}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: selectedRole === role.key ? role.color + "15" : theme.backgroundSecondary,
                    borderColor: selectedRole === role.key ? role.color : "transparent",
                  },
                ]}
              >
                <Feather name={role.icon as any} size={20} color={selectedRole === role.key ? role.color : theme.textSecondary} />
                <ThemedText type="small" style={{ color: selectedRole === role.key ? role.color : theme.text }}>
                  {role.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {selectedRole === "student" && (
            <>
              <ThemedText type="small" style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                Выберите класс
              </ThemedText>
              <View style={styles.classesGrid}>
                {classes.map((cls) => (
                  <Pressable
                    key={cls.id}
                    onPress={() => setSelectedClassId(cls.id)}
                    style={[
                      styles.classButton,
                      {
                        backgroundColor: selectedClassId === cls.id ? Colors.light.primary : theme.backgroundSecondary,
                      },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{ color: selectedClassId === cls.id ? "#FFFFFF" : theme.text, fontWeight: "600" }}
                    >
                      {cls.grade}{cls.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Button
            onPress={handleCreateCode}
            style={styles.createButton}
            disabled={createCodeMutation.isPending || !selectedRole}
          >
            {createCodeMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              "Создать код"
            )}
          </Button>
        </Card>

        {myCreatedCodes.length > 0 && (
          <>
            <ThemedText type="h3" style={[styles.sectionTitle, { marginTop: Spacing["2xl"] }]}>
              Созданные коды
            </ThemedText>
            {myCreatedCodes.map((code) => (
              <Card key={code.id} style={styles.codeCard}>
                <View style={styles.codeHeader}>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    {code.code}
                  </ThemedText>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: code.isActive ? Colors.light.success + "20" : Colors.light.error + "20" },
                    ]}
                  >
                    <ThemedText
                      type="caption"
                      style={{ color: code.isActive ? Colors.light.success : Colors.light.error }}
                    >
                      {code.isActive ? "Активен" : "Использован"}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Роль: {code.role} {code.maxUses ? `| Осталось: ${(code.maxUses || 0) - (code.usedCount || 0)}` : ""}
                </ThemedText>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
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
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  createCard: {
    padding: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  classesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  classButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  createButton: {
    marginTop: Spacing.xl,
  },
  generatedCodeCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  generatedCodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  generatedCode: {
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  codeCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
});
