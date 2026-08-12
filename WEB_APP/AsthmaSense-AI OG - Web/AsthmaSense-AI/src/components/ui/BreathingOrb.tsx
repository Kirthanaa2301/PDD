import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface BreathingOrbProps {
  size?: number;
  color?: string;
  phase?: 'inhale' | 'hold' | 'exhale' | 'idle';
  animated?: boolean;
  targetScale?: number;
  children?: React.ReactNode;
}

export function BreathingOrb({
  size = 120,
  color = '#4A9EFF',
  phase = 'idle',
  animated = true,
  targetScale,
  children,
}: BreathingOrbProps) {
  const scale = useSharedValue(1);
  const outerOpacity = useSharedValue(0.12);
  const midOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (!animated) {
      scale.value = 1;
      return;
    }

    if (phase === 'idle') {
      // Gentle idle pulse
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      outerOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 2000 }),
          withTiming(0.08, { duration: 2000 })
        ),
        -1,
        false
      );
    } else if (phase === 'inhale') {
      const target = targetScale ?? 1.35;
      scale.value = withTiming(target, {
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
      });
      outerOpacity.value = withTiming(0.25, { duration: 4000 });
      midOpacity.value = withTiming(0.45, { duration: 4000 });
    } else if (phase === 'hold') {
      // Pulse outer ring while holding
      outerOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 600 }),
          withTiming(0.8, { duration: 600 })
        ),
        -1,
        true
      );
    } else if (phase === 'exhale') {
      scale.value = withTiming(1, {
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
      });
      outerOpacity.value = withTiming(0.12, { duration: 4000 });
      midOpacity.value = withTiming(0.3, { duration: 4000 });
    }
  }, [phase, animated]);

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const outerStyle = useAnimatedStyle(() => ({
    opacity: outerOpacity.value,
    transform: [{ scale: scale.value * 1.33 }],
  }));

  const midStyle = useAnimatedStyle(() => ({
    opacity: midOpacity.value,
    transform: [{ scale: scale.value * 1.16 }],
  }));

  return (
    <View style={{ width: size * 1.5, height: size * 1.5, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: color,
          },
          outerStyle,
        ]}
      />
      {/* Mid ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 1.25,
            height: size * 1.25,
            borderRadius: size * 0.625,
            backgroundColor: color,
            position: 'absolute',
          },
          midStyle,
        ]}
      />
      {/* Inner circle */}
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: 0.6,
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
          },
          innerStyle,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
  },
});
