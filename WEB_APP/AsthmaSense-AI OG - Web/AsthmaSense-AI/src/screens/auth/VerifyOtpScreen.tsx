import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { inputShadow } from '../../theme/shadows';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyOtp'>;

export function VerifyOtpScreen({ navigation }: Props) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const refs = useRef<(TextInput | null)[]>([]);

  const onChange = (index: number, value: string) => {
    const d = value.slice(-1);
    const next = [...digits];
    next[index] = d;
    setDigits(next);
    if (d && index < 3) refs.current[index + 1]?.focus();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.sub}>Enter the OTP sent to your phone</Text>
        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <View key={i} style={[styles.otpBox, inputShadow]}>
              <TextInput
                ref={(r) => { refs.current[i] = r; }}
                value={d}
                onChangeText={(v) => onChange(i, v)}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.otpInput}
                textAlign="center"
              />
            </View>
          ))}
        </View>
        <Pressable style={styles.resend}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </Pressable>
        <View style={styles.spacer} />
        <PrimaryButton text="Verify" onPress={() => navigation.navigate('LoginSuccess')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24 },
  title: { marginTop: 16, fontSize: 24, fontWeight: '700', color: colors.textDark },
  sub: { marginTop: 8, color: colors.textGrey },
  otpRow: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpBox: {
    width: 60,
    height: 60,
    backgroundColor: colors.cardWhite,
    borderRadius: 12,
    justifyContent: 'center',
  },
  otpInput: { fontSize: 22, fontWeight: '700' },
  resend: { marginTop: 24, alignSelf: 'center' },
  resendText: { color: colors.primaryBlue },
  spacer: { flex: 1 },
});
