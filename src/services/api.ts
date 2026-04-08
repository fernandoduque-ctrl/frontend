import axios from 'axios';
import { ACTIVE_COMPANY_ID_KEY, TOKEN_KEY } from '@/constants/storageKeys';

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const companyId = localStorage.getItem(ACTIVE_COMPANY_ID_KEY);
  if (companyId) {
    config.headers['X-Company-Id'] = companyId;
  }
  return config;
});

export type ApiSuccess<T> = { success: true; data: T };
export type ApiErr = { success: false; statusCode: number; message?: string };

export function unwrap<T>(res: { data: ApiSuccess<T> | (T & { success?: boolean }) }): T {
  const d = res.data as ApiSuccess<T> & T;
  if (d && typeof d === 'object' && 'success' in d && d.success === true && 'data' in d) {
    return (d as ApiSuccess<T>).data;
  }
  return d as T;
}
