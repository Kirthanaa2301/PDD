import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { radius, typography } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonState = 'default' | 'loading' | 'success' | 'disabled';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: ButtonState;
  fullWidth?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  iconRight?: boolean;
}

const SIZE_HEIGHT = { sm: 36, md: 48, lg: 56 };
const SIZE_FONT = { sm: 13, md: 15, lg: 16 };
const SIZE_ICON = { sm: 14, md: 16, lg: 18 };

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  state = 'default',
  fullWidth = false,
  icon,
  iconRight = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const [buttonState, setButtonState] = useState<ButtonState>(state);

  const isLoading = buttonState === 'loading' || state === 'loading';
  const isSuccess = buttonState === 'success' || state === 'success';
  const isDisabled = buttonState === 'disabled' || state === 'disabled';

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    if (isDisabled || isLoading) return;
    haptics.light();
    scale.value = withTiming(0.97, { duration: 100, easing: Easing.out(Easing.ease) }, () => {
      scale.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.ease) });
    });
    onPress?.();
  }, [isDisabled, isLoading, onPress]);

  const height = isLoading || isSuccess ? SIZE_HEIGHT[size] : SIZE_HEIGHT[size];
  const showIcon = !isLoading && !isSuccess && icon;

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator color="#fff" size="small" />;
    }
    if (isSuccess) {
      return <Feather name="check" size={SIZE_ICON[size] + 4} color="#fff" />;
    }
    return (
      <View style={styles.row}>
        {showIcon && !iconRight && (
          <Feather
            name={icon!}
            size={SIZE_ICON[size]}
            color={variant === 'ghost' ? colors.accent : '#fff'}
            style={{ marginRight: 8 }}
          />
        )}
        <Text
          style={[
            typography.label,
            {
              fontSize: SIZE_FONT[size],
              fontFamily: 'Inter_700Bold',
              color: variant === 'secondary' || variant === 'ghost'
                ? colors.accent
                : variant === 'danger'
                ? '#fff'
                : '#fff',
            },
          ]}
        >
          {label}
        </Text>
        {showIcon && iconRight && (
          <Feather
            name={icon!}
            size={SIZE_ICON[size]}
            color={variant === 'ghost' ? colors.accent : '#fff'}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    );
  };

  const containerStyle = [
    styles.base,
    { height, borderRadius: radius.pill },
    fullWidth && { alignSelf: 'stretch' as const },
    variant === 'secondary' && {
      borderWidth: 1.5,
      borderColor: colors.accent,
      backgroundColor: 'transparent',
    },
    variant === 'ghost' && { backgroundColor: 'transparent' },
    variant === 'danger' && { backgroundColor: colors.danger },
    isDisabled && { opacity: 0.5 },
  ];

  if (variant === 'primary' || variant === 'danger') {
    const gradientColors: [string, string] =
      variant === 'danger'
        ? [colors.danger, '#CC2E24']
        : ['#4A9EFF', '#2D7DD2'];
    return (
      <AnimatedTouchable
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={1}
        style={[animStyle, fullWidth && { alignSelf: 'stretch' }]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={containerStyle}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={1}
      style={[containerStyle, animStyle]}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
