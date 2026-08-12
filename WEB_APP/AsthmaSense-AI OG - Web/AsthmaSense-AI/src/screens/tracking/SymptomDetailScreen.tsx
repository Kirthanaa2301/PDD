import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SeveritySelector } from '../../components/SeveritySelector';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SymptomDetail'>;

function getIcon(symptom: string): { name: keyof typeof Ionicons.glyphMap; color: string } {
  switch (symptom) {
    case 'Coughing':
      return { name: 'volume-high-outline', color: colors.moderateColor };
    case 'Wheezing':
      return { name: 'pulse-outline', color: colors.severeColor };
    case 'Chest Pain':
      return { name: 'heart-outline', color: colors.redDanger };
    default:
      return { name: 'cloud-outline', color: colors.primaryBlue };
  }
}

export function SymptomDetailScreen({ navigation, route }: Props) {
  const { symptom } = route.params;
  const [severity, setSeverity] = useState('Mild');
  const [notes, setNotes] = useState('');
  const { name, color } = getIcon(symptom);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={symptom} onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}1F` }]}>
          <Ionicons name={name} size={40} color={color} />
        </View>
        <Text style={styles.title}>{symptom}</Text>
        <Text style={styles.fieldLabel}>Severity</Text>
        <SeveritySelector selected={severity} onSelect={setSeverity} />
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Notes</Text>
        <AppCard padding={0}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Add notes..."
            placeholderTextColor={colors.textGrey}
            style={styles.notes}
          />
        </AppCard>
        <View style={styles.spacer} />
        <PrimaryButton text="Save" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  title: { marginTop: 12, fontSize: 20, fontWeight: '700' },
  fieldLabel: { alignSelf: 'flex-start', color: colors.textGrey, fontSize: 13, marginTop: 32, marginBottom: 8 },
  notes: { padding: 14, minHeight: 100, textAlignVertical: 'top', fontSize: 14 },
  spacer: { flex: 1 },
});
