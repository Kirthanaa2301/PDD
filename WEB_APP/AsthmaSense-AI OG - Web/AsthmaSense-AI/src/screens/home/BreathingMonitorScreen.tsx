import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BreathingMonitor'>;

const ACTIVITIES = ['Post asthma test', 'Breathing test 1st set', 'Sept 7th Late'];

function WaveChart() {
  const w = 320;
  const h = 80;
  let d = `M 0 ${h / 2}`;
  for (let x = 0; x <= w; x += 4) {
    const y = h / 2 + 20 * (Math.sin(x / 20) * 0.8);
    d += ` L ${x} ${y}`;
  }
  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <Path d={d} stroke="rgba(135,206,250,0.7)" strokeWidth={2} fill="none" />
    </Svg>
  );
}

function MiniStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniValue, { color }]}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

export function BreathingMonitorScreen(_props: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Aaron - 24</Text>
          </View>
          <View style={styles.tagMuted}>
            <Text style={styles.tagMutedText}>Male</Text>
          </View>
          <View style={styles.tagLow}>
            <Text style={styles.tagLowText}>Low</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <MiniStat value="88" label="SpO2" color="#90CAF9" />
          <MiniStat value="72" label="BPM" color="#A5D6A7" />
          <MiniStat value="18" label="Breath/min" color="#FFCC80" />
        </View>
        <Text style={styles.sectionLabel}>Last 24h breathing</Text>
        <View style={styles.waveBox}>
          <WaveChart />
        </View>
        <Text style={styles.sectionLabel}>Breathing score</Text>
        <Text style={styles.score}>88</Text>
        <Text style={styles.scoreSub}>out of 100</Text>
        <View style={styles.awesome}>
          <Text style={styles.awesomeText}>Awesome!</Text>
        </View>
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Recent activity</Text>
        {ACTIVITIES.map((a) => (
          <View key={a} style={styles.activityRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.greenSuccess} />
            <Text style={styles.activityText}>{a}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.monitorBg },
  scroll: { paddingHorizontal: 20, paddingVertical: 16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tagText: { color: colors.textLight, fontWeight: '600' },
  tagMuted: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tagMutedText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  tagLow: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: `${colors.greenSuccess}33`,
  },
  tagLowText: { color: colors.greenSuccess, fontWeight: '600' },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  miniStat: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  miniValue: { fontWeight: '700', fontSize: 18 },
  miniLabel: { color: 'rgba(255,255,255,0.54)', fontSize: 10, marginTop: 2 },
  sectionLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 20 },
  waveBox: {
    marginTop: 8,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  score: {
    marginTop: 8,
    fontSize: 64,
    fontWeight: '800',
    color: colors.textLight,
    textAlign: 'center',
  },
  scoreSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
  },
  awesome: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  awesomeText: { color: colors.textLight, fontWeight: '600' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  activityText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
