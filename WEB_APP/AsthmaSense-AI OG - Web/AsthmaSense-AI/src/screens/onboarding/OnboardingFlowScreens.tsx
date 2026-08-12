import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { OnboardingStep } from '../../components/OnboardingStep';
import { SelectionChip } from '../../components/SelectionChip';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackScreenProps<RootStackParamList>;

export function CustomTriggerScreen({ navigation }: Nav) {
  const [text, setText] = useState('');
  return (
    <OnboardingStep
      step={3}
      total={12}
      title="Add custom trigger"
      subtitle="Describe any other triggers"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('SymptomsTiming')}
    >
      <AppCard padding={0}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="e.g. Paint fumes"
          placeholderTextColor={colors.textGrey}
          style={styles.textInput}
        />
      </AppCard>
    </OnboardingStep>
  );
}

export function SymptomsTimingScreen({ navigation }: Nav) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['Morning']));
  const items = ['Morning', 'Night', 'During exercise', 'Random'];
  const toggle = (t: string) => {
    const n = new Set(selected);
    if (n.has(t)) n.delete(t);
    else n.add(t);
    setSelected(n);
  };
  return (
    <OnboardingStep
      step={4}
      total={12}
      title="When do symptoms occur?"
      subtitle="Select all that apply"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('SeverityLevel')}
    >
      <View style={styles.chips}>
        {items.map((t) => (
          <SelectionChip key={t} label={t} isSelected={selected.has(t)} onPress={() => toggle(t)} />
        ))}
      </View>
    </OnboardingStep>
  );
}

export function SeverityLevelScreen({ navigation }: Nav) {
  const [severity, setSeverity] = useState('Moderate');
  const levels = [
    { label: 'Mild', color: colors.mildColor },
    { label: 'Moderate', color: colors.moderateColor },
    { label: 'Severe', color: colors.severeColor },
  ];
  return (
    <OnboardingStep
      step={5}
      total={12}
      title="Severity level"
      subtitle="How severe is your asthma?"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('MedicationSetup')}
    >
      <View style={styles.severityRow}>
        {levels.map((l) => {
          const isSelected = severity === l.label;
          return (
            <Pressable
              key={l.label}
              onPress={() => setSeverity(l.label)}
              style={[
                styles.severityItem,
                { backgroundColor: isSelected ? l.color : `${l.color}1F` },
              ]}
            >
              <Text style={[styles.severityText, { color: isSelected ? colors.textLight : l.color }]}>
                {l.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );
}

export function MedicationSetupScreen({ navigation }: Nav) {
  const [yes, setYes] = useState(true);
  return (
    <OnboardingStep
      step={6}
      total={12}
      title="Medication setup"
      subtitle="Do you currently use any medication?"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('CommonMedications')}
    >
      <View style={styles.yesNoRow}>
        <Pressable
          onPress={() => setYes(true)}
          style={[styles.yesNo, yes && styles.yesNoActive]}
        >
          <Text style={[styles.yesNoText, yes && styles.yesNoTextActive]}>Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => setYes(false)}
          style={[styles.yesNo, !yes && styles.yesNoActive]}
        >
          <Text style={[styles.yesNoText, !yes && styles.yesNoTextActive]}>No</Text>
        </Pressable>
      </View>
    </OnboardingStep>
  );
}

export function CommonMedicationsScreen({ navigation }: Nav) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['Asthalin']));
  const meds = ['Asthalin', 'Budecort', 'Foracort', 'Seroflo'];
  const toggle = (m: string) => {
    const n = new Set(selected);
    if (n.has(m)) n.delete(m);
    else n.add(m);
    setSelected(n);
  };
  return (
    <OnboardingStep
      step={7}
      total={12}
      title="Common medications"
      subtitle="Select your medications"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('Dosage')}
    >
      <View style={styles.chips}>
        {meds.map((m) => (
          <SelectionChip key={m} label={m} isSelected={selected.has(m)} onPress={() => toggle(m)} />
        ))}
      </View>
    </OnboardingStep>
  );
}

export function DosageScreen({ navigation }: Nav) {
  const [dosage, setDosage] = useState('1 puff');
  const options = ['1 puff', '2 puffs', 'Tablet', 'Syrup'];
  return (
    <OnboardingStep
      step={8}
      total={12}
      title="Dosage"
      subtitle="Select your dosage"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('Timing')}
    >
      <View style={styles.chips}>
        {options.map((d) => (
          <SelectionChip key={d} label={d} isSelected={dosage === d} onPress={() => setDosage(d)} />
        ))}
      </View>
    </OnboardingStep>
  );
}

export function TimingScreen({ navigation }: Nav) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['Morning', 'Night']));
  const toggle = (t: string) => {
    const n = new Set(selected);
    if (n.has(t)) n.delete(t);
    else n.add(t);
    setSelected(n);
  };
  return (
    <OnboardingStep
      step={9}
      total={12}
      title="Timing"
      subtitle="When do you take your medication?"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('AddMedication')}
    >
      <View style={styles.chips}>
        {['Morning', 'Afternoon', 'Night'].map((t) => (
          <SelectionChip key={t} label={t} isSelected={selected.has(t)} onPress={() => toggle(t)} />
        ))}
      </View>
      <View style={[styles.chips, { marginTop: 16 }]}>
        {['Multiple', 'Custom'].map((t) => (
          <SelectionChip key={t} label={t} isSelected={false} onPress={() => {}} />
        ))}
      </View>
    </OnboardingStep>
  );
}

export function AddMedicationScreen({ navigation }: Nav) {
  return (
    <OnboardingStep
      step={10}
      total={12}
      title="Add another medication?"
      subtitle="You can add more medications"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('DailyHabits')}
    >
      <Pressable style={styles.addMed}>
        <Ionicons name="add" size={20} color={colors.primaryBlue} />
        <Text style={styles.addMedText}>Add medication</Text>
      </Pressable>
    </OnboardingStep>
  );
}

export function DailyHabitsScreen({ navigation }: Nav) {
  const [breathing, setBreathing] = useState(true);
  const [smoke, setSmoke] = useState(false);
  return (
    <OnboardingStep
      step={11}
      total={12}
      title="Daily habits"
      subtitle="Tell us about your habits"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('EmergencyContact')}
    >
      <AppCard paddingHorizontal={16} paddingVertical={12}>
        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>Daily breathing exercises?</Text>
          <Pressable onPress={() => setBreathing(!breathing)}>
            <Ionicons
              name={breathing ? 'checkbox' : 'square-outline'}
              size={24}
              color={colors.primaryBlue}
            />
          </Pressable>
        </View>
      </AppCard>
      <AppCard paddingHorizontal={16} paddingVertical={12} style={{ marginTop: 8 }}>
        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>Smoke/vape?</Text>
          <Pressable onPress={() => setSmoke(!smoke)}>
            <Ionicons
              name={smoke ? 'checkbox' : 'square-outline'}
              size={24}
              color={colors.primaryBlue}
            />
          </Pressable>
        </View>
      </AppCard>
    </OnboardingStep>
  );
}

export function EmergencyContactScreen({ navigation }: Nav) {
  const [name, setName] = useState('Mom');
  const [relation, setRelation] = useState('Mother');
  const [phone, setPhone] = useState('+91 98765 12345');

  return (
    <OnboardingStep
      step={12}
      total={12}
      title="Emergency contact"
      subtitle="Add an emergency contact"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
      nextLabel="Finish & Go Home"
    >
      <EmergencyField label="Name" value={name} onChangeText={setName} />
      <EmergencyField label="Relation" value={relation} onChangeText={setRelation} />
      <EmergencyField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
    </OnboardingStep>
  );
}

function EmergencyField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <AppCard padding={0}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          style={styles.fieldInput}
        />
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  textInput: { padding: 16, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  severityRow: { flexDirection: 'row', gap: 8 },
  severityItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  severityText: { fontWeight: '600' },
  yesNoRow: { flexDirection: 'row', gap: 12 },
  yesNo: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.primaryBlue}4D`,
    backgroundColor: colors.cardWhite,
    alignItems: 'center',
  },
  yesNoActive: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  yesNoText: { color: colors.primaryBlue, fontWeight: '600' },
  yesNoTextActive: { color: colors.textLight },
  addMed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.primaryBlue}4D`,
    backgroundColor: colors.cardWhite,
    gap: 8,
  },
  addMedText: { color: colors.primaryBlue, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  checkLabel: { flex: 1, fontSize: 14 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: colors.textGrey, marginBottom: 4 },
  fieldInput: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
});
