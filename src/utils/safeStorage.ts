import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Universal Storage Adapter
 * Safely handles:
 * - Native iOS / Android: AsyncStorage
 * - Web Client: window.localStorage
 * - Web Server / SSR (render.js): In-memory no-op fallback (prevents 'ReferenceError: window is not defined')
 */
export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      return window.localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};
