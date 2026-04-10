const PREFIX = 'folha_wizard_draft_s1_';

export function loadEmpresaCadastroDraft(slug: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(PREFIX + slug);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function saveEmpresaCadastroDraft(slug: string, values: Record<string, unknown>) {
  localStorage.setItem(PREFIX + slug, JSON.stringify(values));
}

export function clearEmpresaCadastroDraft(slug: string) {
  localStorage.removeItem(PREFIX + slug);
}
