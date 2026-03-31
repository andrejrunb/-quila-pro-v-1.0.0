import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const GEOFENCE_TASK_NAME = 'GEOFENCE_ARRIVE';
const SCHOOL_LAT = -23.5505; // Mock: São Paulo (deve vir da config da escola)
const SCHOOL_LNG = -46.6333;
const RADIUS_METERS = 500;

export const LocationService = {
  async startGeofencing() {
    if (Platform.OS === 'web') return;

    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== 'granted') return;

    const { status: background } = await Location.requestBackgroundPermissionsAsync();
    if (background !== 'granted') return;

    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, [
      {
        identifier: 'SCHOOL_CAMPUS',
        latitude: SCHOOL_LAT,
        longitude: SCHOOL_LNG,
        radius: RADIUS_METERS,
      },
    ]);
    console.log('[Geofencing] Iniciado para a escola');
  },

  async stopGeofencing() {
    if (Platform.OS === 'web') return;
    const isStarted = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
    if (isStarted) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    }
  }
};

// Task Manager Handler
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data: { eventType, region }, error }: any) => {
  if (error) {
    console.error('[Geofencing] Task Error:', error);
    return;
  }

  if (eventType === Location.GeofencingEventType.Enter) {
    console.log('[Geofencing] Entrou no raio da escola!');
    
    // Dispara sinal automático de chegada
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
});
