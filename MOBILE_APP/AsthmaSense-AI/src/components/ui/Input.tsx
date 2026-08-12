import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { radius, typography } from '../../theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
  showCharCount?: boolean;
  maxLength?: number;
  containerStyle?: object;
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

export function Input({
  label,
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  showCharCount = false,
  maxLength,
  containerStyle,
  value = '',
  onChangeText,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value as string);

  const labelY = useSharedValue(internalValue ? -22 : 0);
  const labelScale = useSharedValue(internalValue ? 0.78 : 1);
  const borderHeight = useSharedValue(internalValue ? 2 : 0);
  const shakeX = useSharedValue(0);

  const hasValue = internalValue.length > 0 || (value as string).length > 0;

  const handleFocus = useCallback((e: any) => {
    setFocused(true);
    labelY.value = withTiming(-22, { duration: 200 });
    labelScale.value = withTiming(0.78, { duration: 200 });
    borderHeight.value = withTiming(2, { duration: 250 });
    onFocus?.(e);
  }, []);

  const handleBlur = useCallback((e: any) => {
    setFocused(false);
    if (!hasValue) {
      labelY.value = withTiming(0, { duration: 200 });
      labelScale.value = withTiming(1, { duration: 200 });
    }
    borderHeight.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  }, [hasValue]);

  const handleChangeText = useCallback((text: string) => {
    setInternalValue(text);
    onChangeText?.(text);
  }, [onChangeText]);

  // Trigger shake on error
  React.useEffect(() => {
    if (error) {
      shakeX.value = withSequence(
        withTiming(6, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
    }
  }, [error]);

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: labelY.value },
      { scale: labelScale.value },
    ],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    height: borderHeight.value,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const borderColor = error ? colors.danger : focused ? colors.accent : colors.cardBorder;
  const labelColor = error ? colors.danger : focused ? colors.accent : colors.textSub;

  return (
    <AnimatedView style={[shakeStyle, containerStyle]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor,
            borderWidth: 1,
            borderRadius: radius.md,
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIcon}>
            <Feather
              name={leftIcon}
              size={18}
              color={error ? colors.danger : focused ? colors.accent : colors.textSub}
            />
          </View>
        )}

        <View style={styles.inputWrapper}>
          <Animated.Text
            style={[
              styles.label,
              { color: labelColor, left: leftIcon ? 0 : 4 },
              labelStyle,
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            value={internalValue || (value as string)}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.input,
              {
                color: colors.text,
                fontFamily: 'Inter_400Regular',
              },
            ]}
            placeholderTextColor={colors.textSub}
            maxLength={maxLength}
            {...rest}
          />
        </View>

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            <Feather name={rightIcon} size={18} color={colors.textSub} />
          </TouchableOpacity>
        )}

        {/* Accent bottom border */}
        <Animated.View
          style={[
            styles.accentBorder,
            { backgroundColor: error ? colors.danger : colors.accent },
            borderStyle,
          ]}
        />
      </View>

      {/* Error or char count row */}
      <View style={styles.meta}>
        {error ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        ) : (
          <View />
        )}
        {showCharCount && maxLength && (
          <Text style={[styles.charCount, { color: colors.textSub }]}>
            {internalValue.length}/{maxLength}
          </Text>
        )}
      </View>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  leftIcon: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 8,
  },
  label: {
    position: 'absolute',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    transformOrigin: 'left center',
  },
  input: {
    fontSize: 15,
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  rightIcon: {
    paddingRight: 16,
    paddingLeft: 8,
  },
  accentBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  charCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
