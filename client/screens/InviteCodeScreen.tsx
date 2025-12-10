import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";
import { useAuth, UserRole } from "@/context/AuthContext";

type InviteCodeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, "InviteCode">;

const ROLES: { key: UserRole; label: string; icon: string; color: string }[] = [
  { key: "student", label: "Ученик", icon: "user", color: Colors.light.secondary },
  { key: "teacher", label: "Учитель", icon: "book", color: Colors.light.success },
  { key: "director", label: "Директор", icon: "briefcase", color: Colors.light.warning },
  { key: "curator", label: "Куратор", icon: "shield", color: Colors.light.error },
  { key: "cook", label: "Повар", icon: "coffee", color: "#8B5CF6" },
];

export default function InviteCodeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<InviteCodeScreenNavigationProp>();
  const { theme } = useTheme();
  const { login } = useAuth();

  const [inviteCode, setInviteCode] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");

  const handleSubmit = () => {
    if (!inviteCode.trim()) {
      Alert.alert("Ошибка", "Введите инвайт-код");
      return;
    }
    login(inviteCode.toUpperCase(), selectedRole);
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="h2" style={styles.title}>
            Добро пожаловать!
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Введите инвайт-код вашего класса и выберите роль
          </ThemedText>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Инвайт-код
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Например: 9A-X7B3"
            placeholderTextColor={theme.textSecondary}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <View style={styles.roleContainer}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Выберите роль
          </ThemedText>
          <View style={styles.rolesGrid}>
            {ROLES.map((role) => (
              <Pressable
                key={role.key}
                onPress={() => setSelectedRole(role.key)}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor:
                      selectedRole === role.key
                        ? role.color + "15"
                        : theme.backgroundDefault,
                    borderColor:
                      selectedRole === role.key ? role.color : theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.roleIconContainer,
                    {
                      backgroundColor:
                        selectedRole === role.key
                          ? role.color
                          : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <Feather
                    name={role.icon as any}
                    size={20}
                    color={selectedRole === role.key ? "#FFFFFF" : theme.textSecondary}
                  />
                </View>
                <ThemedText
                  type="small"
                  style={[
                    styles.roleLabel,
                    { color: selectedRole === role.key ? role.color : theme.text },
                  ]}
                >
                  {role.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.exampleContainer}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Примеры кодов для тестирования:
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            9A-X7B3, TEACH-001, DIR-001, CUR-001, COOK-001
          </ThemedText>
        </View>

        <Button onPress={handleSubmit} style={styles.submitButton}>
          Войти
        </Button>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing["2xl"],
  },
  header: {
    marginBottom: Spacing["3xl"],
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: Spacing["2xl"],
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  roleContainer: {
    marginBottom: Spacing["2xl"],
  },
  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  roleCard: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: "center",
    gap: Spacing.sm,
  },
  roleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  roleLabel: {
    fontWeight: "600",
  },
  exampleContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
