import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = { currentStep: number; totalSteps: number };

export function StepProgressBar({ currentStep, totalSteps }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            {
              backgroundColor:
                index < currentStep
                  ? colors.primaryBlue
                  : `${colors.primaryBlue}33`,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});
