import { useRef } from 'react';
import { Animated } from 'react-native';

interface ScrollHeaderOptions {
  expandedHeight?: number;
  collapsedHeight?: number;
  scrollThreshold?: number;
}

export function useScrollHeader({
  expandedHeight = 80,
  collapsedHeight = 56,
  scrollThreshold = 60,
}: ScrollHeaderOptions = {}) {
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, scrollThreshold],
    outputRange: [expandedHeight, collapsedHeight],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, scrollThreshold * 0.5, scrollThreshold],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [scrollThreshold * 0.5, scrollThreshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  return { scrollY, headerHeight, headerOpacity, titleOpacity, onScroll };
}
