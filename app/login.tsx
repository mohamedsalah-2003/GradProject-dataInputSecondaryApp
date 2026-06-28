import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { signinRequest } from '@/services/auth';
import { tokenStorage } from '@/utils/tokenStorage';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const border = useThemeColor({}, 'border');
  const cardShadow = useThemeColor({}, 'cardShadow');

  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await signinRequest({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!response.accesstoken) {
        setError('Login succeeded but no access token was returned.');
        return;
      }

      await tokenStorage.set('accesstoken', response.accesstoken);

      if (response.refreshtoken) {
        await tokenStorage.set('refreshtoken', response.refreshtoken);
      }

      if (response.user) {
        await tokenStorage.set('user', JSON.stringify(response.user));
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Invalid email or password. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: text }]}>AegisIQ Emulator</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Sign in to send sensor readings and face events using your real account token.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: surface,
                borderColor: border,
                shadowColor: cardShadow,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: text }]}>Login</Text>

            <AppInput
              label="Email"
              placeholder="your.email@example.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <AppInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError('');
              }}
              secureTextEntry
            />
            <View style={{ marginVertical: Spacing.md }} >
              {error ? <StatusBadge label={error} variant="danger" /> : null}
            </View>

            <AppButton
              title="Sign In"
              loading={loading}
              onPress={handleLogin}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },

  header: {
    marginBottom: Spacing.xl,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },

  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
});