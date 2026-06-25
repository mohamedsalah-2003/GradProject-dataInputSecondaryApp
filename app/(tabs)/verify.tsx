import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_PATHS } from '@/constants/api';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiClient } from '@/services/api';

const AUTO_VERIFY_INTERVAL_MS = 3000;

type FaceResult = {
  known: boolean;
  name?: string | null;
  confidence?: number;
};

type VerifyResponse = {
  success: boolean;
  message?: string;
  data?: {
    results?: FaceResult[];
  };
};

export default function VerifyFaceScreen() {
  const cameraRef = useRef<CameraView>(null);
  const deviceIdRef = useRef('');
  const verifyingRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [deviceId, setDeviceId] = useState('');
  const [autoVerify, setAutoVerify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FaceResult[]>([]);
  const [error, setError] = useState('');
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);

  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const border = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'primary');
  const cardShadow = useThemeColor({}, 'cardShadow');

  useEffect(() => {
    deviceIdRef.current = deviceId;
  }, [deviceId]);

  const verifyFace = useCallback(async (options?: { manual?: boolean }) => {
    if (verifyingRef.current || !cameraRef.current) return;

    const trimmedDeviceId = deviceIdRef.current.trim();
    if (!trimmedDeviceId) {
      if (options?.manual) {
        setError('Device ID is required.');
      }
      return;
    }

    verifyingRef.current = true;
    setLoading(true);
    if (options?.manual) {
      setError('');
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        if (options?.manual) {
          setError('Could not capture photo.');
        }
        return;
      }

      const imageResponse = await fetch(photo.uri);
      const blob = await imageResponse.blob();

      const formData = new FormData();
      formData.append('file', blob, 'verify.jpg');
      formData.append('deviceId', trimmedDeviceId);

      const response = await apiClient.post<VerifyResponse>(API_PATHS.face.verify, formData);

      if (!response.data.success) {
        setError(response.data.message ?? 'Verification failed.');
        return;
      }

      setError('');
      setResults(response.data.data?.results ?? []);
      setLastScanAt(new Date());
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setError(message ?? 'Verification error. Check camera and API connection.');
    } finally {
      verifyingRef.current = false;
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!permission?.granted || !autoVerify || !deviceId.trim()) {
        return undefined;
      }

      void verifyFace();

      const intervalId = setInterval(() => {
        void verifyFace();
      }, AUTO_VERIFY_INTERVAL_MS);

      return () => clearInterval(intervalId);
    }, [permission?.granted, autoVerify, deviceId, verifyFace]),
  );

  if (!permission) {
    return <View style={[styles.center, { backgroundColor: background }]} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: background }]}>
        <View style={[styles.permissionCard, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.title, { color: text }]}>Camera Access</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Allow camera access to verify a registered face.
          </Text>
          <AppButton title="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  const autoScanActive = autoVerify && deviceId.trim().length > 0;

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />

      {autoScanActive ? (
        <View style={[styles.scanIndicator, { backgroundColor: surface, borderColor: border }]}>
          {loading ? (
            <ActivityIndicator size="small" color={primary} />
          ) : (
            <View style={[styles.scanDot, { backgroundColor: primary }]} />
          )}
          <Text style={[styles.scanText, { color: text }]}>
            {loading ? 'Scanning…' : 'Auto-verify every 3s'}
          </Text>
        </View>
      ) : null}

      <SafeAreaView style={styles.overlay} edges={['bottom']}>
        <View
          style={[
            styles.panel,
            { backgroundColor: surface, borderColor: border, shadowColor: cardShadow },
          ]}>
          <Text style={[styles.title, { color: text }]}>Verify Face</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Enter a device ID — verification runs automatically every 3 seconds.
          </Text>

          <AppInput
            label="Device ID"
            placeholder="e.g. 674a1b2c3d4e5f6789012345"
            value={deviceId}
            onChangeText={setDeviceId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            onPress={() => setAutoVerify((prev) => !prev)}
            style={[styles.autoToggle, { borderColor: border, backgroundColor: background }]}>
            <View style={[styles.toggleTrack, { backgroundColor: autoVerify ? primary : border }]}>
              <View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: autoVerify ? 18 : 0 }] },
                ]}
              />
            </View>
            <Text style={[styles.autoToggleLabel, { color: text }]}>
              Auto-verify every 3 seconds
            </Text>
          </Pressable>

          <AppButton
            title="Verify Now"
            loading={loading}
            variant="secondary"
            onPress={() => verifyFace({ manual: true })}
          />

          {lastScanAt ? (
            <Text style={[styles.lastScan, { color: textSecondary }]}>
              Last scan: {lastScanAt.toLocaleTimeString()}
            </Text>
          ) : null}

          {error ? <StatusBadge label={error} variant="danger" /> : null}

          {results.length > 0 ? (
            <View style={styles.result}>
              {results.map((result, index) => (
                <View key={`${result.name ?? 'unknown'}-${index}`} style={styles.resultItem}>
                  <StatusBadge
                    label={result.known ? 'Known Person' : 'Unknown Person'}
                    variant={result.known ? 'success' : 'danger'}
                  />
                  {result.name ? <InfoRow label="Name" value={result.name} /> : null}
                  {result.confidence != null ? (
                    <InfoRow label="Confidence" value={`${Math.round(result.confidence * 100)}%`} />
                  ) : null}
                  {!result.known ? (
                    <Text style={[styles.intrusionHint, { color: textSecondary }]}>
                      Intrusion alert may have been triggered for this device.
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scanIndicator: {
    position: 'absolute',
    top: Spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    zIndex: 10,
  },
  scanDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  scanText: {
    fontSize: 13,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    margin: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  autoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  autoToggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: Radius.full,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: '#fff',
  },
  lastScan: {
    fontSize: 12,
  },
  result: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  resultItem: {
    gap: Spacing.sm,
  },
  intrusionHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
});
