import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (__DEV__) {
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:3001/api/parent'
      : 'http://localhost:3001/api/parent';
  }
  return 'https://api.aquilapro.com.br/api/parent';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('parent_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    if (Platform.OS === 'web') {
      const webToken = localStorage.getItem('parent_token');
      if (webToken) config.headers['Authorization'] = `Bearer ${webToken}`;
    }
  }
  return config;
});

// ─── Pickup API helpers ───────────────────────────────────────
export const PickupAPI = {
  /** Solicita busca do aluno — sinal manual "Estou Chegando" */
  async requestPickup(schoolId: string, studentHash: string): Promise<{ success: boolean; estimatedMinutes?: number }> {
    const { data } = await api.post('/pickup/request', { schoolId, studentHash });
    return data;
  },

  /** Consulta status do pickup ativo */
  async getPickupStatus(schoolId: string, studentHash: string): Promise<{
    status: 'none' | 'requested' | 'preparing' | 'at_gate' | 'completed';
    updatedAt?: string;
    estimatedMinutes?: number;
  }> {
    const { data } = await api.get(`/pickup/status?schoolId=${schoolId}&studentHash=${studentHash}`);
    return data;
  },

  /** Cancela pickup ativo */
  async cancelPickup(schoolId: string, studentHash: string): Promise<void> {
    await api.post('/pickup/cancel', { schoolId, studentHash });
  },
};
