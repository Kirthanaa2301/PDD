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
