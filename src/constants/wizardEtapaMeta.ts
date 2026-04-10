export type WizardEtapaPasso = { path: string; label: string };

/** Metadados de UI por número da etapa (1–6), alinhados ao assistente. */
export const WIZARD_ETAPA_META: Record<
  number,
  { title: string; subtitle: string; eta: string; steps: WizardEtapaPasso[] }
> = {
  1: {
    title: 'Identificação e cadastro da empresa',
    subtitle: 'Matriz, filiais, documentos e identidade visual',
    eta: '10–15 min',
    steps: [
      { path: 'passo-1', label: 'Identificação do cliente' },
      { path: 'passo-2', label: 'Dados da matriz' },
      { path: 'passo-3', label: 'Estrutura de filiais' },
      { path: 'passo-4', label: 'Identidade visual' },
      { path: 'resumo', label: 'Resumo da etapa' },
    ],
  },
  2: {
    title: 'Estrutura operacional da folha',
    subtitle: 'Horários, centros de custo, bancos e departamentos',
    eta: '15–20 min',
    steps: [
      { path: 'passo-1', label: 'Entrada da etapa' },
      { path: 'passo-2', label: 'Relação de horários' },
      { path: 'passo-3', label: 'Centros de custo' },
      { path: 'passo-4', label: 'Bancos e agências' },
      { path: 'passo-5', label: 'Departamentos' },
      { path: 'resumo', label: 'Resumo da etapa' },
    ],
  },
  3: {
    title: 'Base histórica e trabalhadores',
    subtitle: 'Documentos e conferência de risco',
    eta: '20–30 min',
    steps: [
      { path: 'passo-1', label: 'Entrada' },
      { path: 'passo-2', label: 'Pensão e ofícios' },
      { path: 'passo-3', label: 'Folha últimos 3 meses' },
      { path: 'passo-4', label: 'Profissionais afastados' },
      { path: 'passo-5', label: 'Dependentes' },
      { path: 'passo-6', label: 'Fichas de registro' },
      { path: 'passo-7', label: 'Desoneração' },
      { path: 'passo-8', label: 'Férias' },
      { path: 'resumo', label: 'Resumo da etapa' },
    ],
  },
  4: {
    title: 'Parametrização de benefícios',
    subtitle: 'Tipos, regras, valores e fornecedores',
    eta: '20–30 min',
    steps: [
      { path: 'passo-1', label: 'Entrada' },
      { path: 'passo-2', label: 'Tipos de benefícios' },
      { path: 'passo-3', label: 'Cadastro do tipo' },
      { path: 'passo-4', label: 'Regras de cálculo' },
      { path: 'passo-5', label: 'Valores' },
      { path: 'passo-6', label: 'Fornecedor' },
      { path: 'passo-7', label: 'Regras específicas (VT)' },
      { path: 'passo-8', label: 'Confirmação' },
      { path: 'resumo', label: 'Resumo da etapa' },
    ],
  },
  5: {
    title: 'Rubricas e eventos',
    subtitle: 'Mapeamento para importações e folha',
    eta: '15–25 min',
    steps: [
      { path: 'passo-1', label: 'Lista e cadastro' },
      { path: 'passo-2', label: 'Incidências e regras' },
      { path: 'passo-3', label: 'Importação planilha' },
      { path: 'resumo', label: 'Resumo da etapa' },
    ],
  },
  6: {
    title: 'Importação histórica eSocial',
    subtitle: 'Staging, pré-visualização e confirmação',
    eta: '30–45 min',
    steps: [
      { path: 'passo-1', label: 'Entrada' },
      { path: 'passo-2', label: 'Certificado digital' },
      { path: 'passo-3', label: 'Período' },
      { path: 'passo-4', label: 'Eventos' },
      { path: 'passo-5', label: 'Processamento' },
      { path: 'passo-6', label: 'Pré-visualização' },
      { path: 'passo-7', label: 'Confirmação' },
      { path: 'passo-8', label: 'Status' },
    ],
  },
};

/** Segmento da rota do app (`#/wizard/etapa-N/...`). */
export function wizardEtapaPath(num: number) {
  return `etapa-${num}`;
}

/** Bases REST por domínio (espelham os `@Controller` Nest em `wizard-*`). */
export const WIZARD_DOMINIO_REST_PREFIX = {
  empresaCadastro: '/wizard/empresa-cadastro',
  folhaOperacional: '/wizard/folha-operacional',
  historicoTrabalhadores: '/wizard/historico-trabalhadores',
  beneficios: '/wizard/beneficios',
  rubricasEventos: '/wizard/rubricas-eventos',
  importacaoEsocial: '/wizard/importacao-esocial',
} as const;

/** React Query — payload principal da etapa empresa (GET domínio empresa-cadastro). */
export const QK_WIZARD_EMPRESA_CADASTRO = ['wizard', 'empresa-cadastro'] as const;

/** React Query — pré-requisitos da importação eSocial. */
export const QK_WIZARD_IMPORTACAO_ESOCIAL_ACCESS = ['wizard', 'importacao-esocial', 'access'] as const;

/** React Query — lista de etapas do assistente (`GET /wizard/etapas`). */
export const QK_WIZARD_ETAPAS_LISTA = ['wizard', 'etapas'] as const;

export function qkWizardEtapaProgresso(etapaNumero: number) {
  return ['wizard', 'etapa', etapaNumero, 'progresso'] as const;
}
