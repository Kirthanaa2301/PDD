import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/theme';
import { useSessionStore } from '../../src/store';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type PhaseName = 'inhale' | 'hold' | 'exhale' | 'hold2';
interface Phase {
  name: PhaseName;
  label: string;
  dur: number;
}

const PHASES: Phase[] = [
  { name: 'inhale', label: 'Inhale', dur: 4 },
  { name: 'hold', label: 'Hold', dur: 4 },
  { name: 'exhale', label: 'Exhale', dur: 4 },
  { name: 'hold2', label: 'Hold', dur: 4 },
];

export default function BreathingPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [running, setRunning] = useState(true);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [count, setCount] = useState(PHASES[0].dur);
  const [cycle, setCycle] = useState(1);
  
  const totalCycles = useMemo(() => {
    if (id === 'belly') return 5;
    if (id === 'pursed') return 6;
    if (id === 'box' || id === 'diaphragm') return 4;
    return 4; // safety fallback
  }, [id]);

  const phase = PHASES[phaseIdx];

  // Reanimated values for Orb
  const orbScale = useSharedValue(1.1);

  const orbPhase = phase.name === 'hold2' ? 'hold' : phase.name;

  // Add Session to storage upon completion
  const handleCompleteSession = useCallback(async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await useSessionStore.getState().addSession({
        exercise: id || 'box',
        cycles: totalCycles,
      });
    } catch (e) {
      console.error('Error saving breathing session', e);
    }
    router.navigate('/(tabs)/breathing');
  }, [id, totalCycles]);

  // Handle focus changes: Reset state on focus, pause on blur
  useEffect(() => {
    if (isFocused) {
      setPhaseIdx(0);
      setCount(PHASES[0].dur);
      setCycle(1);
      setRunning(true);
      orbScale.value = 1.1;
    } else {
      setRunning(false);
    }
  }, [isFocused]);

  // Timer Tick implementation - decrements the counter safely
  useEffect(() => {
    if (!running || !isFocused) {
      return;
    }

    const intervalId = setInterval(() => {
      setCount((c) => (c > 1 ? c - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [running, isFocused]);

  // Phase and Cycle advancement handler - avoids nested setters during render
  useEffect(() => {
    if (count === 0 && running && isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const nextIdx = (phaseIdx + 1) % PHASES.length;
      setPhaseIdx(nextIdx);
      setCount(PHASES[nextIdx].dur);

      if (nextIdx === 0) {
        if (cycle >= totalCycles) {
          setRunning(false);
          handleCompleteSession();
        } else {
          setCycle((c) => c + 1);
        }
      }
    }
  }, [count, running, phaseIdx, cycle, totalCycles, handleCompleteSession, isFocused]);

  // Orb animations based on the current phase
  useEffect(() => {
    let targetScale = 1.1;
    let duration = 3000;

    if (orbPhase === 'inhale') {
      targetScale = 1.35;
      duration = 4000;
    } else if (orbPhase === 'exhale') {
      targetScale = 1.0;
      duration = 4000;
    } else if (orbPhase === 'hold') {
      targetScale = 1.35;
      duration = 4000;
    }

    orbScale.value = withTiming(targetScale, {
      duration: duration,
      easing: Easing.inOut(Easing.ease),
    });
  }, [orbPhase]);

  const progress = ((cycle - 1) / totalCycles) * 100 + ((phaseIdx / PHASES.length) * (100 / totalCycles));

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const midStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value * 0.95 }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value * 0.9 }],
  }));

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value * 0.85 }],
  }));

  const triggerReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhaseIdx(0);
    setCount(PHASES[0].dur);
    setCycle(1);
    orbScale.value = 1.1;
  };

  const toggleRunning = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRunning((r) => !r);
  };

  const triggerSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = (phaseIdx + 1) % PHASES.length;
    setPhaseIdx(next);
    setCount(PHASES[next].dur);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {/* Top progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.navigate('/(tabs)/breathing');
            }
          }}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.centerSection}>
        {/* Breathing Orb */}
        <View style={styles.orbWrapper}>
          <Reanimated.View style={[styles.orbRingOuter, outerStyle]} />
          <Reanimated.View style={[styles.orbRingMid, midStyle]} />
          <Reanimated.View style={[styles.orbRingInner, innerStyle]} />
          <Reanimated.View style={[styles.orbCenter, centerStyle]}>
            <Text style={styles.countdownText}>{count}</Text>
          </Reanimated.View>
        </View>

        {/* Phase Text with reanimated transition */}
        <View style={styles.phaseLabelContainer}>
          <Reanimated.Text
            key={phase.label + phaseIdx}
            entering={FadeInDown.duration(250)}
            exiting={FadeOutUp.duration(250)}
            style={styles.phaseLabel}
          >
            {phase.label}
          </Reanimated.Text>
        </View>

        {/* Phase Pills */}
        <View style={styles.phasePillsRow}>
          {PHASES.map((p, i) => {
            const active = i === phaseIdx;
            return (
              <View
                key={i}
                style={[
                  styles.phasePill,
                  {
                    backgroundColor: active ? '#4A9EFF' : 'rgba(255, 255, 255, 0.05)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.phasePillText,
                    {
                      color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                      fontFamily: active ? 'Inter_700Bold' : 'Inter_400Regular',
                    },
                  ]}
                >
                  {p.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={triggerReset}
            activeOpacity={0.8}
            style={styles.controlBtn}
            accessibilityLabel="reset"
          >
            <Feather name="rotate-ccw" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleRunning}
            activeOpacity={0.9}
            style={styles.playBtn}
            accessibilityLabel="play/pause"
          >
            <Feather name={running ? 'pause' : 'play'} size={24} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={triggerSkip}
            activeOpacity={0.8}
            style={styles.controlBtn}
            accessibilityLabel="skip"
          >
            <Feather name="skip-forward" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
        <Text style={styles.cycleText}>Cycle {cycle} of {totalCycles}</Text>
      </View>
    </View>
  );
}

const ORB_SIZE = 280;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070B12',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A9EFF',
  },
  safeTop: {
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
    minHeight: 44,
  },
  backBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 32,
  },
  orbWrapper: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbRingOuter: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: '#4A9EFF',
    opacity: 0.12,
  },
  orbRingMid: {
    position: 'absolute',
    width: ORB_SIZE * 0.85,
    height: ORB_SIZE * 0.85,
    borderRadius: (ORB_SIZE * 0.85) / 2,
    backgroundColor: '#4A9EFF',
    opacity: 0.08,
  },
  orbRingInner: {
    position: 'absolute',
    width: ORB_SIZE * 0.6,
    height: ORB_SIZE * 0.6,
    borderRadius: (ORB_SIZE * 0.6) / 2,
    backgroundColor: '#4A9EFF',
    opacity: 0.24,
  },
  orbCenter: {
    width: ORB_SIZE * 0.42,
    height: ORB_SIZE * 0.42,
    borderRadius: (ORB_SIZE * 0.42) / 2,
    backgroundColor: '#4A9EFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4A9EFF',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.45,
        shadowRadius: 30,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  countdownText: {
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
    fontSize: ORB_SIZE * 0.18,
    textAlign: 'center',
  },
  phaseLabelContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseLabel: {
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    textAlign: 'center',
  },
  phasePillsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phasePill: {
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phasePillText: {
    fontSize: 11,
  },
  bottomControls: {
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4A9EFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4A9EFF',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cycleText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
