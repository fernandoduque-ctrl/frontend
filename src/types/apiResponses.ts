/**
 * Formas de corpo JSON retornadas por unwrap(api.*) no MVP.
 * Mantidas explícitas para o TypeScript inferir useQuery/useMutation corretamente.
 */

export type DashboardSummary = {
  company?: {
    clientDisplayName?: string | null;
    legalName?: string | null;
    onboardingStatus?: string | null;
    taxId?: string | null;
    contactPerson?: { name?: string; cpf?: string | null };
    branches?: { id: string; name: string; taxId?: string | null }[];
  } | null;
  onboardingPercent: number;
  stages: {
    stageNumber: number;
    title: string;
    status: string;
    stepProgress: number;
    updatedAt: Date | string;
  }[];
  pendencias: string[];
  recentUploads: { originalName: string; category: string }[];
  auditTimeline?: unknown[];
  blockedStages?: number[];
};

export type EsocialStagingRow = {
  id: string;
  recordType: string;
  externalId: string;
  payloadJson?: string;
};

export type EsocialBatchPreviewPayload = {
  counts?: { trabalhadores: number; remuneracoes: number; feriasAfastamentos: number };
  tabs?: {
    trabalhadores: EsocialStagingRow[];
    remuneracoes: EsocialStagingRow[];
    feriasAfastamentos: EsocialStagingRow[];
  };
};

export type EsocialBatchDetailPayload = {
  status: string;
};

export type EsocialAlertItem = {
  id: string;
  severity: string;
  title: string;
  description?: string;
};

export type WizardEtapaListItem = {
  stageNumber: number;
  status: string;
  title?: string;
  stepProgress?: number;
  updatedAt?: string;
};

export type WizardEtapaDetalhePayload = {
  steps?: { stepNumber: number; title: string; status: string }[];
};

export type WizardEmpresaS1Company = {
  clientDisplayName?: string;
  legalName?: string | null;
  taxId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  hasBranches?: boolean;
  hasDifferentBranchLogos?: boolean;
  contactPerson?: { name?: string; cpf?: string | null };
  branches?: { id: string; name: string; taxId?: string | null }[];
};

export type WizardEmpresaS1Payload = {
  company?: WizardEmpresaS1Company;
};

export type WizardEmpresaEtapa1SummaryPayload = {
  checklist?: Record<string, boolean>;
  company?: unknown;
};

export type WizardHistoricoTrabalhadoresSummaryPayload = {
  checklist?: Record<string, boolean>;
  counts?: {
    historicalPayrollFiles: number;
    leaves: number;
    dependents: number;
    registry: number;
    vacations: number;
  };
};

export type LeaveRecordDto = {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  expectedReturnDate?: string | null;
};

export type DependentRecordDto = {
  id: string;
  dependentName: string;
  cpf?: string;
  dependencyType: string;
};

export type VacationRecordDto = {
  id: string;
  employeeName: string;
  accrualStartDate: string;
  accrualEndDate: string;
  takenDays?: number;
  pendingDays?: number;
};

export type CostCenterListItem = {
  id: string;
  code: string;
  name: string;
  branch?: { name?: string };
};

export type BankReferenceItem = { id: string; code: string; name: string };

export type EmployeePaymentBankItem = {
  id: string;
  agency: string;
  accountType: string;
  bankReference?: { name: string; code: string };
};

export type DepartmentListItem = {
  id: string;
  code: string;
  name: string;
  costCenter?: { code: string };
};

export type BenefitSupplierListItem = {
  id: string;
  name: string;
  taxId?: string;
  isPrimary?: boolean;
  benefit?: { internalName?: string };
};

export type WizardImportacaoEsocialAccessPayload = {
  allowed?: boolean;
  reasons?: string[];
};

export type ImportCsvMutationResult = {
  errors?: string[];
};
