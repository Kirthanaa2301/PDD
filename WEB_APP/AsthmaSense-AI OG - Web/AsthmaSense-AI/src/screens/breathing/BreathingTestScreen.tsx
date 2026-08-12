import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { API_BASE_URL } from '../../config/api';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store';
import {
  analyzeBreathingAudio,
  BreathingAnalysisResult,
  checkApiHealth,
} from '../../services/breathingAnalysis';

type Props = NativeStackScreenProps<RootStackParamList, 'BreathingTest'>;

type Mode = 'idle' | 'recording' | 'recorded' | 'analyzing' | 'results';

const MAX_RECORD_SECONDS = 30;

const STEPS = ['Record', 'Analyze', 'Results'];

export function BreathingTestScreen({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<BreathingAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  const user = useAuthStore((s) => s.user);
  const emergencyContact = user?.profile?.emergencyContact || '911';

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder, 120);

  const pulse = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const finishRecordingRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [mode]);

  const stepIndex =
    mode === 'results' ? 2 : mode === 'analyzing' || mode === 'recorded' ? 1 : 0;

  const probeServer = useCallback(async () => {
    const health = await checkApiHealth();
    setServerOk(health.ok);
  }, []);

  useEffect(() => {
    void probeServer();
    void (async () => {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await AudioModule.requestRecordingPermissionsAsync();
    })();
  }, [probeServer]);

  useEffect(() => {
    if (mode !== 'recording') {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [mode, pulse]);

  const finishRecording = useCallback(async () => {
    try {
      if (recorderState.isRecording) {
        await audioRecorder.stop();
      }
      const uri = audioRecorder.uri;
      if (uri) {
        setAudioUri(uri);
        setFileName(`recording-${Date.now()}.m4a`);
        setMode('recorded');
      } else {
        setError('Recording failed — no audio file');
        setMode('idle');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not stop recording');
      setMode('idle');
    }
  }, [audioRecorder, recorderState.isRecording]);

  finishRecordingRef.current = finishRecording;

  useEffect(() => {
    if (recorderState.isRecording) {
      const sec = Math.floor(recorderState.durationMillis / 1000);
      setSeconds(sec);
      if (sec >= MAX_RECORD_SECONDS) {
        void finishRecordingRef.current();
      }
    }
  }, [recorderState.durationMillis, recorderState.isRecording]);

  const reset = () => {
    setMode('idle');
    setAudioUri(null);
    setFileName(null);
    setSeconds(0);
    setResult(null);
    setError(null);
  };

  const callContact = (numberToCall: string) => {
    const cleanNumber = numberToCall.replace(/[^\d+]/g, '');
    const url = `tel:${cleanNumber || '911'}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Emergency Contact Call', `Dialing ${cleanNumber || '911'} on your device.`);
    });
  };

  const startRecording = async () => {
    try {
      setError(null);
      setResult(null);
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microphone required', 'Allow microphone access to record breathing audio.');
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setMode('recording');
      setSeconds(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start recording');
    }
  };

  const pickFile = async () => {
    try {
      setError(null);
      setResult(null);
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      setAudioUri(asset.uri);
      setFileName(asset.name || 'upload.m4a');
      setMode('recorded');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open file');
    }
  };

  const submitAnalysis = async () => {
    if (!audioUri) return;
    setMode('analyzing');
    setError(null);
    try {
      const mimeType = fileName?.endsWith('.wav')
        ? 'audio/wav'
        : fileName?.endsWith('.mp3')
          ? 'audio/mpeg'
          : 'audio/m4a';
      const analysis = await analyzeBreathingAudio({
        uri: audioUri,
        name: fileName || 'audio.m4a',
        mimeType,
      });
      setResult(analysis);
      setMode('results');

      // Trigger auto-alert for emergency contact if High Risk or Wheezing Detected
      if (analysis.riskLevel === 'High' || analysis.wheezingDetected === 'Yes') {
        setTimeout(() => {
          Alert.alert(
            '🚨 HIGH RISK ASTHMA DETECTED',
            `High-risk wheezing detected in recording! Take 1-2 puffs of your rescue inhaler. Would you like to call your emergency contact (${emergencyContact}) now?`,
            [
              {
                text: `Call Contact (${emergencyContact})`,
                style: 'destructive',
                onPress: () => callContact(emergencyContact),
              },
              {
                text: 'Call Emergency 911',
                onPress: () => callContact('911'),
              },
              { text: 'Dismiss', style: 'cancel' },
            ],
          );
        }, 300);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
      setMode('recorded');
      void probeServer();
    }
  };

  const riskColor = (level: string) => {
    switch (level) {
      case 'High':
        return colors.severeColor;
      case 'Moderate':
        return colors.moderateColor;
      default:
        return colors.greenSuccess;
    }
  };

  // Adaptive meter level so "silence" doesn't look like signal across devices/rooms.
  const noiseFloorRef = useRef<number | null>(null);
  const meterLevel = (() => {
    const m = recorderState.metering;
    if (m == null || !Number.isFinite(m)) return 0;
    const db = Math.min(0, Math.max(-160, m));
    const prevFloor = noiseFloorRef.current;
    const initFloor = prevFloor == null ? db : prevFloor;
    const nearFloor = db <= initFloor + 6;
    const floorAlpha = nearFloor ? 0.06 : 0.01;
    const nextFloor = initFloor + (db - initFloor) * floorAlpha;
    noiseFloorRef.current = nextFloor;

    const above = db - nextFloor;
    const gateDb = 8;
    if (above <= gateDb) return 0;
    const raw = (above - gateDb) / 32;
    return Math.min(1, Math.max(0, raw));
  })();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Breathing Analysis"
        onBack={() => navigation.goBack()}
        backgroundColor={colors.darkBackground}
        titleColor={colors.textLight}
        backColor={colors.textLight}
      />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ServerBanner ok={serverOk} onRetry={probeServer} />

        <View style={styles.steps}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.stepItem}>
              <View style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]}>
                <Text style={[styles.stepNum, i <= stepIndex && styles.stepNumActive]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, i <= stepIndex && styles.stepLabelActive]}>
                {label}
              </Text>
              {i < STEPS.length - 1 ? <View style={styles.stepLine} /> : null}
            </View>
          ))}
        </View>

        {mode !== 'results' ? (
          <>
            <LinearGradient
              colors={[`${colors.primaryBlue}33`, 'transparent']}
              style={styles.heroCard}
            >
              <Text style={styles.heroTitle}>
                {mode === 'recording' ? 'Listening…' : 'Capture your breathing'}
              </Text>
              <Text style={styles.heroSub}>
                Hold the phone near your chest. Record 10–30 seconds of breathing or cough sounds.
              </Text>

              {mode === 'recording' ? (
                <View style={styles.meterRow}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.meterBar,
                        {
                          height: 8 + (i < Math.floor(meterLevel * 12) ? 28 : 8),
                          backgroundColor:
                            i < Math.floor(meterLevel * 12)
                              ? colors.primaryBlue
                              : 'rgba(255,255,255,0.15)',
                        },
                      ]}
                    />
                  ))}
                </View>
              ) : null}

              <View style={styles.timerRow}>
                <Text style={styles.timer}>
                  {mode === 'recording' ? `${seconds}s` : '0s'}
                </Text>
                <Text style={styles.timerMax}> / {MAX_RECORD_SECONDS}s</Text>
              </View>

              <Pressable
                style={styles.micWrap}
                onPress={() => {
                  if (mode === 'recording') void finishRecordingRef.current();
                  else if (mode === 'idle' || mode === 'recorded') void startRecording();
                }}
                disabled={mode === 'analyzing'}
              >
                <Animated.View style={{ transform: [{ scale: mode === 'recording' ? pulse : 1 }] }}>
                  <LinearGradient
                    colors={
                      mode === 'recording'
                        ? [colors.redDanger, '#C62828']
                        : [colors.primaryBlue, colors.lightBlue]
                    }
                    style={styles.micBtn}
                  >
                    <Ionicons
                      name={mode === 'recording' ? 'stop' : 'mic'}
                      size={40}
                      color={colors.textLight}
                    />
                  </LinearGradient>
                </Animated.View>
              </Pressable>
              <Text style={styles.micHint}>
                {mode === 'recording'
                  ? 'Tap to stop recording'
                  : mode === 'recorded'
                    ? 'Tap to record again'
                    : 'Tap to start recording'}
              </Text>
            </LinearGradient>

            <Pressable
              style={styles.uploadCard}
              onPress={pickFile}
              disabled={mode === 'analyzing' || mode === 'recording'}
            >
              <View style={styles.uploadIcon}>
                <Ionicons name="folder-open-outline" size={22} color={colors.primaryBlue} />
              </View>
              <View style={styles.uploadTextCol}>
                <Text style={styles.uploadTitle}>Upload audio file</Text>
                <Text style={styles.uploadSub}>mp3, m4a, wav, ogg — max 25MB</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textGrey} />
            </Pressable>

            {mode === 'recorded' && fileName ? (
              <View style={styles.readyCard}>
                <Ionicons name="checkmark-circle" size={22} color={colors.greenSuccess} />
                <Text style={styles.readyText} numberOfLines={1}>
                  Ready: {fileName}
                </Text>
              </View>
            ) : null}

            {mode === 'recorded' && (
              <PrimaryButton text="Analyze with AI" onPress={submitAnalysis} />
            )}

            {mode === 'analyzing' ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.primaryBlue} size="large" />
                <Text style={styles.loadingTitle}>Analyzing audio</Text>
                <Text style={styles.loadingSub}>
                  Transcribing with Whisper, then assessing wheeze & risk…
                </Text>
              </View>
            ) : null}
          </>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={colors.severeColor} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {mode === 'results' && result ? (
          <View style={styles.results}>
            {/* EMERGENCY CONTACT HIGH RISK ALERT CARD */}
            {result.riskLevel === 'High' || result.wheezingDetected === 'Yes' ? (
              <View style={styles.emergencyCard}>
                <Ionicons name="alert-circle" size={32} color="#FFFFFF" />
                <Text style={styles.emergencyTitle}>🚨 HIGH RISK ASTHMA ALERT</Text>
                <Text style={styles.emergencySub}>
                  High risk wheezing detected in recording. Use 1-2 puffs of your rescue inhaler and contact emergency support immediately.
                </Text>
                <Pressable
                  style={styles.emergencyBtn}
                  onPress={() => callContact(emergencyContact)}
                >
                  <Ionicons name="call" size={20} color="#FFFFFF" />
                  <Text style={styles.emergencyBtnText}>
                    CALL EMERGENCY CONTACT ({emergencyContact})
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.emergencySubBtn}
                  onPress={() => callContact('911')}
                >
                  <Ionicons name="warning-outline" size={16} color="#FFD700" />
                  <Text style={styles.emergencySubBtnText}>Call Emergency Services (911)</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.resultsHeader}>
              <Ionicons name="sparkles" size={22} color={colors.primaryBlue} />
              <Text style={styles.resultsTitle}>AI analysis complete</Text>
            </View>

            <View style={styles.resultGrid}>
              <ResultCard
                icon="pulse-outline"
                label="Wheezing detected"
                value={result.wheezingDetected}
                color={
                  result.wheezingDetected === 'Yes' ? colors.orangeWarning : colors.greenSuccess
                }
              />
              <ResultCard
                icon="shield-checkmark-outline"
                label="Risk level"
                value={result.riskLevel}
                color={riskColor(result.riskLevel)}
              />
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Summary</Text>
              <Text style={styles.summary}>{result.summary}</Text>
              <Text style={styles.confidence}>Confidence: {result.confidence}</Text>
            </View>

            {result.recommendations && result.recommendations.length > 0 ? (
              <View style={styles.recBox}>
                <Text style={styles.recLabel}>Recommended Actions</Text>
                {result.recommendations.map((rec, i) => (
                  <View key={i} style={styles.recItem}>
                    <Ionicons name="chevron-forward-circle" size={16} color={colors.primaryBlue} />
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {result.transcript ? (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>Transcript</Text>
                <Text style={styles.transcript}>{result.transcript}</Text>
              </View>
            ) : null}

            <Text style={styles.disclaimer}>
              Screening only — not a medical diagnosis. Consult your doctor for clinical decisions.
            </Text>
            <PrimaryButton text="New recording" onPress={reset} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ServerBanner({ ok, onRetry }: { ok: boolean | null; onRetry: () => void }) {
  if (ok === null) {
    return (
      <View style={[styles.serverBanner, styles.serverChecking]}>
        <ActivityIndicator size="small" color={colors.primaryBlue} />
        <Text style={styles.serverText}>Checking server…</Text>
      </View>
    );
  }
  if (!ok) {
    return (
      <Pressable style={[styles.serverBanner, styles.serverDown]} onPress={onRetry}>
        <Ionicons name="cloud-offline-outline" size={18} color={colors.severeColor} />
        <View style={styles.serverTextCol}>
          <Text style={styles.serverDownTitle}>Cannot reach API</Text>
          <Text style={styles.serverDownSub}>
            {API_BASE_URL} — run `npm run dev` in asthmasense-server (same Wi‑Fi)
          </Text>
        </View>
        <Ionicons name="refresh" size={18} color={colors.textLight} />
      </Pressable>
    );
  }
  return (
    <View style={[styles.serverBanner, styles.serverOk]}>
      <View style={styles.serverDot} />
      <Text style={styles.serverOkText}>Connected · {API_BASE_URL}</Text>
    </View>
  );
}

function ResultCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.resultCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.resultCardLabel}>{label}</Text>
      <Text style={[styles.resultCardValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBackground },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  serverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  serverChecking: { backgroundColor: 'rgba(255,255,255,0.06)' },
  serverOk: { backgroundColor: `${colors.greenSuccess}22` },
  serverDown: { backgroundColor: `${colors.severeColor}22` },
  serverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.greenSuccess,
  },
  serverText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  serverOkText: { color: colors.greenSuccess, fontSize: 11, flex: 1 },
  serverTextCol: { flex: 1 },
  serverDownTitle: { color: colors.textLight, fontWeight: '600', fontSize: 13 },
  serverDownSub: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { borderColor: colors.primaryBlue, backgroundColor: colors.primaryBlue },
  stepNum: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  stepNumActive: { color: colors.textLight },
  stepLabel: { marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  stepLabelActive: { color: 'rgba(255,255,255,0.85)' },
  stepLine: {
    position: 'absolute',
    top: 14,
    left: '55%',
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroTitle: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 20,
    height: 36,
  },
  meterBar: { width: 6, borderRadius: 3 },
  timerRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
  timer: { color: colors.textLight, fontSize: 28, fontWeight: '800' },
  timerMax: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  micWrap: { marginTop: 20 },
  micBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micHint: { marginTop: 12, color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
    gap: 12,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.primaryBlue}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextCol: { flex: 1 },
  uploadTitle: { color: colors.textLight, fontWeight: '600', fontSize: 14 },
  uploadSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  readyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: `${colors.greenSuccess}18`,
    marginBottom: 12,
  },
  readyText: { color: colors.greenSuccess, fontSize: 13, flex: 1 },
  loadingCard: {
    alignItems: 'center',
    padding: 24,
    gap: 10,
    marginTop: 8,
  },
  loadingTitle: { color: colors.textLight, fontWeight: '600', fontSize: 15 },
  loadingSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center' },
  errorCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: `${colors.severeColor}18`,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  errorText: { flex: 1, color: colors.severeColor, fontSize: 13, lineHeight: 18 },
  results: { gap: 14 },
  emergencyCard: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emergencySub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 6,
    width: '100%',
    justifyContent: 'center',
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emergencySubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  emergencySubBtnText: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 12,
  },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultsTitle: { color: colors.textLight, fontSize: 18, fontWeight: '700' },
  resultGrid: { flexDirection: 'row', gap: 12 },
  resultCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 6,
  },
  resultCardLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    textAlign: 'center',
  },
  resultCardValue: { fontSize: 20, fontWeight: '800' },
  summaryCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  summaryLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 },
  summary: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 21 },
  confidence: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 8 },
  recBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  recLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  recItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recText: { color: colors.textLight, fontSize: 13, flex: 1 },
  transcriptBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  transcriptLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 },
  transcript: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 18 },
  disclaimer: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
