import { Platform, ViewStyle } from 'react-native';

export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
  default: {},
}) as ViewStyle;

export const navShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: { elevation: 8 },
  default: {},
}) as ViewStyle;

export const inputShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  android: { elevation: 2 },
  default: {},
}) as ViewStyle;
