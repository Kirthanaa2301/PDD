import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Reports'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = { navigation: Nav };

const PERIODS = ['Weekly', 'Monthly', 'Yearly'];
const BAR_DATA = [0.6, 0.75, 0.5, 0.9, 0.7, 0.85, 0.65];
const BAR_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ReportsScreen({ navigation }: Props) {
  const [period, setPeriod] = useState('Weekly');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Reports"
        right={
          <Pressable onPress={() => navigation.navigate('Insights')} hitSlop={12}>
            <Ionicons name="analytics-outline" size={24} color={colors.primaryBlue} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.periodRow}>
          {PERIODS.map((p) => {
            const selected = period === p;
            return (
              <Pressable
                key={p}
                style={[styles.periodPill, selected && styles.periodPillActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, selected && styles.periodTextActive]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>

        <AppCard>
          <Text style={styles.cardTitle}>{period} overview</Text>
          <View style={styles.barChart}>
            {BAR_DATA.map((h, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: 100 * h }]} />
                <Text style={styles.barLabel}>{BAR_LABELS[i]}</Text>
              </View>
            ))}
          </View>
          <View style={styles.statsRow}>
            <StatPill label="Avg score" value="84" />
            <StatPill label="Best day" value="Sat" />
            <StatPill label="Adherence" value="92%" />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.cardTitle}>Risk indicator</Text>
          <View style={styles.gaugeWrap}>
            <RiskGauge />
          </View>
          <Text style={styles.riskLevel}>Low</Text>
          <Text style={styles.riskSub}>risk level</Text>
        </AppCard>

        <Pressable
          style={styles.doctorBtn}
          onPress={() => navigation.navigate('DoctorReport')}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.textLight} />
          <Text style={styles.doctorBtnText}>Generate Doctor Report</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RiskGauge() {
  const size = 120;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = 0.25;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`${colors.primaryBlue}1A`}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.greenSuccess}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference * progress} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Ionicons
        name="arrow-down"
        size={28}
        color={colors.greenSuccess}
        style={{ position: 'absolute' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 16 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.cardWhite,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  periodPillActive: { backgroundColor: colors.primaryBlue },
  periodText: { color: colors.textGrey, fontWeight: '600', fontSize: 13 },
  periodTextActive: { color: colors.textLight },
  cardTitle: { fontWeight: '600', fontSize: 15 },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 16,
    gap: 4,
  },
  barCol: { flex: 1, alignItems: 'center' },
  bar: {
    width: '100%',
    backgroundColor: colors.primaryBlue,
    borderRadius: 6,
    marginHorizontal: 3,
  },
  barLabel: { fontSize: 9, color: colors.textGrey, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statPill: { alignItems: 'center' },
  statValue: { fontWeight: '700', fontSize: 18, color: colors.primaryBlue },
  statLabel: { color: colors.textGrey, fontSize: 11, marginTop: 2 },
  gaugeWrap: { alignItems: 'center', marginTop: 16 },
  riskLevel: {
    textAlign: 'center',
    color: colors.greenSuccess,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 8,
  },
  riskSub: { textAlign: 'center', color: colors.textGrey, fontSize: 12 },
  doctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryBlue,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doctorBtnText: { color: colors.textLight, fontWeight: '600', fontSize: 16 },
});
