import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  App,
} from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FieldHelp } from '@/components/wizard/FieldHelp';
import {
  QK_WIZARD_EMPRESA_CADASTRO,
  WIZARD_DOMINIO_REST_PREFIX,
  qkWizardEtapaProgresso,
} from '@/constants/wizardEtapaMeta';
import { api, unwrap } from '@/services/api';
import { slugToBackendStepNumber } from '@/utils/wizardSteps';
import { isReasonableBankAgency } from '@/utils/brForm';
import { workScheduleLegalHints } from '@/utils/workScheduleHints';

const WEEKDAY_OPTS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

type WsRow = {
  id: string;
  name: string;
  journeyType: string;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number;
  weekdays?: { weekday: number }[];
};

function wizardStatusTag(status: string | undefined): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    NOT_STARTED: { label: 'Não iniciada', color: 'default' },
    IN_PROGRESS: { label: 'Em andamento', color: 'processing' },
    PENDING_VALIDATION: { label: 'Em validação', color: 'warning' },
    APPROVED: { label: 'Aprovada', color: 'success' },
    REJECTED: { label: 'Reprovada', color: 'error' },
    BLOCKED: { label: 'Bloqueada', color: 'error' },
  };
  return map[status || ''] || { label: status || '—', color: 'default' };
}

export function WizardFolhaOperacional({ slug }: { slug: string }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const nav = useNavigate();
  const etapaFolhaOperacionalNumero = 2;
  const [wsOpen, setWsOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [epbOpen, setEpbOpen] = useState(false);
  const [wsCsv, setWsCsv] = useState('');
  const [ccCsv, setCcCsv] = useState('');
  const [wsEntryMode, setWsEntryMode] = useState<'manual' | 'import'>('manual');
  const [ccEntryMode, setCcEntryMode] = useState<'manual' | 'import'>('manual');
  const [wsForm] = Form.useForm();
  const [ccForm] = Form.useForm();
  const [deptForm] = Form.useForm();
  const [epbForm] = Form.useForm();

  const { data: etapaProgressoResposta } = useQuery({
    queryKey: qkWizardEtapaProgresso(etapaFolhaOperacionalNumero),
    queryFn: async () => unwrap(await api.get(`/wizard/etapas/${etapaFolhaOperacionalNumero}`)),
  });

  const { data: dash } = useQuery({
    queryKey: ['dash'],
    queryFn: async () => unwrap(await api.get('/dashboard/summary')),
    enabled: slug === 'passo-1' || slug === 'resumo',
  });

  const { data: w1 } = useQuery({
    queryKey: QK_WIZARD_EMPRESA_CADASTRO,
    queryFn: async () => unwrap(await api.get(WIZARD_DOMINIO_REST_PREFIX.empresaCadastro)),
    enabled: slug === 'passo-3',
  });

  const { data: ws } = useQuery({
    queryKey: ['ws'],
    queryFn: async () => unwrap(await api.get('/work-schedules')) as WsRow[],
    enabled: slug === 'passo-2' || slug === 'passo-1' || slug === 'resumo',
  });
  const { data: cc } = useQuery({
    queryKey: ['cc'],
    queryFn: async () => unwrap(await api.get('/cost-centers')),
    enabled: slug === 'passo-3' || slug === 'passo-1' || slug === 'resumo',
  });
  const { data: banks } = useQuery({
    queryKey: ['banks'],
    queryFn: async () => unwrap(await api.get('/banks')),
    enabled: slug === 'passo-4' || slug === 'resumo',
  });
  const { data: epb } = useQuery({
    queryKey: ['epb'],
    queryFn: async () => unwrap(await api.get('/employee-payment-banks')),
    enabled: slug === 'passo-4' || slug === 'resumo',
  });
  const { data: dept } = useQuery({
    queryKey: ['dept'],
    queryFn: async () => unwrap(await api.get('/departments')),
    enabled: slug === 'passo-5' || slug === 'resumo',
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['ws'] });
    qc.invalidateQueries({ queryKey: ['cc'] });
    qc.invalidateQueries({ queryKey: ['epb'] });
    qc.invalidateQueries({ queryKey: ['dept'] });
  };

  const completeStep = async () => {
    const n = slugToBackendStepNumber(etapaFolhaOperacionalNumero, slug);
    if (!n) return;
    try {
      await api.post(`/wizard/passos/${etapaFolhaOperacionalNumero}/${n}/complete`, {});
    } catch {
      /* opcional se seed antigo */
    }
  };

  const mWs = useMutation({
    mutationFn: async (v: Record<string, unknown>) => {
      const body = {
        name: v.name as string,
        journeyType: v.journeyType as string,
        startTime: v.startTime as string | undefined,
        endTime: v.endTime as string | undefined,
        breakMinutes: (v.breakMinutes as number) ?? 0,
        weekdays: (v.weekdays as number[]) || [1, 2, 3, 4, 5],
      };
      return unwrap(await api.post('/work-schedules', body));
    },
    onSuccess: async () => {
      message.success('Horário criado');
      setWsOpen(false);
      wsForm.resetFields();
      invalidateAll();
      await completeStep();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      message.error(e.response?.data?.message || 'Erro ao criar horário'),
  });

  const mWsCsv = useMutation({
    mutationFn: async () => unwrap(await api.post('/work-schedules/import-csv', { csv: wsCsv })),
    onSuccess: (r: { errors?: string[] }) => {
      message.success('Importação concluída');
      if (r?.errors?.length) message.warning(`${r.errors.length} linha(s) com aviso — veja resposta na rede`);
      setWsCsv('');
      invalidateAll();
    },
    onError: (e: { response?: { data?: { message?: string; errors?: string[] } } }) => {
      const err = e.response?.data;
      message.error(err?.message || 'Falha na importação');
      if (err?.errors?.length) console.warn(err.errors);
    },
  });

  const mCc = useMutation({
    mutationFn: async (v: { code: string; name: string; branchId?: string }) =>
      unwrap(await api.post('/cost-centers', { ...v, active: true })),
    onSuccess: async () => {
      message.success('Centro de custo criado');
      setCcOpen(false);
      ccForm.resetFields();
      invalidateAll();
      await completeStep();
    },
  });

  const mCcCsv = useMutation({
    mutationFn: async () => unwrap(await api.post('/cost-centers/import-csv', { csv: ccCsv })),
    onSuccess: (r: { errors?: string[] }) => {
      message.success('CC importados');
      if (r?.errors?.length) message.warning(`${r.errors.length} linha(s) com aviso`);
      setCcCsv('');
      invalidateAll();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      message.error(e.response?.data?.message || 'Falha'),
  });

  const mDept = useMutation({
    mutationFn: async (v: { code: string; name: string; costCenterId?: string }) =>
      unwrap(await api.post('/departments', { ...v, active: true })),
    onSuccess: async () => {
      message.success('Departamento criado');
      setDeptOpen(false);
      deptForm.resetFields();
      invalidateAll();
      await completeStep();
    },
  });

  const mEpb = useMutation({
    mutationFn: async (v: {
      bankReferenceId: string;
      agency: string;
      agencyDigit?: string;
      accountType: string;
    }) => unwrap(await api.post('/employee-payment-banks', v)),
    onSuccess: async () => {
      message.success('Banco de pagamento cadastrado');
      setEpbOpen(false);
      epbForm.resetFields();
      invalidateAll();
      await completeStep();
    },
  });

  const submit = useMutation({
    mutationFn: () => api.post('/wizard/etapas/2/submit', {}).then((r) => unwrap(r)),
    onSuccess: () => message.success('Etapa 2 enviada'),
  });

  const delWs = useMutation({
    mutationFn: (id: string) => api.delete(`/work-schedules/${id}`).then((r) => unwrap(r)),
    onSuccess: () => {
      message.success('Removido');
      invalidateAll();
    },
  });

  const steps = (etapaProgressoResposta as { steps?: { stepNumber: number; title: string; status: string }[] })
    ?.steps;

  if (slug === 'passo-1') {
    const etapaEmpresa = dash?.stages?.find((x: { stageNumber: number }) => x.stageNumber === 1);
    const etapaFolha = dash?.stages?.find((x: { stageNumber: number }) => x.stageNumber === 2);
    const etapaImportacaoEsocial = dash?.stages?.find((x: { stageNumber: number }) => x.stageNumber === 6);
    const ob = dash?.company?.onboardingStatus;
    const s1t = wizardStatusTag(etapaEmpresa?.status);
    const s2t = wizardStatusTag(etapaFolha?.status);
    const tagImportacaoEsocial = wizardStatusTag(etapaImportacaoEsocial?.status);
    const consult = ob === 'PENDING_VALIDATION' ? { label: 'Pendente', color: 'warning' as const } : ob === 'COMPLETED' ? { label: 'Concluída', color: 'success' as const } : { label: 'Acompanhe as etapas', color: 'default' as const };
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="Etapa 2 — Estrutura operacional da folha"
          description="Substitui o fluxo planilha manual: cadastro direto no passo a passo, com importação CSV opcional onde indicado. Ao final, o sistema fica apto a receber trabalhadores após validações."
          type="info"
          showIcon
        />
        <Typography.Text type="secondary">
          Dependência: etapa 1 aprovada (empresa parametrizada). Tempo estimado: 15–20 minutos.
        </Typography.Text>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" title="🟢 Empresa">
              <Tag color={s1t.color} style={{ marginBottom: 8 }}>
                {etapaEmpresa?.status === 'APPROVED' ? 'Parametrizada' : s1t.label}
              </Tag>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }} ellipsis>
                Cadastro matriz/filiais (Etapa 1)
              </Typography.Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" title="🟡 Estrutura da folha">
              <Tag color={s2t.color} style={{ marginBottom: 8 }}>
                {s2t.label}
              </Tag>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Horários, CC, bancos, departamentos
              </Typography.Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" title="⚪ Trabalhadores">
              <Tag color="default" style={{ marginBottom: 8 }}>
                Bloqueado
              </Tag>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Libera após importação eSocial (Etapa 6) e validações
              </Typography.Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" title="🔒 Validação consultiva">
              <Tag color={consult.color} style={{ marginBottom: 8 }}>
                {consult.label}
              </Tag>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                eSocial: {tagImportacaoEsocial.label}
              </Typography.Paragraph>
            </Card>
          </Col>
        </Row>
        <Row gutter={[12, 12]}>
          <Col xs={12} md={6}>
            <Card size="small" title="Horários (cadastrados)">
              <Typography.Title level={4} style={{ margin: 0 }}>
                {ws?.length ?? 0}
              </Typography.Title>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" title="Centros de custo">
              <Typography.Title level={4} style={{ margin: 0 }}>
                {cc?.length ?? 0}
              </Typography.Title>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" title="Bancos (pagamento)">
              <Typography.Title level={4} style={{ margin: 0 }}>
                {epb?.length ?? 0}
              </Typography.Title>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" title="Departamentos">
              <Typography.Title level={4} style={{ margin: 0 }}>
                {dept?.length ?? 0}
              </Typography.Title>
            </Card>
          </Col>
        </Row>
        <Card title="Etapa 2 — Estrutura da folha">
          <Typography.Paragraph>Cadastre horários, centros de custo, bancos e departamentos.</Typography.Paragraph>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
            Estruturas desta etapa:
          </Typography.Paragraph>
          <ul style={{ marginTop: 0 }}>
            <li>Horários de trabalho</li>
            <li>Centros de custo</li>
            <li>Bancos e agências para pagamento</li>
            <li>Departamentos</li>
          </ul>
        </Card>
        <Button
          type="primary"
          size="large"
          onClick={() => nav('/wizard/etapa-2/passo-2')}
          style={{ background: '#722ed1', borderColor: '#722ed1' }}
        >
          🟣 ➡️ Iniciar etapa 2 — horários
        </Button>
        {steps && (
          <Card size="small" title="Progresso dos passos (backend)">
            <Space wrap>
              {steps.map((s) => (
                <Typography.Text key={s.stepNumber} type="secondary">
                  {s.stepNumber}. {s.title}: <strong>{s.status}</strong>
                </Typography.Text>
              ))}
            </Space>
          </Card>
        )}
      </Space>
    );
  }

  if (slug === 'passo-2') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Card size="small" title="Horários de trabalho">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Cadastre os horários utilizados na empresa. Validações de carga horária e intervalo aparecem ao preencher
            entrada, saída e intervalo.
          </Typography.Paragraph>
        </Card>
        <Card size="small" title="Como deseja cadastrar os horários?">
          <Radio.Group value={wsEntryMode} onChange={(e) => setWsEntryMode(e.target.value)}>
            <Radio value="manual">Cadastrar manualmente (recomendado)</Radio>
            <Radio value="import">Importar planilha (CSV)</Radio>
          </Radio.Group>
        </Card>
        {wsEntryMode === 'manual' && (
          <Button type="primary" onClick={() => setWsOpen(true)}>
            + Adicionar novo horário
          </Button>
        )}
        <Table
          size="small"
          dataSource={ws || []}
          rowKey="id"
          columns={[
            { title: 'Nome', dataIndex: 'name' },
            { title: 'Jornada', dataIndex: 'journeyType' },
            { title: 'Entrada', dataIndex: 'startTime' },
            { title: 'Saída', dataIndex: 'endTime' },
            { title: 'Intervalo (min)', dataIndex: 'breakMinutes' },
            {
              title: 'Dias',
              render: (_: unknown, r: WsRow) =>
                (r.weekdays || []).map((w) => w.weekday).join(', ') || '—',
            },
            {
              title: '',
              width: 90,
              render: (_: unknown, r: WsRow) => (
                <Button type="link" danger size="small" onClick={() => delWs.mutate(r.id)}>
                  Excluir
                </Button>
              ),
            },
          ]}
        />
        {wsEntryMode === 'import' && (
          <Card size="small" title="Importar CSV">
            <Typography.Paragraph type="secondary">
              Formato: nome;journeyType;entrada;saida;intervaloMin;dias (ex.: 1,2,3,4,5). FIXED ou SHIFT.
            </Typography.Paragraph>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input.TextArea
                rows={6}
                value={wsCsv}
                onChange={(e) => setWsCsv(e.target.value)}
                placeholder="Administrativo II;FIXED;08:00;17:00;60;1,2,3,4,5"
              />
              <Button type="primary" loading={mWsCsv.isPending} onClick={() => mWsCsv.mutate()}>
                Importar horários
              </Button>
            </Space>
          </Card>
        )}
        <Modal
          title="Cadastro manual — horário de trabalho"
          open={wsOpen}
          onCancel={() => setWsOpen(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            form={wsForm}
            layout="vertical"
            onFinish={(v) => mWs.mutate(v)}
            initialValues={{
              journeyType: 'FIXED',
              breakMinutes: 60,
              weekdays: [1, 2, 3, 4, 5],
            }}
          >
            <Form.Item
              name="name"
              label={
                <FieldHelp title="Nome do horário" help="Ex.: Administrativo, Produção turno A." example="Administrativo" />
              }
              rules={[{ required: true }]}
            >
              <Input placeholder="Ex.: Administrativo" />
            </Form.Item>
            <Form.Item
              name="journeyType"
              label={<FieldHelp title="Tipo de jornada" help="Fixa: mesma escala recorrente. Escala: revezamento de turnos." />}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'FIXED', label: 'Fixa' },
                  { value: 'SHIFT', label: 'Escala' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="startTime"
              label={<FieldHelp title="Horário de entrada" help="Formato HH:mm (24h)." example="08:00" />}
            >
              <Input placeholder="08:00" />
            </Form.Item>
            <Form.Item
              name="endTime"
              label={<FieldHelp title="Horário de saída" help="Formato HH:mm (24h)." example="17:00" />}
            >
              <Input placeholder="17:00" />
            </Form.Item>
            <Form.Item
              name="breakMinutes"
              label={<FieldHelp title="Intervalo" help="Duração do intervalo intrajornada em minutos." example="60" />}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="weekdays"
              label={<FieldHelp title="Dias da semana" help="Marque os dias em que a jornada se aplica. Sugestão: incluir descanso semanal legal (ex.: domingo)." />}
            >
              <Checkbox.Group options={WEEKDAY_OPTS} />
            </Form.Item>
            <Form.Item dependencies={['startTime', 'endTime', 'breakMinutes']} noStyle>
              {() => {
                const v = wsForm.getFieldsValue();
                const hints = workScheduleLegalHints({
                  startTime: v.startTime,
                  endTime: v.endTime,
                  breakMinutes: v.breakMinutes,
                });
                return (
                  <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
                    {hints.map((h) => (
                      <Alert key={h} type="warning" showIcon message={h} />
                    ))}
                  </Space>
                );
              }}
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={mWs.isPending}>
              Salvar
            </Button>
          </Form>
        </Modal>
      </Space>
    );
  }

  if (slug === 'passo-3') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Card size="small" title="Centros de custo">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Organize custos da folha por centro para relatórios gerenciais e integração contábil.
          </Typography.Paragraph>
        </Card>
        <Card size="small" title="Como deseja cadastrar centros de custo?">
          <Radio.Group value={ccEntryMode} onChange={(e) => setCcEntryMode(e.target.value)}>
            <Radio value="manual">Cadastrar manualmente</Radio>
            <Radio value="import">Importar planilha (CSV)</Radio>
          </Radio.Group>
        </Card>
        {ccEntryMode === 'manual' && (
          <Button type="primary" onClick={() => setCcOpen(true)}>
            + Adicionar centro de custo
          </Button>
        )}
        <Table
          size="small"
          dataSource={cc || []}
          rowKey="id"
          columns={[
            { title: 'Código', dataIndex: 'code' },
            { title: 'Nome', dataIndex: 'name' },
            {
              title: 'Filial',
              render: (_: unknown, r: { branch?: { name?: string } }) => r.branch?.name ?? 'Matriz',
            },
          ]}
        />
        {ccEntryMode === 'import' && (
          <Card size="small" title="Importar CSV">
            <Typography.Paragraph type="secondary">codigo;nome;cnpjFilialOpcional</Typography.Paragraph>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input.TextArea rows={5} value={ccCsv} onChange={(e) => setCcCsv(e.target.value)} />
              <Button type="primary" loading={mCcCsv.isPending} onClick={() => mCcCsv.mutate()}>
                Importar centros de custo
              </Button>
            </Space>
          </Card>
        )}
        <Modal title="Novo centro de custo" open={ccOpen} onCancel={() => setCcOpen(false)} footer={null}>
          <Form
            form={ccForm}
            layout="vertical"
            onFinish={(v) => mCc.mutate(v as { code: string; name: string; branchId?: string })}
          >
            <Form.Item
              name="code"
              label={<FieldHelp title="Código do centro de custo" help="Código interno para integração e relatórios." example="001" />}
              rules={[{ required: true }]}
            >
              <Input placeholder="001" />
            </Form.Item>
            <Form.Item
              name="name"
              label={<FieldHelp title="Nome do centro de custo" help="Nome amigável exibido na operação." example="Administrativo" />}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="branchId"
              label={
                <FieldHelp
                  title="Empresa / filial vinculada"
                  help="Opcional. Sem seleção, o centro fica na matriz."
                />
              }
            >
              <Select
                allowClear
                placeholder="Matriz ou filial com empregados"
                options={(w1?.company?.branches as { id: string; name: string }[] | undefined)?.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
              />
            </Form.Item>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
              Sem filial: o centro fica na matriz. Importação CSV: terceira coluna com CNPJ da filial (somente dígitos).
            </Typography.Paragraph>
            <Button type="primary" htmlType="submit" loading={mCc.isPending}>
              Salvar
            </Button>
          </Form>
        </Modal>
      </Space>
    );
  }

  if (slug === 'passo-4') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Card size="small" title="Bancos e agências para pagamento">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Cadastre os bancos utilizados para pagamento de colaboradores. Lista de referência FEBRABAN:{' '}
            {banks?.length ?? 0} bancos carregados.
          </Typography.Paragraph>
        </Card>
        <Button type="primary" onClick={() => setEpbOpen(true)}>
          + Adicionar banco para pagamento
        </Button>
        <Table
          size="small"
          dataSource={epb || []}
          rowKey="id"
          columns={[
            {
              title: 'Banco',
              render: (_: unknown, r: { bankReference?: { name: string; code: string } }) =>
                r.bankReference ? `${r.bankReference.code} — ${r.bankReference.name}` : '—',
            },
            { title: 'Agência', dataIndex: 'agency' },
            { title: 'Tipo conta', dataIndex: 'accountType' },
          ]}
        />
        <Modal title="Banco para pagamento" open={epbOpen} onCancel={() => setEpbOpen(false)} footer={null}>
          <Form
            form={epbForm}
            layout="vertical"
            onFinish={(v) => mEpb.mutate(v as never)}
            initialValues={{ accountType: 'CHECKING' }}
          >
            <Form.Item
              name="bankReferenceId"
              label={<FieldHelp title="Banco" help="Selecione o banco; o código é preenchido automaticamente a partir da lista." />}
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={(banks as { id: string; code: string; name: string }[] | undefined)?.map((b) => ({
                  value: b.id,
                  label: `${b.code} — ${b.name}`,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="agency"
              label={<FieldHelp title="Agência" help="Somente números da agência (1 a 5 dígitos); dígito verificador no campo ao lado, se houver." />}
              rules={[
                { required: true },
                {
                  validator: (_: unknown, v: string) =>
                    isReasonableBankAgency(String(v || ''))
                      ? Promise.resolve()
                      : Promise.reject(new Error('Informe a agência com dígitos válidos (1 a 5).')),
                },
              ]}
            >
              <Input inputMode="numeric" placeholder="0000" />
            </Form.Item>
            <Form.Item name="agencyDigit" label={<FieldHelp title="Dígito da agência" help="Opcional, conforme convênio do banco." />}>
              <Input inputMode="numeric" maxLength={2} />
            </Form.Item>
            <Form.Item name="accountType" label="Tipo de conta" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'CHECKING', label: 'Conta corrente' },
                  { value: 'SAVINGS', label: 'Poupança' },
                  { value: 'PAYMENT', label: 'Conta pagamento' },
                ]}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={mEpb.isPending}>
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
        <Card size="small" title="Departamentos">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Defina departamentos organizacionais e vincule ao centro de custo quando fizer sentido para relatórios.
          </Typography.Paragraph>
        </Card>
        <Button type="primary" onClick={() => setDeptOpen(true)}>
          + Adicionar novo departamento
        </Button>
        <Table
          size="small"
          dataSource={dept || []}
          rowKey="id"
          columns={[
            { title: 'Código', dataIndex: 'code' },
            { title: 'Nome', dataIndex: 'name' },
            {
              title: 'CC',
              render: (_: unknown, r: { costCenter?: { code: string } }) => r.costCenter?.code ?? '—',
            },
          ]}
        />
        <Modal title="Departamento" open={deptOpen} onCancel={() => setDeptOpen(false)} footer={null}>
          <Form form={deptForm} layout="vertical" onFinish={(v) => mDept.mutate(v as never)}>
            <Form.Item
              name="code"
              label={<FieldHelp title="Código do departamento" help="Código interno (ex.: RH, OP)." example="RH" />}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="name"
              label={<FieldHelp title="Nome do departamento" help="Nome para exibição em holerites e relatórios." />}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="costCenterId"
              label={<FieldHelp title="Centro de custo vinculado" help="Opcional. Associa o departamento a um CC da etapa." />}
            >
              <Select
                allowClear
                options={(cc as { id: string; code: string; name: string }[] | undefined)?.map((c) => ({
                  value: c.id,
                  label: `${c.code} — ${c.name}`,
                }))}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={mDept.isPending}>
              Salvar
            </Button>
          </Form>
        </Modal>
      </Space>
    );
  }

  if (slug === 'resumo') {
    const okWs = (ws?.length ?? 0) > 0;
    const okCc = (cc?.length ?? 0) > 0;
    const okBank = (epb?.length ?? 0) > 0;
    const okDept = (dept?.length ?? 0) > 0;
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Card size="small" title="Ganhos em relação ao formulário em planilha">
          <Table
            size="small"
            pagination={false}
            rowKey="key"
            columns={[
              { title: 'Antes', dataIndex: 'antes' },
              { title: 'Com o wizard', dataIndex: 'wizard' },
            ]}
            dataSource={[
              { key: '1', antes: 'Planilhas manuais e anexos soltos', wizard: 'Cadastro direto e importação CSV opcional' },
              { key: '2', antes: 'Alto risco de erro e retrabalho', wizard: 'Validações no formulário e conferência final do consultor' },
              { key: '3', antes: 'Experiência pesada', wizard: 'Fluxo guiado por passos com ajuda contextual' },
            ]}
          />
        </Card>
        <Typography.Title level={5}>Checklist de conclusão</Typography.Title>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>{okWs ? '✔' : '—'} Horários cadastrados</li>
          <li>{okCc ? '✔' : '—'} Centros de custo definidos</li>
          <li>{okBank ? '✔' : '—'} Bancos para pagamento configurados</li>
          <li>{okDept ? '✔' : '—'} Departamentos criados</li>
        </ul>
        <Typography.Paragraph type="secondary">
          Contagens: Horários {ws?.length ?? 0} · CC {cc?.length ?? 0} · Bancos {epb?.length ?? 0} · Deptos{' '}
          {dept?.length ?? 0}
        </Typography.Paragraph>
        <Alert
          type="info"
          showIcon
          message="Aguardando validação do consultor"
          description="Após o envio, o consultor confere se as estruturas atendem à legislação e boas práticas."
        />
        <Alert
          type="success"
          showIcon
          message="Resultado técnico após aprovação da etapa 2"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Horários, centros de custo, bancos e departamentos ficam ativos para uso no cadastro;</li>
              <li>Liberação progressiva: registro de trabalhadores, admissões e folha — conforme política da conta e etapas seguintes (ex.: eSocial).</li>
            </ul>
          }
        />
        <Space wrap>
          <Button onClick={() => nav('/wizard/etapa-2/passo-2')}>✏️ Editar horários</Button>
          <Button onClick={() => nav('/wizard/etapa-2/passo-3')}>✏️ Editar centros de custo</Button>
          <Button onClick={() => nav('/wizard/etapa-2/passo-4')}>✏️ Editar bancos</Button>
          <Button onClick={() => nav('/wizard/etapa-2/passo-5')}>✏️ Editar departamentos</Button>
          <Button onClick={() => qc.invalidateQueries()}>Atualizar contadores</Button>
          <Button type="primary" onClick={() => submit.mutate()}>
            📤 Enviar etapa 2 para validação
          </Button>
          <Button onClick={() => nav('/wizard/etapa-3')}>⏭️ Avançar para etapa 3</Button>
        </Space>
      </Space>
    );
  }

  return null;
}
