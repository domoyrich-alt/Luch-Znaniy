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
  { key: "parent", label: "Родитель", icon: "users", color: Colors.light.primary },
  { key: "teacher", label: "Учитель", icon: "book", color: Colors.light.success },
  { key: "curator", label: "Куратор", icon: "shield", color: Colors.light.error },
  { key: "director", label: "Директор", icon: "briefcase", color: "#F59E0B" },
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
      setLocalError("Введите код приглашения");
      return;
    }
    setLocalError(null);
    await login(inviteCode.toUpperCase(), selectedRole, firstName.trim() || "Пользователь", lastName.trim() || "");
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
            Луч Знаний
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Введите код приглашения для входа
          </ThemedText>
        </View>

        <View style={styles.nameContainer}>
          <View style={styles.nameField}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Имя *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: !firstName.trim() && displayError ? Colors.light.error : theme.border,
                },
              ]}
              placeholder="Ваше имя"
              placeholderTextColor={theme.textSecondary}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setLocalError(null);
              }}
            />
          </View>
          <View style={styles.nameField}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Фамилия *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: !lastName.trim() && displayError ? Colors.light.error : theme.border,
                },
              ]}
              placeholder="Ваша фамилия"
              placeholderTextColor={theme.textSecondary}
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                setLocalError(null);
              }}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Код приглашения *
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
            placeholder="Введите код"
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

        <View style={[styles.infoContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="info" size={16} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary, flex: 1 }}>
            Код приглашения выдается администрацией школы. Обратитесь к классному руководителю или директору.
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
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
