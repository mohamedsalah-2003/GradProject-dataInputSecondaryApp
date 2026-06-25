import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#4fc3f7';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#f4f6f8',
    surface: '#ffffff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#e2e8f0',
    primary: '#0a7ea4',
    primaryMuted: '#e0f4fa',
    success: '#16a34a',
    successMuted: '#dcfce7',
    warning: '#d97706',
    warningMuted: '#fef3c7',
    danger: '#dc2626',
    dangerMuted: '#fee2e2',
    cardShadow: 'rgba(15, 23, 42, 0.08)',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#0f1419',
    surface: '#1a222d',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#2d3748',
    primary: '#4fc3f7',
    primaryMuted: '#1e3a4a',
    success: '#4ade80',
    successMuted: '#14532d',
    warning: '#fbbf24',
    warningMuted: '#451a03',
    danger: '#f87171',
    dangerMuted: '#450a0a',
    cardShadow: 'rgba(0, 0, 0, 0.35)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
