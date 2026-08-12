import React, { useMemo, useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import Reanimated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useAuthStore, useSessionStore, useSymptomStore, useAnalysisStore } from '../../src/store';

const { width } = Dimensions.get('window');
const GRID_SPACING = 12;
const CELL_WIDTH = (width - 32 - GRID_SPACING * 2) / 3;

export default function HomeScreen() {
  const { colors, mode, toggleTheme, isDark } = useTheme();
  const haptics = useHaptics();
  const isFocused = useIsFocused();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isFocused) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isFocused]);

  const user = useAuthStore((s: any) => s.user);
  const userName = user?.name || 'Sarah';

  // Custom states for Emergency Contact
  const [emergencyContact, setEmergencyContact] = useState('');
  const [dismissedDistress, setDismissedDistress] = useState(false);

  useEffect(() => {
    if (isFocused) {
      if (user?.profile?.emergencyContact) {
        setEmergencyContact(user.profile.emergencyContact);
      } else {
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
          const userKey = user?.email || 'guest';
          AsyncStorage.getItem(`asthmasense_emergency_contact_${userKey}`).then((num) => {
            setEmergencyContact(num || '');
          });
        });
      }
      import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
        AsyncStorage.getItem('asthmasense_home_alert_dismissed').then((val) => {
          if (val === 'true') {
            setDismissedDistress(true);
          }
        });
      });
    }
  }, [isFocused, user]);
  const streak = useAuthStore((s: any) => s.streak) || 0;
  const sessions = useSessionStore((s: any) => s.sessions) || [];
  const logs = useSymptomStore((s: any) => s.logs) || [];
  const reports = useAnalysisStore((s: any) => s.reports) || [];
  const isSyncing = useAuthStore((s: any) => s.isSyncing);



  // Greeting logic
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }, []);

  // Ambient circle animations
  const driftAnim1 = useSharedValue(1);
  const driftAnim2 = useSharedValue(1);
  const driftAnim3 = useSharedValue(1);

  useEffect(() => {
    const pulse = (sharedVal: any, delay: number) => {
      sharedVal.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 4000 + delay }),
          withTiming(1, { duration: 4000 + delay })
        ),
        -1,
        true
      );
    };
    pulse(driftAnim1, 0);
    pulse(driftAnim2, 500);
    pulse(driftAnim3, 1000);
  }, []);

  const ambientStyle1 = useAnimatedStyle(() => ({ transform: [{ scale: driftAnim1.value }] }));
  const ambientStyle2 = useAnimatedStyle(() => ({ transform: [{ scale: driftAnim2.value }] }));
  const ambientStyle3 = useAnimatedStyle(() => ({ transform: [{ scale: driftAnim3.value }] }));

  const quickActions = [
    {
      to: '/(tabs)/tracking' as const,
      icon: 'plus' as const,
      title: 'Log',
      sub: 'Symptoms',
      from: 'rgba(52,199,133,0.18)',
      to_: 'rgba(52,199,133,0.06)',
      border: 'rgba(52,199,133,0.25)',
      iconColor: colors.mint,
      ambient: ambientStyle1,
    },
    {
      to: '/(tabs)/analysis' as const,
      icon: 'mic' as const,
      title: 'Analyze',
      sub: 'Breathing',
      from: 'rgba(74,158,255,0.18)',
      to_: 'rgba(74,158,255,0.06)',
      border: 'rgba(74,158,255,0.25)',
      iconColor: colors.accent,
      taller: true,
      pulse: true,
      ambient: ambientStyle2,
    },
    {
      to: '/(tabs)/breathing' as const,
      icon: 'wind' as const,
      title: 'Breathe',
      sub: 'Exercise',
      from: 'rgba(245,166,35,0.15)',
      to_: 'rgba(245,166,35,0.05)',
      border: 'rgba(245,166,35,0.20)',
      iconColor: colors.amber,
      ambient: ambientStyle3,
    },
  ];

  // Dynamic status computation
  const todayStatus = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayReports = reports.filter((r: any) => new Date(r.date).toDateString() === todayStr);
    const todayLogs = logs.filter((l: any) => new Date(l.createdAt).toDateString() === todayStr);

    if (todayReports.length === 0 && todayLogs.length === 0) return 'Good';

    const hasHigh = todayReports.some((r: any) => r.riskLevel === 'High') || 
                    todayLogs.some((l: any) => l.severity === 'severe');
    if (hasHigh) return 'Alert';

    const hasMod = todayReports.some((r: any) => r.riskLevel === 'Moderate') || 
                    todayLogs.some((l: any) => l.severity === 'moderate');
    if (hasMod) return 'Moderate';

    return 'Good';
  }, [logs, reports]);

  const statusColor = useMemo(() => {
    if (todayStatus === 'Alert') return colors.danger;
    if (todayStatus === 'Moderate') return colors.amber;
    return colors.mint;
  }, [todayStatus, colors]);

  // Generate dynamic 7-day Lung Wellness Score
  const lungWellnessScore = useMemo(() => {
    let score = 100;
    
    // Evaluate last 7 days logs, reports, and sessions
    const today = new Date();
    const limitDate = new Date();
    limitDate.setDate(today.getDate() - 7);
    
    const recentLogs = logs.filter((l: any) => new Date(l.createdAt || l.time) >= limitDate);
    const recentReports = reports.filter((r: any) => new Date(r.date) >= limitDate);
    const recentSessions = sessions.filter((s: any) => new Date(s.date) >= limitDate);
    
    recentLogs.forEach((l: any) => {
      const sev = (l.severity || '').toLowerCase();
      if (sev === 'severe') score -= 20;
      else if (sev === 'moderate') score -= 10;
      else if (sev === 'mild') score -= 5;
    });
    
    recentReports.forEach((r: any) => {
      if (r.riskLevel === 'High') score -= 20;
      else if (r.riskLevel === 'Moderate') score -= 10;
    });
    
    // Completing breathing exercises rewards lung wellness!
    score += recentSessions.length * 10;
    
    const finalScore = Math.max(15, Math.min(100, score));
    
    let rating = 'Optimal';
    if (finalScore < 50) rating = 'Needs Attention';
    else if (finalScore < 80) rating = 'Fair';
    else if (finalScore < 95) rating = 'Good';
    
    return {
      score: `${finalScore}%`,
      rating,
      color: finalScore < 50 ? colors.danger : finalScore < 80 ? colors.amber : colors.mint,
    };
  }, [logs, reports, sessions, colors]);

  // Compute Last session relative time
  const lastSessionTime = useMemo(() => {
    if (sessions.length === 0) return 'None yet';
    const latest = sessions[0];
    const diffMs = Date.now() - latest.date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  }, [sessions]);

  // Generate dynamic risk category distribution from audio reports
  const riskDistributionData = useMemo(() => {
    const low = reports.filter((r: any) => r.riskLevel === 'Low').length;
    const moderate = reports.filter((r: any) => r.riskLevel === 'Moderate').length;
    const severe = reports.filter((r: any) => r.riskLevel === 'High').length;
    
    const maxVal = Math.max(low, moderate, severe, 0);
    const maxCount = maxVal === 0 ? 4 : maxVal;

    let categories = [
      { label: 'Low Risk', count: low, color: colors.mint },
      { label: 'Moderate', count: moderate, color: colors.amber },
      { label: 'High Risk', count: severe, color: colors.danger },
    ];

    // Sort descending by count so the greater count bar always stays in the left
    categories.sort((a, b) => b.count - a.count);

    return {
      categories,
      maxCount,
    };
  }, [reports, colors]);

  // Dynamic Recent Activity Timeline
  const dynamicActivity = useMemo(() => {
    const items: any[] = [];

    sessions.forEach((s: any) => {
      items.push({
        type: 'session',
        name: `Breathing session completed`,
        timeRaw: s.date,
        icon: 'wind' as const,
        color: colors.amber,
        bg: colors.amberTint,
      });
    });

    logs.forEach((l: any) => {
      items.push({
        type: 'log',
        name: `${l.symptom.charAt(0).toUpperCase() + l.symptom.slice(1)} severity: ${l.severity}`,
        timeRaw: l.createdAt,
        icon: 'check-circle' as const,
        color: colors.mint,
        bg: colors.mintTint,
      });
    });

    reports.forEach((r: any) => {
      items.push({
        type: 'report',
        name: `AI Audio Analysis: ${r.riskLevel} Risk`,
        timeRaw: r.date,
        icon: 'bar-chart-2' as const,
        color: colors.accent,
        bg: colors.accentTint,
      });
    });

    items.sort((a, b) => b.timeRaw - a.timeRaw);

    if (items.length === 0) {
      return [];
    }

    return items.slice(0, 4).map((item) => {
      const diffMs = Date.now() - item.timeRaw;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      let timeStr = 'Just now';
      if (diffMins >= 1) {
        if (diffMins < 60) {
          timeStr = `${diffMins}m ago`;
        } else {
          const diffHrs = Math.floor(diffMins / 60);
          if (diffHrs < 24) {
            timeStr = `${diffHrs}h ago`;
          } else {
            const diffDays = Math.floor(diffHrs / 24);
            timeStr = `${diffDays}d ago`;
          }
        }
      }
      return {
        type: item.type,
        name: item.name,
        time: timeStr,
        icon: item.icon,
        color: item.color,
        bg: item.bg,
      };
    });
  }, [sessions, logs, reports, colors]);

  if (isSyncing && reports.length === 0 && logs.length === 0 && sessions.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.textSub, marginTop: 12 }}>
          Synchronizing clinical logs...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Top Header Logo Row matching TopBar.tsx on web */}
      <SafeAreaView edges={['top']}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => haptics.light()} style={styles.logoRow}>
            <Image source={isDark ? require('../../assets/logo-dark.png') : require('../../assets/logo.png')} style={{ width: 44, height: 44, borderRadius: 11 }} resizeMode="contain" />
            <Text style={[styles.logoText, { color: colors.text }]}>AsthmaSense AI</Text>
          </TouchableOpacity>
          <View style={styles.topHeaderRight}>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.accentDim }]}
              onPress={() => { haptics.light(); toggleTheme(); }}
            >
              <Feather name={mode === 'dark' ? 'sun' : 'moon'} size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SECTION 1 — GREETING HEADER */}
        <Reanimated.View entering={FadeInDown.duration(400)} style={styles.sectionGreeting}>
          <Text style={[styles.greetingLabel, { color: colors.textSub }]}>{greeting}</Text>
          <Text style={[styles.greetingName, { color: colors.text }]}>{userName}.</Text>
        </Reanimated.View>

        {/* SECTION 2 — QUICK ACTION HERO GRID */}
        <View style={styles.gridContainer}>
          {quickActions.map((t, i) => (
            <Reanimated.View
              key={t.title}
              entering={FadeInDown.delay(i * 80).duration(400)}
              style={{ flex: 1 }}
            >
              <TouchableOpacity
                onPress={() => { haptics.light(); router.push(t.to); }}
                activeOpacity={0.88}
                style={[
                  styles.gridCard,
                  {
                    height: t.taller ? 152 : 140,
                    borderColor: t.border,
                    backgroundColor: t.from,
                  },
                ]}
              >
                {/* Slow ambient drift circles */}
                <Reanimated.View
                  style={[
                    styles.ambientCircle,
                    { backgroundColor: t.iconColor },
                    t.ambient,
                  ]}
                />

                <View style={styles.gridCardTop}>
                  <Feather name={t.icon} size={24} color={t.iconColor} />
                  <Feather name="arrow-up-right" size={12} color={colors.textSub} />
                </View>

                <View>
                  <Text style={[styles.gridCardTitle, { color: colors.text }]}>{t.title}</Text>
                  <Text style={[styles.gridCardSub, { color: colors.textSub }]}>{t.sub}</Text>
                </View>
              </TouchableOpacity>
            </Reanimated.View>
          ))}
        </View>

        {/* SECTION 3 — TODAY'S SUMMARY STRIP */}
        <Reanimated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.summaryStrip, { borderTopColor: colors.cardBorder, borderBottomColor: colors.cardBorder }]}>
          <View style={styles.summaryRow}>
            {[
              { v: `${streak}`, l: 'Day streak', color: colors.accent },
              { v: lastSessionTime, l: 'Last session', color: colors.text },
              { v: lungWellnessScore.score, l: 'Wellness Score', color: lungWellnessScore.color },
            ].map((s, i) => (
              <View
                key={s.l}
                style={[
                  styles.summaryCol,
                  i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.cardBorder },
                ]}
              >
                <Text style={[styles.summaryVal, { color: s.color }]}>{s.v}</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSub }]}>{s.l}</Text>
              </View>
            ))}
          </View>
        </Reanimated.View>



        {/* SECTION 4 — WEEKLY TREND */}
        <Reanimated.View entering={FadeInDown.delay(280).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>THIS WEEK</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/reports')}>
              <Text style={[styles.viewReportLink, { color: colors.accent }]}>View report →</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.text }}>Audio Analysis Risk Distribution</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textSub, marginTop: 4 }}>
                Total cases categorized by risk level.
              </Text>
            </View>

            {reports.length === 0 ? (
              <View
                style={{
                  height: 120,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  marginTop: 8,
                }}
              >
                <Feather name="bar-chart-2" size={24} color={colors.accent} style={{ marginBottom: 6 }} />
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textSub }}>
                  No audio analyses saved yet
                </Text>
              </View>
            ) : (
              <View>
                <View style={[styles.barsContainer, { justifyContent: 'space-around', paddingHorizontal: 16 }]}>
                  {riskDistributionData.categories.map((c: any, i) => {
                    const barHeight = (c.count / riskDistributionData.maxCount) * 110;
                    return (
                      <View key={i} style={[styles.barCol, { width: 64, flex: 0 }]}>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.text, marginBottom: 4 }}>
                          {c.count}
                        </Text>
                        <View style={[styles.barTrack, { width: 44, height: c.count > 0 ? 110 : 8, backgroundColor: colors.bg }]}>
                          {c.count > 0 && (
                            <View
                              style={[
                                styles.barFill,
                                {
                                  width: 44,
                                  height: Math.max(barHeight, 8),
                                  backgroundColor: c.color,
                                  borderRadius: 8,
                                },
                              ]}
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.barLabel,
                            {
                              color: colors.textSub,
                              fontFamily: 'Inter_500Medium',
                              fontSize: 10,
                              marginTop: 4,
                              textAlign: 'center',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {c.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </Reanimated.View>

        {/* SECTION 5 — RECENT ACTIVITY */}
        <Reanimated.View entering={FadeInDown.delay(360).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub, marginBottom: 6 }]}>RECENT ACTIVITY</Text>
          {dynamicActivity.length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 4 }]}>
              <Feather name="activity" size={24} color={colors.accent} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.textSub }}>No recent activity logged yet</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {dynamicActivity.map((a, i) => (
                <TouchableOpacity
                  key={a.name + i}
                  activeOpacity={0.8}
                  onPress={() => {
                    haptics.light();
                    if (a.type === 'log') {
                      router.push('/(tabs)/tracking');
                    } else {
                      router.push('/(tabs)/reports');
                    }
                  }}
                  style={[
                    styles.activityRow,
                    i < dynamicActivity.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
                  ]}
                >
                  <View style={[styles.activityIconContainer, { backgroundColor: a.bg }]}>
                    <Feather name={a.icon} size={16} color={a.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityName, { color: colors.text }]} numberOfLines={1}>{a.name}</Text>
                    <Text style={[styles.activityTime, { color: colors.textSub }]}>{a.time}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.textSub} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Reanimated.View>

        <View style={{ height: 15 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoDot: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoDotText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  logoText: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  topHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  sectionGreeting: { marginBottom: 24 },
  greetingLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 1.8 },
  greetingName: { fontFamily: 'Inter_700Bold', fontSize: 32, marginTop: 4 },
  gridContainer: { flexDirection: 'row', gap: GRID_SPACING, alignItems: 'flex-end', marginBottom: 24 },
  gridCard: { borderRadius: 24, borderWidth: 1, padding: 14, overflow: 'hidden', justifyContent: 'space-between' },
  ambientCircle: { position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: 40, opacity: 0.08 },
  gridCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  gridCardTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  gridCardSub: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 2 },
  summaryStrip: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 14, marginBottom: 24, borderTopColor: 'rgba(74,158,255,0.1)', borderBottomColor: 'rgba(74,158,255,0.1)' },
  summaryRow: { flexDirection: 'row' },
  summaryCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryVal: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  summaryLabel: { fontFamily: 'Inter_500Medium', fontSize: 9, letterSpacing: 1.2, marginTop: 4, uppercase: true } as any,
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.8 },
  viewReportLink: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  barCol: { alignItems: 'center', flex: 1, gap: 8 },
  barTrack: { width: 26, height: 110, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: 26, borderRadius: 8 },
  barLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  activityList: { gap: 1 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  activityIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  activityName: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  activityTime: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 2 },
  seeAllLink: { fontFamily: 'Inter_500Medium', fontSize: 13, textAlign: 'center' },
  emergencyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  emergencyCardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  emergencyIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  emergencySubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  emergencyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    marginTop: 4,
  },
  emergencyActionBtnText: {
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
