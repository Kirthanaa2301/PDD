import React, { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';

type TabName = 'index' | 'breathing' | 'tracking' | 'analysis' | 'reports' | 'profile';

const TAB_CONFIG: Array<{
  name: TabName;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  iconSize: number;
}> = [
  { name: 'index', label: 'Home', icon: 'home', iconSize: 20 },
  { name: 'breathing', label: 'Breathing', icon: 'wind', iconSize: 20 },
  { name: 'tracking', label: 'Tracking', icon: 'activity', iconSize: 20 },
  { name: 'analysis', label: 'Analysis', icon: 'mic', iconSize: 20 },
  { name: 'reports', label: 'Reports', icon: 'bar-chart-2', iconSize: 20 },
  { name: 'profile', label: 'Profile', icon: 'user', iconSize: 20 },
];

function TabIcon({
  focused,
  icon,
  iconSize,
  color,
}: {
  focused: boolean;
  icon: keyof typeof Feather.glyphMap;
  iconSize: number;
  color: string;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Non-spring transition on focus press
    scale.value = withTiming(focused ? 1.08 : 1, {
      duration: 180,
      easing: Easing.out(Easing.ease),
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Feather name={icon} size={iconSize} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true, // Auto hide when keyboard is shown
        tabBarActiveTintColor: colors.accent, // Dynamic theme accent
        tabBarInactiveTintColor: colors.textSub, // Dynamic textSub
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 80,
          paddingBottom: Platform.OS === 'ios' ? 26 : 18,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.cardBorder,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 1,
          fontFamily: 'Inter_500Medium',
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                focused={focused}
                icon={tab.icon}
                iconSize={tab.iconSize}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
