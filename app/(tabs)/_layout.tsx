import { Tabs, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { tokenStorage } from '@/utils/tokenStorage';

const TAB_BAR_CONTENT_HEIGHT = Platform.OS === 'ios' ? 49 : 56;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const tabBarTopPadding = Spacing.sm;
  const tabBarBottomPadding = Math.max(insets.bottom, Spacing.sm);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await tokenStorage.get('accesstoken');

      if (!token) {
        router.replace('/login');
        setCheckingAuth(false);
        return;
      }

      setHasToken(true);
      setCheckingAuth(false);
    };

    void checkToken();
  }, []);

  if (checkingAuth || !hasToken) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingTop: tabBarTopPadding,
          paddingBottom: tabBarBottomPadding,
          height:
            TAB_BAR_CONTENT_HEIGHT + tabBarTopPadding + tabBarBottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reading',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="waveform.path.ecg" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="register"
        options={{
          title: 'Register',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={26}
              name="person.crop.circle.badge.plus"
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="verify"
        options={{
          title: 'Verify',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="faceid" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}