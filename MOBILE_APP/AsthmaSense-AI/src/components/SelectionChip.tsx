import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

export function SelectionChip({ label, isSelected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? colors.primaryBlue : colors.cardWhite,
          borderColor: isSelected ? colors.primaryBlue : `${colors.primaryBlue}4D`,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: isSelected ? colors.textLight : colors.textDark },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: { fontWeight: '500', fontSize: 14 },
});
