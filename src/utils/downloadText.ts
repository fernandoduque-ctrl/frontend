import { ACTIVE_COMPANY_ID_KEY, TOKEN_KEY } from '@/constants/storageKeys';

/** Download de texto/arquivo sem passar pelo unwrap JSON do axios. */
export async function downloadAuthenticatedTextFile(
  path: string,
  filenameFallback: string,
): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);
  const companyId = localStorage.getItem(ACTIVE_COMPANY_ID_KEY);
  const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (companyId) headers['X-Company-Id'] = companyId;
  const res = await fetch(`${base.replace(/\/$/, '')}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`Download falhou (${res.status})`);
  }
  const blob = await res.blob();
  const dispo = res.headers.get('Content-Disposition');
  let name = filenameFallback;
  const m = /filename="?([^";]+)"?/i.exec(dispo || '');
  if (m) name = m[1];
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download de conteúdo já em memória (ex.: SVG do Mermaid). */
export function downloadBlobContent(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
