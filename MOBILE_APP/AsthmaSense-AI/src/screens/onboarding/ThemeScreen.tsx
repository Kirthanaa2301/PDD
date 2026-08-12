import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BackNextButtons } from '../../components/BackNextButtons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { cardShadow } from '../../theme/shadows';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Theme'>;

function ThemeOption({
  label,
  icon,
  isSelected,
  isDark,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        cardShadow,
        {
          backgroundColor: isDark ? colors.darkBackground : colors.cardWhite,
          borderColor: isSelected ? colors.primaryBlue : 'transparent',
          borderWidth: isSelected ? 2.5 : 0,
        },
      ]}
    >
      <Ionicons name={icon} size={32} color={isDark ? colors.textLight : colors.textDark} />
      <Text style={[styles.optionLabel, { color: isDark ? colors.textLight : colors.textDark }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ThemeScreen({ navigation }: Props) {
  const [theme, setTheme] = useState('Dark');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Theme" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.hint}>Choose your app theme</Text>
        <View style={styles.options}>
          <ThemeOption
            label="Light"
            icon="sunny-outline"
            isSelected={theme === 'Light'}
            isDark={false}
            onPress={() => setTheme('Light')}
          />
          <ThemeOption
            label="Dark"
            icon="moon-outline"
            isSelected={theme === 'Dark'}
            isDark
            onPress={() => setTheme('Dark')}
          />
        </View>
        <View style={styles.spacer} />
        <BackNextButtons
          onBack={() => navigation.goBack()}
          onNext={() => navigation.navigate('Permissions')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  hint: { marginTop: 24, fontSize: 16, color: colors.textGrey, textAlign: 'center' },
  options: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  option: {
    width: 120,
    height: 120,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { marginTop: 8, fontWeight: '600' },
  spacer: { flex: 1 },
});
