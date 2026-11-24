import Constants from 'expo-constants';

const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  fromExtra ??
  'https://tectalk-api.onrender.com'
).replace(/\/+$/, '');
