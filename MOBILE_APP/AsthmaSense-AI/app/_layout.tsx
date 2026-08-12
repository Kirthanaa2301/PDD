import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../src/theme';

SplashScreen.preventAutoHideAsync();

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
      router.replace('/');
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
  });

  const _hydrated = useAuthStore((s: any) => s._hydrated);

  const ready = fontsLoaded && _hydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
