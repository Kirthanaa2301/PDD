import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../../components/AppCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Breathing'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = { navigation: Nav };

const CATEGORIES = [
  {
    title: '4-4-4 Box breathing',
    items: ['Beginner', 'Intermediate', 'Advanced'],
    type: '4-4-4 Breathing',
  },
  {
    title: 'Deep breathing',
    items: ['Beginner', 'Intermediate', 'Advanced'],
    type: 'Deep Breathing',
  },
  {
    title: 'Diaphragmatic',
    items: ['Beginner exercises', 'Intermediate', 'Advanced'],
    type: 'Diaphragmatic',
  },
];

export function BreathingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Breathing & Lungs" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.navigate('BreathingTest')}>
          <AppCard>
            <View style={styles.testRow}>
              <View style={styles.testIcon}>
                <Ionicons name="mic-outline" size={22} color={colors.primaryBlue} />
              </View>
              <View style={styles.testText}>
                <Text style={styles.testTitle}>Breathing & cough analysis</Text>
                <Text style={styles.testSub}>Record or upload audio for AI analysis</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textGrey} />
            </View>
          </AppCard>
        </Pressable>

        <Text style={styles.sectionTitle}>Exercises</Text>
        {CATEGORIES.map((cat) => (
          <AppCard key={cat.title} style={styles.category}>
            <Text style={styles.catTitle}>{cat.title}</Text>
            {cat.items.map((item, index) => (
              <Pressable
                key={item}
                style={styles.exerciseRow}
                onPress={() =>
                  navigation.navigate('BreathingExercise', { type: cat.type, level: item })
                }
              >
                <View style={styles.indexBox}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                <Text style={styles.exerciseLabel}>{item}</Text>
                <View style={styles.startPill}>
                  <Text style={styles.startText}>Start</Text>
                </View>
              </Pressable>
            ))}
          </AppCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  testRow: { flexDirection: 'row', alignItems: 'center' },
  testIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primaryBlue}1F`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  testText: { flex: 1 },
  testTitle: { fontWeight: '600', fontSize: 14 },
  testSub: { color: colors.textGrey, fontSize: 12, marginTop: 2 },
  sectionTitle: { fontWeight: '700', fontSize: 16, marginTop: 8 },
  category: { marginTop: 0 },
  catTitle: { fontWeight: '700', fontSize: 15, marginBottom: 12 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  indexBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${colors.primaryBlue}1F`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  indexText: { color: colors.primaryBlue, fontWeight: '700', fontSize: 13 },
  exerciseLabel: { flex: 1, fontSize: 14 },
  startPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: `${colors.primaryBlue}1A`,
  },
  startText: { color: colors.primaryBlue, fontSize: 12, fontWeight: '600' },
});
