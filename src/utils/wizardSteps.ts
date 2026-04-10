import { WIZARD_ETAPA_META } from '@/constants/wizardEtapaMeta';

/** Alinha slug da URL ao `stepNumber` do backend (seed WizardStepProgress). */
export function slugToBackendStepNumber(etapaNumero: number, slug: string): number | null {
  const meta = WIZARD_ETAPA_META[etapaNumero];
  if (!meta) return null;
  if (slug === 'resumo') return meta.steps.length;
  const m = /^passo-(\d+)$/.exec(slug);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n < 1 || n > meta.steps.length) return null;
  return n;
}
