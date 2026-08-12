import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type Props = { text: string; onPress?: () => void };

export function SecondaryButton({ text, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 52,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.primaryBlue,
    fontSize: 16,
    fontWeight: '600',
  },
});
