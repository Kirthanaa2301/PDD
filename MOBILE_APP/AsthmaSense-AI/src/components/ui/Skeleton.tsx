import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { radius } from '../../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * (typeof width === 'number' ? width : 300) }],
  }));

  const baseColor = isDark ? '#1A2235' : '#E8EDF5';
  const shimmerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)';

  return (
    <View
      style={[
        styles.container,
        { width: width as any, height, borderRadius, backgroundColor: baseColor },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: shimmerColor },
          shimmerStyle,
        ]}
      />
    </View>
  );
}

export function CardSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      <Skeleton width={160} height={14} borderRadius={7} style={{ marginBottom: 12 }} />
      <Skeleton width="90%" height={10} borderRadius={5} style={{ marginBottom: 8 }} />
      <Skeleton width="70%" height={10} borderRadius={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
});
