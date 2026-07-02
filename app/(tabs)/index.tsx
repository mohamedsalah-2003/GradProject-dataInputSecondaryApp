import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_PATHS } from '@/constants/api';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiClient } from '@/services/api';

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

type ReadingForm = {
  temp: string;
  smoke: string;
  gas: string;
  power: string;
  motion: string;
  door: string;
  water_flow: string;
};

type ReadingResponse = {
  reading: {
    temp: number;
    smoke: number;
    gas: number;
    power: number;
    motion: number;
    door: number;
    water_flow: number;
    isAnomaly: boolean;
    anomalyType?: string;
  };
  anomaly?: {
    severity: string;
    detectedAt: string;
  };
  alert?: {
    message: string;
    severity: string;
    isRead: boolean;
  };
};

const INITIAL_FORM: ReadingForm = {
  temp: '',
  smoke: '',
  gas: '',
  power: '',
  motion: '0',
  door: '0',
  water_flow: '',
};

export default function CreateReadingScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState<ReadingResponse | null>(null);
  const [form, setForm] = useState<ReadingForm>(INITIAL_FORM);

  const [homes, setHomes] = useState<Home[]>([]);
  const [sensorDevices, setSensorDevices] = useState<Device[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [homesLoading, setHomesLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const border = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'primary');
  const cardShadow = useThemeColor({}, 'cardShadow');

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

  const loadSensorDevices = useCallback(async (homeId: string) => {
    try {
      if (!homeId) return;

      setDevicesLoading(true);
      setSensorDevices([]);
      setSelectedDeviceId('');
      setError('');

      const response = await apiClient.get(`/devices/getDevicesByHome/${homeId}`);
      const devices: Device[] = response.data?.devices ?? [];

      const sensors = devices.filter((device) => device.isCamera !== true);

      setSensorDevices(sensors);

      if (sensors.length > 0) {
        setSelectedDeviceId(sensors[0]._id);
      }
    } catch {
      setError('Could not load devices.');
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomes();
  }, [loadHomes]);

  useEffect(() => {
    if (selectedHomeId) {
      loadSensorDevices(selectedHomeId);
    }
  }, [selectedHomeId, loadSensorDevices]);

  const handleChange = (key: keyof ReadingForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitReading = async () => {
    if (!selectedDeviceId.trim()) {
      setError('Please select a device first.');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const payload = {
        deviceId: selectedDeviceId,
        temp: Number(form.temp),
        smoke: Number(form.smoke),
        gas: Number(form.gas),
        power: Number(form.power),
        motion: Number(form.motion),
        door: Number(form.door),
        water_flow: Number(form.water_flow),
      };

      const res = await apiClient.post<ReadingResponse>(API_PATHS.readings.create, payload);
      setResponse(res.data);
    } catch {
      setError('Failed to send reading. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: text }]}>Send Reading</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Submit sensor data from a device to the monitoring backend.
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: surface, borderColor: border, shadowColor: cardShadow },
            ]}>
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
              <Text style={[styles.selectorLabel, { color: text }]}>Select Device</Text>

              {devicesLoading ? (
                <ActivityIndicator color={primary} />
              ) : selectedHomeId && sensorDevices.length === 0 ? (
                <Text style={[styles.emptyText, { color: textSecondary }]}>
                  No sensor devices found in this home.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsRow}>
                    {sensorDevices.map((device) => {
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

            <Text style={[styles.sectionTitle, { color: text }]}>Sensors</Text>
            <AppInput
              label="Temperature"
              placeholder="25"
              value={form.temp}
              onChangeText={(v) => handleChange('temp', v)}
              keyboardType="decimal-pad"
            />
            <AppInput
              label="Smoke Level"
              placeholder="0"
              value={form.smoke}
              onChangeText={(v) => handleChange('smoke', v)}
              keyboardType="decimal-pad"
            />
            <AppInput
              label="Gas Level"
              placeholder="0"
              value={form.gas}
              onChangeText={(v) => handleChange('gas', v)}
              keyboardType="decimal-pad"
            />
            <AppInput
              label="Power (W)"
              placeholder="120"
              value={form.power}
              onChangeText={(v) => handleChange('power', v)}
              keyboardType="decimal-pad"
            />
            <AppInput
              label="Water Flow"
              placeholder="0"
              value={form.water_flow}
              onChangeText={(v) => handleChange('water_flow', v)}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.sectionTitle, { color: text }]}>Status Flags</Text>
            <AppInput
              label="Motion"
              placeholder="0 or 1"
              value={form.motion}
              onChangeText={(v) => handleChange('motion', v)}
              keyboardType="number-pad"
              hint="Use 1 for motion detected, 0 for none."
            />
            <AppInput
              label="Door"
              placeholder="0 or 1"
              value={form.door}
              onChangeText={(v) => handleChange('door', v)}
              keyboardType="number-pad"
              hint="Use 1 for open, 0 for closed."
            />

            {error ? (
              <StatusBadge label={error} variant="danger" />
            ) : null}

            <AppButton title="Submit Reading" loading={loading} onPress={submitReading} />
          </View>

          {response ? (
            <View
              style={[
                styles.card,
                styles.resultCard,
                { backgroundColor: surface, borderColor: border, shadowColor: cardShadow },
              ]}>
              <View style={styles.resultHeader}>
                <Text style={[styles.sectionTitle, { color: text }]}>Response</Text>
                <StatusBadge
                  label={response.reading.isAnomaly ? 'Anomaly Detected' : 'Normal'}
                  variant={response.reading.isAnomaly ? 'danger' : 'success'}
                />
              </View>

              <Text style={[styles.groupLabel, { color: textSecondary }]}>Reading</Text>
              <InfoRow label="Temperature" value={response.reading.temp} />
              <InfoRow label="Smoke" value={response.reading.smoke} />
              <InfoRow label="Gas" value={response.reading.gas} />
              <InfoRow label="Power" value={response.reading.power} />
              <InfoRow label="Motion" value={response.reading.motion} />
              <InfoRow label="Door" value={response.reading.door} />
              <InfoRow label="Water Flow" value={response.reading.water_flow} />

              {response.reading.isAnomaly ? (
                <>
                  <Text style={[styles.groupLabel, { color: textSecondary }]}>Anomaly</Text>
                  <InfoRow label="Type" value={response.reading.anomalyType ?? 'Unknown'} />
                  {response.anomaly ? (
                    <>
                      <InfoRow label="Severity" value={response.anomaly.severity} />
                      <InfoRow label="Detected At" value={response.anomaly.detectedAt} />
                    </>
                  ) : null}
                </>
              ) : null}

              {response.alert ? (
                <>
                  <Text style={[styles.groupLabel, { color: textSecondary }]}>Alert</Text>
                  <InfoRow label="Message" value={response.alert.message} />
                  <InfoRow label="Severity" value={response.alert.severity} />
                  <InfoRow label="Read" value={response.alert.isRead} />
                </>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  resultCard: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  selectorBlock: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
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
});
