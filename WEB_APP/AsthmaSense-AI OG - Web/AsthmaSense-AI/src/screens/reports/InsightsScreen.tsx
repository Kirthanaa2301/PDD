import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Insights'>;

const LINE_POINTS = [0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 0.75];
const TRIGGERS: Record<string, number> = {
  Pollen: 0.8,
  Dust: 0.6,
  Exercise: 0.5,
  Weather: 0.7,
};

function MiniLineChart({ color = colors.primaryBlue }: { color?: string }) {
  const w = 300;
  const h = 60;
  const pts = LINE_POINTS.map((p, i) => {
    const x = (w * i) / (LINE_POINTS.length - 1);
    const y = h * (1 - p);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} />
    </Svg>
  );
}

export function InsightsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Insights" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppCard>
          <Text style={styles.cardTitle}>Adherence score</Text>
          <View style={styles.adherenceRow}>
            <Text style={styles.score}>92%</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '92%' }]} />
            </View>
          </View>
        </AppCard>
        <AppCard>
          <Text style={styles.cardTitle}>Charts & trends</Text>
          <MiniLineChart />
        </AppCard>
        <AppCard>
          <Text style={styles.cardTitle}>Score trend</Text>
          <MiniLineChart color={colors.greenSuccess} />
        </AppCard>
        <AppCard>
          <Text style={styles.cardTitle}>Top triggers</Text>
          {Object.entries(TRIGGERS).map(([key, value]) => (
            <View key={key} style={styles.triggerRow}>
              <Text style={styles.triggerLabel}>{key}</Text>
              <View style={styles.triggerBarBg}>
                <View style={[styles.triggerBarFill, { width: `${value * 100}%` }]} />
              </View>
            </View>
          ))}
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  cardTitle: { fontWeight: '600', fontSize: 15, marginBottom: 12 },
  adherenceRow: { flexDirection: 'row', alignItems: 'center' },
  score: { fontSize: 36, fontWeight: '800', color: colors.primaryBlue },
  progressBg: {
    flex: 1,
    marginLeft: 16,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.progressBg,
    overflow: 'hidden',
    maxWidth: 120,
  },
  progressFill: { height: '100%', backgroundColor: colors.primaryBlue, borderRadius: 4 },
  triggerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  triggerLabel: { width: 70, fontSize: 11, color: colors.textGrey },
  triggerBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: `${colors.primaryBlue}1A`,
    overflow: 'hidden',
  },
  triggerBarFill: { height: '100%', backgroundColor: colors.primaryBlue, borderRadius: 4 },
});
