import { api, unwrap } from '@/services/api';

export async function uploadBlob(file: File, category: string) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post(`/uploads?category=${category}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(res) as { id: string };
}
