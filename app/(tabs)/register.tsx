import axios from 'axios';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {  useRef, useState } from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { API_PATHS } from '@/constants/api';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { apiClient } from '@/services/api';

type FlaskData = {
  message?: string;
  name?: string;
  status?: string;
  user_id?: string;
};

type DbData = {
  userId: string;
  name: string;
  registeredAt: string;
  _id: string;
};

type RegisterResponse = {
  success: boolean;
  message?: string;
  flaskData?: FlaskData;
  dbData?: DbData;
};

type RegisterResult = {
  variant: 'success' | 'warning' | 'danger';
  title: string;
  details: { label: string; value: string }[];
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function parseRegisterResponse(data: RegisterResponse, submittedName: string): RegisterResult {
  if (!data.success) {
    return {
      variant: 'danger',
      title: data.message ?? 'Registration failed.',
      details: [],
    };
  }

  const flask = data.flaskData;
  const db = data.dbData;

  if (flask?.status === 'already_registered') {
    return {
      variant: 'warning',
      title: flask.message ?? `${flask.name ?? submittedName} is already registered in the face model.`,
      details: [
        ...(flask.name ? [{ label: 'Face Model Name', value: flask.name }] : []),
        ...(db?.name ? [{ label: 'Saved As', value: db.name }] : []),
        ...(flask.user_id ? [{ label: 'Face ID', value: flask.user_id }] : []),
        ...(db?.registeredAt ? [{ label: 'Registered At', value: formatDate(db.registeredAt) }] : []),
      ],
    };
  }

  return {
    variant: 'success',
    title: flask?.message ?? `Successfully registered ${db?.name ?? submittedName}.`,
    details: [
      ...(db?.name ? [{ label: 'Name', value: db.name }] : []),
      ...(flask?.user_id ? [{ label: 'Face ID', value: flask.user_id }] : []),
      ...(db?.registeredAt ? [{ label: 'Registered At', value: formatDate(db.registeredAt) }] : []),
      ...(db?._id ? [{ label: 'Record ID', value: db._id }] : []),
    ],
  };
}

export default function RegisterFaceScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);

  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const border = useThemeColor({}, 'border');
  const cardShadow = useThemeColor({}, 'cardShadow');

  const registerFace = async () => {
    try {
      if (!cameraRef.current) return;

      const trimmedName = name.trim();
      if (!trimmedName) {
        setResult({
          variant: 'warning',
          title: 'Name is required.',
          details: [],
        });
        return;
      }

      setLoading(true);
      setResult(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        setResult({
          variant: 'danger',
          title: 'Could not capture photo.',
          details: [],
        });
        return;
      }

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const imageResponse = await fetch(photo.uri);
        const blob = await imageResponse.blob();
        formData.append('file', blob, 'register.jpg');
      } else {
        formData.append('file', {
          uri: photo.uri,
          name: 'register.jpg',
          type: 'image/jpeg',
        } as any);
      }
      formData.append('name', trimmedName);

      const response = await apiClient.post<RegisterResponse>(API_PATHS.face.register, formData);
      setResult(parseRegisterResponse(response.data, trimmedName));
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;

      setResult({
        variant: 'danger',
        title: message ?? 'Registration error. Check camera and API connection.',
        details: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <View style={[styles.center, { backgroundColor: background }]} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: background }]}>
        <View style={[styles.permissionCard, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.title, { color: text }]}>Camera Access</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Allow camera access to capture a face for registration.
          </Text>
          <AppButton title="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />

      <SafeAreaView style={styles.overlay} edges={['bottom']}>
        <View
          style={[
            styles.panel,
            { backgroundColor: surface, borderColor: border, shadowColor: cardShadow },
          ]}>
          <Text style={[styles.title, { color: text }]}>Register Face</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Position the face in frame, enter a name, then tap register.
          </Text>

          <AppInput
            label="Person Name"
            placeholder="Enter full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <AppButton title="Register Face" loading={loading} onPress={registerFace} />

          {result ? (
            <View style={styles.result}>
              <StatusBadge label={result.title} variant={result.variant} />
              {result.details.length > 0 ? (
                <View style={styles.details}>
                  {result.details.map((row:any) => (
                    <InfoRow key={row.label} label={row.label} value={row.value} />
                  ))}
                </View>
              ) : null}
              {result.variant === 'warning' ? (
                <Text style={[styles.hint, { color: textSecondary }]}>
                  The face model reported an existing match, but a database record was still saved.
                </Text>
              ) : null}
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
  result: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  details: {
    marginTop: Spacing.xs,
  },
  hint: {
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
