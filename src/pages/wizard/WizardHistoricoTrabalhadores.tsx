import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Typography,
  Upload,
  App,
} from '@/ds';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import { FieldHelp } from '@/components/wizard/FieldHelp';
import { WIZARD_DOMINIO_REST_PREFIX } from '@/constants/wizardEtapaMeta';
import { api, unwrap } from '@/services/api';
import type {
  DependentRecordDto,
  LeaveRecordDto,
  VacationRecordDto,
  WizardHistoricoTrabalhadoresSummaryPayload,
} from '@/types/apiResponses';
import { slugToBackendStepNumber } from '@/utils/wizardSteps';
import { isValidCpf, maskCpf, onlyDigits } from '@/utils/brForm';
import { uploadBlob } from './uploadBlob';

const DEPENDENCY_TYPE_OPTIONS = [
  { value: 'FILHO_FILHA', label: 'Filho(a)' },
  { value: 'CONJUGE', label: 'Cônjuge / companheiro(a)' },
  { value: 'ENTEADO', label: 'Enteado(a)' },
  { value: 'PAI_MAE', label: 'Pai / mãe' },
  { value: 'IRMAO', label: 'Irmão(ã)' },
  { value: 'OUTRO', label: 'Outro (especificar observação)' },
];

/** Alinhado ao checklist final do documento (chaves = GET .../historico-trabalhadores/summary). */
const HISTORICO_TRABALHADORES_CHECKLIST_LABELS: Record<string, string> = {
  pension: 'Pensionistas validados',
  historicalThreeMonths: 'Histórico de folha conferido (3 competências)',
  leavesMapped: 'Afastamentos mapeados',
  dependents: 'Dependentes validados',
  registry: 'Fichas de registro analisadas',
  taxRelief: 'Desoneração informada (se aplicável)',
  vacations: 'Férias conferidas',
};

export function WizardHistoricoTrabalhadores({ slug }: { slug: string }) {
  const { message } = App.useApp();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [pension, setPension] = useState<boolean | null>(null);
  const [hasLeavesToReport, setHasLeavesToReport] = useState<boolean | null>(null);
  const [hasDepsToReport, setHasDepsToReport] = useState<boolean | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [depOpen, setDepOpen] = useState(false);
  const [vacOpen, setVacOpen] = useState(false);
  const [leaveForm] = Form.useForm();
  const [depForm] = Form.useForm();
  const [vacForm] = Form.useForm();
  const [taxReliefForm] = Form.useForm();

  const { data: s3 } = useQuery({
    queryKey: ['wizard', 'historico-trabalhadores', 'summary'],
    queryFn: async () =>
      unwrap<WizardHistoricoTrabalhadoresSummaryPayload>(
        await api.get(`${WIZARD_DOMINIO_REST_PREFIX.historicoTrabalhadores}/summary`),
      ),
    enabled: slug === 'resumo' || slug === 'passo-1',
  });

  const { data: leaves } = useQuery({
    queryKey: ['leave-records'],
    queryFn: async () => unwrap<LeaveRecordDto[]>(await api.get('/leave-records')),
    enabled: ['passo-4', 'resumo', 'passo-1'].includes(slug),
  });
  const { data: dependents } = useQuery({
    queryKey: ['dependent-records'],
    queryFn: async () => unwrap<DependentRecordDto[]>(await api.get('/dependent-records')),
    enabled: ['passo-5', 'resumo', 'passo-1'].includes(slug),
  });
  const { data: vacations } = useQuery({
    queryKey: ['vacation-records'],
    queryFn: async () => unwrap<VacationRecordDto[]>(await api.get('/vacation-records')),
    enabled: ['passo-8', 'resumo', 'passo-1'].includes(slug),
  });

  const tryComplete = async () => {
    const n = slugToBackendStepNumber(3, slug);
    if (!n) return;
    try {
      await api.post(`/wizard/passos/3/${n}/complete`, {});
    } catch {
      /* seed antigo */
    }
  };

  if (slug === 'passo-1') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card
          title="Etapa 3 — Validação de base histórica"
          extra={
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Depende das etapas 1 e 2 aprovadas · ~20–30 min
            </Typography.Text>
          }
        >
          <Typography.Paragraph>
            Envie os relatórios solicitados para conferência. O sistema cruza documentos e regras para reduzir riscos
            antes do processamento da folha.
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary">Esta etapa cobre, entre outros:</Typography.Paragraph>
          <ul style={{ marginTop: 0 }}>
            <li>Trabalhadores (ativos/inativos) e dependentes</li>
            <li>Afastamentos e férias</li>
            <li>Eventos recorrentes (pensão, desoneração etc.)</li>
            <li>Folhas recentes para conferência (não importação direta automática)</li>
          </ul>
          <Button type="primary" size="large" onClick={() => nav('/wizard/etapa-3/passo-2')}>
            ➡️ Iniciar etapa 3
          </Button>
        </Card>
        <Alert
          type="info"
          showIcon
          message="Visão geral da etapa"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Dependências: Etapa 1 (empresa) e Etapa 2 (estrutura da folha) aprovadas;</li>
              <li>Tempo estimado: 20–30 minutos · upload guiado + validações no servidor;</li>
              <li>Validação: regras automáticas + consultor nas pendências finais.</li>
            </ul>
          }
        />
        {s3?.checklist && (
          <Card size="small" title="Checklist (referência)">
            <ul>
              {Object.entries(s3.checklist as Record<string, boolean>).map(([k, v]) => (
                <li key={k}>
                  {HISTORICO_TRABALHADORES_CHECKLIST_LABELS[k] || k}: {v ? '✔' : '—'}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Space>
    );
  }
  if (slug === 'passo-2') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Card size="small" title="Pensão alimentícia e ofícios">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Se houver pensão ativa, inclua valor, percentual, beneficiário, competências com desconto e forma de
            desconto na documentação enviada.
          </Typography.Paragraph>
        </Card>
        <Typography.Text>
          <FieldHelp
            title="Sua empresa possui pensão alimentícia ativa?"
            help="Se não, o item pode ser concluído sem uploads. Se sim, anexe lista de pensionistas e ofícios judiciais."
          />
        </Typography.Text>
        <Radio.Group onChange={(e) => setPension(e.target.value)} value={pension ?? undefined}>
          <Radio value={true}>Sim</Radio>
          <Radio value={false}>Não</Radio>
        </Radio.Group>
        {pension === true && (
          <Space wrap>
            <Upload
              beforeUpload={async (file) => {
                await uploadBlob(file, 'PENSION_LIST');
                message.success('Lista de pensionistas enviada');
                return false;
              }}
            >
              <Button>Relação de pensionistas</Button>
            </Upload>
            <Upload
              beforeUpload={async (file) => {
                await uploadBlob(file, 'COURT_ORDERS');
                message.success('Ofício enviado');
                return false;
              }}
            >
              <Button>Ofícios judiciais</Button>
            </Upload>
          </Space>
        )}
        <Button
          type="primary"
          disabled={pension === null}
          onClick={async () => {
            await api.put(`${WIZARD_DOMINIO_REST_PREFIX.historicoTrabalhadores}/pension-config`, {
              hasActivePension: pension === true,
            });
            message.success('Salvo');
            await tryComplete();
            if (pension === false) {
              message.info('Sem pensão ativa — passo marcado como concluído.');
            }
          }}
        >
          Salvar pensão
        </Button>
      </Space>
    );
  }
  if (slug === 'passo-3') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Card size="small" title="Histórico de folha — últimos 3 meses">
          <Typography.Paragraph>
            Envie <strong>um arquivo por competência</strong>. O sistema usa esses dados como base de{' '}
            <strong>conferência</strong>, não como importação automática direta para a folha.
          </Typography.Paragraph>
          <Alert
            type="info"
            showIcon
            message="Validações (quando disponíveis no backend)"
            description="Competência, totais de proventos/descontos e alertas de divergência com a estrutura atual cadastrada na etapa 2."
          />
        </Card>
        <Upload
          beforeUpload={async (file) => {
            const comp = prompt('Competência (AAAA-MM)?');
            if (!comp) return false;
            const up = await uploadBlob(file, 'HISTORICAL_PAYROLL');
            await api.post(`${WIZARD_DOMINIO_REST_PREFIX.historicoTrabalhadores}/historical-payroll-files`, {
              competence: comp,
              uploadedFileId: up.id,
            });
            message.success('Registrado');
            await tryComplete();
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>Anexar folha</Button>
        </Upload>
      </Space>
    );
  }
  if (slug === 'passo-4') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Card size="small" title="Profissionais afastados">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Em caso positivo, a relação deve conter nome, tipo de afastamento, início e previsão de retorno. Exemplos:
            INSS, licença-maternidade, acidente de trabalho.
          </Typography.Paragraph>
        </Card>
        <Typography.Paragraph>Existem colaboradores afastados atualmente ou nos últimos meses?</Typography.Paragraph>
        <Radio.Group
          onChange={(e) => setHasLeavesToReport(e.target.value)}
          value={hasLeavesToReport ?? undefined}
        >
          <Radio value={true}>Sim</Radio>
          <Radio value={false}>Não</Radio>
        </Radio.Group>
        {hasLeavesToReport === false && (
          <Button
            type="primary"
            onClick={async () => {
              await tryComplete();
              message.success('Passo registrado sem afastamentos.');
            }}
          >
            Confirmar — sem afastamentos a relatar
          </Button>
        )}
        {hasLeavesToReport === true && (
          <>
            <Typography.Paragraph type="secondary">
              Você pode registrar um a um abaixo ou anexar planilha/PDF com a relação (opcional).
            </Typography.Paragraph>
            <Upload
              beforeUpload={async (file) => {
                await uploadBlob(file, 'LEAVE_RECORDS');
                message.success('Arquivo de afastamentos arquivado');
                await tryComplete();
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>Anexar relação de afastamentos</Button>
            </Upload>
            <Button type="primary" onClick={() => setLeaveOpen(true)}>
              Registrar afastamento
            </Button>
            <Table
              size="small"
              rowKey="id"
              dataSource={leaves || []}
              columns={[
                { title: 'Colaborador', dataIndex: 'employeeName' },
                { title: 'Tipo', dataIndex: 'leaveType' },
                {
                  title: 'Início',
                  dataIndex: 'startDate',
                  render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
                },
                {
                  title: 'Retorno prev.',
                  dataIndex: 'expectedReturnDate',
                  render: (d: string | null) => (d ? dayjs(d).format('DD/MM/YYYY') : '—'),
                },
              ]}
            />
          </>
        )}
        <Modal title="Afastamento" open={leaveOpen} onCancel={() => setLeaveOpen(false)} footer={null}>
          <Form
            form={leaveForm}
            layout="vertical"
            onFinish={async (v) => {
              await api.post('/leave-records', {
                employeeName: v.employeeName,
                leaveType: v.leaveType,
                startDate: dayjs(v.startDate as never).toISOString(),
                expectedReturnDate: v.expectedReturnDate
                  ? dayjs(v.expectedReturnDate as never).toISOString()
                  : undefined,
              });
              message.success('Registrado');
              setLeaveOpen(false);
              leaveForm.resetFields();
              qc.invalidateQueries({ queryKey: ['leave-records'] });
              await tryComplete();
            }}
          >
            <Form.Item name="employeeName" label="Nome" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="leaveType" label="Tipo" rules={[{ required: true }]}>
              <Input placeholder="Ex.: INSS, acidente" />
            </Form.Item>
            <Form.Item name="startDate" label="Início" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="expectedReturnDate" label="Retorno previsto">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Salvar
            </Button>
          </Form>
        </Modal>
      </Space>
    );
  }
  if (slug === 'passo-5') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Card size="small" title="Dependentes">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Informe nome, CPF, tipo de dependência aceito para IRRF, nome da mãe e data de nascimento. O CPF é validado
            com dígito verificador.
          </Typography.Paragraph>
        </Card>
        <Typography.Paragraph>
          Há dependentes para IRRF ou benefícios a cadastrar nesta etapa?
        </Typography.Paragraph>
        <Radio.Group
          onChange={(e) => setHasDepsToReport(e.target.value)}
          value={hasDepsToReport ?? undefined}
        >
          <Radio value={true}>Sim</Radio>
          <Radio value={false}>Não</Radio>
        </Radio.Group>
        {hasDepsToReport === false && (
          <Button
            type="primary"
            onClick={async () => {
              await tryComplete();
              message.success('Passo registrado sem dependentes.');
            }}
          >
            Confirmar — sem dependentes a relatar
          </Button>
        )}
        {hasDepsToReport === true && (
          <>
            <Alert
              type="info"
              showIcon
              message="Cadastro ou upload"
              description="O documento pede relação com nome, CPF, tipo de dependência (IRRF), nome da mãe e nascimento. Cadastre linha a linha ou anexe planilha/PDF — o consultor cruza com as regras de validação."
            />
            <Space wrap>
              <Button type="primary" onClick={() => setDepOpen(true)}>
                + Adicionar dependente
              </Button>
              <Upload
                accept="application/pdf,.pdf,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,.xls"
                beforeUpload={async (file) => {
                  await uploadBlob(file, 'DEPENDENTS');
                  message.success('Arquivo de dependentes anexado');
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>Anexar planilha / PDF de dependentes</Button>
              </Upload>
            </Space>
            <Table
              size="small"
              rowKey="id"
              dataSource={dependents || []}
              columns={[
                { title: 'Nome', dataIndex: 'dependentName' },
                { title: 'CPF', dataIndex: 'cpf' },
                { title: 'Tipo', dataIndex: 'dependencyType' },
              ]}
            />
          </>
        )}
        <Modal title="Dependente" open={depOpen} onCancel={() => setDepOpen(false)} footer={null}>
          <Form
            form={depForm}
            layout="vertical"
            onFinish={async (v) => {
              await api.post('/dependent-records', {
                dependentName: v.dependentName,
                cpf: v.cpf ? onlyDigits(String(v.cpf)) : undefined,
                dependencyType: v.dependencyType,
                motherName: v.motherName || undefined,
                birthDate: v.birthDate ? dayjs(v.birthDate as never).format('YYYY-MM-DD') : undefined,
              });
              message.success('Salvo');
              setDepOpen(false);
              depForm.resetFields();
              qc.invalidateQueries({ queryKey: ['dependent-records'] });
              await tryComplete();
            }}
          >
            <Form.Item name="dependentName" label="Nome" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="cpf"
              label="CPF"
              rules={[
                {
                  validator: (_: unknown, v: string) => {
                    const d = onlyDigits(String(v || ''));
                    if (!d) return Promise.resolve();
                    return isValidCpf(d)
                      ? Promise.resolve()
                      : Promise.reject(new Error('CPF inválido'));
                  },
                },
              ]}
              getValueFromEvent={(e) => maskCpf(e.target.value)}
            >
              <Input placeholder="000.000.000-00" maxLength={14} />
            </Form.Item>
            <Form.Item
              name="dependencyType"
              label={
                <FieldHelp
                  title="Tipo de dependência"
                  help="Escolha a categoria para fins de IRRF e benefícios. Use “Outro” quando precisar detalhar fora da lista."
                />
              }
              rules={[{ required: true, message: 'Selecione o tipo' }]}
            >
              <Select options={DEPENDENCY_TYPE_OPTIONS} placeholder="Tipo para IRRF / benefícios" />
            </Form.Item>
            <Form.Item name="motherName" label="Nome da mãe">
              <Input />
            </Form.Item>
            <Form.Item name="birthDate" label="Data de nascimento">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Salvar
            </Button>
          </Form>
        </Modal>
      </Space>
    );
  }
  if (slug === 'passo-6') {
    return (
      <Space direction="vertical" size="middle">
        <Card size="small" title="Fichas de registro dos profissionais">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Fichas cadastrais dos profissionais ativos para conferência de dados contratuais e vínculo com horários,
            centros de custo e departamentos criados na etapa 2.
          </Typography.Paragraph>
        </Card>
        <Upload
          beforeUpload={async (file) => {
            const up = await uploadBlob(file, 'EMPLOYEE_REGISTRY');
            await api.post(`${WIZARD_DOMINIO_REST_PREFIX.historicoTrabalhadores}/employee-registry-files`, {
              uploadedFileId: up.id,
            });
            message.success('Ficha registrada');
            await tryComplete();
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>Enviar ficha</Button>
        </Upload>
      </Space>
    );
  }
  if (slug === 'passo-7') {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          type="warning"
          showIcon
          message="Desoneração da folha"
          description="Aplicação incorreta pode gerar passivo fiscal. Se sim, anexe comprovantes (PGDAS, decisão, etc.)."
        />
        <Form
          form={taxReliefForm}
          layout="vertical"
          onFinish={async (v) => {
            await api.put(`${WIZARD_DOMINIO_REST_PREFIX.historicoTrabalhadores}/tax-relief`, {
              hasTaxRelief: v.hasTaxRelief,
              notes: v.notes || undefined,
            });
            message.success('Salvo');
            await tryComplete();
          }}
        >
          <Form.Item name="hasTaxRelief" label="Empresa em desoneração da folha?" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={true}>Sim</Radio>
              <Radio value={false}>Não</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="notes" label="Observações">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.hasTaxRelief !== cur.hasTaxRelief}>
            {() =>
              taxReliefForm.getFieldValue('hasTaxRelief') === true ? (
                <Form.Item label="Documentos comprobatórios (PDF/imagem)">
                  <Upload
                    multiple
                    beforeUpload={async (file) => {
                      await uploadBlob(file, 'TAX_RELIEF');
                      message.success('Documento anexado');
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Anexar arquivo</Button>
                  </Upload>
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Salvar
          </Button>
        </Form>
      </Space>
    );
  }
  if (slug === 'passo-8') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Card size="small" title="Férias e períodos aquisitivos">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Registre colaborador, início e fim do período aquisitivo, férias gozadas e pendentes. Prazos legais e
            alertas de vencimento podem ser aprimorados no backend em versões futuras.
          </Typography.Paragraph>
        </Card>
        <Alert
          type="info"
          showIcon
          message="Conferência"
          description="Use este passo para mapear a situação atual; integrações com cálculo automático de férias evoluem após a base eSocial."
        />
        <Button type="primary" onClick={() => setVacOpen(true)}>
          Lançar férias (período aquisitivo)
        </Button>
        <Table
          size="small"
          rowKey="id"
          dataSource={vacations || []}
          columns={[
            { title: 'Colaborador', dataIndex: 'employeeName' },
            {
              title: 'Aquisitivo',
              render: (_: unknown, r: { accrualStartDate: string; accrualEndDate: string }) =>
                `${dayjs(r.accrualStartDate).format('DD/MM/YY')} — ${dayjs(r.accrualEndDate).format('DD/MM/YY')}`,
            },
            { title: 'Gozadas', dataIndex: 'takenDays' },
            { title: 'Pendentes', dataIndex: 'pendingDays' },
          ]}
        />
        <Modal title="Férias" open={vacOpen} onCancel={() => setVacOpen(false)} footer={null}>
          <Form
            form={vacForm}
            layout="vertical"
            onFinish={async (v) => {
              await api.post('/vacation-records', {
                employeeName: v.employeeName,
                accrualStartDate: dayjs(v.accrualStartDate as never).format('YYYY-MM-DD'),
                accrualEndDate: dayjs(v.accrualEndDate as never).format('YYYY-MM-DD'),
                takenDays: Number(v.takenDays) || 0,
                pendingDays: Number(v.pendingDays) || 0,
              });
              message.success('Salvo');
              setVacOpen(false);
              vacForm.resetFields();
              qc.invalidateQueries({ queryKey: ['vacation-records'] });
              await tryComplete();
            }}
          >
            <Form.Item name="employeeName" label="Colaborador" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="accrualStartDate" label="Início aquisitivo" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="accrualEndDate" label="Fim aquisitivo" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="takenDays" label="Dias gozados" initialValue={0}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="pendingDays" label="Dias pendentes" initialValue={0}>
              <Input type="number" />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Salvar
            </Button>
          </Form>
        </Modal>
      </Space>
    );
  }
  if (slug === 'resumo') {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Card size="small" title="Evolução em relação ao formulário em papel / e-mail">
          <Table
            size="small"
            pagination={false}
            rowKey="key"
            columns={[
              { title: 'Formulário tradicional', dataIndex: 'form' },
              { title: 'Wizard Folha Digital', dataIndex: 'wizard' },
            ]}
            dataSource={[
              { key: '1', form: 'Upload sem contexto', wizard: 'Upload guiado com explicação por passo' },
              { key: '2', form: 'Validação manual concentrada', wizard: 'Validações automáticas + consultor no fechamento' },
              { key: '3', form: 'Alto retrabalho', wizard: 'Conferência focada com checklist' },
              { key: '4', form: 'Risco oculto', wizard: 'Alertas preventivos onde aplicável' },
            ]}
          />
        </Card>
        <Typography.Title level={5}>Checklist final</Typography.Title>
        {s3?.checklist && (
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {Object.entries(s3.checklist as Record<string, boolean>).map(([k, v]) => (
              <li key={k}>
                {v ? '✔' : '—'} {HISTORICO_TRABALHADORES_CHECKLIST_LABELS[k] || k}
              </li>
            ))}
          </ul>
        )}
        {s3?.counts && (
          <Typography.Paragraph type="secondary">
            Resumo numérico — Folhas hist.: {s3.counts.historicalPayrollFiles} · Afastamentos: {s3.counts.leaves} ·
            Dependentes: {s3.counts.dependents} · Fichas: {s3.counts.registry} · Férias: {s3.counts.vacations}
          </Typography.Paragraph>
        )}
        <Alert
          type="warning"
          showIcon
          message="Status final: aguardando validação consultiva"
          description="Após aprovação, a folha poderá ser liberada para processamento. Em cenários sem necessidade histórica extensa, admissões e encargos seguem conforme política da conta."
        />
        <Alert
          type="info"
          showIcon
          message="Resultado técnico após aprovação"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Comparativo futuro entre base histórica conferida e dados pós-importação (eSocial);</li>
              <li>Menor risco trabalhista e fiscal com documentação organizada e alertas preventivos;</li>
              <li>Base pronta para admissões, folha e obrigações acessórias nas etapas seguintes.</li>
            </ul>
          }
        />
        <Space wrap>
          <Button onClick={() => nav('/wizard/etapa-3/passo-2')}>Corrigir documentos — pensão</Button>
          <Button onClick={() => nav('/wizard/etapa-3/passo-3')}>Corrigir — folhas</Button>
          <Button onClick={() => nav('/wizard/etapa-3/passo-4')}>Corrigir — afastamentos</Button>
        </Space>
        <Space wrap>
          <Button
            type="primary"
            onClick={() =>
              api.post('/wizard/etapas/3/submit', {}).then(() => {
                message.success('Enviado para validação');
                qc.invalidateQueries();
              })
            }
          >
            📤 Enviar etapa 3 para validação
          </Button>
          <Button onClick={() => nav('/wizard/etapa-4')}>⏭️ Avançar para etapa 4</Button>
        </Space>
      </Space>
    );
  }
  return (
    <Typography.Paragraph type="secondary">
      Passo {slug} não mapeado na interface — use as APIs documentadas.
    </Typography.Paragraph>
  );
}
