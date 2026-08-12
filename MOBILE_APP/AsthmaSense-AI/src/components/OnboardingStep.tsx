import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { BackNextButtons } from './BackNextButtons';
import { ScreenHeader } from './ScreenHeader';
import { StepProgressBar } from './StepProgressBar';

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
};

export function OnboardingStep({
  step,
  total,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = 'Next',
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={`Step ${step} of ${total}`} onBack={onBack} titleColor={colors.textGrey} />
      <View style={styles.body}>
        <StepProgressBar currentStep={step} totalSteps={total} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        <BackNextButtons onBack={onBack} onNext={onNext} nextLabel={nextLabel} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  title: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
  },
  subtitle: { marginTop: 6, fontSize: 14, color: colors.textGrey },
  scroll: { flex: 1, marginTop: 24, marginBottom: 16 },
});
