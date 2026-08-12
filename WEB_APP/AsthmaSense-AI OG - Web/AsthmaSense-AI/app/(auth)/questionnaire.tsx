import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  LayoutAnimation,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, radius, fonts, spacing, typography } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useAuthStore, syncUserDataFromBackend } from '../../src/store';
import { API_BASE_URL } from '../../src/config/api';

const { width: W } = Dimensions.get('window');

const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'] as const;
const INHALER_OPTIONS = ['Albuterol', 'Budecort', 'Foracort', 'Seroflo', 'None'] as const;
const FREQUENCY_OPTIONS = ['Rarely', 'Weekly', 'Daily', 'Multiple times a day'] as const;
const TRIGGER_OPTIONS = [
  'Dust',
  'Smoke',
  'Cold Air',
  'Exercise',
  'Pollen',
  'Weather change',
];

export default function QuestionnaireScreen() {
  const { colors, isDark } = useTheme();
  const haptics = useHaptics();

  // Auth Store
  const user = useAuthStore((s: any) => s.user);
  const token = useAuthStore((s: any) => s.token);

  // Form State (6 Steps)
  const [currentStep, setCurrentStep] = useState(1);
  const [age, setAge] = useState('');
  const [severity, setSeverity] = useState<typeof SEVERITY_OPTIONS[number] | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [inhaler, setInhaler] = useState<typeof INHALER_OPTIONS[number] | null>(null);
  const [frequency, setFrequency] = useState<typeof FREQUENCY_OPTIONS[number] | null>(null);
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Errors & Loading
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Background entrance animation
  const bgOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(bgOpacity, { toValue: 1.0, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleNext = () => {
    setError('');
    haptics.light();

    if (currentStep === 1) {
      const num = Number(age);
      if (!age || isNaN(num) || num <= 0 || num > 120) {
        setError('Please enter a valid age (1-120).');
        haptics.warning();
        return;
      }
    } else if (currentStep === 2) {
      if (!severity) {
        setError('Please select your asthma severity.');
        haptics.warning();
        return;
      }
    } else if (currentStep === 3) {
      if (selectedTriggers.length === 0) {
        setError('Please select at least one trigger.');
        haptics.warning();
        return;
      }
    } else if (currentStep === 4) {
      if (!inhaler) {
        setError('Please select your primary rescue inhaler.');
        haptics.warning();
        return;
      }
    } else if (currentStep === 5) {
      if (!frequency) {
        setError('Please select your baseline symptom frequency.');
        haptics.warning();
        return;
      }
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setError('');
      haptics.light();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const toggleTrigger = (trigger: string) => {
    haptics.light();
    setError('');
    if (selectedTriggers.includes(trigger)) {
      setSelectedTriggers(selectedTriggers.filter((t) => t !== trigger));
    } else {
      setSelectedTriggers([...selectedTriggers, trigger]);
    }
  };

  const handleSubmit = async () => {
    setError('');
    const trimmedContact = emergencyContact.trim();
    const trimmedContactName = emergencyContactName.trim();

    if (!trimmedContact) {
      setError('Please enter an emergency contact phone number.');
      haptics.warning();
      return;
    }

    haptics.light();
    setIsLoading(true);

    const updatedProfile = {
      age: Number(age) || 21,
      severity: severity || 'Mild',
      triggers: selectedTriggers.length > 0 ? selectedTriggers : ['Smoke', 'Dust'],
      inhaler: inhaler || 'None',
      frequency: frequency || 'As needed',
      emergencyContact: trimmedContact,
      emergencyContactName: trimmedContactName || 'Emergency Contact',
      hasCompletedOnboarding: true,
    };

    try {
      if (token && !token.startsWith('local_')) {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updatedProfile),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.userProfile) {
            useAuthStore.setState({ user: data.userProfile });
            haptics.success();
            router.replace('/(tabs)');
            return;
          }
        }
      }
    } catch (err: any) {
      console.warn('[Questionnaire] Remote profile update error, continuing with local profile:', err);
    }

    // Fallback local update to guarantee baseline completion success
    const currentUser = useAuthStore.getState().user;
    const mergedUser = {
      ...currentUser,
      hasCompletedOnboarding: true,
      profile: {
        ...(currentUser?.profile || {}),
        ...updatedProfile,
      },
    };
    useAuthStore.setState({ user: mergedUser as any });
    haptics.success();
    router.replace('/(tabs)');
    setIsLoading(false);
  };

  const inputStyle = [
    styles.input,
    {
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      color: colors.text,
      fontFamily: fonts.regular,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.root,
          {
            backgroundColor: colors.bg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Background glow orbs */}
        <Animated.View style={{ opacity: bgOpacity, ...StyleSheet.absoluteFillObject }} pointerEvents="none">
          <LinearGradient
            colors={[colors.accent + '25', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.glowOrb, styles.orbTopRight]}
          />
          <LinearGradient
            colors={[colors.mint + '18', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.glowOrb, styles.orbBottomLeft]}
          />
          <LinearGradient
            colors={[colors.accent + '25', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.glowOrb, styles.orbBottomLeftSmall]}
          />
        </Animated.View>

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoBox, { backgroundColor: isDark ? '#070B12' : '#ffffff', borderColor: colors.cardBorder, borderWidth: 1, overflow: 'hidden' }]}>
              <Image source={isDark ? require('../../assets/logo-dark.png') : require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>

            <Text style={[styles.brand, { color: colors.accent }]}>AsthmaSense AI</Text>
            <Text style={[styles.title, { color: colors.text }]}>Patient Baseline</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>
              Step {currentStep} of 6 · Help us customize your clinical experience & emergency alerts.
            </Text>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressContainer, { backgroundColor: colors.cardBorder }]}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.accent,
                  width: `${(currentStep / 6) * 100}%`,
                },
              ]}
            />
          </View>

          {/* Form Step Contents */}
          <View style={styles.stepContent}>
            {error ? (
              <View style={[styles.errorCard, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '35' }]}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            ) : null}

            {/* STEP 1: Age */}
            {currentStep === 1 && (
              <View style={styles.questionSection}>
                <Text style={[styles.questionText, { color: colors.text }]}>How old are you?</Text>
                <Text style={[styles.questionSubText, { color: colors.textSub }]}>
                  Your age helps us baseline your heart and respiration rate metrics accurately.
                </Text>
                <TextInput
                  style={[inputStyle, error ? { borderColor: colors.danger } : null]}
                  placeholder="Enter your age"
                  placeholderTextColor={colors.textSub}
                  value={age}
                  onChangeText={(val) => {
                    setAge(val.replace(/[^0-9]/g, ''));
                    setError('');
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                  autoFocus
                />
              </View>
            )}

            {/* STEP 2: Severity */}
            {currentStep === 2 && (
              <View style={styles.questionSection}>
                <Text style={[styles.questionText, { color: colors.text }]}>What is your diagnosed severity?</Text>
                <Text style={[styles.questionSubText, { color: colors.textSub }]}>
                  Choose the classification that matches your asthma diagnosis.
                </Text>
                <View style={styles.optionsList}>
                  {SEVERITY_OPTIONS.map((opt) => {
                    const isSelected = severity === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          setSeverity(opt);
                          setError('');
                          haptics.light();
                        }}
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: isSelected ? colors.accentDim : colors.card,
                            borderColor: isSelected ? colors.accent : colors.cardBorder,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionTitle, { color: isSelected ? colors.accent : colors.text }]}>
                          {opt}
                        </Text>
                        <Feather
                          name={isSelected ? 'check-circle' : 'circle'}
                          size={18}
                          color={isSelected ? colors.accent : colors.textSub}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 3: Triggers */}
            {currentStep === 3 && (
              <View style={styles.questionSection}>
                <Text style={[styles.questionText, { color: colors.text }]}>What are your primary triggers?</Text>
                <Text style={[styles.questionSubText, { color: colors.textSub }]}>
                  Select all that apply. This assists our AI with trigger correlation.
                </Text>
                <View style={styles.chipsContainer}>
                  {TRIGGER_OPTIONS.map((trig) => {
                    const isSelected = selectedTriggers.includes(trig);
                    return (
                      <TouchableOpacity
                        key={trig}
                        onPress={() => toggleTrigger(trig)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.card,
                            borderColor: isSelected ? colors.accent : colors.cardBorder,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? '#ffffff' : colors.text,
                              fontFamily: isSelected ? fonts.semibold : fonts.regular,
                            },
                          ]}
                        >
                          {trig}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 4: Inhaler */}
            {currentStep === 4 && (
              <View style={styles.questionSection}>
                <Text style={[styles.questionText, { color: colors.text }]}>Which rescue inhaler do you use?</Text>
                <Text style={[styles.questionSubText, { color: colors.textSub }]}>
                  Select your primarily prescribed medication.
                </Text>
                <View style={styles.optionsList}>
                  {INHALER_OPTIONS.map((opt) => {
                    const isSelected = inhaler === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          setInhaler(opt);
                          setError('');
                          haptics.light();
                        }}
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: isSelected ? colors.accentDim : colors.card,
                            borderColor: isSelected ? colors.accent : colors.cardBorder,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionTitle, { color: isSelected ? colors.accent : colors.text }]}>
                          {opt}
                        </Text>
                        <Feather
                          name={isSelected ? 'check-circle' : 'circle'}
                          size={18}
                          color={isSelected ? colors.accent : colors.textSub}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 5: Symptoms Frequency */}
            {currentStep === 5 && (
              <View style={styles.questionSection}>
                <Text style={[styles.questionText, { color: colors.text }]}>How often do you experience symptoms?</Text>
                <Text style={[styles.questionSubText, { color: colors.textSub }]}>
                  Your baseline frequency allows the clinical summaries to evaluate your progress.
                </Text>
                <View style={styles.optionsList}>
                  {FREQUENCY_OPTIONS.map((opt) => {
                    const isSelected = frequency === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          setFrequency(opt);
                          setError('');
                          haptics.light();
                        }}
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: isSelected ? colors.accentDim : colors.card,
                            borderColor: isSelected ? colors.accent : colors.cardBorder,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionTitle, { color: isSelected ? colors.accent : colors.text }]}>
                          {opt}
                        </Text>
                        <Feather
                          name={isSelected ? 'check-circle' : 'circle'}
                          size={18}
                          color={isSelected ? colors.accent : colors.textSub}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* STEP 6: Emergency Contact */}
            {currentStep === 6 && (
              <View style={styles.questionSection}>
                <Text style={[styles.questionText, { color: colors.text }]}>Emergency Contact Details</Text>
                <Text style={[styles.questionSubText, { color: colors.textSub }]}>
                  Add a trusted phone number & contact name to automatically alert when high respiratory risk or wheezing is detected.
                </Text>
                <View style={{ gap: 12 }}>
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.textSub, fontFamily: fonts.medium }}>Contact Name / Relation</Text>
                    <TextInput
                      style={[inputStyle, error ? { borderColor: colors.danger } : null]}
                      placeholder="e.g. Mom, Dr. Smith, Caregiver"
                      placeholderTextColor={colors.textSub}
                      value={emergencyContactName}
                      onChangeText={(val) => {
                        setEmergencyContactName(val);
                        setError('');
                      }}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.textSub, fontFamily: fonts.medium }}>Phone Number *</Text>
                    <TextInput
                      style={[inputStyle, error ? { borderColor: colors.danger } : null]}
                      placeholder="e.g. +91 98765 43210 or 911"
                      placeholderTextColor={colors.textSub}
                      value={emergencyContact}
                      onChangeText={(val) => {
                        setEmergencyContact(val);
                        setError('');
                      }}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={handleBack}
                disabled={isLoading}
                style={[styles.backBtn, { borderColor: colors.cardBorder, borderWidth: 1 }]}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={18} color={colors.text} />
                <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={currentStep === 6 ? handleSubmit : handleNext}
              disabled={isLoading}
              style={[
                styles.submitBtn,
                { backgroundColor: colors.accent, flex: 1 },
              ]}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.submitText}>
                    {currentStep === 6 ? 'Complete Baseline' : 'Continue'}
                  </Text>
                  <Feather name={currentStep === 6 ? 'check' : 'arrow-right'} size={18} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
    width: W * 1.2,
    height: W * 1.2,
  },
  orbTopRight: {
    top: -W * 0.5,
    right: -W * 0.5,
  },
  orbBottomLeft: {
    bottom: -W * 0.5,
    left: -W * 0.5,
  },
  orbBottomLeftSmall: {
    bottom: -W * 0.2,
    left: -W * 0.2,
    width: W * 0.6,
    height: W * 0.6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  stepContent: {
    minHeight: 250,
  },
  questionSection: {
    gap: 12,
  },
  questionText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  questionSubText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backBtn: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#ffffff',
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    flex: 1,
    lineHeight: 16,
  },
});
