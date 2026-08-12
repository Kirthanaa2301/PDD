import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackNextButtons } from '../../components/BackNextButtons';
import { SelectionChip } from '../../components/SelectionChip';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StepProgressBar } from '../../components/StepProgressBar';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AsthmaTriggers'>;

const TRIGGERS = [
  'Dust',
  'Smoke',
  'Cold Air',
  'Exercise',
  'Pollen',
  'Stress',
  'Strong smells',
  'Weather change',
  'Other',
];

export function AsthmaTriggersScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['Pollen', 'Walking']));

  const toggle = (t: string) => {
    const next = new Set(selected);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setSelected(next);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Step 2 of 12" titleColor={colors.textGrey} onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <StepProgressBar currentStep={2} totalSteps={12} />
        <Text style={styles.title}>What triggers your asthma?</Text>
        <Text style={styles.sub}>Select all that apply</Text>
        <View style={styles.chips}>
          {TRIGGERS.map((t) => (
            <SelectionChip
              key={t}
              label={t}
              isSelected={selected.has(t)}
              onPress={() => toggle(t)}
            />
          ))}
        </View>
        <View style={styles.spacer} />
        <BackNextButtons
          onBack={() => navigation.goBack()}
          onNext={() => navigation.navigate('CustomTrigger')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  title: { marginTop: 20, fontSize: 20, fontWeight: '700', color: colors.textDark },
  sub: { marginTop: 6, color: colors.textGrey },
  chips: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spacer: { flex: 1 },
});
