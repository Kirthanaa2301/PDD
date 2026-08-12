import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const LEVELS = ['None', 'Mild', 'Moderate', 'Severe'] as const;
const LEVEL_COLORS = ['#9E9E9E', colors.mildColor, colors.moderateColor, colors.severeColor];

type Props = {
  selected: string;
  onSelect: (value: string) => void;
};

export function SeveritySelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {LEVELS.map((level, i) => {
        const isSelected = selected === level;
        const c = LEVEL_COLORS[i];
        return (
          <Pressable
            key={level}
            onPress={() => onSelect(level)}
            style={[
              styles.item,
              { backgroundColor: isSelected ? c : `${c}26` },
            ]}
          >
            <Text style={[styles.text, { color: isSelected ? colors.textLight : c }]}>
              {level}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  item: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: { fontSize: 12, fontWeight: '600' },
});
