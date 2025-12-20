import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, updateUserProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');

  const handleSave = () => {
    if (updateUserProfile) {
      updateUserProfile({ firstName, lastName });
      Alert.alert('Успешно', 'Профиль обновлён');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formGroup}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Имя
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Введите имя"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Фамилия
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Введите фамилию"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <Button onPress={handleSave} style={{ marginTop: Spacing.lg }}>
          Сохранить
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
