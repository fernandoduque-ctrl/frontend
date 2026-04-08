import { ESOC_BATCH_KEY } from '@/constants/storageKeys';

export function getEsocialBatchId(): string | null {
  return localStorage.getItem(ESOC_BATCH_KEY) || sessionStorage.getItem(ESOC_BATCH_KEY);
}

export function setEsocialBatchId(id: string) {
  localStorage.setItem(ESOC_BATCH_KEY, id);
  sessionStorage.setItem(ESOC_BATCH_KEY, id);
}
