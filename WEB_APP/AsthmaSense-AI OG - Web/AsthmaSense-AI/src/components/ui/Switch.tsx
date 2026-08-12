import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  size?: 'sm' | 'md';
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Switch({ value, onValueChange, size = 'md' }: SwitchProps) {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const progress = useSharedValue(value ? 1 : 0);

  const trackWidth = size === 'md' ? 50 : 40;
  const trackHeight = size === 'md' ? 28 : 22;
  const thumbSize = size === 'md' ? 22 : 18;
  const thumbOffset = size === 'md' ? 3 : 2;
  const thumbTravel = trackWidth - thumbSize - thumbOffset * 2;

  React.useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * thumbTravel }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.card, colors.accent]
    ),
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        haptics.light();
        onValueChange(!value);
      }}
    >
      <AnimatedView
        style={[
          styles.track,
          { width: trackWidth, height: trackHeight, borderRadius: trackHeight / 2 },
          trackStyle,
        ]}
      >
        <AnimatedView
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              top: thumbOffset,
              left: thumbOffset,
            },
            thumbStyle,
          ]}
        />
      </AnimatedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
