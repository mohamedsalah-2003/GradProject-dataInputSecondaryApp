import axios from 'axios';
import { router } from 'expo-router';

import { BASE_URI } from '@/constants/api';
import { tokenStorage } from '@/utils/tokenStorage';

export const apiClient = axios.create({
  baseURL: BASE_URI,
});

apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = await tokenStorage.get('accesstoken');

    if (accessToken) {
      config.headers = config.headers ?? {};
      (config.headers as any).accesstoken = accessToken;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 500 || status === 403) {
      await tokenStorage.remove('accesstoken');
      await tokenStorage.remove('refreshtoken');
      router.replace('/login');
    }

    return Promise.reject(error);
  },
);