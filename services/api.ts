import axios from 'axios';

import { BASE_URI, TOKEN } from '@/constants/api';

export const apiClient = axios.create({
  baseURL: BASE_URI,
  headers: {
    accesstoken: TOKEN,
  },
});
