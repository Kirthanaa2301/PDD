import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  title?: string;
  onBack?: () => void;
  centerTitle?: boolean;
  right?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  backColor?: string;
};

export function ScreenHeader({
  title,
  onBack,
  centerTitle = true,
  right,
  backgroundColor = colors.backgroundLight,
  titleColor = colors.textDark,
  backColor = colors.textDark,
}: Props) {
  return (
    <View style={[styles.bar, { backgroundColor }]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color={backColor} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <View style={[styles.titleWrap, centerTitle && styles.titleCenter]}>
        {title ? (
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, styles.sideRight]}>{right ?? <View style={styles.placeholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
  },
  side: { width: 48, alignItems: 'flex-start', justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  titleWrap: { flex: 1 },
  titleCenter: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  placeholder: { width: 20, height: 20 },
});
