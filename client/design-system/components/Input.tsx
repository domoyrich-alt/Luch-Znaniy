/**
 * DESIGN SYSTEM - INPUT
 * Styled input field component
 */

import React, { useState } from 'react';
import { 
  TextInput, 
  View, 
  Text, 
  StyleSheet, 
  TextInputProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { BorderRadius, Spacing } from '../tokens/spacing';
import { Typography } from '../tokens/typography';
import { ThemeColors, SemanticColors } from '../tokens/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error 
    ? SemanticColors.feedback.error.border
    : isFocused 
    ? '#8B5CF6' 
    : ThemeColors.dark.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      {/* Input container */}
      <View 
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {/* Left icon */}
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}

        {/* Text input */}
        <TextInput
          {...props}
          style={[styles.input, style]}
          placeholderTextColor={ThemeColors.dark.textTertiary}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        />

        {/* Right icon */}
        {rightIcon && (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        )}
      </View>

      {/* Error or hint text */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label.large,
    color: ThemeColors.dark.text,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: ThemeColors.dark.border,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
  },
  inputContainerFocused: {
    borderColor: '#8B5CF6',
    backgroundColor: ThemeColors.dark.backgroundTertiary,
  },
  inputContainerError: {
    borderColor: SemanticColors.feedback.error.border,
  },
  input: {
    flex: 1,
    ...Typography.body.medium,
    color: ThemeColors.dark.text,
    paddingVertical: 0,
  },
  iconContainer: {
    marginHorizontal: Spacing.sm,
  },
  errorText: {
    ...Typography.label.medium,
    color: SemanticColors.feedback.error.text,
    marginTop: Spacing.xs,
  },
  hintText: {
    ...Typography.label.medium,
    color: ThemeColors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
});
