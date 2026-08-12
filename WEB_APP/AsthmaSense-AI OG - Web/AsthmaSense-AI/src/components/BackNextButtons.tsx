import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
};

export function BackNextButtons({ onBack, onNext, nextLabel = 'Next' }: Props) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <View style={styles.gap} />
        </>
      ) : null}
      <View style={styles.nextWrap}>
        <PrimaryButton text={nextLabel} onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    minWidth: 100,
    height: 48,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.primaryBlue, fontSize: 16 },
  gap: { width: 12 },
  nextWrap: { flex: 1 },
});
