import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

function FeatureItem({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.feature}>
      <Ionicons name={icon} size={28} color={colors.primaryBlue} />
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={styles.logo}>
            <Ionicons name="cloud-outline" size={48} color={colors.textLight} />
          </View>
          <Text style={styles.heading}>Welcome</Text>
          <Text style={styles.sub}>
            AI-powered asthma tracking, breathing analysis & 24/7 emergency support.
          </Text>
          <View style={styles.features}>
            <FeatureItem icon="shield-outline" label="Safe" />
            <FeatureItem icon="bulb-outline" label="AI" />
            <FeatureItem icon="heart-outline" label="Care" />
          </View>
        </View>
        <PrimaryButton text="Login" onPress={() => navigation.navigate('PhoneLogin')} />
        <Pressable style={styles.signUp}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 22,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    marginTop: 24,
    fontSize: 28,
    fontWeight: '700',
    color: colors.textDark,
  },
  sub: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textGrey,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  features: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 32,
  },
  feature: { alignItems: 'center' },
  featureLabel: { marginTop: 6, fontSize: 12, color: colors.textGrey },
  signUp: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  signUpText: { color: colors.primaryBlue, fontSize: 16, fontWeight: '600' },
});
