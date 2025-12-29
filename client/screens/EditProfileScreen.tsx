import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { getApiUrl } from '@/lib/query-client';
import { Spacing, BorderRadius } from '@/constants/theme';

const isProbablyRemoteUrl = (value: string) => /^https?:\/\//i.test(value) || value.startsWith('/uploads/');

const makeAbsoluteUrl = (maybeRelative: string) => {
  if (!maybeRelative) return '';
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
  try {
    return new URL(maybeRelative, getApiUrl()).toString();
  } catch {
    return maybeRelative;
  }
};

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { settings, updateProfileSettings } = useSettings();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(settings.profile.avatar || '');
  const [displayName, setDisplayName] = useState(settings.profile.displayName || user?.name || '');
  const [username, setUsername] = useState('');
    useEffect(() => {
      const loadUsername = async () => {
        if (!user?.id) return;
        try {
          const url = new URL(`/api/user/${user.id}/profile`, getApiUrl()).toString();
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          if (data?.username) {
            setUsername(String(data.username).replace(/^@+/, ''));
          }
        } catch {
          // ignore
        }
      };
      loadUsername();
    }, [user?.id]);

  const [bio, setBio] = useState(settings.profile.bio || '');
  const [status, setStatus] = useState(settings.profile.status || '');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее в настройках');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Ошибка', 'Введите имя');
      return;
    }

    const normalizedUsername = username.trim().replace(/^@+/, '');
    if (normalizedUsername.length > 0) {
      // username: 3-20, латиница/цифры/underscore
      if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
        Alert.alert('Ошибка', 'Username должен быть от 3 до 20 символов');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
        Alert.alert('Ошибка', 'Username: только латинские буквы, цифры и _');
        return;
      }
    }

    setLoading(true);
    try {
      let uploadedAvatarUrl: string | null = null;

      // Если аватар выбран локально — загрузим на сервер и будем хранить URL
      if (avatar && !isProbablyRemoteUrl(avatar)) {
        const form = new FormData();
        form.append('file', {
          uri: avatar,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);

        const uploadUrl = new URL('/api/upload', getApiUrl()).toString();
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          body: form,
          // Важно: не задаём Content-Type вручную, чтобы boundary проставился корректно
        });

        if (!uploadRes.ok) {
          const text = await uploadRes.text();
          throw new Error(text || 'Failed to upload avatar');
        }

        const uploadData = await uploadRes.json();
        if (uploadData?.fileUrl) {
          uploadedAvatarUrl = String(uploadData.fileUrl);
        }
      } else if (avatar && avatar.startsWith('/uploads/')) {
        uploadedAvatarUrl = avatar;
      }

      const avatarForSettings = uploadedAvatarUrl ? makeAbsoluteUrl(uploadedAvatarUrl) : avatar;

      await updateProfileSettings({
        displayName: displayName.trim(),
        bio: bio.trim(),
        status: status.trim(),
        avatar: avatarForSettings,
      });

      // Сохраняем username на сервере (если пользователь залогинен)
      if (user?.id) {
        const body: any = {
          status: status.trim(),
        };
        if (normalizedUsername.length > 0) {
          body.username = normalizedUsername;
        }

        if (uploadedAvatarUrl) {
          body.avatarUrl = uploadedAvatarUrl;
        }

        // Примечание: backend в проекте принимает PATCH без токена (по userId), как при регистрации
        const url = new URL(`/api/user/${user.id}/profile`, getApiUrl()).toString();
        const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to update profile');
        }
      }

      Alert.alert('Успешно', 'Профиль обновлён');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Хедер */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Редактировать профиль</ThemedText>
        <Pressable style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Feather name="check" size={24} color={theme.primary} />
          )}
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content}>
        {/* Аватар */}
        <Pressable style={styles.avatarSection} onPress={pickImage}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <ThemedText style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || '?'}
              </ThemedText>
            )}
          </View>
          <View style={[styles.avatarEditBadge, { backgroundColor: theme.primary }]}>
            <Feather name="camera" size={16} color="#FFFFFF" />
          </View>
          <ThemedText style={[styles.avatarHint, { color: theme.primary }]}>
            Изменить фото
          </ThemedText>
        </Pressable>

        {/* Поля ввода */}
        <View style={styles.form}>
          {/* Username */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Username
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Например: ivan_123"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
              Будет отображаться как @{username.trim().replace(/^@+/, '') || 'username'}
            </ThemedText>
          </View>

          {/* Имя */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Отображаемое имя
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Введите имя"
              placeholderTextColor={theme.textSecondary}
              maxLength={50}
            />
            <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
              {displayName.length}/50
            </ThemedText>
          </View>

          {/* Статус */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Статус
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              value={status}
              onChangeText={setStatus}
              placeholder="Ваш статус"
              placeholderTextColor={theme.textSecondary}
              maxLength={100}
            />
            <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
              {status.length}/100
            </ThemedText>
          </View>

          {/* О себе */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              О себе
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.backgroundSecondary, color: theme.text },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Расскажите о себе..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={300}
              textAlignVertical="top"
            />
            <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
              {bio.length}/300
            </ThemedText>
          </View>
        </View>

        {/* Информация */}
        <View style={[styles.infoSection, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="info" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Эта информация будет видна другим пользователям приложения
          </ThemedText>
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '600',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 24,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    marginTop: Spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {},
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  input: {
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  hint: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: Spacing.xs,
    marginRight: Spacing.xs,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
