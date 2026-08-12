import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackNextButtons } from '../../components/BackNextButtons';
import { SelectionChip } from '../../components/SelectionChip';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { inputShadow } from '../../theme/shadows';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateProfile'>;

export function CreateProfileScreen({ navigation }: Props) {
  const [name, setName] = useState('Aaron Sharma');
  const [age, setAge] = useState('24');
  const [gender, setGender] = useState('Male');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Create Profile" />
      <View style={styles.body}>
        <Field label="Full Name" value={name} onChangeText={setName} />
        <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {['Male', 'Female', 'Other'].map((g) => (
            <View key={g} style={styles.genderChip}>
              <SelectionChip label={g} isSelected={gender === g} onPress={() => setGender(g)} />
            </View>
          ))}
        </View>
        <View style={styles.spacer} />
        <BackNextButtons
          onBack={() => navigation.goBack()}
          onNext={() => navigation.navigate('PrivacySetup')}
        />
      </View>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, inputShadow]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  field: { marginTop: 16 },
  label: { fontSize: 13, color: colors.textGrey, marginBottom: 8 },
  inputWrap: {
    backgroundColor: colors.cardWhite,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: { fontSize: 15, fontWeight: '500' },
  genderRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  genderChip: { flex: 1 },
  spacer: { flex: 1 },
});
