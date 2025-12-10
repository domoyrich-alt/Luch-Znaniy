import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth, UserRole } from "@/context/AuthContext";

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
  const { theme } = useTheme();
  const { login, isLoading, error } = useAuth();

  const [inviteCode, setInviteCode] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!inviteCode.trim()) {
      setLocalError("Введите инвайт-код");
      return;
    }
    setLocalError(null);
    await login(inviteCode.toUpperCase(), selectedRole, firstName || undefined, lastName || undefined);
  };

  const displayError = localError || error;

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
            Введите инвайт-код и выберите роль
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
                borderColor: displayError ? Colors.light.error : theme.border,
              },
            ]}
            placeholder="Например: CLASS9-ELNS5"
            placeholderTextColor={theme.textSecondary}
            value={inviteCode}
            onChangeText={(text) => {
              setInviteCode(text);
              setLocalError(null);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <View style={styles.nameContainer}>
          <View style={styles.nameField}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Имя (необязательно)
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
              placeholder="Ваше имя"
              placeholderTextColor={theme.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.nameField}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Фамилия (необязательно)
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
              placeholder="Ваша фамилия"
              placeholderTextColor={theme.textSecondary}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
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

        {displayError ? (
          <View style={[styles.errorContainer, { backgroundColor: Colors.light.error + "15" }]}>
            <Feather name="alert-circle" size={16} color={Colors.light.error} />
            <ThemedText type="small" style={{ color: Colors.light.error }}>
              {displayError}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.exampleContainer}>
          <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Коды классов: CLASS1-KPMD2, CLASS9-ELNS5, CLASS11-HMWK7
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Директор: DIRECTOR-2024-LUCH
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Учитель: TEACHER-MATH-001 | Повар: COOK-MENU-001
          </ThemedText>
        </View>

        <Button 
          onPress={handleSubmit} 
          style={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            "Войти"
          )}
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
    marginBottom: Spacing["2xl"],
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  nameContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  nameField: {
    flex: 1,
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
    marginBottom: Spacing.lg,
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
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  exampleContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
