import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { inputShadow } from '../../theme/shadows';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneLogin'>;

export function PhoneLoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('98191 61230');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.title}>Phone Login</Text>
        <Text style={styles.sub}>Enter your phone number</Text>
        <View style={[styles.inputWrap, inputShadow]}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Phone number"
            style={styles.input}
          />
        </View>
        <Text style={styles.terms}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
        <View style={styles.spacer} />
        <PrimaryButton text="Continue" onPress={() => navigation.navigate('VerifyOtp')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24 },
  title: { marginTop: 16, fontSize: 24, fontWeight: '700', color: colors.textDark },
  sub: { marginTop: 8, fontSize: 14, color: colors.textGrey },
  inputWrap: {
    marginTop: 32,
    flexDirection: 'row',
    backgroundColor: colors.cardWhite,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  prefixText: { fontWeight: '600', fontSize: 16 },
  input: { flex: 1, paddingHorizontal: 14, fontSize: 16, fontWeight: '500' },
  terms: { marginTop: 16, fontSize: 12, color: colors.textGrey },
  spacer: { flex: 1 },
});
