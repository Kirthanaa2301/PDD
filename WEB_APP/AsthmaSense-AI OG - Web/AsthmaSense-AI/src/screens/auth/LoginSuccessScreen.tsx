import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginSuccess'>;

export function LoginSuccessScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.spacer} />
        <View style={styles.circle}>
          <Ionicons name="checkmark" size={56} color={colors.textLight} />
        </View>
        <Text style={styles.title}>Login Successful</Text>
        <Text style={styles.sub}>Welcome to AsthmaSense AI</Text>
        <View style={styles.spacer} />
        <PrimaryButton
          text="Continue"
          onPress={() => navigation.navigate('CreateProfile')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },
  spacer: { flex: 1 },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryBlue,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 32,
    fontSize: 26,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
  },
  sub: { marginTop: 12, fontSize: 15, color: colors.textGrey, textAlign: 'center' },
});
