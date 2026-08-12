import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { radius } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  pressScale?: number;
  accentBar?: boolean;
  accentBarColor?: string;
  noPadding?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Card({
  children,
  style,
  onPress,
  pressScale = 0.97,
  accentBar = false,
  accentBarColor,
  noPadding = false,
}: CardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withTiming(pressScale, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    }
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  };

  const cardContent = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderRadius: radius.lg, // 16
          padding: noPadding ? 0 : 16,
        },
        style as ViewStyle,
      ]}
    >
      {accentBar && (
        <View
          style={[
            styles.accentBar,
            { backgroundColor: accentBarColor || colors.accent },
          ]}
        />
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={animStyle}
      >
        {cardContent}
      </AnimatedTouchable>
    );
  }

  return <Animated.View style={animStyle}>{cardContent}</Animated.View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
    // Consistent shadow/elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
});
