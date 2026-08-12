import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, radius, typography } from '../../src/theme';
import { API_BASE_URL } from '../../src/config/api';

// ─── Step identifiers ────────────────────────────────────────────────────────
type Step = 'email' | 'otp' | 'newPassword' | 'done';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();

  // ── shared state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── animated focus border (reused across steps) ──────────────────────────
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const emailLabelY = useSharedValue(0);
  const emailLabelScale = useSharedValue(1);
  const emailLabelAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: emailLabelY.value }, { scale: emailLabelScale.value }],
  }));

  const handleEmailFocus = () => {
    setFocusedField('email');
    emailLabelY.value = withTiming(-28, { duration: 180 });
    emailLabelScale.value = withTiming(0.82, { duration: 180 });
  };
  const handleEmailBlur = () => {
    setFocusedField(null);
    if (!email) {
      emailLabelY.value = withTiming(0, { duration: 180 });
      emailLabelScale.value = withTiming(1, { duration: 180 });
    }
  };

  // ─── Step 1: Request OTP ───────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setErrorMsg('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');
      // Always advance to OTP step (server hides whether email exists)
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setErrorMsg('');
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed.');
      setStep('newPassword');
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async () => {
    setErrorMsg('');
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed.');
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setOtp('');
    setErrorMsg('');
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      Alert.alert('Code resent', 'A new OTP has been sent to your email.');
    } catch {
      setErrorMsg('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step indicator helper ────────────────────────────────────────────────
  const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : step === 'newPassword' ? 2 : 3;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={{ paddingHorizontal: 24 }}>
        <TouchableOpacity
          onPress={() => (step === 'email' || step === 'done' ? router.back() : setStep(step === 'otp' ? 'email' : 'otp'))}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.textSub} />
        </TouchableOpacity>

        {/* Step progress dots */}
        {step !== 'done' && (
          <View style={styles.stepRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i <= stepIndex ? colors.accent : colors.cardBorder,
                    width: i === stepIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>

          {/* ── STEP 1: Email ─────────────────────────────────────────────── */}
          {step === 'email' && (
            <Animated.View entering={FadeInDown.duration(220)} style={{ gap: 28 }}>
              <View style={{ marginBottom: 4 }}>
                <Text style={[styles.heading, { color: colors.text }]}>Reset password</Text>
                <Text style={[styles.subheading, { color: colors.textSub }]}>
                  Enter your email and we'll send a 6-digit OTP code.
                </Text>
              </View>

              {/* Email field */}
              <View style={{ marginTop: 10 }}>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: focusedField === 'email' ? colors.accent : colors.cardBorder }]}>
                  <Animated.Text
                    style={[
                      styles.floatLabel,
                      {
                        color: focusedField === 'email' ? colors.accent : colors.textSub,
                        backgroundColor: colors.card,
                        paddingHorizontal: 4,
                        zIndex: 2,
                      },
                      emailLabelAnim,
                    ]}
                  >
                    Email address
                  </Animated.Text>
                  <View style={{ paddingLeft: 16 }}>
                    <Feather name="mail" size={18} color={focusedField === 'email' ? colors.accent : colors.textSub} style={{ marginRight: 10 }} />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={handleEmailFocus}
                    onBlur={handleEmailBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={handleSendOtp}
                    style={[styles.textInput, { color: colors.text, fontFamily: 'Inter_400Regular', flex: 1 }]}
                  />
                </View>
              </View>

              {errorMsg ? <Text style={[styles.errorText, { color: '#ef4444' }]}>{errorMsg}</Text> : null}

              <TouchableOpacity onPress={handleSendOtp} activeOpacity={0.92} disabled={loading} style={styles.ctaWrapper}>
                <LinearGradient colors={['#4A9EFF', '#2D7DD2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Send OTP Code</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── STEP 2: Enter OTP ─────────────────────────────────────────── */}
          {step === 'otp' && (
            <Animated.View entering={FadeInDown.duration(220)} style={{ gap: 28 }}>
              <View style={[styles.successIcon, { backgroundColor: colors.mintTint, marginBottom: 4 }]}>
                <Feather name="mail" size={32} color={colors.mint} />
              </View>
              <View style={{ marginBottom: 4 }}>
                <Text style={[styles.heading, { color: colors.text }]}>Check your email</Text>
                <Text style={[styles.subheading, { color: colors.textSub }]}>
                  We sent a 6-digit code to{' '}
                  <Text style={{ color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>{email}</Text>
                  {'. '}Enter it below.
                </Text>
              </View>

              {/* OTP field */}
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: focusedField === 'otp' ? colors.accent : colors.cardBorder }]}>
                <View style={{ paddingLeft: 16 }}>
                  <Feather name="shield" size={18} color={focusedField === 'otp' ? colors.accent : colors.textSub} style={{ marginRight: 10 }} />
                </View>
                <TextInput
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  onFocus={() => setFocusedField('otp')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="6-digit code"
                  placeholderTextColor={colors.textSub}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                  style={[styles.otpInput, { color: colors.text, fontFamily: 'Inter_700Bold' }]}
                />
              </View>

              {errorMsg ? <Text style={[styles.errorText, { color: '#ef4444' }]}>{errorMsg}</Text> : null}

              <TouchableOpacity onPress={handleVerifyOtp} activeOpacity={0.92} disabled={loading} style={styles.ctaWrapper}>
                <LinearGradient colors={['#4A9EFF', '#2D7DD2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Verify Code</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResend} disabled={loading} style={styles.linkRow}>
                <Text style={[styles.linkText, { color: colors.textSub }]}>Didn't get it? </Text>
                <Text style={[styles.linkText, { color: colors.accent }]}>Resend code</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── STEP 3: New Password ──────────────────────────────────────── */}
          {step === 'newPassword' && (
            <Animated.View entering={FadeInDown.duration(220)} style={{ gap: 20 }}>
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.heading, { color: colors.text }]}>New password</Text>
                <Text style={[styles.subheading, { color: colors.textSub }]}>
                  Create a strong password. Minimum 6 characters.
                </Text>
              </View>

              {/* New password field */}
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: focusedField === 'np' ? colors.accent : colors.cardBorder }]}>
                <View style={{ paddingLeft: 16 }}>
                  <Feather name="lock" size={18} color={focusedField === 'np' ? colors.accent : colors.textSub} style={{ marginRight: 10 }} />
                </View>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onFocus={() => setFocusedField('np')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="New password"
                  placeholderTextColor={colors.textSub}
                  secureTextEntry={!showPass}
                  returnKeyType="next"
                  style={[styles.textInput, { color: colors.text, fontFamily: 'Inter_400Regular', flex: 1 }]}
                />
                <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={{ paddingRight: 16 }}>
                  <Feather name={showPass ? 'eye-off' : 'eye'} size={18} color={colors.textSub} />
                </TouchableOpacity>
              </View>

              {/* Confirm password field */}
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: focusedField === 'cp' ? colors.accent : colors.cardBorder }]}>
                <View style={{ paddingLeft: 16 }}>
                  <Feather name="lock" size={18} color={focusedField === 'cp' ? colors.accent : colors.textSub} style={{ marginRight: 10 }} />
                </View>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('cp')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textSub}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                  style={[styles.textInput, { color: colors.text, fontFamily: 'Inter_400Regular', flex: 1 }]}
                />
                <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={{ paddingRight: 16 }}>
                  <Feather name={showConfirm ? 'eye-off' : 'eye'} size={18} color={colors.textSub} />
                </TouchableOpacity>
              </View>

              {errorMsg ? <Text style={[styles.errorText, { color: '#ef4444' }]}>{errorMsg}</Text> : null}

              <TouchableOpacity onPress={handleResetPassword} activeOpacity={0.92} disabled={loading} style={styles.ctaWrapper}>
                <LinearGradient colors={['#4A9EFF', '#2D7DD2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Reset Password</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── STEP 4: Done ──────────────────────────────────────────────── */}
          {step === 'done' && (
            <Animated.View entering={FadeInDown.duration(220)} style={{ alignItems: 'center', gap: 24 }}>
              <View style={[styles.doneIcon, { backgroundColor: colors.mintTint }]}>
                <Feather name="check-circle" size={40} color={colors.mint} />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.heading, { color: colors.text, textAlign: 'center' }]}>Password updated!</Text>
                <Text style={[styles.subheading, { color: colors.textSub, textAlign: 'center' }]}>
                  Your password has been reset successfully. Sign in with your new password.
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.92} style={[styles.ctaWrapper, { width: '100%' }]}>
                <LinearGradient colors={['#4A9EFF', '#2D7DD2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
                  <Text style={styles.ctaText}>Back to Sign In</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { height: 8, borderRadius: 4 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  heading: { ...typography.displayMd, fontSize: 28, marginBottom: 8 },
  subheading: { ...typography.bodyMd },
  successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doneIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  inputContainer: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  floatLabel: { position: 'absolute', fontFamily: 'Inter_400Regular', fontSize: 13, top: 18, left: 46 },
  textInput: { fontSize: 15, paddingVertical: 0, paddingHorizontal: 2, paddingTop: 8 },
  otpInput: { flex: 1, fontSize: 22, paddingHorizontal: 16, paddingVertical: 14, letterSpacing: 6, textAlign: 'center' },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: -8 },
  ctaWrapper: { borderRadius: radius.pill, overflow: 'hidden' },
  ctaGradient: { height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  ctaText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  linkRow: { flexDirection: 'row', justifyContent: 'center' },
  linkText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
});
