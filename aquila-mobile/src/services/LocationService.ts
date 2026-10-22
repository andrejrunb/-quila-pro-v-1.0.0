import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const GEOFENCE_TASK_NAME = 'GEOFENCE_ARRIVE';
const PICKUP_GEOFENCE_TASK = 'GEOFENCE_PICKUP';

interface SchoolGeoConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  pickupRadiusMeters: number;
  pickupPointName: string;
}

// Default — será sobrescrito pela API
let schoolGeo: SchoolGeoConfig = {
  latitude: -23.5505,
  longitude: -46.6333,
  radiusMeters: 500,
  pickupRadiusMeters: 200,
  pickupPointName: 'Portaria Principal',
};

/**
 * Busca coordenadas reais da escola cadastrada no servidor
 */
async function loadSchoolConfig(): Promise<void> {
  try {
    const schoolId = Platform.OS === 'web'
      ? localStorage.getItem('school_id')
      : await SecureStore.getItemAsync('school_id');

    if (!schoolId) return;

    const { data } = await api.get(`/school-config?schoolId=${schoolId}`);
    if (data?.geo) {
      schoolGeo = {
        latitude: data.geo.latitude,
        longitude: data.geo.longitude,
        radiusMeters: data.geo.radiusMeters ?? 500,
        pickupRadiusMeters: data.geo.pickupRadiusMeters ?? 200,
        pickupPointName: data.geo.pickupPointName ?? 'Portaria Principal',
      };
      console.log('[Geofencing] Coordenadas da escola carregadas:', schoolGeo);
    }
  } catch (err) {
    console.warn('[Geofencing] Usando coordenadas padrão — API indisponível:', err);
  }
}

export const LocationService = {
  /**
   * Inicia geofencing de presença (raio amplo)
   */
  async startGeofencing(): Promise<void> {
    if (Platform.OS === 'web') return;

    await loadSchoolConfig();

    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return;

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    if (bg !== 'granted') return;

    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, [
      {
        identifier: 'SCHOOL_CAMPUS',
        latitude: schoolGeo.latitude,
        longitude: schoolGeo.longitude,
        radius: schoolGeo.radiusMeters,
      },
    ]);
    console.log('[Geofencing] Presença iniciada — raio:', schoolGeo.radiusMeters, 'm');
  },

  /**
   * Inicia geofencing de pick-up (raio curto — 200m)
   */
  async startPickupGeofencing(): Promise<void> {
    if (Platform.OS === 'web') return;

    await loadSchoolConfig();

    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return;

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    if (bg !== 'granted') return;

    await Location.startGeofencingAsync(PICKUP_GEOFENCE_TASK, [
      {
        identifier: 'SCHOOL_PICKUP',
        latitude: schoolGeo.latitude,
        longitude: schoolGeo.longitude,
        radius: schoolGeo.pickupRadiusMeters,
      },
    ]);
    console.log('[Geofencing] Pickup iniciado — raio:', schoolGeo.pickupRadiusMeters, 'm');
  },

  async stopGeofencing(): Promise<void> {
    if (Platform.OS === 'web') return;
    for (const task of [GEOFENCE_TASK_NAME, PICKUP_GEOFENCE_TASK]) {
      const started = await Location.hasStartedGeofencingAsync(task);
      if (started) await Location.stopGeofencingAsync(task);
    }
  },

  /**
   * Calcula distância aproximada até a escola (em metros)
   */
  async getDistanceToSchool(): Promise<number | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const R = 6371000; // metros
      const dLat = (schoolGeo.latitude - loc.coords.latitude) * (Math.PI / 180);
      const dLng = (schoolGeo.longitude - loc.coords.longitude) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(loc.coords.latitude * (Math.PI / 180)) *
          Math.cos(schoolGeo.latitude * (Math.PI / 180)) *
          Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    } catch {
      return null;
    }
  },

  getSchoolConfig(): SchoolGeoConfig {
    return schoolGeo;
  },
};

// --- Task Manager: Arrival geofence ---
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }: { data: { eventType: number; region: Location.LocationRegion }; error: TaskManager.TaskManagerError | null }) => {
  if (error) {
    console.error('[Geofencing] Task Error:', error);
    return;
  }

  if (data.eventType === Location.GeofencingEventType.Enter) {
    console.log('[Geofencing] Entrou no raio da escola!');
    try {
      const studentHash = await SecureStore.getItemAsync('student_hash');
      const schoolId = await SecureStore.getItemAsync('school_id');
      if (studentHash && schoolId) {
        await api.post('/arrive', { schoolId, studentHash, auto: true });
        console.log('[Geofencing] Sinal de "Chegando" enviado automaticamente.');
      }
    } catch (err) {
      console.error('[Geofencing] Falha ao notificar chegada automática:', err);
    }
  }

  if (data.eventType === Location.GeofencingEventType.Exit) {
    console.log('[Geofencing] Saiu do raio da escola.');
  }
});

// --- Task Manager: Pickup geofence ---
TaskManager.defineTask(PICKUP_GEOFENCE_TASK, async ({ data, error }: { data: { eventType: number; region: Location.LocationRegion }; error: TaskManager.TaskManagerError | null }) => {
  if (error) {
    console.error('[Pickup Geofencing] Task Error:', error);
    return;
  }

  if (data.eventType === Location.GeofencingEventType.Enter) {
    console.log('[Pickup] Responsável no raio de busca!');
    try {
      const studentHash = await SecureStore.getItemAsync('student_hash');
      const schoolId = await SecureStore.getItemAsync('school_id');
      if (studentHash && schoolId) {
        await api.post('/pickup/nearby', { schoolId, studentHash });
        console.log('[Pickup] Escola notificada — responsável próximo.');
      }
    } catch (err) {
      console.error('[Pickup] Falha ao notificar proximidade:', err);
    }
  }
});
