import { API_PATHS } from '@/constants/api';
import { apiClient } from '@/services/api';

type SigninPayload = {
  email: string;
  password: string;
};

export type SigninResponse = {
  message?: string;
  accesstoken?: string;
  refreshtoken?: string;
  user?: unknown;
};

export async function signinRequest(payload: SigninPayload) {
  const response = await apiClient.post<SigninResponse>(
    API_PATHS.auth.signin,
    payload,
  );

  return response.data;
}