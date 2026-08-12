import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TriggerJournal'>;

const TRIGGERS = [
  { name: 'Pollen', note: 'High exposure', time: '8:30 am' },
  { name: 'Dust', note: 'Office cleaning', time: '10:00 am' },
  { name: 'Cold Air', note: 'Morning walk', time: '7:00 am' },
  { name: 'Smoke', note: 'Nearby traffic', time: '3:00 pm' },
];

export function TriggerJournalScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title="Trigger Journal" onBack={() => navigation.goBack()} />
      <FlatList
        data={TRIGGERS}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <AppCard paddingHorizontal={16} paddingVertical={14}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name="warning-outline" size={22} color={colors.primaryBlue} />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.note}>{item.note}</Text>
              </View>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </AppCard>
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton text="+ Add Trigger" onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: `${colors.primaryBlue}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textCol: { flex: 1 },
  name: { fontWeight: '600', fontSize: 14 },
  note: { color: colors.textGrey, fontSize: 12, marginTop: 2 },
  time: { color: colors.textGrey, fontSize: 11 },
  footer: { paddingHorizontal: 20, paddingBottom: 24 },
});
