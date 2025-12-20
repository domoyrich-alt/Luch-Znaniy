import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const PRESET_COLORS = [
  '#4A90E2', // Синий
  '#E24A4A', // Красный
  '#4AE290', // Зелёный
  '#E2C84A', // Жёлтый
  '#A84AE2', // Фиолетовый
  '#E24A90', // Розовый
  '#4AE2E2', // Голубой
  '#E2904A', // Оранжевый
];

export function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="body" style={styles.title}>
        Акцентный цвет
      </ThemedText>
      <View style={styles.colorsGrid}>
        {PRESET_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => onSelectColor(color)}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColor,
            ]}
          >
            {selectedColor === color && (
              <View style={styles.checkmark}>
                <ThemedText type="h4" style={{ color: '#FFFFFF' }}>
                  ✓
                </ThemedText>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  title: {
    fontWeight: '600',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkmark: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
