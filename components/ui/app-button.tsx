import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type AppButtonVariant = 'primary' | 'secondary' | 'danger';

type AppButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: AppButtonVariant;
};

export function AppButton({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: AppButtonProps) {
  const primary = useThemeColor({}, 'primary');
  const surface = useThemeColor({}, 'surface');
  const danger = useThemeColor({}, 'danger');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');

  const palette = {
    primary: { bg: primary, fg: '#ffffff', border: primary },
    secondary: { bg: surface, fg: text, border },
    danger: { bg: danger, fg: '#ffffff', border: danger },
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text style={[styles.label, { color: palette.fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
