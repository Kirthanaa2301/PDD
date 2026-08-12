import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { radius, typography } from '../../theme';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const { colors } = useTheme();
  const pulse = useSharedValue(1);

  const isUrgent = level === 'HIGH' || level === 'SEVERE';

  useEffect(() => {
    if (isUrgent) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 700 }),
          withTiming(1, { duration: 700 })
        ),
        -1,
        false
      );
    }
  }, [isUrgent]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const config: Record<RiskLevel, { color: string; bg: string; border: string }> = {
    LOW: {
      color: colors.mint,
      bg: colors.mintTint,
      border: `${colors.mint}40`,
    },
    MODERATE: {
      color: colors.amber,
      bg: colors.amberTint,
      border: `${colors.amber}40`,
    },
    HIGH: {
      color: colors.danger,
      bg: colors.dangerTint,
      border: `${colors.danger}40`,
    },
    SEVERE: {
      color: colors.danger,
      bg: `${colors.danger}25`,
      border: colors.danger,
    },
  };

  const { color, bg, border } = config[level];

  const fontSize = { sm: 11, md: 13, lg: 15 }[size];
  const padding = { sm: 6, md: 10, lg: 14 }[size];

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingHorizontal: padding + 4,
          paddingVertical: padding / 2,
          borderRadius: radius.pill,
        },
        isUrgent && pulseStyle,
      ]}
    >
      <Text
        style={[
          typography.label,
          { color, fontSize, fontFamily: 'Inter_700Bold' },
        ]}
      >
        {level}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
