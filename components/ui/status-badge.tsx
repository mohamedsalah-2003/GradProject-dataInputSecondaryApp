import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral';

type StatusBadgeProps = {
  label: string;
  variant?: StatusVariant;
};

export function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
  const success = useThemeColor({}, 'success');
  const successMuted = useThemeColor({}, 'successMuted');
  const warning = useThemeColor({}, 'warning');
  const warningMuted = useThemeColor({}, 'warningMuted');
  const danger = useThemeColor({}, 'danger');
  const dangerMuted = useThemeColor({}, 'dangerMuted');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');

  const palette = {
    success: { bg: successMuted, fg: success },
    warning: { bg: warningMuted, fg: warning },
    danger: { bg: dangerMuted, fg: danger },
    neutral: { bg: surface, fg: textSecondary, border },
  }[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          borderColor: 'border' in palette ? palette.border : palette.fg,
        },
      ]}>
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
