import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { colors } from '../../theme/colors';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = { navigation: Nav };

const WEEKLY = [0.3, 0.6, 0.4, 0.8, 0.5, 0.7, 0.4];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const NOTIFS = [
  'Time for nebule',
  'Daily breathing test',
  'Inhaler alert today',
  '7-day streak',
  'Sleep mode ready',
];

const ACTIONS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: (n: Nav) => void;
}[] = [
  { label: 'Breathing\nanalysis', icon: 'mic-outline', onPress: (n) => n.navigate('BreathingTest') },
  { label: 'Log\nmedication', icon: 'medkit-outline' },
  { label: 'Symptom\nlog', icon: 'create-outline' },
  { label: 'Emergency', icon: 'warning-outline' },
  { label: 'Help', icon: 'help-circle-outline' },
  { label: 'Insights', icon: 'analytics-outline' },
];

export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.name}>Aaron</Text>
              <View style={styles.excellentBadge}>
                <Text style={styles.excellentText}>Excellent</Text>
              </View>
            </View>
            <Text style={styles.appName}>AsthmaSense AI</Text>
          </View>
          <LinearGradient colors={[colors.primaryBlue, colors.lightBlue]} style={styles.avatar}>
            <Text style={styles.avatarText}>AS</Text>
          </LinearGradient>
        </View>

        <AppCard padding={20}>
          <Text style={styles.cardTitle}>Today's risk</Text>
          <View style={styles.badges}>
            <RiskBadge label="LOW" color={colors.greenSuccess} />
            <RiskBadge label="AQI" color={colors.moderateColor} />
            <RiskBadge label="GPS" color={colors.primaryBlue} />
          </View>
        </AppCard>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Quick actions</Text>
            <Pressable>
              <Text style={styles.findAi}>Find AI</Text>
            </Pressable>
          </View>
          <View style={styles.grid}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                style={styles.gridItem}
                onPress={() => a.onPress?.(navigation)}
              >
                <AppCard padding={12} style={styles.actionCard}>
                  <View style={styles.actionIcon}>
                    <Ionicons name={a.icon} size={20} color={colors.primaryBlue} />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </AppCard>
              </Pressable>
            ))}
          </View>
        </View>

        <AppCard>
          <Text style={styles.cardTitle}>Weekly trend</Text>
          <View style={styles.chartRow}>
            {WEEKLY.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: 60 * h,
                    backgroundColor: colors.primaryBlue,
                    opacity: 0.2 + h * 0.4,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.daysRow}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.dayLabel}>
                {d}
              </Text>
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.lastCard}>
          <Text style={styles.cardTitle}>Notifications</Text>
          {NOTIFS.map((n) => (
            <View key={n} style={styles.notifRow}>
              <View style={styles.dot} />
              <Text style={styles.notifText}>{n}</Text>
              <Text style={styles.notifTime}>now</Text>
            </View>
          ))}
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function RiskBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.riskBadge, { backgroundColor: `${color}26` }]}>
      <Text style={[styles.riskBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 22, fontWeight: '700', color: colors.textDark },
  excellentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: `${colors.greenSuccess}26`,
  },
  excellentText: { color: colors.greenSuccess, fontSize: 11, fontWeight: '600' },
  appName: { color: colors.textGrey, fontSize: 13, marginTop: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  avatarText: { color: colors.textLight, fontWeight: '700', fontSize: 16 },
  cardTitle: { fontWeight: '600', fontSize: 15, color: colors.textDark },
  badges: { flexDirection: 'row', marginTop: 12, gap: 12 },
  riskBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  riskBadgeText: { fontWeight: '700', fontSize: 12 },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  findAi: { color: colors.primaryBlue, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '31%' },
  actionCard: { alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primaryBlue}1F`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    color: colors.textDark,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
    marginTop: 12,
  },
  bar: { width: 28, borderRadius: 6, backgroundColor: `${colors.primaryBlue}66` },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayLabel: { fontSize: 11, color: colors.textGrey, width: 28, textAlign: 'center' },
  lastCard: { marginBottom: 8 },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryBlue,
    marginRight: 12,
  },
  notifText: { flex: 1, fontSize: 13 },
  notifTime: { fontSize: 11, color: colors.textGrey },
});
