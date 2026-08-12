import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { BackNextButtons } from '../../components/BackNextButtons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacySetup'>;

function ToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <AppCard paddingHorizontal={16} paddingVertical={12}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ true: colors.primaryBlue, false: '#ccc' }}
          thumbColor={colors.cardWhite}
        />
      </View>
    </AppCard>
  );
}

export function PrivacySetupScreen({ navigation }: Props) {
  const [pinLock, setPinLock] = useState(false);
  const [password, setPassword] = useState(false);
  const [patternLock, setPatternLock] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Privacy Setup" />
      <View style={styles.body}>
        <ToggleRow label="PIN Lock" subtitle="Secure with PIN" value={pinLock} onValueChange={setPinLock} />
        <ToggleRow label="Password" subtitle="Secure password" value={password} onValueChange={setPassword} />
        <ToggleRow label="Pattern Lock" subtitle="Screen pattern" value={patternLock} onValueChange={setPatternLock} />
        <View style={styles.spacer} />
        <BackNextButtons
          onBack={() => navigation.goBack()}
          onNext={() => navigation.navigate('Theme')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  textCol: { flex: 1 },
  label: { fontWeight: '600', fontSize: 15 },
  sub: { color: colors.textGrey, fontSize: 12, marginTop: 2 },
  spacer: { flex: 1 },
});
