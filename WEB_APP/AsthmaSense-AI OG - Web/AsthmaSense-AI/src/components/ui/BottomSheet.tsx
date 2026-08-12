import React, { useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { radius } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetRef {
  expand: () => void;
  collapse: () => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  snapHeight?: number;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  ({ children, snapHeight = 400 }, ref) => {
    const { colors, isDark } = useTheme();
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    const [isVisible, setIsVisible] = useState(false);

    const expand = useCallback(() => {
      setIsVisible(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    }, []);

    const collapse = useCallback(() => {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      setTimeout(() => setIsVisible(false), 220);
    }, []);

    useImperativeHandle(ref, () => ({ expand, collapse }));

    const sheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    if (!isVisible) return null;

    return (
      <>
        <TouchableWithoutFeedback onPress={collapse}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: snapHeight,
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
            },
            sheetStyle,
          ]}
        >
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 101,
    borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.12)',
    padding: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
});
