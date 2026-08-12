import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, radius, fonts, spacing, typography } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useAuthStore, syncUserDataFromBackend } from '../../src/store';
import { API_BASE_URL } from '../../src/config/api';

const { width: W } = Dimensions.get('window');

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const haptics = useHaptics();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Validation Error States
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Background entrance radial glow animation
  const bgOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(bgOpacity, { toValue: 1.0, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let hasError = false;

    if (!trimmedEmail) {
      setEmailError('Email is required.');
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Please enter a valid email address.');
        hasError = true;
      }
    }

    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }

    if (hasError) {
      haptics.warning();
      return;
    }

    haptics.light();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      // Update store and local storage
      await AsyncStorage.setItem('asthmasense_logged_in', 'true');
      useAuthStore.setState({
        user: data.userProfile,
        token: data.token,
        streak: data.userProfile.streak || 0,
        lastLoginDate: data.userProfile.lastLoginDate || null,
        loginDates: data.userProfile.loginDates || [],
      });
      useAuthStore.getState().checkLoginStreak();
      
      // Async sync user history in background
      syncUserDataFromBackend().catch(() => {});

      setSuccess(true);
      haptics.success();

      setTimeout(() => {
        if (data.userProfile?.hasCompletedOnboarding) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/questionnaire');
        }
      }, 500);
    } catch (err: any) {
      console.warn('[Login] Error during submit:', err);
      let errMsg = err.message || 'Server connection error.';
      const msg = String(errMsg).toLowerCase();
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('typeerror')) {
        errMsg = 'Unable to connect to our secure health servers. Please verify your internet connection or try again shortly.';
      }
      setGeneralError(errMsg);
      haptics.warning();
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      color: colors.text,
      fontFamily: fonts.regular,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior="padding"
    >
      {/* Decorative gradient orbs in background covering full screen */}
      <Animated.View style={{ opacity: bgOpacity, ...StyleSheet.absoluteFillObject }} pointerEvents="none">
        <LinearGradient
          colors={[colors.accent + '25', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.glowOrb, styles.orbTopRight]}
        />
        <LinearGradient
          colors={[colors.mint + '18', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.glowOrb, styles.orbBottomLeft]}
        />
        <LinearGradient
          colors={[colors.accent + '25', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.glowOrb, styles.orbBottomLeftSmall]}
        />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.root}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.card}>
          {/* Logo icon */}
          <View style={styles.header}>
            <View style={[styles.logoBox, { backgroundColor: isDark ? '#070B12' : '#ffffff', borderColor: colors.cardBorder, borderWidth: 1, overflow: 'hidden' }]}>
              <Image source={isDark ? require('../../assets/logo-dark.png') : require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>

            <Text style={[styles.brand, { color: colors.accent }]}>AsthmaSense AI</Text>
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>
              Sign in to continue your journey and view your breathing dashboard.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* General Error Banner */}
            {generalError ? (
              <View style={[styles.generalErrorCard, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '35' }]}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
                <Text style={[styles.generalErrorText, { color: colors.danger }]}>{generalError}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={{ gap: 4 }}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Feather name="mail" size={20} color={colors.textSub} />
                </View>
                <TextInput
                  style={[inputStyle, emailError ? { borderColor: colors.danger } : null]}
                  placeholder="Email Address"
                  placeholderTextColor={colors.textSub}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setEmailError('');
                    setGeneralError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {emailError ? <Text style={[styles.errorText, { color: colors.danger }]}>{emailError}</Text> : null}
            </View>

            {/* Password */}
            <View style={{ gap: 4 }}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Feather name="lock" size={20} color={colors.textSub} />
                </View>
                <TextInput
                  style={[inputStyle, passwordError ? { borderColor: colors.danger } : null]}
                  placeholder="Password"
                  placeholderTextColor={colors.textSub}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setPasswordError('');
                    setGeneralError('');
                  }}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                >
                  <Feather name={showPass ? 'eye-off' : 'eye'} size={18} color={colors.textSub} />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={[styles.errorText, { color: colors.danger }]}>{passwordError}</Text> : null}
            </View>

            {/* Forgot Password link */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'flex-end', marginTop: 4 }}
              activeOpacity={0.7}
            >
              <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={isLoading}
              style={[
                styles.submitBtn,
                { backgroundColor: colors.accent, opacity: isLoading ? 0.7 : 1 },
              ]}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : success ? (
                <Feather name="check" size={20} color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.submitText}>Sign In</Text>
                  <Feather name="arrow-right" size={20} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer links */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
              <Text style={[styles.switchText, { color: colors.accent }]}>
                Don't have an account? Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
    width: W * 1.2,
    height: W * 1.2,
  },
  orbTopRight: {
    top: -W * 0.5,
    right: -W * 0.5,
  },
  orbBottomLeft: {
    bottom: -W * 0.5,
    left: -W * 0.5,
  },
  orbBottomLeftSmall: {
    bottom: -W * 0.2,
    left: -W * 0.2,
    width: W * 0.6,
    height: W * 0.6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
    padding: 4,
  },
  input: {
    height: 52,
    paddingLeft: 44,
    paddingRight: 44,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 15,
  },
  forgotText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#ffffff',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 4,
  },
  switchText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: 2,
    marginLeft: 4,
    fontFamily: fonts.medium,
  },
  generalErrorCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  generalErrorText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    flex: 1,
    lineHeight: 18,
  },
});
