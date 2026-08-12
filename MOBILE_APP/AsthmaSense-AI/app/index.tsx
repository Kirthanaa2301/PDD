import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, radius, spacing, typography } from '../src/theme';
import { useAuthStore } from '../src/store';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const token = useAuthStore((s: any) => s.token);
  const user = useAuthStore((s: any) => s.user);
  const _hydrated = useAuthStore((s: any) => s._hydrated);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { colors, isDark } = useTheme();
  const [slide, setSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Redirect immediately once the store is hydrated — no flash, no delay
  useEffect(() => {
    if (!_hydrated) return;
    
    // If onboarding is already showing/shown, do not auto-redirect on token changes.
    // The Login/Register flow will handle their own delayed redirects.
    if (showOnboarding) return;

    if (token) {
      if (user?.hasCompletedOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/questionnaire');
      }
    } else {
      setShowOnboarding(true);
    }
  }, [_hydrated, token, user, showOnboarding]);

  const orbScale1 = useRef(new Animated.Value(1)).current;
  const orbScale2 = useRef(new Animated.Value(1)).current;
  const orbScale3 = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(16)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const pill1Y = useRef(new Animated.Value(24)).current;
  const pill1Opacity = useRef(new Animated.Value(0)).current;
  const pill2Y = useRef(new Animated.Value(24)).current;
  const pill2Opacity = useRef(new Animated.Value(0)).current;
  const pill3Y = useRef(new Animated.Value(24)).current;
  const pill3Opacity = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    if (!showOnboarding) return;

    // Breathing orb animations — staggered 600ms each
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1.18,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    pulse(orbScale1, 0).start();
    pulse(orbScale2, 600).start();
    pulse(orbScale3, 1200).start();

    // Title fade in
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, delay: 600, useNativeDriver: true }),
      Animated.timing(titleY, { toValue: 0, duration: 600, delay: 600, useNativeDriver: true }),
    ]).start();

    // Tagline
    Animated.timing(taglineOpacity, { toValue: 1, duration: 600, delay: 900, useNativeDriver: true }).start();

    // Feature pills staggered
    const pillAnim = (yVal: Animated.Value, opVal: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(yVal, { toValue: 0, duration: 500, delay, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
        Animated.timing(opVal, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      ]);

    Animated.parallel([
      pillAnim(pill1Y, pill1Opacity, 1200),
      pillAnim(pill2Y, pill2Opacity, 1280),
      pillAnim(pill3Y, pill3Opacity, 1360),
    ]).start();

    // Shimmer loop on CTA button
    Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(shimmerX, { toValue: width, duration: 800, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmerX, { toValue: -width, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [showOnboarding]);

  const handleGetStarted = () => {
    if (slide < 2) {
      const nextSlide = slide + 1;
      setSlide(nextSlide);
      scrollViewRef.current?.scrollTo({ x: nextSlide * width, animated: true });
    } else {
      router.push('/(auth)/login');
    }
  };

  // Don't render anything while hydrating or if logged in (redirect in progress)
  if (!showOnboarding) return null;

  const slides = [
    {
      title: 'AsthmaSense AI',
      subtitle: 'AI-powered breathing insights designed to help you spot patterns early.',
      icon: 'logo' as const,
    },
    {
      title: 'Track triggers & symptoms',
      subtitle: 'Log common triggers, symptoms, and severity to build a clearer health timeline.',
      icon: 'clipboard' as const,
    },
    {
      title: 'Analyze breath audio',
      subtitle: 'Record a short breath/cough sample and get an instant screening summary.',
      icon: 'mic' as const,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newSlide = Math.round(e.nativeEvent.contentOffset.x / width);
          setSlide(newSlide);
        }}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {slides.map((item, idx) => (
          <View key={idx} style={styles.slideContainer}>
            {/* Orb section */}
            <View style={styles.orbContainer}>
              {/* Outer ring */}
              <Animated.View
                style={[
                  styles.orbRing,
                  styles.orbOuter,
                  { transform: [{ scale: orbScale1 }], backgroundColor: `${colors.accent}14` },
                ]}
              />
              {/* Mid ring */}
              <Animated.View
                style={[
                  styles.orbRing,
                  styles.orbMid,
                  { transform: [{ scale: orbScale2 }], backgroundColor: `${colors.accent}22` },
                ]}
              />
              {/* Inner */}
              <Animated.View
                style={[
                  styles.orbRing,
                  styles.orbInner,
                  {
                    transform: [{ scale: orbScale3 }],
                    backgroundColor: item.icon === 'logo' ? (isDark ? '#070B12' : '#ffffff') : colors.accent,
                  },
                ]}
              >
                {item.icon === 'logo' ? (
                  <Image source={isDark ? require('../assets/logo-dark.png') : require('../assets/logo.png')} style={{ width: '85%', height: '85%', borderRadius: 999 }} resizeMode="contain" />
                ) : (
                  <Feather name={item.icon as any} size={40} color="#fff" />
                )}
              </Animated.View>
            </View>

            {/* Title */}
            <Animated.View
              style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], alignItems: 'center' }}
            >
              <Text style={[styles.appName, { color: colors.text }]}>{item.title}</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.Text style={[styles.tagline, { opacity: taglineOpacity, color: colors.textSub }]}>
              {item.subtitle}
            </Animated.Text>
          </View>
        ))}
      </ScrollView>

      {/* Slide indicators */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === slide ? colors.accent : colors.cardBorder,
                width: i === slide ? 18 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom CTA */}
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        <TouchableOpacity
          onPress={handleGetStarted}
          activeOpacity={0.92}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={[colors.accent, isDark ? '#2D7DD2' : '#3A8DEB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{slide < 2 ? 'Next' : 'Get Started'}</Text>
            {/* Shimmer overlay */}
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerX }] },
              ]}
            />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const ORB_INNER = 120;
const ORB_MID = 180;
const ORB_OUTER = 240;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContainer: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  orbContainer: {
    width: ORB_OUTER,
    height: ORB_OUTER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  orbRing: {
    position: 'absolute',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbOuter: { width: ORB_OUTER, height: ORB_OUTER },
  orbMid: { width: ORB_MID, height: ORB_MID },
  orbInner: { width: ORB_INNER, height: ORB_INNER },
  appName: {
    ...typography.displayMd,
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 36,
    paddingHorizontal: 24,
  },
  tagline: {
    ...typography.bodyMd,
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 120 },
  dot: { height: 8, borderRadius: 999 },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  ctaWrapper: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  ctaButton: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ skewX: '-20deg' }],
  },
  loginLink: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
