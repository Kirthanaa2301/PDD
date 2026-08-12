import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, radius } from '../src/theme';
import { useHaptics } from '../src/hooks/useHaptics';

const { width } = Dimensions.get('window');

const STEPS = [
  'Stay calm. Sit upright — do not lie down.',
  'Take your rescue inhaler: 1 puff, wait 30 seconds, repeat if needed.',
  'Loosen tight clothing. Slow your breathing — inhale 4, exhale 6.',
  'If symptoms persist after 10 minutes, call emergency services.',
  'Notify a trusted contact and share your location.',
];

export default function EmergencyScreen() {
  const { colors } = useTheme();
  const haptics = useHaptics();

  // Pulse animation for Call button
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.16, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleCall = () => {
    haptics.warning();
    const num = Platform.OS === 'android' ? 'tel:911' : 'telprompt:911';
    Linking.openURL(num).catch(() => {});
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Emergency</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Warning Card */}
        <View style={[styles.alertCard, { backgroundColor: colors.dangerTint, borderColor: `${colors.danger}40` }]}>
          <Feather name="alert-triangle" size={18} color={colors.danger} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>Asthma emergency</Text>
            <Text style={[styles.alertDesc, { color: colors.textSub }]}>
              Follow the rescue protocol. Call for help if it doesn't ease.
            </Text>
          </View>
        </View>

        {/* Big Pulse Dial Button */}
        <View style={styles.dialSection}>
          <TouchableOpacity onPress={handleCall} activeOpacity={0.9}>
            <Animated.View style={[styles.dialBtn, { backgroundColor: colors.danger }, pulseStyle]}>
              <Feather name="phone" size={32} color="#fff" />
            </Animated.View>
          </TouchableOpacity>
          <Text style={[styles.dialLabel, { color: colors.text }]}>Call Emergency</Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={() => haptics.light()}
          activeOpacity={0.8}
          style={[styles.notifyBtn, { borderColor: `${colors.accent}40` }]}
        >
          <Feather name="user-plus" size={16} color={colors.accent} />
          <Text style={[styles.notifyBtnText, { color: colors.accent }]}>Notify emergency contact</Text>
        </TouchableOpacity>

        {/* Rescue Protocol Steps */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Rescue protocol</Text>
          <View style={{ gap: 14 }}>
            {STEPS.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.accentDim }]}>
                  <Text style={[styles.stepNumberText, { color: colors.accent }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nearest Hospital Card */}
        <View style={[styles.hospitalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.hospitalGradient, { backgroundColor: colors.accentDim }]}>
            <Feather name="map-pin" size={24} color={colors.accent} style={{ marginBottom: 6 }} />
            <Text style={[styles.hospitalTitle, { color: colors.text }]}>Nearest hospital · 1.2 mi</Text>
            <Text style={[styles.hospitalDesc, { color: colors.textSub }]}>Mercy General — 24/7 ER</Text>
          </View>
        </View>

        {/* I'm okay now CTA */}
        <TouchableOpacity
          onPress={() => { haptics.success(); router.back(); }}
          activeOpacity={0.9}
          style={[styles.ctaButton, { backgroundColor: colors.mint }]}
        >
          <Feather name="check-circle" size={16} color="#fff" />
          <Text style={styles.ctaText}>I'm okay now</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  alertCard: { flexDirection: 'row', gap: 12, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24 },
  alertTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  alertDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4, lineHeight: 18 },
  dialSection: { alignItems: 'center', marginVertical: 12, gap: 12 },
  dialBtn: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  dialLabel: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  notifyBtn: { height: 46, borderRadius: 99, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  notifyBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 16 },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  stepText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1, lineHeight: 20 },
  hospitalCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  hospitalGradient: { height: 140, alignItems: 'center', justifyContent: 'center' },
  hospitalTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  hospitalDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  ctaButton: { height: 48, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  ctaText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
});
