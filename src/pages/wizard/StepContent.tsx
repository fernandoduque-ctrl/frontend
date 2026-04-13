import { useQuery } from '@tanstack/react-query';
import { Form, Typography } from '@/ds';
import { api, unwrap } from '@/services/api';
import type { WizardEmpresaS1Payload, WizardImportacaoEsocialAccessPayload } from '@/types/apiResponses';
import {
  QK_WIZARD_EMPRESA_CADASTRO,
  QK_WIZARD_IMPORTACAO_ESOCIAL_ACCESS,
  WIZARD_DOMINIO_REST_PREFIX,
} from '@/constants/wizardEtapaMeta';
import { WizardBeneficios } from './WizardBeneficios';
import { WizardEmpresaCadastro } from './WizardEmpresaCadastro';
import { WizardFolhaOperacional } from './WizardFolhaOperacional';
import { WizardHistoricoTrabalhadores } from './WizardHistoricoTrabalhadores';
import { WizardImportacaoEsocial } from './WizardImportacaoEsocial';
import { WizardRubricasEventos } from './WizardRubricasEventos';

export function StepContent({ etapaNumero, slug }: { etapaNumero: number; slug: string }) {
  const [form] = Form.useForm();

  const { data: s1 } = useQuery({
    queryKey: QK_WIZARD_EMPRESA_CADASTRO,
    queryFn: async () =>
      unwrap<WizardEmpresaS1Payload>(await api.get(WIZARD_DOMINIO_REST_PREFIX.empresaCadastro)),
    enabled: etapaNumero === 1,
  });

  const { data: acessoImportacaoEsocial, isLoading: acessoImportacaoEsocialLoading } = useQuery({
    queryKey: QK_WIZARD_IMPORTACAO_ESOCIAL_ACCESS,
    queryFn: async () =>
      unwrap<WizardImportacaoEsocialAccessPayload>(
        await api.get(`${WIZARD_DOMINIO_REST_PREFIX.importacaoEsocial}/access`),
      ),
    enabled: etapaNumero === 6,
  });

  if (etapaNumero === 1) {
    return <WizardEmpresaCadastro slug={slug} s1={s1} form={form} />;
  }

  if (etapaNumero === 2) return <WizardFolhaOperacional slug={slug} />;
  if (etapaNumero === 3) return <WizardHistoricoTrabalhadores slug={slug} />;
  if (etapaNumero === 4) return <WizardBeneficios slug={slug} />;
  if (etapaNumero === 5) return <WizardRubricasEventos slug={slug} />;
  if (etapaNumero === 6) {
    return (
      <WizardImportacaoEsocial
        slug={slug}
        access={acessoImportacaoEsocial}
        accessLoading={acessoImportacaoEsocialLoading}
      />
    );
  }

  return (
    <Typography.Text type="secondary">
      Passo em construção: etapa {etapaNumero} / {slug}
    </Typography.Text>
  );
}
