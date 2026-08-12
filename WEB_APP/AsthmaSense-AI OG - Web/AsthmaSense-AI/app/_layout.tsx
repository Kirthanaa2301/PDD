import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import Octicons from '@expo/vector-icons/Octicons';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../src/theme';
import { Platform } from 'react-native';

SplashScreen.preventAutoHideAsync();

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const iconFontStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    @font-face {
      font-family: 'Inter_400Regular';
      src: local('Inter'), local('Inter Regular'), url('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2') format('woff2');
      font-display: swap;
    }
    @font-face {
      font-family: 'Inter_500Medium';
      src: local('Inter Medium'), url('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2') format('woff2');
      font-display: swap;
    }
    @font-face {
      font-family: 'Inter_600SemiBold';
      src: local('Inter SemiBold'), url('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2') format('woff2');
      font-display: swap;
    }
    @font-face {
      font-family: 'Inter_700Bold';
      src: local('Inter Bold'), url('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2') format('woff2');
      font-display: swap;
    }

    @font-face {
      font-family: 'Feather';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'Ionicons';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'MaterialCommunityIcons';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'Material Icons';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'FontAwesome';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'FontAwesome5Free-Solid';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'FontAwesome5Free-Regular';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'FontAwesome6Free-Solid';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Solid.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'FontAwesome6Free-Regular';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Regular.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'anticon';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'simple-line-icons';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/SimpleLineIcons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'Octicons';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/Octicons.ttf') format('truetype');
      font-display: swap;
    }

    body, html {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }

    /* Vector icon fonts preserved */
    [style*="font-family: Feather"], [class*="r-fontFamily-Feather"] {
      font-family: 'Feather' !important;
    }
    [style*="font-family: Ionicons"], [class*="r-fontFamily-Ionicons"] {
      font-family: 'Ionicons' !important;
    }
    [style*="font-family: MaterialCommunityIcons"], [class*="r-fontFamily-MaterialCommunityIcons"] {
      font-family: 'MaterialCommunityIcons' !important;
    }
    [style*="font-family: Material Icons"], [class*="r-fontFamily-MaterialIcons"] {
      font-family: 'Material Icons' !important;
    }
    [style*="font-family: FontAwesome"], [class*="r-fontFamily-FontAwesome"] {
      font-family: 'FontAwesome' !important;
    }
    [style*="font-family: FontAwesome5Free-Solid"], [class*="r-fontFamily-FontAwesome5Free-Solid"] {
      font-family: 'FontAwesome5Free-Solid' !important;
    }
  `;
  if (!document.getElementById('expo-vector-icons-css')) {
    const style = document.createElement('style');
    style.id = 'expo-vector-icons-css';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(iconFontStyles));
    document.head.appendChild(style);
  }
}

import { useAuthStore, syncUserDataFromBackend } from '../src/store';

function RootLayoutNav() {
  const { isDark } = useTheme();
  const checkLoginStreak = useAuthStore((s: any) => s.checkLoginStreak);
  const token = useAuthStore((s: any) => s.token);
  const segments = useSegments();
  const _hydrated = useAuthStore((s: any) => s._hydrated);

  useEffect(() => {
    if (!_hydrated) return;
    
    const inTabsGroup = segments[0] === '(tabs)';
    
    if (!token && inTabsGroup) {
      const t = setTimeout(() => {
        try {
          router.replace('/');
        } catch (_) {}
      }, 50);
      return () => clearTimeout(t);
    }
  }, [token, _hydrated, segments]);

  useEffect(() => {
    checkLoginStreak();
    if (token) {
      syncUserDataFromBackend().catch(() => {});
    }
  }, [checkLoginStreak, token]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(auth)/forgot-password" />
        <Stack.Screen name="(auth)/questionnaire" />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen
          name="breathing/analysis"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="breathing/[id]"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="tracking/[symptom]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Feather.font,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    ...MaterialIcons.font,
    ...FontAwesome.font,
    ...FontAwesome5.font,
    ...FontAwesome6.font,
    ...AntDesign.font,
    ...SimpleLineIcons.font,
    ...Octicons.font,
  });

  const _hydrated = useAuthStore((s: any) => s._hydrated);
  const isWeb = Platform.OS === 'web';
  const ready = isWeb || (fontsLoaded && _hydrated);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready && !isWeb) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
