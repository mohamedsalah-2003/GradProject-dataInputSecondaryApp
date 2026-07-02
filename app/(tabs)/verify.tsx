import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_PATHS } from '@/constants/api';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiClient } from '@/services/api';

const AUTO_VERIFY_INTERVAL_MS = 3000;

type Home = {
  _id: string;
  name: string;
  location: string;
};

type Device = {
  _id: string;
  name: string;
  location: string;
  isActive: boolean;
  isCamera: boolean;
};

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

  const [homes, setHomes] = useState<Home[]>([]);
  const [cameraDevices, setCameraDevices] = useState<Device[]>([]);

  const [selectedHomeId, setSelectedHomeId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const [homesLoading, setHomesLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(false);

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
    deviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  const loadHomes = useCallback(async () => {
    try {
      setHomesLoading(true);
      setError('');

      const response = await apiClient.get('/homes/getHomes');
      const fetchedHomes: Home[] = response.data?.homes ?? [];

      setHomes(fetchedHomes);

      if (fetchedHomes.length > 0) {
        setSelectedHomeId(fetchedHomes[0]._id);
      }
    } catch {
      setError('Could not load homes.');
    } finally {
      setHomesLoading(false);
    }
  }, []);

  const loadCameraDevices = useCallback(async (homeId: string) => {
    try {
      if (!homeId) return;

      setDevicesLoading(true);
      setCameraDevices([]);
      setSelectedDeviceId('');
      setError('');

      const response = await apiClient.get(`/devices/getDevicesByHome/${homeId}`);
      const devices: Device[] = response.data?.devices ?? [];

      const cameras = devices.filter((device) => device.isCamera === true);

      setCameraDevices(cameras);

      if (cameras.length > 0) {
        setSelectedDeviceId(cameras[0]._id);
      }
    } catch {
      setError('Could not load camera devices.');
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomes();
  }, [loadHomes]);

  useEffect(() => {
    if (selectedHomeId) {
      loadCameraDevices(selectedHomeId);
    }
  }, [selectedHomeId, loadCameraDevices]);

  const verifyFace = useCallback(
    async (options?: { manual?: boolean }) => {
      if (verifyingRef.current || !cameraRef.current) return;

      const trimmedDeviceId = deviceIdRef.current.trim();

      if (!selectedHomeId) {
        if (options?.manual) {
          setError('Please select a home first.');
        }
        return;
      }

      if (!trimmedDeviceId) {
        if (options?.manual) {
          setError('Please select a camera device first.');
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

        const formData = new FormData();

        if (Platform.OS === 'web') {
          const imageResponse = await fetch(photo.uri);
          const blob = await imageResponse.blob();
          formData.append('file', blob, 'verify.jpg');
        } else {
          formData.append('file', {
            uri: photo.uri,
            name: 'verify.jpg',
            type: 'image/jpeg',
          } as any);
        }

        formData.append('deviceId', trimmedDeviceId);

        const response = await apiClient.post<VerifyResponse>(
          API_PATHS.face.verify,
          formData
        );

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
    },
    [selectedHomeId]
  );

  useFocusEffect(
    useCallback(() => {
      if (!permission?.granted || !autoVerify || !selectedDeviceId.trim()) {
        return undefined;
      }

      void verifyFace();

      const intervalId = setInterval(() => {
        void verifyFace();
      }, AUTO_VERIFY_INTERVAL_MS);

      return () => clearInterval(intervalId);
    }, [permission?.granted, autoVerify, selectedDeviceId, verifyFace])
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

  const autoScanActive = autoVerify && selectedDeviceId.trim().length > 0;

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
          ]}
        >
          <Text style={[styles.title, { color: text }]}>Verify Face</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Select a home and CCTV camera — verification runs automatically every 3 seconds.
          </Text>

          <View style={styles.selectorBlock}>
            <Text style={[styles.selectorLabel, { color: text }]}>Select Home</Text>

            {homesLoading ? (
              <ActivityIndicator color={primary} />
            ) : homes.length === 0 ? (
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                No homes found. Please create a home first.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsRow}>
                  {homes.map((home) => {
                    const selected = selectedHomeId === home._id;

                    return (
                      <TouchableOpacity
                        key={home._id}
                        style={[
                          styles.optionCard,
                          {
                            borderColor: selected ? primary : border,
                            backgroundColor: selected ? primary : surface,
                          },
                        ]}
                        onPress={() => setSelectedHomeId(home._id)}
                        disabled={loading}
                      >
                        <Text style={[styles.optionTitle, { color: selected ? '#fff' : text }]}>
                          {home.name}
                        </Text>
                        <Text
                          style={[
                            styles.optionSubtitle,
                            { color: selected ? '#fff' : textSecondary },
                          ]}
                        >
                          {home.location}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          <View style={styles.selectorBlock}>
            <Text style={[styles.selectorLabel, { color: text }]}>Select CCTV Camera</Text>

            {devicesLoading ? (
              <ActivityIndicator color={primary} />
            ) : selectedHomeId && cameraDevices.length === 0 ? (
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                No camera devices found in this home.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsRow}>
                  {cameraDevices.map((device) => {
                    const selected = selectedDeviceId === device._id;

                    return (
                      <TouchableOpacity
                        key={device._id}
                        style={[
                          styles.optionCard,
                          {
                            borderColor: selected ? primary : border,
                            backgroundColor: selected ? primary : surface,
                          },
                        ]}
                        onPress={() => setSelectedDeviceId(device._id)}
                        disabled={loading}
                      >
                        <Text style={[styles.optionTitle, { color: selected ? '#fff' : text }]}>
                          {device.name}
                        </Text>
                        <Text
                          style={[
                            styles.optionSubtitle,
                            { color: selected ? '#fff' : textSecondary },
                          ]}
                        >
                          {device.location}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          <Pressable
            onPress={() => setAutoVerify((prev) => !prev)}
            style={[styles.autoToggle, { borderColor: border, backgroundColor: background }]}
          >
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
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
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
  selectorBlock: {
    gap: Spacing.xs,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  optionCard: {
    minWidth: 130,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
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