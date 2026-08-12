import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Medications'>;

const MEDS = [
  { name: 'Asthalin', dosage: '1 puff', taken: false },
  { name: 'Budecort - 1 puff', dosage: '1 puff', taken: false },
  { name: 'Asthalin - 2 puffs', dosage: '2 puffs', taken: true },
];

export function MedicationsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Medications" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        {MEDS.map((m) => (
          <AppCard key={m.name} paddingHorizontal={16} paddingVertical={14} style={styles.medCard}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name="medkit" size={22} color={colors.primaryBlue} />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.name}>{m.name}</Text>
                <Text style={styles.dosage}>{m.dosage}</Text>
              </View>
              {m.taken ? (
                <View style={styles.takenBadge}>
                  <Text style={styles.takenText}>Taken</Text>
                </View>
              ) : null}
            </View>
          </AppCard>
        ))}
        <Text style={styles.weekTitle}>This week</Text>
        <View style={styles.weekRow}>
          {Array.from({ length: 7 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dayCircle,
                { backgroundColor: i < 5 ? colors.primaryBlue : `${colors.primaryBlue}26` },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={18}
                color={i < 5 ? colors.textLight : `${colors.primaryBlue}66`}
              />
            </View>
          ))}
        </View>
        <View style={styles.spacer} />
        <PrimaryButton text="+ Add medication" onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  medCard: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: `${colors.primaryBlue}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textCol: { flex: 1 },
  name: { fontWeight: '600', fontSize: 14 },
  dosage: { color: colors.textGrey, fontSize: 12, marginTop: 2 },
  takenBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: `${colors.greenSuccess}1F`,
  },
  takenText: { color: colors.greenSuccess, fontSize: 11, fontWeight: '600' },
  weekTitle: { fontWeight: '600', fontSize: 15, marginTop: 4 },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { flex: 1 },
});
