import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BreathingExercise'>;

const PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold'] as const;
const PHASE_COLORS = [
  colors.phaseInhale,
  colors.phaseHold1,
  colors.phaseExhale,
  colors.phaseHold2,
];

export function BreathingExerciseScreen({ navigation, route }: Props) {
  const { type, level } = route.params;
  const [count, setCount] = useState(4);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase = PHASES[phaseIndex];
  const phaseColor = PHASE_COLORS[phaseIndex];

  useEffect(() => {
    if (!running) {
      scale.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [running, scale]);

  const startStop = () => {
    if (running) {
      if (timerRef.current) clearInterval(timerRef.current);
      setRunning(false);
      setCount(4);
      setPhaseIndex(0);
      return;
    }
    setRunning(true);
    timerRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          setPhaseIndex((pi) => (pi + 1) % PHASES.length);
          return 4;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title={type}
        onBack={() => navigation.goBack()}
        backgroundColor={colors.darkBackground}
        titleColor={colors.textLight}
        backColor={colors.textLight}
        right={
          <View style={styles.infoBtn}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textLight} />
          </View>
        }
      />
      <View style={styles.body}>
        <View style={styles.center}>
          <Animated.View style={{ transform: [{ scale: running ? scale : 1 }] }}>
            <View style={[styles.ringOuter, { backgroundColor: `${phaseColor}4D` }]} />
            <View style={[styles.ringMid, { backgroundColor: `${phaseColor}80` }]} />
            <View style={[styles.ringInner, { backgroundColor: phaseColor }]}>
              <Text style={styles.count}>{count}</Text>
              <Text style={styles.seconds}>seconds</Text>
            </View>
          </Animated.View>
          <Text style={styles.phase}>{phase}</Text>
          <Text style={styles.level}>{level}</Text>
        </View>
        <View style={styles.controls}>
          {['Inhale', 'Hold', 'Exhale', '1 cycle'].map((label, i) => (
            <View
              key={label}
              style={[
                styles.controlPill,
                i === phaseIndex && running && styles.controlPillActive,
              ]}
            >
              <Text
                style={[
                  styles.controlText,
                  i === phaseIndex && running && styles.controlTextActive,
                ]}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.iconRow}>
          <Pressable style={styles.iconBtn} onPress={startStop}>
            <Ionicons name={running ? 'pause' : 'play'} size={26} color={colors.textLight} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="refresh" size={26} color={colors.textLight} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="play-skip-forward" size={26} color={colors.textLight} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBackground },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -50,
    left: -50,
  },
  ringMid: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -30,
    left: -30,
  },
  ringInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { color: colors.textLight, fontSize: 48, fontWeight: '700' },
  seconds: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  phase: { marginTop: 20, color: colors.textLight, fontSize: 20, fontWeight: '600' },
  level: { marginTop: 8, color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  controlPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  controlPillActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  controlText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500' },
  controlTextActive: { color: colors.textLight },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
