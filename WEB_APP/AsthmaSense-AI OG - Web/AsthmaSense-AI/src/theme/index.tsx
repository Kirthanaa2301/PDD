import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Color Palette ───────────────────────────────────────────────────────────

export const palette = {
  accent: '#4A9EFF', // Primary blue (dark)
  mint: '#34C785',
  amber: '#F5A623',
  danger: '#FF4D4D',
  white: '#FFFFFF',
  black: '#000000',
};

export const darkColors = {
  bg: '#070B12',
  surface: '#0D1420',
  card: '#131C2E',
  cardBorder: 'rgba(74, 158, 255, 0.10)',
  text: '#E8EEFF',
  textSub: '#6B7FA0',
  accentDim: 'rgba(74, 158, 255, 0.12)',
  accent: '#4A9EFF',
  mint: '#34C785',
  amber: '#F5A623',
  danger: '#FF4D4D',
  accentTint: 'rgba(74, 158, 255, 0.12)',
  mintTint: 'rgba(52, 199, 133, 0.12)',
  amberTint: 'rgba(245, 166, 35, 0.12)',
  dangerTint: 'rgba(255, 77, 77, 0.12)',
  purpleTint: 'rgba(175, 82, 222, 0.12)',
};

export const lightColors = {
  bg: '#EEF3FF', // Consistent light blue background
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: 'rgba(74, 158, 255, 0.15)',
  text: '#0A1628',
  textSub: '#556070',
  accentDim: 'rgba(43, 127, 221, 0.08)',
  accent: '#2B7FDD',
  mint: '#1B9E60',
  amber: '#C47D0E',
  danger: '#D93025',
  accentTint: 'rgba(43, 127, 221, 0.08)',
  mintTint: 'rgba(27, 158, 96, 0.10)',
  amberTint: 'rgba(196, 125, 14, 0.10)',
  dangerTint: 'rgba(217, 48, 37, 0.10)',
  purpleTint: 'rgba(175, 82, 222, 0.08)',
};

export type ColorTheme = typeof darkColors;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 14, // Cards: borderRadius: 14 (0.875rem)
  xl: 24,
  pill: 999,
} as const;

// ─── Typography (Inter — sole typeface, weights 400–700) ─────────────────────

/** Matches Google Fonts / --font-sans: Inter 400, 500, 600, 700 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  displayLg: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 48,
  },
  displayMd: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  displaySm: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
  },
  displayXs: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: 30,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  subheading: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMd: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
  },
  tiny: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
  },
} as const;

// ─── Animation Configs (Non-Spring Timing Presets) ───────────────────────────

export const timings = {
  fast: { duration: 150 },
  normal: { duration: 200 }, // Standard timing: 200ms
  slow: { duration: 300 },
} as const;

// ─── Theme Context ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'asthmasense_theme';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ColorTheme;
  isDark: boolean;
  toggleTheme: () => void;
  bgAnim: Animated.Value;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
  bgAnim: new Animated.Value(1),
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('light');
  const bgAnim = useRef(new Animated.Value(1)).current;

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
        bgAnim.setValue(saved === 'dark' ? 0 : 1);
      } else {
        setMode('light');
        bgAnim.setValue(1);
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next);
      Animated.timing(bgAnim, {
        toValue: next === 'dark' ? 0 : 1,
        duration: 200, // Replaced spring/slow transition with standard 200ms
        useNativeDriver: false,
      }).start();
      return next;
    });
  }, [bgAnim]);

  const colors = mode === 'dark' ? darkColors : lightColors;
  const isDark = mode === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, toggleTheme, bgAnim }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
