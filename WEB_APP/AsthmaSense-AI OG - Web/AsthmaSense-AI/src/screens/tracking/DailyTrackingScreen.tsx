import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Tracking'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = { navigation: Nav };

const ITEMS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  color: string;
  symptom?: string;
  screen?: 'TriggerJournal';
}[] = [
  {
    icon: 'cloud-outline',
    label: 'Shortness of breath',
    sub: 'Not logged yet',
    color: colors.primaryBlue,
    symptom: 'Shortness of Breath',
  },
  {
    icon: 'volume-high-outline',
    label: 'Coughing',
    sub: 'Not logged yet',
    color: colors.moderateColor,
    symptom: 'Coughing',
  },
  {
    icon: 'pulse-outline',
    label: 'Wheezing',
    sub: 'Not logged yet',
    color: colors.severeColor,
    symptom: 'Wheezing',
  },
  {
    icon: 'heart-outline',
    label: 'Chest pain',
    sub: 'Not logged yet',
    color: colors.redDanger,
    symptom: 'Chest Pain',
  },
  {
    icon: 'book-outline',
    label: 'Trigger journal',
    sub: 'Add triggers',
    color: colors.greenSuccess,
    screen: 'TriggerJournal',
  },
];

export function DailyTrackingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Daily tracking" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppCard>
          <Text style={styles.cardTitle}>Today's progress</Text>
          <Text style={styles.progressSub}>4/6 done</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: '67%' }]} />
          </View>
        </AppCard>
        {ITEMS.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => {
              if (item.screen) navigation.navigate(item.screen);
              else if (item.symptom)
                navigation.navigate('SymptomDetail', { symptom: item.symptom });
            }}
          >
            <AppCard paddingHorizontal={16} paddingVertical={14}>
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}1F` }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.textCol}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.sub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textGrey} />
              </View>
            </AppCard>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  cardTitle: { fontWeight: '600', fontSize: 15 },
  progressSub: { color: colors.textGrey, fontSize: 12, marginTop: 4 },
  progressBg: {
    marginTop: 10,
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.progressBg,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primaryBlue, borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textCol: { flex: 1 },
  label: { fontWeight: '600', fontSize: 14 },
  sub: { color: colors.textGrey, fontSize: 12, marginTop: 2 },
});
