import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = { navigation: Nav };

const ACHIEVEMENTS = [
  { icon: 'trophy' as const, label: '7 Day Streak', color: '#FFC107' },
  { icon: 'star' as const, label: 'Perfect Week', color: colors.orangeWarning },
  { icon: 'cloud-outline' as const, label: 'Breathing Pro', color: colors.primaryBlue },
  { icon: 'flame' as const, label: 'Streak', color: colors.redDanger },
];

export function ProfileScreen({ navigation }: Props) {
  const signOut = () => {
    const root = navigation.getParent()?.getParent();
    root?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      }),
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primaryBlue, colors.lightBlue]} style={styles.avatar}>
          <Text style={styles.avatarText}>AS</Text>
        </LinearGradient>
        <Text style={styles.name}>Aaron Sharma</Text>
        <Text style={styles.sub}>AsthmaSense AI user</Text>
        <View style={styles.statsRow}>
          <StatBox value="42" label="Days" />
          <StatBox value="7" label="Streak" />
          <StatBox value="88" label="Score" />
        </View>
        <AppCard>
          <Text style={styles.cardTitle}>Achievements</Text>
          <View style={styles.achievements}>
            {ACHIEVEMENTS.map((a) => (
              <View key={a.label} style={styles.achievement}>
                <View style={[styles.achIcon, { backgroundColor: `${a.color}26` }]}>
                  <Ionicons name={a.icon} size={24} color={a.color} />
                </View>
                <Text style={styles.achLabel}>{a.label}</Text>
              </View>
            ))}
          </View>
        </AppCard>
        <ProfileRow
          icon="medkit-outline"
          label="Medications"
          onPress={() => navigation.navigate('Medications')}
        />
        <ProfileRow icon="notifications-outline" label="Notifications" onPress={() => {}} />
        <ProfileRow icon="language-outline" label="Language" onPress={() => {}} />
        <ProfileRow icon="bar-chart-outline" label="Doctor report" onPress={() => {}} />
        <Pressable onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProfileRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <AppCard paddingHorizontal={16} paddingVertical={14} style={{ marginTop: 8 }}>
        <View style={styles.profileRow}>
          <View style={styles.profileIcon}>
            <Ionicons name={icon} size={18} color={colors.primaryBlue} />
          </View>
          <Text style={styles.profileLabel}>{label}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textGrey} />
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  avatarText: { color: colors.textLight, fontSize: 28, fontWeight: '700' },
  name: { marginTop: 12, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.textGrey, fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 20 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.primaryBlue },
  statLabel: { color: colors.textGrey, fontSize: 12, marginTop: 2 },
  cardTitle: { fontWeight: '600', fontSize: 15, alignSelf: 'flex-start', width: '100%' },
  achievements: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    width: '100%',
  },
  achievement: { alignItems: 'center', maxWidth: 72 },
  achIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achLabel: { fontSize: 9, color: colors.textGrey, textAlign: 'center', marginTop: 4 },
  profileRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.primaryBlue}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  signOut: { marginTop: 20, paddingVertical: 8 },
  signOutText: { color: colors.redDanger, fontSize: 15 },
});
