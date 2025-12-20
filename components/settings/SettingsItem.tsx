import React from 'react';
import { View, StyleSheet, Pressable, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface SettingsItemProps {
  icon: string;
  label: string;
  value?: string | boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
  type?: 'navigation' | 'switch' | 'display';
  color?: string;
}

export function SettingsItem({
  icon,
  label,
  value,
  onPress,
  onValueChange,
  type = 'navigation',
  color,
}: SettingsItemProps) {
  const { theme } = useTheme();

  const renderValue = () => {
    if (type === 'switch' && typeof value === 'boolean') {
      return (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.primary + '60' }}
          thumbColor={value ? theme.primary : theme.textSecondary}
        />
      );
    }

    if (type === 'display' && typeof value === 'string') {
      return (
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {value}
        </ThemedText>
      );
    }

    if (type === 'navigation') {
      return (
        <>
          {typeof value === 'string' && (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {value}
            </ThemedText>
          )}
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </>
      );
    }

    return null;
  };

  const Container = type === 'switch' ? View : Pressable;
  const containerProps =
    type === 'switch'
      ? {}
      : {
          onPress,
          style: ({ pressed }: { pressed: boolean }) => [
            styles.container,
            { opacity: pressed ? 0.7 : 1, borderBottomColor: theme.border },
          ],
        };

  return (
    <Container {...containerProps} style={[styles.container, { borderBottomColor: theme.border }]}>
      <Feather name={icon as any} size={20} color={color || theme.textSecondary} />
      <ThemedText type="body" style={styles.label}>
        {label}
      </ThemedText>
      {renderValue()}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  label: {
    flex: 1,
  },
});
