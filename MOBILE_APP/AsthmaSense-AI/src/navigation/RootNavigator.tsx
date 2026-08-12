import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { navShadow } from '../theme/shadows';
import { MainTabParamList, RootStackParamList } from './types';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { PhoneLoginScreen } from '../screens/auth/PhoneLoginScreen';
import { VerifyOtpScreen } from '../screens/auth/VerifyOtpScreen';
import { LoginSuccessScreen } from '../screens/auth/LoginSuccessScreen';
import { CreateProfileScreen } from '../screens/onboarding/CreateProfileScreen';
import { PrivacySetupScreen } from '../screens/onboarding/PrivacySetupScreen';
import { ThemeScreen } from '../screens/onboarding/ThemeScreen';
import { PermissionsScreen } from '../screens/onboarding/PermissionsScreen';
import { OnboardingWelcomeScreen } from '../screens/onboarding/OnboardingWelcomeScreen';
import { AsthmaTriggersScreen } from '../screens/onboarding/AsthmaTriggersScreen';
import {
  AddMedicationScreen,
  CommonMedicationsScreen,
  CustomTriggerScreen,
  DailyHabitsScreen,
  DosageScreen,
  EmergencyContactScreen,
  MedicationSetupScreen,
  SeverityLevelScreen,
  SymptomsTimingScreen,
  TimingScreen,
} from '../screens/onboarding/OnboardingFlowScreens';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BreathingScreen } from '../screens/breathing/BreathingScreen';
import { DailyTrackingScreen } from '../screens/tracking/DailyTrackingScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { BreathingTestScreen } from '../screens/breathing/BreathingTestScreen';
import { BreathingExerciseScreen } from '../screens/breathing/BreathingExerciseScreen';
import { SymptomDetailScreen } from '../screens/tracking/SymptomDetailScreen';
import { TriggerJournalScreen } from '../screens/tracking/TriggerJournalScreen';
import { InsightsScreen } from '../screens/reports/InsightsScreen';
import { DoctorReportScreen } from '../screens/reports/DoctorReportScreen';
import { MedicationsScreen } from '../screens/medications/MedicationsScreen';
import { AIChatScreen } from '../screens/ai_chat/AIChatScreen';
import { BreathingMonitorScreen } from '../screens/home/BreathingMonitorScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }
> = {
  Home: { outline: 'home-outline', filled: 'home' },
  Breathing: { outline: 'cloud-outline', filled: 'cloud' },
  Tracking: { outline: 'sync-outline', filled: 'sync' },
  Reports: { outline: 'bar-chart-outline', filled: 'bar-chart' },
  Profile: { outline: 'person-outline', filled: 'person' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryBlue,
        tabBarInactiveTintColor: colors.textGrey,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [styles.tabBar, navShadow],
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Ionicons
              name={focused ? icons.filled : icons.outline}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Breathing" component={BreathingScreen} />
      <Tab.Screen name="Tracking" component={DailyTrackingScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
        <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        <Stack.Screen name="LoginSuccess" component={LoginSuccessScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen name="PrivacySetup" component={PrivacySetupScreen} />
        <Stack.Screen name="Theme" component={ThemeScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
        <Stack.Screen name="AsthmaTriggers" component={AsthmaTriggersScreen} />
        <Stack.Screen name="CustomTrigger" component={CustomTriggerScreen} />
        <Stack.Screen name="SymptomsTiming" component={SymptomsTimingScreen} />
        <Stack.Screen name="SeverityLevel" component={SeverityLevelScreen} />
        <Stack.Screen name="MedicationSetup" component={MedicationSetupScreen} />
        <Stack.Screen name="CommonMedications" component={CommonMedicationsScreen} />
        <Stack.Screen name="Dosage" component={DosageScreen} />
        <Stack.Screen name="Timing" component={TimingScreen} />
        <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
        <Stack.Screen name="DailyHabits" component={DailyHabitsScreen} />
        <Stack.Screen name="EmergencyContact" component={EmergencyContactScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="BreathingTest" component={BreathingTestScreen} />
        <Stack.Screen name="BreathingExercise" component={BreathingExerciseScreen} />
        <Stack.Screen name="SymptomDetail" component={SymptomDetailScreen} />
        <Stack.Screen name="TriggerJournal" component={TriggerJournalScreen} />
        <Stack.Screen name="Insights" component={InsightsScreen} />
        <Stack.Screen name="DoctorReport" component={DoctorReportScreen} />
        <Stack.Screen name="Medications" component={MedicationsScreen} />
        <Stack.Screen name="AIChat" component={AIChatScreen} />
        <Stack.Screen name="BreathingMonitor" component={BreathingMonitorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.cardWhite,
    borderTopWidth: 0,
    elevation: 0,
    paddingTop: 4,
    height: 60,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
