import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorReport'>;

const INCLUDES = [
  'Patient profile',
  '30-day breathing scores',
  'Symptom log',
  'Medication adherence',
  'Trigger journal',
  'Sleep analysis',
];

export function DoctorReportScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Doctor Report" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <AppCard>
          <View style={styles.iconBox}>
            <Ionicons name="document-text-outline" size={32} color={colors.primaryBlue} />
          </View>
          <Text style={styles.reportTitle}>Medical Report - May 2026</Text>
          <Text style={styles.includesTitle}>Includes:</Text>
          {INCLUDES.map((item) => (
            <View key={item} style={styles.includeRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.greenSuccess} />
              <Text style={styles.includeText}>{item}</Text>
            </View>
          ))}
        </AppCard>
        <PrimaryButton text="Generate PDF" onPress={() => {}} style={{ marginTop: 20 }} />
        <View style={styles.shareRow}>
          <Pressable style={[styles.shareBtn, styles.whatsapp]}>
            <Ionicons name="share-social-outline" size={18} color={colors.greenSuccess} />
            <Text style={[styles.shareText, { color: colors.greenSuccess }]}>WhatsApp</Text>
          </Pressable>
          <Pressable style={[styles.shareBtn, styles.email]}>
            <Ionicons name="mail-outline" size={18} color={colors.primaryBlue} />
            <Text style={[styles.shareText, { color: colors.primaryBlue }]}>Email</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: `${colors.primaryBlue}1A`,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: {
    marginTop: 16,
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  includesTitle: {
    alignSelf: 'flex-start',
    marginTop: 20,
    fontWeight: '600',
    fontSize: 13,
  },
  includeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  includeText: { fontSize: 13 },
  shareRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  whatsapp: { borderColor: colors.greenSuccess },
  email: { borderColor: colors.primaryBlue },
  shareText: { fontWeight: '600', fontSize: 14 },
});
