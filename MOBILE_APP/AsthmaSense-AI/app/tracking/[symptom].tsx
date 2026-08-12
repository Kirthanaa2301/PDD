import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Reanimated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme, radius } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useSymptomStore } from '../../src/store';

const SYMPTOM_META: Record<string, { name: string; icon: keyof typeof Feather.glyphMap; color: string }> = {
  wheezing: { name: 'Wheezing', icon: 'wind', color: '#F5A623' },
  medication: { name: 'Medication', icon: 'tablet', color: '#4A9EFF' },
  cough: { name: 'Cough', icon: 'activity', color: '#FF4D4D' },
  sleep: { name: 'Sleep quality', icon: 'moon', color: '#4A9EFF' },
  triggers: { name: 'Triggers', icon: 'zap', color: '#F5A623' },
  energy: { name: 'Energy level', icon: 'heart', color: '#34C785' },
};

const TIMES = ['Now', 'Earlier today', 'Yesterday'];

export default function SymptomLoggerScreen() {
  const { symptom } = useLocalSearchParams<{ symptom: string }>();
  const { colors } = useTheme();
  const haptics = useHaptics();
  const addLog = useSymptomStore((s: any) => s.addLog);

  const m = SYMPTOM_META[symptom ?? 'wheezing'] || { name: symptom ?? 'Symptom', icon: 'activity' as const, color: '#4A9EFF' };

  const severities: { v: 'none' | 'mild' | 'moderate' | 'severe'; label: string; color: string }[] = [
    { v: 'none', label: 'None', color: colors.textSub },
    { v: 'mild', label: 'Mild', color: colors.mint },
    { v: 'moderate', label: 'Moderate', color: colors.amber },
    { v: 'severe', label: 'Severe', color: colors.danger },
  ];

  const [severity, setSeverity] = useState<'none' | 'mild' | 'moderate' | 'severe'>('mild');
  const [time, setTime] = useState('Now');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(-10);

  useEffect(() => {
    iconScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    iconRotate.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const submit = async () => {
    haptics.success();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    addLog({
      symptom: symptom ?? 'wheezing',
      severity,
      time,
      notes,
    });
    setSaved(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.textSub} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Log Symptom</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header icon row */}
          <View style={styles.hero}>
            <Reanimated.View
              style={[
                styles.iconCircle,
                { backgroundColor: `${m.color}22` },
                iconStyle,
              ]}
            >
              <Feather name={m.icon} size={30} color={m.color} />
            </Reanimated.View>
            <Text style={[styles.symptomName, { color: colors.text }]}>{m.name}</Text>
            <Text style={[styles.lastLoggedText, { color: colors.textSub }]}>
              Last logged: Yesterday at 2:30 PM
            </Text>
          </View>

          {/* Severity selector row */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>SEVERITY</Text>
            <View style={styles.btnRow}>
              {severities.map((s) => {
                const active = severity === s.v;
                return (
                  <TouchableOpacity
                    key={s.v}
                    onPress={() => { haptics.light(); setSeverity(s.v); }}
                    style={[
                      styles.btnCell,
                      {
                        backgroundColor: active ? `${s.color}1E` : colors.card,
                        borderColor: active ? s.color : colors.cardBorder,
                        borderWidth: active ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.btnCellText, { color: active ? s.color : colors.textSub, fontFamily: active ? 'Inter_700Bold' : 'Inter_400Regular' }]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Time Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>WHEN</Text>
            <View style={styles.btnRow}>
              {TIMES.map((t) => {
                const active = time === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => { haptics.light(); setTime(t); }}
                    style={[
                      styles.timeChip,
                      {
                        backgroundColor: active ? colors.accent : colors.card,
                        borderColor: active ? colors.accent : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.timeChipText, { color: active ? '#fff' : colors.textSub }]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes textarea input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>NOTES</Text>
            <TextInput
              value={notes}
              maxLength={200}
              onChangeText={setNotes}
              placeholder="Any context..."
              placeholderTextColor={colors.textSub}
              multiline
              style={[
                styles.notesInput,
                { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text },
              ]}
            />
            <Text style={[styles.charCountText, { color: colors.textSub }]}>{notes.length}/200</Text>
          </View>

          {/* CTA Save button */}
          <TouchableOpacity
            disabled={saving}
            onPress={submit}
            activeOpacity={0.9}
            style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{saved ? 'Saved ✓' : 'Save log'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 60 },
  hero: { alignItems: 'center', marginVertical: 16 },
  iconCircle: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  symptomName: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  lastLoggedText: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, marginBottom: 8 },
  btnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btnCell: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnCellText: { fontSize: 13 },
  timeChip: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timeChipText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  notesInput: { borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 110, fontSize: 13, textAlignVertical: 'top' },
  charCountText: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'right', marginTop: 4 },
  saveBtn: { height: 48, borderRadius: 99, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
});
