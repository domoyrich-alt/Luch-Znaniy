import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов');
      return;
    }

    // В реальном приложении здесь будет API запрос
    Alert.alert('Успешно', 'Пароль изменён');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formGroup}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Текущий пароль
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Введите текущий пароль"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Новый пароль
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Введите новый пароль"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Подтвердите пароль
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Повторите новый пароль"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
          />
        </View>

        <Button onPress={handleChangePassword} style={{ marginTop: Spacing.lg }}>
          Изменить пароль
        </Button>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  formGroup: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
});
