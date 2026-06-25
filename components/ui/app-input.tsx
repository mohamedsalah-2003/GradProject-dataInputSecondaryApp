import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type AppInputProps = TextInputProps & {
  label: string;
  hint?: string;
};

export function AppInput({ label, hint, style, ...rest }: AppInputProps) {
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'primary');

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={textSecondary}
        style={[
          styles.input,
          { color: text, backgroundColor: surface, borderColor: border },
          style,
        ]}
        selectionColor={primary}
        {...rest}
      />
      {hint ? <Text style={[styles.hint, { color: textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 16,
    minHeight: 48,
  },
  hint: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});
