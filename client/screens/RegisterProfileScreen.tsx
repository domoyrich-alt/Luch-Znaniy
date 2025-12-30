import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl as getBaseApiUrl } from "@/lib/query-client";

const API_URL = getBaseApiUrl();

export default function RegisterProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { completeRegistration, isLoading } = useAuth();

  // Данные с предыдущего экрана
  const { userId, firstName, lastName } = route.params || {};

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthday, setBirthday] = useState("");
  const [status, setStatus] = useState("");
  
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  // Анимации
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Проверка username на уникальность
  const checkUsername = async (value: string) => {
    if (!value.trim() || value.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(value.length > 0 && value.length < 3 ? "Минимум 3 символа" : null);
      return;
    }

    // Проверка формата username
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Только латинские буквы, цифры и _");
      setUsernameAvailable(false);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError(null);

    try {
      const response = await fetch(`${API_URL}/api/users/check-username?username=${encodeURIComponent(value)}`);
      const data = await response.json();
      
      if (data.available) {
        setUsernameAvailable(true);
        setUsernameError(null);
      } else {
        setUsernameAvailable(false);
        setUsernameError("Этот username уже занят");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Ошибка проверки");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Дебаунс для проверки username
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) {
        checkUsername(username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async () => {
    if (!username.trim()) {
      setUsernameError("Введите username");
      return;
    }

    if (username.length < 3) {
      setUsernameError("Минимум 3 символа");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError("Только латинские буквы, цифры и _");
      return;
    }

    if (!usernameAvailable) {
      setUsernameError("Этот username уже занят");
      return;
    }

    try {
      await completeRegistration(userId, {
        username: username.toLowerCase(),
        bio: bio.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        birthday: birthday.trim() || undefined,
        status: status.trim() || undefined,
      });
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось завершить регистрацию");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primary + "20" }]}>
              <ThemedText style={styles.avatarEmoji}>👋</ThemedText>
            </View>
            <ThemedText type="h2" style={styles.title}>
              Привет, {firstName}!
            </ThemedText>
            <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
              Настрой свой профиль
            </ThemedText>
          </View>

          {/* Username Field */}
          <View style={styles.fieldContainer}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Username * (уникальный)
            </ThemedText>
            <View style={styles.inputWrapper}>
              <ThemedText style={[styles.usernamePrefix, { color: theme.textSecondary }]}>@</ThemedText>
              <TextInput
                style={[
                  styles.usernameInput,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: usernameError 
                      ? Colors.light.error 
                      : usernameAvailable 
                        ? Colors.light.success 
                        : theme.border,
                  },
                ]}
                placeholder="your_username"
                placeholderTextColor={theme.textSecondary}
                value={username}
                onChangeText={(text) => {
                  setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                  setUsernameAvailable(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.usernameStatus}>
                {isCheckingUsername && (
                  <ActivityIndicator size="small" color={theme.primary} />
                )}
                {!isCheckingUsername && usernameAvailable === true && (
                  <Feather name="check-circle" size={20} color={Colors.light.success} />
                )}
                {!isCheckingUsername && usernameAvailable === false && (
                  <Feather name="x-circle" size={20} color={Colors.light.error} />
                )}
              </View>
            </View>
            {usernameError && (
              <ThemedText style={[styles.errorText, { color: Colors.light.error }]}>
                {usernameError}
              </ThemedText>
            )}
          </View>

          {/* Bio Field */}
          <View style={styles.fieldContainer}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              О себе (необязательно)
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Расскажи о себе..."
              placeholderTextColor={theme.textSecondary}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Status Field */}
          <View style={styles.fieldContainer}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Статус (необязательно)
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
              placeholder="Например: Учусь на отлично 📚"
              placeholderTextColor={theme.textSecondary}
              value={status}
              onChangeText={setStatus}
            />
          </View>

          {/* Phone Field */}
          <View style={styles.fieldContainer}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Телефон (необязательно)
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
              placeholder="+7 999 123 45 67"
              placeholderTextColor={theme.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Birthday Field */}
          <View style={styles.fieldContainer}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              День рождения (необязательно)
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
              placeholder="01.01.2000"
              placeholderTextColor={theme.textSecondary}
              value={birthday}
              onChangeText={setBirthday}
            />
          </View>

          {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              disabled={isLoading || !usernameAvailable || isCheckingUsername}
              style={[
                styles.submitButton,
                { backgroundColor: usernameAvailable ? theme.primary : theme.textSecondary },
              ]}
            >
              {isLoading ? "Сохранение..." : "Завершить регистрацию"}
            </Button>

          {/* Skip Button */}
          <Pressable
            onPress={() => {
              // Пропустить с дефолтным username
              const defaultUsername = `user_${userId}`;
              completeRegistration(userId, { username: defaultUsername });
            }}
            style={styles.skipButton}
          >
            <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
              Пропустить (username будет user_{userId})
            </ThemedText>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  usernamePrefix: {
    position: "absolute",
    left: 16,
    fontSize: 16,
    zIndex: 1,
  },
  usernameInput: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingLeft: 32,
    paddingRight: 44,
    fontSize: 16,
  },
  usernameStatus: {
    position: "absolute",
    right: 14,
  },
  input: {
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: Spacing.md,
  },
  errorText: {
    fontSize: 12,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  skipButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  skipText: {
    fontSize: 14,
  },
});
