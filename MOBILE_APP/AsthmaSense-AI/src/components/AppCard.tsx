import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { cardShadow } from '../theme/shadows';

type Props = {
  children: React.ReactNode;
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  borderRadius?: number;
  color?: string;
  style?: ViewStyle;
};

export function AppCard({
  children,
  padding = 16,
  paddingHorizontal,
  paddingVertical,
  borderRadius = 16,
  color = colors.cardWhite,
  style,
}: Props) {
  return (
    <View
      style={[
        styles.card,
        cardShadow,
        {
          padding,
          paddingHorizontal,
          paddingVertical,
          borderRadius,
          backgroundColor: color,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
