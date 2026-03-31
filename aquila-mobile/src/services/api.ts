import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// For web, localhost works fine. For Android emulator, use 10.0.2.2.
const getBaseUrl = () => {
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3001/api/parent' : 'http://localhost:3001/api/parent';
  }
  return 'https://api.aquilapro.com.br/api/parent'; // Produção
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
  } catch (err) {
    // If running on web, SecureStore might throw if not configured with polyfill, fallback to localStorage if needed
    if (Platform.OS === 'web') {
      const webToken = localStorage.getItem('parent_token');
      if (webToken) config.headers['Authorization'] = `Bearer ${webToken}`;
    }
  }
  return config;
});
