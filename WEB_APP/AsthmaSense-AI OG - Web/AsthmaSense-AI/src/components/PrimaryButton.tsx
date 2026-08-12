import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  text: string;
  onPress?: () => void;
  width?: number | `${number}%`;
  height?: number;
  color?: string;
  style?: ViewStyle;
};

export function PrimaryButton({
  text,
  onPress,
  width = '100%',
  height = 52,
  color = colors.primaryBlue,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width, height, backgroundColor: color, opacity: pressed ? 0.9 : 1 },
        style,
      ]}
    >
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
});
