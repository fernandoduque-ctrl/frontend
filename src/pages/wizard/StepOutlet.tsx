import { useOutletContext, useLocation } from 'react-router-dom';
import { StepContent } from './StepContent';

export function StepOutlet() {
  const { etapaNumero } = useOutletContext<{ etapaNumero: number }>();
  const loc = useLocation();
  const slug = loc.pathname.split('/').pop() || 'passo-1';
  return <StepContent etapaNumero={etapaNumero} slug={slug} />;
}
