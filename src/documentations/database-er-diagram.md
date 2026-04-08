# Diagrama do banco de dados (Prisma)

Gerado a partir de `backend/prisma/schema.prisma` (SQLite).  
Enums e domínios de string estão em `backend/src/common/prisma-enums.ts`.

## Visão geral — núcleo, usuários e arquivos

```mermaid
erDiagram
  Company ||--o| ContactPerson : "1:1"
  Company ||--o{ Branch : "filiais"
  Company ||--o{ User : "usuários cliente"
  Company ||--o{ UploadedFile : "anexos"
  Company ||--o{ CompanyLogo : "logos"

  User }o--o| Company : "companyId"
  User ||--o{ UploadedFile : "uploadedBy"
  User ||--o{ ESocialImportBatch : "requestedBy"
  User ||--o{ AuditLog : "ações"

  Branch }o--|| Company : "companyId"
  Branch ||--o{ CostCenter : "opcional"
  Branch ||--o{ CompanyLogo : "opcional"

  UploadedFile }o--o| Company : "companyId"
  UploadedFile }o--o| User : "uploadedById"
  UploadedFile ||--o{ CompanyLogo : "arquivo"
  UploadedFile ||--o{ HistoricalPayrollFile : "arquivo"
  UploadedFile ||--o{ EmployeeRegistryFile : "arquivo"
  UploadedFile ||--o{ BenefitSupplierLayoutFile : "arquivo"

  CompanyLogo }o--|| Company : "companyId"
  CompanyLogo }o--o| Branch : "branchId"
  CompanyLogo }o--|| UploadedFile : "uploadedFileId"
```

## Wizard e parametrização operacional

```mermaid
erDiagram
  Company ||--o{ WizardStage : "etapas 1–6"
  Company ||--o{ WizardStepProgress : "passos"
  Company ||--o{ WorkSchedule : "jornadas"
  Company ||--o{ CostCenter : "centros de custo"
  Company ||--o{ Department : "departamentos"
  Company ||--o{ EmployeePaymentBank : "bancos pagamento"

  WorkSchedule ||--o{ WorkScheduleWeekday : "dias"

  CostCenter }o--|| Company : "companyId"
  CostCenter }o--o| Branch : "branchId"
  Department }o--|| Company : "companyId"
  Department }o--o| CostCenter : "costCenterId"

  BankReference ||--o{ EmployeePaymentBank : "banco"
  EmployeePaymentBank }o--|| Company : "companyId"
  EmployeePaymentBank }o--|| BankReference : "bankReferenceId"
```

## Base histórica, benefícios e rubricas

```mermaid
erDiagram
  Company ||--o| PensionConfiguration : "1:1"
  Company ||--o{ HistoricalPayrollFile : "folhas"
  Company ||--o{ LeaveRecord : "afastamentos"
  Company ||--o{ DependentRecord : "dependentes"
  Company ||--o{ EmployeeRegistryFile : "registros"
  Company ||--o| TaxReliefConfiguration : "1:1"
  Company ||--o{ VacationRecord : "férias"
  Company ||--o{ Benefit : "benefícios"
  Company ||--o{ PayrollRubric : "rubricas"

  HistoricalPayrollFile }o--|| Company : "companyId"
  HistoricalPayrollFile }o--|| UploadedFile : "uploadedFileId"

  EmployeeRegistryFile }o--|| Company : "companyId"
  EmployeeRegistryFile }o--|| UploadedFile : "uploadedFileId"

  Benefit }o--|| Company : "companyId"
  Benefit ||--o{ BenefitSupplier : "fornecedores"

  BenefitSupplier }o--|| Benefit : "benefitId"
  BenefitSupplier ||--o{ BenefitSupplierLayoutFile : "layouts"

  BenefitSupplierLayoutFile }o--|| BenefitSupplier : "benefitSupplierId"
  BenefitSupplierLayoutFile }o--|| UploadedFile : "uploadedFileId"

  PayrollRubric }o--|| Company : "companyId"
  PayrollRubric }o--o| CostCenter : "defaultCostCenter"
  PayrollRubric }o--o| Department : "defaultDepartment"
```

## eSocial, auditoria e configuração global

```mermaid
erDiagram
  Company ||--o{ ESocialImportBatch : "lotes"
  Company ||--o{ AuditLog : "auditoria"

  ESocialImportBatch }o--|| Company : "companyId"
  ESocialImportBatch }o--o| User : "requestedById"
  ESocialImportBatch ||--o{ ESocialImportStageRecord : "staging"
  ESocialImportBatch ||--o{ ESocialImportAlert : "alertas"

  ESocialImportStageRecord }o--|| ESocialImportBatch : "batchId"
  ESocialImportAlert }o--|| ESocialImportBatch : "batchId"

  AuditLog }o--o| Company : "companyId"
  AuditLog }o--o| User : "userId"

  AppSettings {
    string id PK "default"
    string dataJson
  }
```

## Legenda

- `||--o{` — um (obrigatório) para muitos (opcional)
- `||--o|` — um para zero ou um
- `}o--||` — muitos para um (FK do lado “muitos”)

**Observação:** `PayrollRubric` referencia `CostCenter` e `Department` (relações `RubricDefaultCC` / `RubricDefaultDept` no Prisma); no terceiro diagrama, `UploadedFile`, `CostCenter` e `Department` são entidades definidas nos blocos anteriores.

---

*Última referência ao schema: modelos `User` … `AppSettings` em `backend/prisma/schema.prisma`.*
