import * as Haptics from 'expo-haptics';

export function useHaptics() {
  const light = () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

  const medium = () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

  const heavy = () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

  const success = () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

  const error = () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

  const warning = () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

  return { light, medium, heavy, success, error, warning };
}
