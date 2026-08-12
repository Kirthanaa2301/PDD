import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { BackNextButtons } from '../../components/BackNextButtons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Permissions'>;

function PermissionRow({
  icon,
  label,
  subtitle,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <AppCard paddingHorizontal={16} paddingVertical={14}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={colors.primaryBlue} />
        </View>
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

export function PermissionsScreen({ navigation }: Props) {
  const [mic, setMic] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [emergencyCalls, setEmergencyCalls] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Permissions" />
      <View style={styles.body}>
        <PermissionRow icon="mic-outline" label="Microphone" subtitle="For breathing analysis" value={mic} onValueChange={setMic} />
        <PermissionRow icon="notifications-outline" label="Notifications" subtitle="Get timely reminders" value={notifications} onValueChange={setNotifications} />
        <PermissionRow icon="call-outline" label="Emergency Calls" subtitle="For emergency support" value={emergencyCalls} onValueChange={setEmergencyCalls} />
        <View style={styles.spacer} />
        <BackNextButtons
          onBack={() => navigation.goBack()}
          onNext={() => navigation.navigate('OnboardingWelcome')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${colors.primaryBlue}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: { flex: 1 },
  label: { fontWeight: '600', fontSize: 15 },
  sub: { color: colors.textGrey, fontSize: 12 },
  spacer: { flex: 1 },
});
