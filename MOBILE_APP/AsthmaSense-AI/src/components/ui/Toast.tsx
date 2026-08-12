import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { radius, typography } from '../../theme';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const ICONS: Record<ToastVariant, keyof typeof Feather.glyphMap> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
  warning: 'alert-triangle',
};

export function Toast({
  message,
  variant = 'info',
  visible,
  onHide,
  duration = 3000,
}: ToastProps) {
  const { colors } = useTheme();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      timer.current = setTimeout(onHide, duration);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [visible]);

  if (!visible) return null;

  const variantColors = {
    success: colors.mint,
    error: colors.danger,
    info: colors.accent,
    warning: colors.amber,
  };

  const color = variantColors[variant];

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: color,
          borderRadius: radius.md,
        },
      ]}
    >
      <Feather name={ICONS[variant]} size={18} color={color} />
      <Text
        style={[
          typography.label,
          { color: colors.text, marginLeft: 10, flex: 1 },
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
