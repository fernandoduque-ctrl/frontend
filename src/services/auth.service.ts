import { api, unwrap } from './api';

export type LoginRes = {
  accessToken: string;
  user: { id: string; name: string; email: string; role: string; companyId?: string | null };
};

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return unwrap<LoginRes>(res);
}

export async function me() {
  const res = await api.get('/auth/me');
  return unwrap(res);
}
