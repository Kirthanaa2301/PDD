import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, radius } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useSessionStore } from '../../src/store';

const { width } = Dimensions.get('window');

const CHIPS = ['All', 'Box Breathing', 'Deep Belly', 'Diaphragmatic', 'Pursed Lip'];

const EXERCISES = [
  { id: 'box', name: 'Box Breathing', desc: 'Equal-time inhale, hold, exhale, hold — used by Navy SEALs to steady the nervous system.', difficulty: 'Beginner', min: 2, cycles: 4, progress: 60, type: 'Box Breathing' },
  { id: 'belly', name: 'Deep Belly', desc: 'Slow diaphragmatic breathing to open the lower lungs and calm the chest.', difficulty: 'Beginner', min: 2, cycles: 5, progress: 35, type: 'Deep Belly' },
  { id: 'pursed', name: 'Pursed Lip', desc: 'Inhale through the nose, exhale slowly through pursed lips — eases air trapping.', difficulty: 'All levels', min: 2, cycles: 6, progress: 80, type: 'Pursed Lip' },
  { id: 'diaphragm', name: 'Diaphragmatic Reset', desc: 'A focused reset for tense breathing patterns and post-flare recovery.', difficulty: 'Intermediate', min: 2, cycles: 4, progress: 20, type: 'Diaphragmatic' },
];

export default function BreathingExercisesScreen() {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const isFocused = useIsFocused();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isFocused) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isFocused]);

  const [selectedChip, setSelectedChip] = useState('All');
  const sessions = useSessionStore((s: any) => s.sessions) || [];

  const filtered = selectedChip === 'All' ? EXERCISES : EXERCISES.filter((e) => e.type === selectedChip);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>Breathing exercises</Text>
          <Text style={[styles.subheading, { color: colors.textSub }]}>
            Guided sessions to ease your breath.
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Horizontal Chips Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={{ gap: 8 }}>
          {CHIPS.map((c) => {
            const active = selectedChip === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => { haptics.light(); setSelectedChip(c); }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.accent : colors.card,
                    borderColor: active ? colors.accent : colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSub }]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Exercises Cards Grid */}
        <View style={styles.exercisesContainer}>
          {filtered.map((e, i) => (
            <Reanimated.View
              key={e.id}
              entering={FadeInDown.delay(i * 60).duration(400)}
            >
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                {(() => {
                  const completedCount = sessions.filter((s: any) => s.exercise === e.id).length;
                  return (
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardName, { color: colors.text }]}>{e.name}</Text>
                        <View style={[styles.difficultyBadge, { backgroundColor: colors.accentDim }]}>
                          <Text style={[styles.difficultyText, { color: colors.accent }]}>{e.difficulty}</Text>
                        </View>
                      </View>
                      
                      {/* Centralized Dynamic Session counter badge instead of progress ring */}
                      <View style={[
                        styles.completedBadge, 
                        { 
                          backgroundColor: completedCount > 0 ? colors.mintTint : colors.accentDim,
                          borderColor: completedCount > 0 ? `${colors.mint}30` : colors.cardBorder
                        }
                      ]}>
                        <Feather 
                          name={completedCount > 0 ? "check-circle" : "play-circle"} 
                          size={12} 
                          color={completedCount > 0 ? colors.mint : colors.accent} 
                        />
                        <Text style={[
                          styles.completedBadgeText, 
                          { color: completedCount > 0 ? colors.mint : colors.textSub }
                        ]}>
                          {completedCount > 0 ? `${completedCount} completed` : '0 sessions'}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                <Text style={[styles.cardDesc, { color: colors.textSub }]} numberOfLines={2}>
                  {e.desc}
                </Text>

                <View style={styles.metaRow}>
                  <Feather name="clock" size={12} color={colors.textSub} />
                  <Text style={[styles.metaText, { color: colors.textSub }]}>
                    {e.min} min · {e.cycles} cycles
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => { haptics.light(); router.push(`/breathing/${e.id}` as any); }}
                  activeOpacity={0.88}
                  style={[styles.startBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.startBtnText}>Start session</Text>
                </TouchableOpacity>
              </View>
            </Reanimated.View>
          ))}
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 26 },
  subheading: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 },
  scrollContent: { paddingTop: 12 },
  chipsScroll: { paddingHorizontal: 16, marginBottom: 20 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  exercisesContainer: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardName: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, alignSelf: 'flex-start', marginTop: 6 },
  difficultyText: { fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, gap: 4 },
  completedBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.3 },
  cardDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  startBtn: { height: 42, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 14 },
});
