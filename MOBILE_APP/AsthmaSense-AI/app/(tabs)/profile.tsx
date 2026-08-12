import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, radius } from '../../src/theme';
import { useIsFocused } from '@react-navigation/native';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useAuthStore, useSessionStore, useSymptomStore, useAnalysisStore } from '../../src/store';
import { API_BASE_URL } from '../../src/config/api';

const { width } = Dimensions.get('window');
const GRID_SPACING = 10;

function Row({ label, right, last, onPress }: { label: string; right?: React.ReactNode; last?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.prefRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}>
      <Text style={[styles.prefLabel, { color: colors.text }]}>{label}</Text>
      <View>{right}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function ProfileScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const haptics = useHaptics();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isFocused) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isFocused]);
  
  // Load stores
  const logout = useAuthStore((s: any) => s.logout);
  const user = useAuthStore((s: any) => s.user);
  const token = useAuthStore((s: any) => s.token);
  const streak = useAuthStore((s: any) => s.streak) || 0;
  const loginDates = useAuthStore((s: any) => s.loginDates) || [];
  const sessions = useSessionStore((s: any) => s.sessions) || [];
  const logs = useSymptomStore((s: any) => s.logs) || [];
  const reports = useAnalysisStore((s: any) => s.reports) || [];

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Custom states for Emergency Contact
  const [emergencyContact, setEmergencyContact] = useState('');
  const [tempNumber, setTempNumber] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Load custom emergency contact on mount (checks MongoDB profile first, then localized local storage fallback)
  useEffect(() => {
    if (user?.profile?.emergencyContact) {
      setEmergencyContact(user.profile.emergencyContact);
    } else {
      const userKey = user?.email || 'guest';
      AsyncStorage.getItem(`asthmasense_emergency_contact_${userKey}`).then((num) => {
        if (num) setEmergencyContact(num);
      });
    }
  }, [user]);

  const saveEmergencyNumber = async () => {
    haptics.success();
    
    // 1. Save to localized AsyncStorage
    const userKey = user?.email || 'guest';
    await AsyncStorage.setItem(`asthmasense_emergency_contact_${userKey}`, tempNumber);
    setEmergencyContact(tempNumber);
    
    // 2. Update local state store so change is immediately reflected app-wide
    if (user) {
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          emergencyContact: tempNumber,
        },
      };
      useAuthStore.setState({ user: updatedUser });
    }

    // 3. Save to MongoDB
    if (token && token !== 'demo-token') {
      try {
        await fetch(`${API_BASE_URL}/api/auth/emergency-contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ emergencyContact: tempNumber }),
        });
      } catch (e) {
        console.warn('Failed to sync emergency contact to MongoDB:', e);
      }
    }
    
    setShowEmergencyModal(false);
  };

  // Dynamic calculations
  const uniqueDaysLogged = useMemo(() => {
    const daysSet = new Set([
      ...logs.map((l: any) => new Date(l.createdAt).toDateString()),
      ...reports.map((r: any) => new Date(r.date).toDateString()),
      ...loginDates.map((d: string) => new Date(d).toDateString()),
    ]);
    return daysSet.size;
  }, [logs, reports, loginDates]);

  const completedTodayTasks = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayLogs = logs.filter((l: any) => new Date(l.createdAt).toDateString() === todayStr);
    const doneKeys = new Set(todayLogs.map((l: any) => l.symptom));
    return doneKeys.size;
  }, [logs]);

  const stats = useMemo(() => [
    { label: 'Days Tracked', val: uniqueDaysLogged },
    { label: 'Streak', val: streak },
    {
      label: 'Score',
      val: reports.length > 0 ? Math.round(reports.reduce((acc: number, curr: any) => {
        if (curr.riskLevel === 'Low') return acc + 95;
        if (curr.riskLevel === 'Moderate') return acc + 75;
        return acc + 40;
      }, 0) / reports.length) : 88
    },
  ], [uniqueDaysLogged, streak, reports]);

  const achievements = useMemo(() => [
    {
      name: 'First Breath',
      earned: sessions.length >= 1,
      progressText: sessions.length >= 1 ? 'Completed!' : `${sessions.length}/1 session`,
      color: colors.accent,
    },
    {
      name: '7-Day Streak',
      earned: streak >= 7,
      progressText: streak >= 7 ? 'Completed!' : `${streak}/7 days`,
      color: colors.mint,
    },
    {
      name: '30 Days Tracked',
      earned: uniqueDaysLogged >= 5,
      progressText: uniqueDaysLogged >= 5 ? 'Completed!' : `${uniqueDaysLogged}/5 days`,
      color: colors.amber,
    },
    {
      name: 'Calm Mind',
      earned: sessions.length >= 5,
      progressText: sessions.length >= 5 ? 'Completed!' : `${sessions.length}/5 sessions`,
      color: colors.accent,
    },
    {
      name: 'AI Pro',
      earned: reports.length >= 3,
      progressText: reports.length >= 3 ? 'Completed!' : `${reports.length}/3 scans`,
      color: colors.danger,
    },
    {
      name: 'Champion',
      earned: completedTodayTasks >= 6,
      progressText: completedTodayTasks >= 6 ? 'Completed!' : `Today: ${completedTodayTasks}/6 tasks`,
      color: colors.mint,
    },
  ], [sessions, streak, uniqueDaysLogged, reports, completedTodayTasks, colors]);

  const handleSignOut = () => {
    haptics.success();
    logout();
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'index' }],
    });
  };

  const toggleDeleteModal = (show: boolean) => {
    haptics.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setConfirmDelete(show);
  };

  const handleDeleteAccount = async () => {
    toggleDeleteModal(false);
    haptics.warning();

    if (token && token !== 'demo-token') {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/delete`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Deletion failed.');
        }

        haptics.success();
        setAlertConfig({
          visible: true,
          title: 'Account Deleted',
          message: 'Your profile and all tracked clinical logs have been permanently erased from AsthmaSense AI.',
          type: 'success',
          onClose: () => {
            logout();
            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: 'index' }],
            });
          },
        });
      } catch (err: any) {
        console.warn('Failed to delete account:', err);
        haptics.warning();
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: err.message || 'Could not connect to the server.',
          type: 'error',
        });
      }
    } else {
      // Standalone demo mode fallback
      haptics.success();
      setAlertConfig({
        visible: true,
        title: 'Account Deleted',
        message: 'Demo session data successfully purged from the device.',
        type: 'success',
        onClose: () => {
          logout();
          navigation.getParent()?.reset({
            index: 0,
            routes: [{ name: 'index' }],
          });
        },
      });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: colors.text }]}>Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover profile card */}
        <View style={[styles.card, styles.coverCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Cover decorative blur rings */}
          <View style={[styles.blurRing, { backgroundColor: colors.accent, opacity: 0.08, top: -40, left: -40 }]} />
          <View style={[styles.blurRing, { backgroundColor: colors.mint, opacity: 0.08, bottom: -40, right: -40 }]} />

          <View style={styles.avatarSection}>
            <View style={[styles.avatarBox, { backgroundColor: colors.accentDim }]}>
              <Text style={[styles.avatarInitials, { color: colors.accent }]}>
                {user?.name?.[0]?.toUpperCase() ?? 'S'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => haptics.light()}>
              <Feather name="camera" size={12} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name ?? 'Sarah'}</Text>
          <Text style={[styles.userRole, { color: colors.textSub }]}>Patient · Member since 2026</Text>
        </View>

        {/* 3-column stats row */}
        <View style={[styles.statsRowCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {stats.map((s, i) => (
            <View key={s.label} style={[styles.statItem, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.cardBorder }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>{s.val}</Text>
              <Text style={[styles.statLabel, { color: colors.textSub }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Health Profile grid */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Health profile</Text>
          <View style={styles.healthGrid}>
            {[
              ['Age', user?.profile?.age ? String(user.profile.age) : '32'],
              ['Severity', user?.profile?.severity || 'Mild'],
              ['Triggers', user?.profile?.triggers && user.profile.triggers.length > 0 ? user.profile.triggers.join(', ') : 'Pollen, dust'],
              ['Inhaler', user?.profile?.inhaler || 'Albuterol'],
            ].map(([k, v]) => (
              <View key={k} style={[styles.healthGridCell, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                <Text style={[styles.healthCellLabel, { color: colors.textSub }]}>{k}</Text>
                <Text style={[styles.healthCellValue, { color: colors.text }]}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Lung Wellness Calculation */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Wellness Score Formula</Text>
          <Text style={[styles.formulaDescText, { color: colors.textSub }]}>
            Your Lung Wellness Score tracks your respiratory wellness over a rolling 7-day period based on symptoms, AI scans, and exercises.
          </Text>
          
          <View style={styles.formulaRow}>
            <View style={styles.formulaRowLeft}>
              <Feather name="shield" size={15} color={colors.accent} style={styles.formulaIcon} />
              <Text style={[styles.formulaLabel, { color: colors.text }]}>Baseline Starting Score</Text>
            </View>
            <Text style={[styles.formulaValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>100%</Text>
          </View>

          <View style={styles.formulaRow}>
            <View style={styles.formulaRowLeft}>
              <Feather name="plus-circle" size={15} color={colors.mint} style={styles.formulaIcon} />
              <Text style={[styles.formulaLabel, { color: colors.text }]}>Breathing Exercise Session</Text>
            </View>
            <View style={[styles.impactBadge, { backgroundColor: colors.mintTint }]}>
              <Text style={[styles.impactBadgeText, { color: colors.mint }]}>+10%</Text>
            </View>
          </View>

          <View style={styles.formulaRow}>
            <View style={styles.formulaRowLeft}>
              <Feather name="minus-circle" size={15} color={colors.amber} style={styles.formulaIcon} />
              <Text style={[styles.formulaLabel, { color: colors.text }]}>Mild Symptom Log</Text>
            </View>
            <View style={[styles.impactBadge, { backgroundColor: colors.amberTint }]}>
              <Text style={[styles.impactBadgeText, { color: colors.amber }]}>-5%</Text>
            </View>
          </View>

          <View style={styles.formulaRow}>
            <View style={styles.formulaRowLeft}>
              <Feather name="alert-triangle" size={15} color={colors.amber} style={styles.formulaIcon} />
              <Text style={[styles.formulaLabel, { color: colors.text }]}>Moderate Symptom or AI Scan</Text>
            </View>
            <View style={[styles.impactBadge, { backgroundColor: colors.amberTint }]}>
              <Text style={[styles.impactBadgeText, { color: colors.amber }]}>-10%</Text>
            </View>
          </View>

          <View style={styles.formulaRow}>
            <View style={styles.formulaRowLeft}>
              <Feather name="alert-circle" size={15} color={colors.danger} style={styles.formulaIcon} />
              <Text style={[styles.formulaLabel, { color: colors.text }]}>Severe Symptom or Distress AI Scan</Text>
            </View>
            <View style={[styles.impactBadge, { backgroundColor: colors.dangerTint }]}>
              <Text style={[styles.impactBadgeText, { color: colors.danger }]}>-20%</Text>
            </View>
          </View>

          <View style={[styles.formulaFooter, { borderTopColor: colors.cardBorder }]}>
            <Feather name="info" size={12} color={colors.textSub} style={{ marginTop: 1 }} />
            <Text style={[styles.formulaFooterText, { color: colors.textSub }]}>
              Safe floor is 15% and maximum is 100%. Keep practicing breathing sessions to reward your lungs!
            </Text>
          </View>
        </View>

        {/* Account settings */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Account</Text>
          <Row
            label="Subscription"
            right={
              <View style={[styles.trialBadge, { backgroundColor: colors.mintTint }]}>
                <Text style={[styles.trialText, { color: colors.mint }]}>Free trial</Text>
              </View>
            }
          />
          <Row
            label="Emergency Contact"
            onPress={() => {
              haptics.light();
              setTempNumber(emergencyContact);
              setShowEmergencyModal(true);
            }}
            right={
              <View style={styles.prefRightVal}>
                <Text style={[styles.prefSubValueText, { color: colors.textSub }]}>
                  {emergencyContact || 'Not set (108)'}
                </Text>
                <Feather name="edit-2" size={12} color={colors.textSub} style={{ marginLeft: 4 }} />
              </View>
            }
          />
          <Row
            label="Sign out"
            onPress={handleSignOut}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="log-out" size={14} color={colors.amber} />
                <Feather name="chevron-right" size={14} color={colors.textSub} />
              </View>
            }
            last
          />
        </View>

        {/* Danger zone buttons */}
        <View style={styles.dangerZone}>
          <TouchableOpacity
            onPress={() => toggleDeleteModal(true)}
            activeOpacity={0.8}
            style={[styles.dangerBtn, { borderColor: `${colors.danger}50` }]}
          >
            <Feather name="trash-2" size={15} color={colors.danger} />
            <Text style={[styles.dangerBtnText, { color: colors.danger }]}>Delete account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => toggleDeleteModal(false)} />
          <Reanimated.View entering={FadeInDown.duration(250)} style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete account?</Text>
            <Text style={[styles.modalDesc, { color: colors.textSub }]}>
              This cannot be undone. All your data will be removed.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => toggleDeleteModal(false)}
                style={[styles.modalBtn, { borderColor: colors.cardBorder, borderWidth: 1 }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={[styles.modalBtn, { backgroundColor: colors.danger }]}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Reanimated.View>
        </View>
      )}

      {/* Custom Themed Alert Modal */}
      {alertConfig.visible && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              if (alertConfig.type === 'error') {
                setAlertConfig((prev) => ({ ...prev, visible: false }));
              }
            }}
          />
          <Reanimated.View
            entering={FadeInDown.duration(250)}
            style={[styles.modalBox, { backgroundColor: colors.card }]}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={[
                  styles.alertIconBox,
                  {
                    backgroundColor:
                      alertConfig.type === 'success'
                        ? `${colors.mint}15`
                        : `${colors.danger}15`,
                  },
                ]}
              >
                <Feather
                  name={alertConfig.type === 'success' ? 'check-circle' : 'alert-triangle'}
                  size={32}
                  color={alertConfig.type === 'success' ? colors.mint : colors.danger}
                />
              </View>
            </View>
            <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center' }]}>
              {alertConfig.title}
            </Text>
            <Text
              style={[
                styles.modalDesc,
                { color: colors.textSub, textAlign: 'center', marginTop: 8 },
              ]}
            >
              {alertConfig.message}
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => {
                  setAlertConfig((prev) => ({ ...prev, visible: false }));
                  if (alertConfig.onClose) {
                    alertConfig.onClose();
                  }
                }}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      alertConfig.type === 'success' ? colors.accent : colors.danger,
                  },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Got it</Text>
              </TouchableOpacity>
            </View>
          </Reanimated.View>
        </View>
      )}

      {/* Emergency Contact Modal */}
      {showEmergencyModal && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowEmergencyModal(false)} />
          <Reanimated.View entering={FadeInDown.duration(250)} style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Emergency Contact</Text>
            <Text style={[styles.modalDesc, { color: colors.textSub, marginBottom: 16 }]}>
              Enter the phone number to be called instantly if you trigger a Distress Alert.
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.bg,
                },
              ]}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={colors.textSub}
              value={tempNumber}
              onChangeText={setTempNumber}
              keyboardType="phone-pad"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setShowEmergencyModal(false)}
                style={[styles.modalBtn, { borderColor: colors.cardBorder, borderWidth: 1 }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEmergencyNumber}
                style={[styles.modalBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </Reanimated.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 26 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12, overflow: 'hidden' },
  coverCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  blurRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  avatarSection: { position: 'relative', marginBottom: 14 },
  avatarBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: 'Inter_700Bold', fontSize: 26 },
  cameraBtn: { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  userName: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  userRole: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4 },
  statsRowCard: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, paddingVertical: 14, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 12 },
  achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_SPACING },
  achieveCard: { width: (width - 32 - GRID_SPACING) / 2, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 10 },
  achieveIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  achieveGridName: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  achieveProgressText: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 14 },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  healthGridCell: { flex: 1, minWidth: '45%', borderRadius: 12, borderWidth: 1, padding: 12 },
  healthCellLabel: { fontFamily: 'Inter_500Medium', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  healthCellValue: { fontFamily: 'Inter_700Bold', fontSize: 13, marginTop: 3 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  prefLabel: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  themeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  prefRightVal: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prefSubValueText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  trialBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99 },
  trialText: { fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase' },
  dangerZone: { gap: 12, marginTop: 12 },
  dangerBtn: { height: 48, borderRadius: 99, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dangerBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'flex-end', padding: 16 },
  modalBox: { width: '100%', borderRadius: 24, padding: 20, marginBottom: Platform.OS === 'ios' ? 24 : 10 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  modalDesc: { fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 10, lineHeight: 20 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, height: 46, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginBottom: 16,
  },
  formulaDescText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  formulaRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  formulaIcon: {
    marginRight: 2,
  },
  formulaLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    flexShrink: 1,
  },
  formulaValue: {
    fontSize: 13,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 42,
    alignItems: 'center',
  },
  impactBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  formulaFooter: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: 'flex-start',
  },
  formulaFooterText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  alertIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
