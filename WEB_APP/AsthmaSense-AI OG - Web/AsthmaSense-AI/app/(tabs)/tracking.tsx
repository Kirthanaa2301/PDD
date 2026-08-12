import React, { useEffect, useRef } from 'react';
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
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { useSymptomStore } from '../../src/store';

const { width } = Dimensions.get('window');

const CALENDAR_DAYS = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  return {
    day: d.toLocaleDateString('en', { weekday: 'short' })[0],
    date: d.getDate(),
    today: i === 0,
  };
});

const SYMPTOMS = [
  { key: 'wheezing', name: 'Wheezing', color: '#F5A623', icon: 'wind' as const },
  { key: 'medication', name: 'Medication', color: '#4A9EFF', icon: 'tablet' as const },
  { key: 'cough', name: 'Cough', color: '#FF4D4D', icon: 'activity' as const },
  { key: 'sleep', name: 'Sleep quality', color: '#4A9EFF', icon: 'moon' as const },
  { key: 'triggers', name: 'Triggers', color: '#F5A623', icon: 'zap' as const },
  { key: 'energy', name: 'Energy level', color: '#34C785', icon: 'heart' as const },
];

export default function TrackingScreen() {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const isFocused = useIsFocused();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isFocused) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isFocused]);

  const logs = useSymptomStore((s: any) => s.logs);

  const todayLogs = logs.filter((l: any) => {
    const d = new Date(l.createdAt);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  });

  const done = new Set(todayLogs.map((l: any) => l.symptom));
  const completed = done.size;
  const pct = (completed / SYMPTOMS.length) * 100;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>Daily tracking</Text>
          <Text style={[styles.subheading, { color: colors.textSub }]}>
            A clear picture, one tap at a time.
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Horizontal Calendar list */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll} contentContainerStyle={{ gap: 8 }}>
          {CALENDAR_DAYS.map((d, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => haptics.light()}
              style={[
                styles.calendarBtn,
                {
                  backgroundColor: d.today ? colors.accent : colors.card,
                  borderColor: d.today ? colors.accent : colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.calendarDay, { color: d.today ? '#fff' : colors.textSub }]}>{d.day}</Text>
              <Text style={[styles.calendarDate, { color: d.today ? '#fff' : colors.text }]}>{d.date}</Text>
              <View style={[styles.calendarDot, { backgroundColor: d.today ? '#fff' : colors.mint }]} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Progressring card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.progressCardRow}>
            <ProgressRing
              size={90}
              strokeWidth={8}
              progress={pct / 100}
              color={colors.accent}
              trackColor={colors.cardBorder}
            >
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.ringCompletedText, { color: colors.text }]}>
                  {completed}/{SYMPTOMS.length}
                </Text>
                <Text style={[styles.ringLabelText, { color: colors.textSub }]}>tasks</Text>
              </View>
            </ProgressRing>

            <View style={styles.progressCardInfo}>
              <Text style={[styles.progressCardTitle, { color: colors.text }]}>Today's progress</Text>
              <Text style={[styles.progressCardDesc, { color: colors.textSub }]}>
                {completed} of {SYMPTOMS.length} symptoms logged.
              </Text>
              
              <View style={[styles.linearTrack, { backgroundColor: colors.bg }]}>
                <Reanimated.View
                  entering={FadeInDown.duration(400)}
                  style={[styles.linearFill, { backgroundColor: colors.accent, width: `${pct}%` }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Symptoms checklist grid */}
        <View style={styles.gridList}>
          {SYMPTOMS.map((s, i) => {
            const logged = done.has(s.key);
            return (
              <Reanimated.View
                key={s.key}
                entering={FadeInDown.delay(i * 60).duration(400)}
              >
                <TouchableOpacity
                  onPress={() => { haptics.light(); router.push(`/tracking/${s.key}` as any); }}
                  activeOpacity={0.88}
                  style={[
                    styles.symptomRow,
                    {
                      backgroundColor: logged ? colors.mintTint : colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: logged ? 'rgba(52,199,133,0.15)' : `${s.color}15` }]}>
                    <Feather
                      name={logged ? 'check' : s.icon}
                      size={18}
                      color={logged ? colors.mint : s.color}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.symptomName, { color: colors.text }]}>{s.name}</Text>
                    <Text style={[styles.symptomStatus, { color: colors.textSub }]}>
                      {logged ? 'Logged today' : 'Tap to log'}
                    </Text>
                  </View>

                  <Text style={[styles.editLink, { color: colors.accent }]}>
                    {logged ? 'Edit →' : 'Log now →'}
                  </Text>
                </TouchableOpacity>
              </Reanimated.View>
            );
          })}
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
  calendarScroll: { paddingHorizontal: 16, marginBottom: 20 },
  calendarBtn: { width: 62, height: 72, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  calendarDay: { fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'uppercase' },
  calendarDate: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  calendarDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginHorizontal: 16, marginBottom: 20 },
  progressCardRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ringCompletedText: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  ringLabelText: { fontFamily: 'Inter_400Regular', fontSize: 9 },
  progressCardInfo: { flex: 1 },
  progressCardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  progressCardDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
  linearTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 10 },
  linearFill: { height: 4, borderRadius: 2 },
  gridList: { paddingHorizontal: 16, gap: 10 },
  symptomRow: { height: 72, borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  symptomName: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  symptomStatus: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  editLink: { fontFamily: 'Inter_700Bold', fontSize: 12 },
});
