import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackNextButtons } from '../../components/BackNextButtons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingWelcome'>;

export function OnboardingWelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Onboarding" />
      <View style={styles.body}>
        <View style={styles.spacer} />
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-outline" size={52} color={colors.primaryBlue} />
        </View>
        <Text style={styles.title}>Welcome to AsthmaSense AI</Text>
        <Text style={styles.sub}>
          Let's set up your asthma profile in a few steps so AI can give the most accurate patterns.
        </Text>
        <View style={styles.spacer} />
        <BackNextButtons
          onBack={() => navigation.goBack()}
          onNext={() => navigation.navigate('AsthmaTriggers')}
          nextLabel="Begin"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' },
  spacer: { flex: 1 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.primaryBlue}1F`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 28,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
  },
  sub: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textGrey,
    textAlign: 'center',
    lineHeight: 21,
  },
});
