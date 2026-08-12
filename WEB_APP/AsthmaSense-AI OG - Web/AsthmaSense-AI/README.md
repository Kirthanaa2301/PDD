# AsthmaSense AI (React Native)

Pixel-faithful React Native port of the **Asthma_AI** Flutter app (`Asthma_AI/`), using the same screens, copy, layout order, colors, spacing, and interactions.

## Stack

- **Expo SDK 54** (`expo@~54.0.0`) — React Native **0.81.5**, React **19.1.0**
- **Expo Go**: use the latest [Expo Go](https://expo.dev/go) app from the App Store / Play Store (must support SDK 54)
- React Navigation (native stack + bottom tabs)
- `expo-linear-gradient`, `react-native-svg`, `@expo/vector-icons`, `expo-font`

## Run

**1. API server** (keeps Groq key off the device; lives next to this app at `../asthmasense-server`):

```bash
cd ../asthmasense-server
cp .env.example .env   # add GROQ_API_KEY
npm install
npm run dev
```

**2. Mobile app:**

```bash
npm install
# Physical device: copy .env.example → .env and set EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001
npx expo start
```

### Breathing / cough analysis

- Record live audio (up to 30s) or upload a file (mp3, m4a, wav, etc.)
- Server transcribes with Groq **whisper-large-v3-turbo**, then analyzes for **Wheezing Detected** and **Risk Level**

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

## Screen map

| Flow | Screens |
|------|---------|
| Auth | Welcome → Phone Login → Verify OTP → Login Success |
| Profile setup | Create Profile → Privacy → Theme → Permissions |
| Onboarding (12 steps) | Welcome → Triggers → Custom trigger → … → Emergency contact → **Main tabs** |
| Main tabs | Home, Breathing, Tracking, Reports, Profile |
| Pushed screens | Breathing test/exercise, symptom detail, trigger journal, insights, doctor report, medications, AI chat, breathing monitor |

Design tokens live in `src/theme/colors.ts` (from `Asthma_AI/lib/theme/app_theme.dart`).
